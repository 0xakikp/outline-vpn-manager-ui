// ============================================================
// REAL OUTLINE MANAGEMENT API CLIENT
// ============================================================
// Replace the mock import in App.tsx with this file to connect
// to a real Outline VPN server.
//
// BEFORE: import { getServerInfo, ... } from '@/lib/outline-api';
// AFTER:  import { getServerInfo, ... } from '@/lib/outline-api-real';
//
// You MUST set your API URL via localStorage or the connect screen:
//   localStorage.setItem('outline_api_url', 'https://203.0.113.42:51083/AbCdEfGh/');
//
// CORS PROXY: Outline servers don't have CORS headers. Run the
// cors-proxy.js (see WIRING_GUIDE.md) and set:
//   localStorage.setItem('outline_cors_proxy', 'http://localhost:3001/proxy');

import type { AccessKey, ServerInfo, TransferMetrics } from './outline-api';

function getApiUrl(): string {
  const url = localStorage.getItem('outline_api_url');
  if (!url) throw new Error('No API URL set. Go to Settings and enter your Outline API URL.');
  return url.endsWith('/') ? url : url + '/';
}

function getProxyUrl(): string | null {
  return localStorage.getItem('outline_cors_proxy');
}

function buildUrl(endpoint: string): string {
  const apiUrl = getApiUrl();
  const proxy = getProxyUrl();

  if (proxy) {
    // Use CORS proxy: proxy forwards to the actual API
    return `${proxy}?target=${encodeURIComponent(apiUrl)}&endpoint=${encodeURIComponent(endpoint)}`;
  }

  return apiUrl + endpoint;
}

async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildUrl(endpoint);

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Server Info ───
export async function getServerInfo(): Promise<ServerInfo> {
  return api<ServerInfo>('server');
}

// ─── Access Keys ───
export async function getAccessKeys(): Promise<AccessKey[]> {
  const data = await api<{ accessKeys: AccessKey[] }>('access-keys');
  return data.accessKeys;
}

export async function createKey(
  name?: string,
  dataLimit?: { bytes: number }
): Promise<AccessKey> {
  return api<AccessKey>('access-keys', {
    method: 'POST',
    body: JSON.stringify({ name, limit: dataLimit }),
  });
}

export async function deleteKey(id: string): Promise<void> {
  await api(`access-keys/${id}`, { method: 'DELETE' });
}

export async function renameKey(id: string, name: string): Promise<void> {
  await api(`access-keys/${id}/name`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function setDataLimit(id: string, bytes: number): Promise<void> {
  await api(`access-keys/${id}/data-limit`, {
    method: 'PUT',
    body: JSON.stringify({ limit: { bytes } }),
  });
}

export async function deleteDataLimit(id: string): Promise<void> {
  await api(`access-keys/${id}/data-limit`, { method: 'DELETE' });
}

// ─── Metrics ───
export async function getTransferMetrics(): Promise<TransferMetrics> {
  return api<TransferMetrics>('metrics/transfer');
}

// ─── Server Settings ───
export async function updateServerName(name: string): Promise<void> {
  await api('server/name', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function updateHostname(hostname: string): Promise<void> {
  await api('server/hostname-for-access-keys', {
    method: 'PUT',
    body: JSON.stringify({ hostname }),
  });
}

export async function updatePortForNewAccessKeys(port: number): Promise<void> {
  await api('server/port-for-new-access-keys', {
    method: 'PUT',
    body: JSON.stringify({ port }),
  });
}

// ─── Connection Test ───
export async function testConnection(apiUrl?: string): Promise<ServerInfo> {
  if (apiUrl) {
    localStorage.setItem('outline_api_url', apiUrl);
  }
  const info = await getServerInfo();
  return info;
}

// ─── Disconnect ───
export function disconnect(): void {
  localStorage.removeItem('outline_api_url');
  localStorage.removeItem('outline_cors_proxy');
  window.location.reload();
}
