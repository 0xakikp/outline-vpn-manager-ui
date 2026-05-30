# Outline VPN Manager

A stunning, production-ready web dashboard for managing Outline VPN servers. Built with React 19, TypeScript, and Tailwind CSS — featuring glassmorphism UI, real-time data visualization, and complete CRUD operations for access keys.

![Outline VPN Manager](https://img.shields.io/badge/Outline-VPN%20Manager-6366F1?style=flat-square)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)

---

## Features

### Core Functionality

| Feature | Description |
|---------|-------------|
| **Server Overview** | At-a-glance KPIs: total keys, data transferred, active keys, server version |
| **Access Key Management** | Full CRUD — create, rename, delete keys with custom names and data limits |
| **Data Visualization** | Bar charts, donut charts, area charts showing per-key usage and trends |
| **Data Limit Alerts** | Warning/critical badges for keys approaching their data limit (>70%, >85%) |
| **Auto-Save Settings** | Server name, hostname, and port changes save automatically on blur |
| **QR Code Sharing** | Generate scannable QR codes for any key's `ss://` access URL |
| **Export Data** | Download all key data as JSON or CSV with dated filenames |
| **Bulk Operations** | Select multiple keys via checkboxes and delete them in one action |
| **Slide-Out Detail Panel** | Click any key's name to see full details, sparkline chart, and actions |
| **Search & Sort** | Real-time search by name/ID/port + sortable columns (Name, Port, Data Used) |
| **Keyboard Shortcuts** | `Cmd/Ctrl+K` to focus search from anywhere |
| **Auto-Refresh** | Data refreshes every 30 seconds automatically |

### Visual Design

| Feature | Description |
|---------|-------------|
| **Pitch Black UI** | Pure `#000000` background with carefully tuned dark surfaces |
| **Glassmorphism Cards** | Semi-transparent backgrounds with `backdrop-filter: blur(16px)` |
| **Neon Glow Effects** | 7 colored glow variants (violet, blue, green, orange, pink, cyan, red) |
| **Animated Background** | Floating mesh gradient + particle field + noise texture overlay |
| **Spotlight Hover** | Mouse-following radial gradient on table rows |
| **Animated Counters** | Numbers count up from 0 on mount |
| **Staggered Entrances** | Every element animates in with calculated delays |
| **Premium Typography** | Space Grotesk (headings) + Inter (body) + Playfair Display (accents) + JetBrains Mono (code) |
| **Tab Navigation** | Animated sliding indicator with spring physics |
| **Toast Notifications** | Success/error feedback on all actions |

---

## Screenshots

### Overview Tab
4 KPI cards with animated counters, data usage bar chart (top 6 keys), recent keys list with status badges, data limit alerts panel, and floating "New Key" action button.

### Keys Tab
Full CRUD table with search, sortable columns, checkbox selection, bulk delete, status badges with progress bars, edit modal with QR code, and slide-out detail drawer.

### Analytics Tab
Donut chart (data distribution), area chart (30-day trend), per-key breakdown table with rankings, insights panel (top consumer, unused keys, limit status), and export dropdown.

### Settings Tab
Server identity (auto-save), network configuration, connection info with copy buttons, danger zone with reset all limits and disconnect confirmations.

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone or download the source code
cd outline-vpn-manager

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build
# Output in dist/ folder
```

### Connect to Your Outline Server

By default, the dashboard runs with a **mock API** that simulates an Outline server with 12 keys. To connect to a real server:

#### Step 1: Find Your Outline API URL

Your API URL was provided when you installed Outline. It looks like:
```
https://203.0.113.42:51083/AbCdEfGhIjKlMnOp/
```

If you lost it, SSH into your server and run:
```bash
docker logs shadowbox 2>&1 | grep "Management API"
```

#### Step 2: Swap Mock API for Real API

In `src/App.tsx`, change **one import line**:

```typescript
// BEFORE (mock):
import { ... } from '@/lib/outline-api';

// AFTER (real):
import { ... } from '@/lib/outline-api-real';
```

The real API client (`src/lib/outline-api-real.ts`) is already included. It reads your API URL from `localStorage`.

#### Step 3: Set Your API URL

Open the dashboard, then in browser DevTools console:

```javascript
localStorage.setItem('outline_api_url', 'https://YOUR_SERVER_IP:PORT/SECRET_PATH/');
location.reload();
```

---

## The CORS Problem & Solutions

Outline servers don't send CORS headers, so browsers block direct API calls. Three solutions:

### Option A: CORS Proxy (Easiest)

A proxy server is included (`cors-proxy.js`):

```bash
node cors-proxy.js
# Runs on http://localhost:3001
```

Then in the dashboard console:
```javascript
localStorage.setItem('outline_api_url', 'https://YOUR_SERVER:PORT/SECRET/');
localStorage.setItem('outline_cors_proxy', 'http://localhost:3001/proxy');
location.reload();
```

### Option B: Nginx Reverse Proxy (Production)

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
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    }
}
```

### Option C: Electron App (No CORS)

Wrap the `dist/` folder in Electron — it doesn't enforce CORS at all.

---

## Architecture

```
src/
├── App.tsx                          # Main shell: tab navigation, data fetching
├── main.tsx                         # Entry point
├── index.css                        # Global styles, animations, effects
├── sections/
│   ├── OverviewTab.tsx              # Dashboard: KPIs, bar chart, recent keys, alerts
│   ├── KeysTab.tsx                  # CRUD: table, search, sort, modals, drawer
│   ├── AnalyticsTab.tsx             # Charts: donut, area, rankings, export
│   └── SettingsTab.tsx              # Config: auto-save inputs, danger zone
├── components/
│   ├── AnimatedBackground.tsx       # Mesh gradient + particles + noise
│   ├── ParticleField.tsx            # Canvas particle system with mouse repulsion
│   ├── GlassCard.tsx                # Glassmorphism card wrapper
│   ├── KPICard.tsx                  # Stat card with animated counter
│   ├── DetailDrawer.tsx             # Slide-out key detail panel
│   ├── Modal.tsx                    # Dialog with backdrop blur
│   ├── Badge.tsx                    # Status badge with pulse animation
│   ├── CopyButton.tsx               # Clipboard copy with feedback
│   ├── AnimatedCounter.tsx          # Number count-up animation
│   └── SpotlightCard.tsx            # Mouse-following glow card
├── lib/
│   ├── outline-api.ts               # Mock API (for demo/development)
│   ├── outline-api-real.ts          # Real API client (for production)
│   └── utils.ts                     # formatBytes, formatDate, cn helpers
└── contexts/
    └── ToastContext.tsx             # Toast notification system
```

---

## API Reference

The dashboard consumes the [Outline Management API](https://shadowsocks.org/en/doc/manage.html):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/server` | GET | Server info (name, version, hostname, port) |
| `/access-keys` | GET | List all access keys |
| `/access-keys` | POST | Create new key |
| `/access-keys/:id` | DELETE | Delete a key |
| `/access-keys/:id/name` | PUT | Rename a key |
| `/access-keys/:id/data-limit` | PUT | Set data limit |
| `/access-keys/:id/data-limit` | DELETE | Remove data limit |
| `/metrics/transfer` | GET | Data usage per key |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search input |
| `Esc` | Close any modal |
| `Enter` | Submit modal form |

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 7 |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| QR Codes | qrcode.react |
| Fonts | Space Grotesk, Inter, Playfair Display, JetBrains Mono |

---

## Customization

### Changing Colors

Edit the CSS custom properties in `src/index.css`:

```css
:root {
  --accent-primary: #6366F1;    /* Primary brand color */
  --accent-violet: #8B5CF6;     /* Violet glow */
  --accent-blue: #3B82F6;       /* Blue glow */
  --accent-green: #22C55E;      /* Green glow */
  /* ... */
}
```

### Changing Fonts

Edit `tailwind.config.js`:

```js
fontFamily: {
  display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
  body: ['"Inter"', 'system-ui', 'sans-serif'],
  accent: ['"Playfair Display"', 'Georgia', 'serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}
```

---

## Security Notes

- **Never commit your API URL** — it contains the secret authentication path
- **Use HTTPS** in production — the API URL is sent in requests
- **The Outline API URL is all-powerful** — anyone with it can manage your server
- **Add authentication** — this dashboard has no built-in login; host it behind a VPN or add OAuth for production use
- **Restrict the CORS proxy** — set `ALLOWED_ORIGIN` to your domain, not `*`

---

## License

MIT
