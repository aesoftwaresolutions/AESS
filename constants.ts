/** Default watchlist – overridden by user's localStorage preference */
export const DEFAULT_WATCHLIST = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD',
  'ADA-USD', 'AVAX-USD', 'LINK-USD', 'DOT-USD', 'MATIC-USD',
];

export const DEFAULT_PRODUCT = 'BTC-USD';

/** Chart granularity options */
export const GRANULARITY_OPTIONS = [
  { label: '1m',  value: 'ONE_MINUTE',     windowSeconds: 3_600 },
  { label: '5m',  value: 'FIVE_MINUTE',    windowSeconds: 6 * 3_600 },
  { label: '15m', value: 'FIFTEEN_MINUTE', windowSeconds: 12 * 3_600 },
  { label: '1h',  value: 'ONE_HOUR',       windowSeconds: 24 * 3_600 },
  { label: '6h',  value: 'SIX_HOUR',       windowSeconds: 7 * 24 * 3_600 },
  { label: '1d',  value: 'ONE_DAY',        windowSeconds: 30 * 24 * 3_600 },
] as const;

/** How often (ms) to auto-refresh news / sentiment */
export const NEWS_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

/** How often (ms) to auto-refresh REST account/order data */
export const DATA_REFRESH_MS = 30 * 1000; // 30 seconds

export const APP_NAME = 'AESS Trade';
