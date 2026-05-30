#!/usr/bin/env node
/**
 * Outline VPN Manager — Production Server
 *
 * Serves static files + CORS proxy for Outline API
 * No nginx needed — single Node.js process
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3002;
const DIST_DIR = path.join(__dirname, 'dist');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function serveStatic(req, res) {
  let pathname = url.parse(req.url).pathname;
  if (pathname === '/') pathname = '/index.html';

  const filePath = path.join(DIST_DIR, pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback: serve index.html for client-side routes
        const indexPath = path.join(DIST_DIR, 'index.html');
        fs.readFile(indexPath, (err2, indexData) => {
          if (err2) {
            res.writeHead(500);
            res.end('Server error');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexData);
        });
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    res.writeHead(200, {
      'Content-Type': getMimeType(filePath),
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
  });
}

function proxyRequest(req, res) {
  const parsed = url.parse(req.url, true);
  const targetUrl = parsed.query.target;
  const endpoint = parsed.query.endpoint || '';

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing ?target= parameter' }));
    return;
  }

  // Ensure target URL ends with / for proper URL joining
  const normalizedTarget = targetUrl.endsWith('/') ? targetUrl : targetUrl + '/';
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const target = new URL(normalizedEndpoint, normalizedTarget);

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
}

const server = http.createServer((req, res) => {
  // CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsed = url.parse(req.url, true);

  // Health check
  if (parsed.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // CORS proxy endpoint
  if (parsed.pathname === '/proxy') {
    proxyRequest(req, res);
    return;
  }

  // Static files
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     Outline VPN Manager — Server                         ║
╠══════════════════════════════════════════════════════════╣
║  Static files:  http://localhost:${PORT}                   ║
║  CORS proxy:    http://localhost:${PORT}/proxy             ║
║  Health check:  http://localhost:${PORT}/health            ║
╚══════════════════════════════════════════════════════════╝
  `);
});
