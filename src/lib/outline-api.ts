export interface AccessKey {
  id: string;
  name: string;
  password: string;
  port: number;
  method: string;
  accessUrl: string;
  dataLimit?: { bytes: number };
  createdAt: number;
}

export interface ServerInfo {
  name: string;
  serverId: string;
  metricsEnabled: boolean;
  createdTimestampMs: number;
  version: string;
  accessKeyDataLimit?: { bytes: number };
  portForNewAccessKeys: number;
  hostnameForAccessKeys: string;
}

export interface TransferMetrics {
  bytesTransferredByUserId: Record<string, number>;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const SERVER_ID = 'outline-server-abc123';

let serverInfo: ServerInfo = {
  name: 'My Outline Server',
  serverId: SERVER_ID,
  metricsEnabled: true,
  createdTimestampMs: Date.now() - 90 * 24 * 60 * 60 * 1000,
  version: '1.10.0',
  portForNewAccessKeys: 65258,
  hostnameForAccessKeys: 'vpn.example.com',
};

let accessKeys: AccessKey[] = [
  {
    id: 'key-1',
    name: 'Alice',
    password: 'sec-pass-1',
    port: 65258,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMQ==@vpn.example.com:65258/?outline=1',
    dataLimit: { bytes: 10 * 1024 * 1024 * 1024 },
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-2',
    name: "Bob's Laptop",
    password: 'sec-pass-2',
    port: 65259,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMg==@vpn.example.com:65259/?outline=1',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-3',
    name: 'Office Router',
    password: 'sec-pass-3',
    port: 65260,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMw==@vpn.example.com:65260/?outline=1',
    dataLimit: { bytes: 50 * 1024 * 1024 * 1024 },
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-4',
    name: 'iPhone 15',
    password: 'sec-pass-4',
    port: 65261,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtNA==@vpn.example.com:65261/?outline=1',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-5',
    name: 'iPad Pro',
    password: 'sec-pass-5',
    port: 65262,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtNQ==@vpn.example.com:65262/?outline=1',
    dataLimit: { bytes: 5 * 1024 * 1024 * 1024 },
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-6',
    name: 'Workstation',
    password: 'sec-pass-6',
    port: 65263,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtNg==@vpn.example.com:65263/?outline=1',
    createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-7',
    name: 'Smart TV',
    password: 'sec-pass-7',
    port: 65264,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtNw==@vpn.example.com:65264/?outline=1',
    dataLimit: { bytes: 20 * 1024 * 1024 * 1024 },
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-8',
    name: 'Android Tablet',
    password: 'sec-pass-8',
    port: 65265,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtOA==@vpn.example.com:65265/?outline=1',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-9',
    name: 'Mac Studio',
    password: 'sec-pass-9',
    port: 65266,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtOQ==@vpn.example.com:65266/?outline=1',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-10',
    name: 'Gaming PC',
    password: 'sec-pass-10',
    port: 65267,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMTA=@vpn.example.com:65267/?outline=1',
    dataLimit: { bytes: 100 * 1024 * 1024 * 1024 },
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-11',
    name: 'Travel Phone',
    password: 'sec-pass-11',
    port: 65268,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMTE=@vpn.example.com:65268/?outline=1',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'key-12',
    name: 'Home Server',
    password: 'sec-pass-12',
    port: 65269,
    method: 'chacha20-ietf-poly1305',
    accessUrl: 'ss://YWVzLTI1Ni1nY206c2VjLXBhc3MtMTI=@vpn.example.com:65269/?outline=1',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
];

const transferMetrics: TransferMetrics = {
  bytesTransferredByUserId: {
    'key-1': 8_423_000_000,
    'key-2': 12_780_500_000,
    'key-3': 45_200_000_000,
    'key-4': 3_150_000_000,
    'key-5': 4_890_000_000,
    'key-6': 14_560_000_000,
    'key-7': 18_900_000_000,
    'key-8': 1_230_000_000,
    'key-9': 6_780_000_000,
    'key-10': 52_400_000_000,
    'key-11': 256_000_000,
    'key-12': 0,
  },
};

export async function getServerInfo(): Promise<ServerInfo> {
  await delay(300 + Math.random() * 200);
  return { ...serverInfo };
}

export async function getAccessKeys(): Promise<AccessKey[]> {
  await delay(300 + Math.random() * 200);
  return [...accessKeys];
}

export async function createKey(
  name?: string,
  dataLimit?: { bytes: number }
): Promise<AccessKey> {
  await delay(400 + Math.random() * 200);
  const newPort = Math.max(...accessKeys.map((k) => k.port)) + 1;
  const id = `key-${accessKeys.length + 1}`;
  const key: AccessKey = {
    id,
    name: name || `Key ${accessKeys.length + 1}`,
    password: `sec-pass-${accessKeys.length + 1}`,
    port: newPort,
    method: 'chacha20-ietf-poly1305',
    accessUrl: `ss://YWVzLTI1Ni1nY206c2VjLXBhc3Mt${accessKeys.length + 1}=@vpn.example.com:${newPort}/?outline=1`,
    dataLimit,
    createdAt: Date.now(),
  };
  accessKeys.push(key);
  transferMetrics.bytesTransferredByUserId[id] = 0;
  return { ...key };
}

export async function deleteKey(id: string): Promise<void> {
  await delay(300 + Math.random() * 200);
  accessKeys = accessKeys.filter((k) => k.id !== id);
  delete transferMetrics.bytesTransferredByUserId[id];
}

export async function renameKey(id: string, name: string): Promise<void> {
  await delay(300 + Math.random() * 200);
  const key = accessKeys.find((k) => k.id === id);
  if (key) key.name = name;
}

export async function setDataLimit(
  id: string,
  bytes: number
): Promise<void> {
  await delay(300 + Math.random() * 200);
  const key = accessKeys.find((k) => k.id === id);
  if (key) key.dataLimit = { bytes };
}

export async function deleteDataLimit(id: string): Promise<void> {
  await delay(300 + Math.random() * 200);
  const key = accessKeys.find((k) => k.id === id);
  if (key) delete key.dataLimit;
}

export async function getTransferMetrics(): Promise<TransferMetrics> {
  await delay(300 + Math.random() * 200);
  return {
    bytesTransferredByUserId: { ...transferMetrics.bytesTransferredByUserId },
  };
}

export async function updateServerName(name: string): Promise<void> {
  await delay(300 + Math.random() * 200);
  serverInfo.name = name;
}

export async function updateHostname(hostname: string): Promise<void> {
  await delay(300 + Math.random() * 200);
  serverInfo.hostnameForAccessKeys = hostname;
}

export async function updatePortForNewAccessKeys(port: number): Promise<void> {
  await delay(300 + Math.random() * 200);
  serverInfo.portForNewAccessKeys = port;
}
