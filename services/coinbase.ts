import {
  Account,
  Product,
  Candle,
  Order,
  Fill,
  BestBidAsk,
  CreateOrderRequest,
  Granularity,
} from '../types';

const API_BASE = '/api';

// ─── JWT helpers ────────────────────────────────────────────────────────────

/** Encode a string (UTF-8) or byte array as Base64URL */
function toBase64Url(input: string | Uint8Array): string {
  let binary = '';
  if (typeof input === 'string') {
    const bytes = new TextEncoder().encode(input);
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
  } else {
    input.forEach((b) => (binary += String.fromCharCode(b)));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Import an EC private key from PEM (PKCS8 format required by Web Crypto) */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN.*?-----/g, '')
    .replace(/-----END.*?-----/g, '')
    .replace(/\s/g, '');

  if (!pem.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'Unsupported key format. Coinbase CDP keys must be PKCS8 (-----BEGIN PRIVATE KEY-----).'
    );
  }

  const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

/** Generate a signed JWT for Coinbase Advanced Trade API (CDP auth) */
async function generateJWT(
  keyName: string,
  privateKeyPem: string,
  method: string,
  path: string
): Promise<string> {
  const cryptoKey = await importPrivateKey(privateKeyPem);

  const now = Math.floor(Date.now() / 1000);
  const nonceBytes = crypto.getRandomValues(new Uint8Array(16));
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const header = { alg: 'ES256', kid: keyName, nonce, typ: 'JWT' };
  const payload = {
    iss: 'cdp',
    nbf: now,
    exp: now + 120,
    sub: keyName,
    uri: `${method} api.coinbase.com${path}`,
  };

  const headerB64 = toBase64Url(JSON.stringify(header));
  const payloadB64 = toBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const sigBytes = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${toBase64Url(new Uint8Array(sigBytes))}`;
}

// ─── Credentials storage ─────────────────────────────────────────────────────

export function getCredentials(): { apiKeyName: string; privateKey: string } | null {
  const apiKeyName = localStorage.getItem('cb_key_name');
  const privateKey = localStorage.getItem('cb_private_key');
  return apiKeyName && privateKey ? { apiKeyName, privateKey } : null;
}

export function saveCredentials(apiKeyName: string, privateKey: string): void {
  localStorage.setItem('cb_key_name', apiKeyName);
  localStorage.setItem('cb_private_key', privateKey);
}

export function clearCredentials(): void {
  localStorage.removeItem('cb_key_name');
  localStorage.removeItem('cb_private_key');
}

// ─── HTTP client ─────────────────────────────────────────────────────────────

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const creds = getCredentials();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (creds) {
    const jwt = await generateJWT(creds.apiKeyName, creds.privateKey, method, path);
    headers['Authorization'] = `Bearer ${jwt}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.error_details || err.message || err.error || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json();
}

// ─── API methods ─────────────────────────────────────────────────────────────

export async function testConnection(): Promise<void> {
  // Lightweight call – just list accounts with a limit of 1
  await request<unknown>('GET', '/v3/brokerage/accounts?limit=1');
}

export async function getAccounts(): Promise<Account[]> {
  const res = await request<{ accounts: Account[] }>('GET', '/v3/brokerage/accounts');
  return res.accounts ?? [];
}

export async function listProducts(productType = 'SPOT'): Promise<Product[]> {
  const res = await request<{ products: Product[]; num_products: number }>(
    'GET',
    `/v3/brokerage/products?product_type=${productType}`
  );
  return res.products ?? [];
}

export async function getProduct(productId: string): Promise<Product> {
  return request<Product>('GET', `/v3/brokerage/products/${productId}`);
}

export async function getCandles(
  productId: string,
  granularity: Granularity = 'ONE_HOUR',
  startSec?: number,
  endSec?: number
): Promise<Candle[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = startSec ?? now - 24 * 3600;
  const end = endSec ?? now;

  const res = await request<{ candles: Candle[] }>(
    'GET',
    `/v3/brokerage/products/${productId}/candles?start=${start}&end=${end}&granularity=${granularity}`
  );

  return (res.candles ?? []).sort((a, b) => Number(a.start) - Number(b.start));
}

export async function getBestBidAsk(productIds: string[]): Promise<BestBidAsk> {
  const qs = productIds.map((id) => `product_ids=${encodeURIComponent(id)}`).join('&');
  return request<BestBidAsk>('GET', `/v3/brokerage/best_bid_ask?${qs}`);
}

export async function createOrder(
  order: CreateOrderRequest
): Promise<{ success: boolean; order_id: string; error_response?: unknown }> {
  return request<{ success: boolean; order_id: string; error_response?: unknown }>(
    'POST',
    '/v3/brokerage/orders',
    order
  );
}

export async function listOrders(
  status?: string,
  productId?: string,
  limit = 100
): Promise<Order[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (status) params.set('order_status', status);
  if (productId) params.set('product_id', productId);

  const res = await request<{ orders: Order[]; has_next: boolean }>(
    'GET',
    `/v3/brokerage/orders/historical/batch?${params}`
  );
  return res.orders ?? [];
}

export async function cancelOrders(orderIds: string[]): Promise<unknown> {
  return request<unknown>('POST', '/v3/brokerage/orders/batch_cancel', {
    order_ids: orderIds,
  });
}

export async function listFills(
  orderId?: string,
  productId?: string,
  limit = 100
): Promise<Fill[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (orderId) params.set('order_id', orderId);
  if (productId) params.set('product_id', productId);

  const res = await request<{ fills: Fill[] }>(
    'GET',
    `/v3/brokerage/orders/historical/fills?${params}`
  );
  return res.fills ?? [];
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function fmtPrice(value: string | number, decimals = 2): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '–';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtChange(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '–';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function generateClientOrderId(): string {
  return `aess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
