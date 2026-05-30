#!/usr/bin/env node
/**
 * CORS Proxy for Outline VPN Manager
 *
 * Outline servers don't send CORS headers, so browsers block direct API calls.
 * This tiny proxy adds CORS headers and forwards requests to your Outline server.
 *
 * Usage:
 *   node cors-proxy.js           # Default port 3001
 *   PORT=8080 node cors-proxy.js # Custom port
 *
 * Then in the dashboard, set the proxy URL in Settings or via console:
 *   localStorage.setItem('outline_cors_proxy', 'http://localhost:3001/proxy');
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // Set to your domain in production

const server = http.createServer((req, res) => {
  // ── CORS Headers ──
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // ── Parse Request ──
  const parsed = url.parse(req.url, true);

  // Health check
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Proxy endpoint: /proxy?target=https://server:port/secret/&endpoint=access-keys
  if (parsed.pathname === '/proxy') {
    const targetUrl = parsed.query.target;
    const endpoint = parsed.query.endpoint || '';

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing ?target= parameter' }));
      return;
    }

    const target = new URL(endpoint, targetUrl);

    const options = {
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: target.pathname + target.search,
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false, // Outline uses self-signed certs
    };

    // Copy content-length for POST/PUT
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      options.headers['Content-Length'] = contentLength;
    }

    const protocol = target.protocol === 'https:' ? https : http;

    const proxyReq = protocol.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  // ── 404 ──
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    usage: 'GET /proxy?target=https://your-server/secret/&endpoint=access-keys',
  }));
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     Outline VPN Manager — CORS Proxy                     ║
╠══════════════════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}                     ║
║                                                          ║
║  Usage in dashboard:                                     ║
║    localStorage.setItem('outline_cors_proxy',            ║
║      'http://localhost:${PORT}/proxy');                   ║
║                                                          ║
║  Health check: http://localhost:${PORT}/health            ║
╚══════════════════════════════════════════════════════════╝
  `);
});
