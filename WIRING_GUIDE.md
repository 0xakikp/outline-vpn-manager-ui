# Outline VPN Manager — Wiring Guide

## 1. Download the Source Code

The complete source code is in this repository. To use it locally:

```bash
# Clone or download the source
cd outline-vpn-manager

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## 2. How It Works with Outline

Outline servers expose a **Management API** at a secret URL. Your API URL looks like:

```
https://YOUR_SERVER_IP:PORT/SECRET_PATH/
```

Example:
```
https://203.0.113.42:51083/xlUG4F5BBft4rSrIvDSWuw/
```

You get this URL when you install an Outline server (via `outline-server` install script or DigitalOcean 1-click).

## 3. Wire to Real Outline Server

Right now the dashboard uses a **mock API** (`src/lib/outline-api.ts`). To connect to a real server, you need to replace the mock with real HTTP calls.

### Step 1: Store the API URL

Add state in `App.tsx` to store the user's API URL:

```tsx
const [apiUrl, setApiUrl] = useState(localStorage.getItem('outline_api_url') || '');
```

### Step 2: Create Real API Client

Create `src/lib/outline-api-real.ts`:

```typescript
// Real Outline Management API client
const API_URL = localStorage.getItem('outline_api_url') || '';

async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const getServerInfo = () => api<ServerInfo>('/server');
export const getAccessKeys = () => api<{ accessKeys: AccessKey[] }>('/access-keys').then(r => r.accessKeys);
export const createKey = (name?: string, limit?: { bytes: number }) =>
  api<AccessKey>('/access-keys', { method: 'POST', body: JSON.stringify({ name, limit }) });
export const deleteKey = (id: string) =>
  api(`/access-keys/${id}`, { method: 'DELETE' });
export const renameKey = (id: string, name: string) =>
  api(`/access-keys/${id}/name`, { method: 'PUT', body: JSON.stringify({ name }) });
export const setDataLimit = (id: string, bytes: number) =>
  api(`/access-keys/${id}/data-limit`, { method: 'PUT', body: JSON.stringify({ limit: { bytes } }) });
export const deleteDataLimit = (id: string) =>
  api(`/access-keys/${id}/data-limit`, { method: 'DELETE' });
export const getTransferMetrics = () => api<TransferMetrics>('/metrics/transfer');
export const updateServerName = (name: string) =>
  api('/server/name', { method: 'PUT', body: JSON.stringify({ name }) });
export const updateHostname = (hostname: string) =>
  api('/server/hostname-for-access-keys', { method: 'PUT', body: JSON.stringify({ hostname }) });
export const updatePortForNewAccessKeys = (port: number) =>
  api('/server/port-for-new-access-keys', { method: 'PUT', body: JSON.stringify({ port }) });
```

### Step 3: Swap Mock → Real

In `App.tsx`, replace the mock imports:

```typescript
// BEFORE (mock):
import { getServerInfo, getAccessKeys, ... } from '@/lib/outline-api';

