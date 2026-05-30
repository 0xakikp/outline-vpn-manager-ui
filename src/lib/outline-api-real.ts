import type { AccessKey, ServerInfo, TransferMetrics } from './outline-api';

// Re-export types for consumers
export type { AccessKey, ServerInfo, TransferMetrics };

// ── Configuration ──
// The CORS proxy URL is set at build time or via localStorage
// For self-hosted deployment, we default to same-origin /proxy
function getProxyUrl(): string {
  // In production (built), the proxy runs on same origin via nginx rewrite
  // In dev, user sets localStorage.setItem('outline_cors_proxy', 'http://localhost:3001/proxy')
  return localStorage.getItem('outline_cors_proxy') || '/proxy';
}

function getApiUrl(): string {
  return localStorage.getItem('outline_api_url') || '';
}

// ── Core fetch wrapper ──
async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const proxy = getProxyUrl();
  const apiUrl = getApiUrl();

  if (!apiUrl) {
    throw new Error('Outline API URL not configured. Go to Settings to connect.');
  }

  const target = encodeURIComponent(apiUrl);
  const url = `${proxy}?target=${target}&endpoint=${encodeURIComponent(endpoint)}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${text || res.statusText}`);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ── Server Info ──
export async function getServerInfo(): Promise<ServerInfo> {
  return api<ServerInfo>('/server');
}

// ── Access Keys ──
export async function getAccessKeys(): Promise<AccessKey[]> {
  const data = await api<{ accessKeys: AccessKey[] }>('/access-keys');
  return data.accessKeys;
}

export async function createKey(
  name?: string,
  dataLimit?: { bytes: number }
): Promise<AccessKey> {
  const body: Record<string, unknown> = {};
  if (name) body.name = name;
  if (dataLimit) body.limit = dataLimit;

  return api<AccessKey>('/access-keys', {
    method: 'POST',
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
}

export async function deleteKey(id: string): Promise<void> {
  return api<void>(`/access-keys/${id}`, { method: 'DELETE' });
}

export async function renameKey(id: string, name: string): Promise<void> {
  return api<void>(`/access-keys/${id}/name`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function setDataLimit(id: string, bytes: number): Promise<void> {
  return api<void>(`/access-keys/${id}/data-limit`, {
    method: 'PUT',
    body: JSON.stringify({ limit: { bytes } }),
  });
}

export async function deleteDataLimit(id: string): Promise<void> {
  return api<void>(`/access-keys/${id}/data-limit`, { method: 'DELETE' });
}

// ── Metrics ──
export async function getTransferMetrics(): Promise<TransferMetrics> {
  return api<TransferMetrics>('/metrics/transfer');
}

// ── Server Settings ──
export async function updateServerName(name: string): Promise<void> {
  return api<void>('/server/name', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function updateHostname(hostname: string): Promise<void> {
  return api<void>('/server/hostname-for-access-keys', {
    method: 'PUT',
    body: JSON.stringify({ hostname }),
  });
}

export async function updatePortForNewAccessKeys(port: number): Promise<void> {
  return api<void>('/server/port-for-new-access-keys', {
    method: 'PUT',
    body: JSON.stringify({ port }),
  });
}

// ── Connection test ──
export async function testConnection(apiUrl: string): Promise<ServerInfo> {
  const proxy = getProxyUrl();
  const target = encodeURIComponent(apiUrl);
  const url = `${proxy}?target=${target}&endpoint=/server`;

  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Connection failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
