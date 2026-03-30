export interface TickerData {
  productId: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  bestBid: number;
  bestAsk: number;
  lastUpdated: Date;
}

type TickerCallback = (data: TickerData) => void;
type StatusCallback = (status: WSStatus) => void;

export type WSStatus = 'connecting' | 'open' | 'closed' | 'error';

const WS_URL = 'wss://advanced-trade-ws.coinbase.com/ws/market';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_DELAY_MS = 30000;

class CoinbaseWebSocketService {
  private ws: WebSocket | null = null;
  private subscribed = new Set<string>();
  private tickerCallbacks = new Set<TickerCallback>();
  private statusCallbacks = new Set<StatusCallback>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = RECONNECT_DELAY_MS;
  private shouldReconnect = false;
  private _status: WSStatus = 'closed';

  // ─── Public API ────────────────────────────────────────────────────────────

  get status(): WSStatus {
    return this._status;
  }

  /** Start the persistent connection. Call once from a top-level provider. */
  connect(): void {
    this.shouldReconnect = true;
    this._open();
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this._setStatus('closed');
  }

  subscribe(productIds: string[]): void {
    const fresh = productIds.filter((id) => !this.subscribed.has(id));
    fresh.forEach((id) => this.subscribed.add(id));
    if (fresh.length === 0) return;
    if (this._status === 'open') {
      this._send({ type: 'subscribe', product_ids: fresh, channel: 'ticker' });
    } else {
      this.connect();
    }
  }

  unsubscribe(productIds: string[]): void {
    productIds.forEach((id) => this.subscribed.delete(id));
    if (this._status === 'open') {
      this._send({ type: 'unsubscribe', product_ids: productIds, channel: 'ticker' });
    }
  }

  onTicker(cb: TickerCallback): () => void {
    this.tickerCallbacks.add(cb);
    return () => this.tickerCallbacks.delete(cb);
  }

  onStatus(cb: StatusCallback): () => void {
    this.statusCallbacks.add(cb);
    cb(this._status); // immediate call with current status
    return () => this.statusCallbacks.delete(cb);
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  private _open(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this._setStatus('connecting');
    const ws = new WebSocket(WS_URL);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectDelay = RECONNECT_DELAY_MS;
      this._setStatus('open');
      // Re-subscribe to everything
      if (this.subscribed.size > 0) {
        this._send({
          type: 'subscribe',
          product_ids: [...this.subscribed],
          channel: 'ticker',
        });
      }
    };

    ws.onmessage = (evt) => {
      try {
        this._handleMessage(JSON.parse(evt.data as string));
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {
      this._setStatus('error');
    };

    ws.onclose = () => {
      this.ws = null;
      if (this._status !== 'error') this._setStatus('closed');
      if (this.shouldReconnect) {
        this.reconnectTimer = setTimeout(() => {
          this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, MAX_RECONNECT_DELAY_MS);
          this._open();
        }, this.reconnectDelay);
      }
    };
  }

  private _handleMessage(msg: Record<string, unknown>): void {
    if (msg.channel !== 'ticker') return;
    const events = msg.events as Array<Record<string, unknown>> | undefined;
    if (!events) return;

    for (const event of events) {
      const tickers = event.tickers as Array<Record<string, string>> | undefined;
      if (!tickers) continue;
      for (const t of tickers) {
        const data: TickerData = {
          productId: t.product_id,
          price: parseFloat(t.price ?? '0'),
          change24h: parseFloat(t.price_percent_chg_24_h ?? '0'),
          high24h: parseFloat(t.high_24_h ?? '0'),
          low24h: parseFloat(t.low_24_h ?? '0'),
          volume24h: parseFloat(t.volume_24_h ?? '0'),
          bestBid: parseFloat(t.best_bid ?? '0'),
          bestAsk: parseFloat(t.best_ask ?? '0'),
          lastUpdated: new Date(),
        };
        this.tickerCallbacks.forEach((cb) => cb(data));
      }
    }
  }

  private _send(payload: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  private _setStatus(s: WSStatus): void {
    this._status = s;
    this.statusCallbacks.forEach((cb) => cb(s));
  }
}

/** Singleton – import this everywhere */
export const coinbaseWS = new CoinbaseWebSocketService();