// AFTER (real):
import { getServerInfo, getAccessKeys, ... } from '@/lib/outline-api-real';
```

## 4. The CORS Problem (IMPORTANT)

Outline servers **do NOT send CORS headers** by default. This means your browser will block direct API calls with an error like:

```
Access to fetch at 'https://...' from origin 'http://localhost:5173'
has been blocked by CORS policy.
```

### Solution A: CORS Proxy (Easiest for self-hosting)

Run a tiny proxy server that adds CORS headers. Create `proxy.js`:

```javascript
// cors-proxy.js
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;
const ALLOWED_ORIGIN = '*'; // Or 'http://localhost:5173' for security

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse target from query: ?target=https://203.0.113.42:51083/secret/
  const parsed = url.parse(req.url, true);
  const targetUrl = parsed.query.target;
  if (!targetUrl) {
    res.writeHead(400);
    res.end('Missing ?target= parameter');
    return;
  }

  // Forward request
  const target = new URL(targetUrl + parsed.pathname.replace('/proxy', ''));
  const options = {
    hostname: target.hostname,
    port: target.port,
    path: target.pathname + target.search,
    method: req.method,
    headers: { 'Content-Type': 'application/json' },
    rejectUnauthorized: false, // Outline uses self-signed certs
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(500);
    res.end('Proxy error: ' + err.message);
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => console.log(`CORS proxy running on http://localhost:${PORT}`));
```

Run it:
```bash
node cors-proxy.js
```

Then in your API client, prefix all calls:
```typescript
const PROXY = 'http://localhost:3001/proxy';
const API_URL = `${PROXY}?target=${encodeURIComponent(outlineApiUrl)}`;
```

### Solution B: Nginx Reverse Proxy (Production)

Add to your nginx config:

```nginx
server {
    listen 80;
    server_name vpn-dashboard.yourdomain.com;

    location / {
        root /var/www/outline-dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass https://YOUR_OUTLINE_SERVER:PORT/SECRET_PATH/;
        proxy_ssl_verify off;
        proxy_set_header Host $host;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type";
    }
}
```

### Solution C: Electron App (No CORS)

Wrap the dashboard in Electron — it doesn't enforce CORS:

```javascript
// main.js (Electron main process)
const { app, BrowserWindow } = require('electron');
function createWindow() {
  new BrowserWindow({ width: 1400, height: 900 })
    .loadFile('dist/index.html');
}
app.whenReady().then(createWindow);
```

## 5. Deploy to Production

### Static Hosting (Netlify/Vercel/Cloudflare Pages)

```bash
npm run build
# Upload the `dist/` folder to your hosting provider
```

⚠️ You'll still need the CORS proxy (Solution A or B) since the Outline server won't have CORS headers.

### Self-Hosted (Recommended)

1. Build: `npm run build`
2. Serve `dist/` with any static file server
3. Run the CORS proxy on the same server
4. Configure the proxy URL in the dashboard

### Docker (One-Command Deploy)

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:
```bash
docker build -t outline-dashboard .
docker run -p 8080:80 outline-dashboard
```

## 6. Security Checklist

- [ ] **Never commit your API URL** — it contains the secret auth path
- [ ] **Use HTTPS** in production — the API URL is sent in requests
- [ ] **Restrict CORS proxy** — set `ALLOWED_ORIGIN` to your domain, not `*`
- [ ] **Add authentication** — the dashboard has no login; host it behind a VPN or add OAuth
- [ ] **The Outline API URL is all-powerful** — anyone with it can manage your server

## 7. File Structure

```
outline-vpn-manager/
├── src/
│   ├── App.tsx              # Main app shell, tabs, data fetching
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles, animations
│   ├── sections/
│   │   ├── OverviewTab.tsx   # Dashboard overview
│   │   ├── KeysTab.tsx       # Full CRUD key management
│   │   ├── AnalyticsTab.tsx  # Charts & data visualization
│   │   └── SettingsTab.tsx   # Server configuration
│   ├── components/
│   │   ├── AnimatedBackground.tsx  # Mesh gradient + particles
│   │   ├── ParticleField.tsx       # Canvas particle system
│   │   ├── GlassCard.tsx           # Glassmorphism card
│   │   ├── KPICard.tsx             # Stat card with counter
│   │   ├── DetailDrawer.tsx        # Slide-out key detail
│   │   ├── Modal.tsx               # Dialog component
│   │   ├── Badge.tsx               # Status badge
│   │   ├── CopyButton.tsx          # Clipboard copy
│   │   └── SpotlightCard.tsx       # Mouse-following glow
│   ├── lib/
│   │   ├── outline-api.ts     # MOCK API (replace this)
│   │   ├── outline-api-real.ts # <-- Create this for real server
│   │   └── utils.ts           # formatBytes, formatDate, cn
│   └── contexts/
│       └── ToastContext.tsx   # Toast notifications
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
