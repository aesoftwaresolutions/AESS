/** Popular spot products shown on the watchlist / quick-select */
export const WATCHLIST_PRODUCTS = [
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'XRP-USD',
  'DOGE-USD',
  'ADA-USD',
  'AVAX-USD',
  'LINK-USD',
  'DOT-USD',
  'MATIC-USD',
];

export const DEFAULT_PRODUCT = 'BTC-USD';

/** Granularity options for the price chart */
export const GRANULARITY_OPTIONS = [
  { label: '1m',  value: 'ONE_MINUTE',     seconds: 60,     windowSeconds: 3600 },
  { label: '5m',  value: 'FIVE_MINUTE',    seconds: 300,    windowSeconds: 6 * 3600 },
  { label: '15m', value: 'FIFTEEN_MINUTE', seconds: 900,    windowSeconds: 12 * 3600 },
  { label: '1h',  value: 'ONE_HOUR',       seconds: 3600,   windowSeconds: 24 * 3600 },
  { label: '6h',  value: 'SIX_HOUR',       seconds: 21600,  windowSeconds: 7 * 24 * 3600 },
  { label: '1d',  value: 'ONE_DAY',        seconds: 86400,  windowSeconds: 30 * 24 * 3600 },
] as const;

export const APP_NAME = 'AESS Trade';
