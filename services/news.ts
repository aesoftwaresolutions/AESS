/** Unified news / social-media / sentiment service.
 *
 *  Sources (all proxied through Vite dev server):
 *   - Alternative.me  Fear & Greed Index    → /feargreed/…
 *   - Reddit JSON API                        → /reddit/…
 *   - CryptoPanic API (optional token)       → /cryptopanic/…
 *   - CoinGecko trending + news              → /coingecko/…
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type Sentiment = 'positive' | 'negative' | 'neutral';
export type NewsSource = 'cryptopanic' | 'reddit' | 'coingecko' | 'rss';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  sentiment: Sentiment;
  /** Uppercase ticker symbols mentioned, e.g. ["BTC","ETH"] */
  currencies: string[];
  type: NewsSource;
  votes: { positive: number; negative: number; comments: number };
  thumbnail?: string;
}

export interface FearGreedData {
  value: number;              // 0 (extreme fear) – 100 (extreme greed)
  classification: string;     // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: Date;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  thumb?: string;
}

export interface SentimentSummary {
  score: number;        // -1 to +1
  label: Sentiment;
  positive: number;     // count
  negative: number;
  neutral: number;
  total: number;
}

// ─── Credentials helpers ──────────────────────────────────────────────────────

export function getCryptoPanicToken(): string {
  return localStorage.getItem('cp_token') ?? '';
}

export function saveCryptoPanicToken(token: string): void {
  localStorage.setItem('cp_token', token);
}

// ─── Watchlist helpers (user-configurable, stored in localStorage) ────────────

const DEFAULT_WATCHLIST = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD',
  'ADA-USD', 'AVAX-USD', 'LINK-USD', 'DOT-USD', 'MATIC-USD',
];

export function getWatchlist(): string[] {
  const raw = localStorage.getItem('watchlist');
  if (!raw) return DEFAULT_WATCHLIST;
  try { return JSON.parse(raw); } catch { return DEFAULT_WATCHLIST; }
}

export function saveWatchlist(list: string[]): void {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

export function addToWatchlist(productId: string): void {
  const list = getWatchlist();
  if (!list.includes(productId)) saveWatchlist([...list, productId]);
}

export function removeFromWatchlist(productId: string): void {
  saveWatchlist(getWatchlist().filter((id) => id !== productId));
}

// ─── Utility ─────────────────────────────────────────────────────────────────

const KNOWN_SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK',
  'DOT', 'MATIC', 'BNB', 'LTC', 'SHIB', 'UNI', 'ATOM', 'NEAR',
  'APT', 'ARB', 'OP', 'SUI', 'INJ', 'SEI', 'FIL', 'ALGO',
];

function extractCurrencies(text: string): string[] {
  const upper = ` ${text.toUpperCase()} `;
  return KNOWN_SYMBOLS.filter((s) => upper.includes(` ${s} `) || upper.includes(` ${s},`) || upper.includes(` ${s}.`));
}

function inferSentiment(text: string, positiveVotes = 0, negativeVotes = 0): Sentiment {
  if (positiveVotes > negativeVotes * 2) return 'positive';
  if (negativeVotes > positiveVotes * 2) return 'negative';
  const lower = text.toLowerCase();
  const positiveWords = ['surge', 'soar', 'rally', 'bull', 'gain', 'high', 'rise', 'boost', 'pump', 'moon', 'breakout', 'all-time'];
  const negativeWords = ['crash', 'dump', 'bear', 'drop', 'fall', 'plunge', 'loss', 'low', 'down', 'fear', 'hack', 'scam', 'ban'];
  const pos = positiveWords.filter((w) => lower.includes(w)).length;
  const neg = negativeWords.filter((w) => lower.includes(w)).length;
  if (pos > neg) return 'positive';
  if (neg > pos) return 'negative';
  return 'neutral';
}

// ─── Fear & Greed Index (Alternative.me) ─────────────────────────────────────

export async function getFearGreed(): Promise<FearGreedData | null> {
  try {
    const res = await fetch('/feargreed/fng/?limit=1&format=json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const item = data.data?.[0];
    if (!item) return null;
    return {
      value: parseInt(item.value, 10),
      classification: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp, 10) * 1000),
    };
  } catch {
    return null;
  }
}

// ─── Reddit JSON API ──────────────────────────────────────────────────────────

const SUBREDDITS = ['CryptoCurrency', 'Bitcoin', 'ethereum', 'CryptoMarkets'];

async function fetchSubreddit(subreddit: string, limit = 20): Promise<NewsItem[]> {
  const res = await fetch(`/reddit/r/${subreddit}/hot.json?limit=${limit}&raw_json=1`);
  if (!res.ok) throw new Error(`Reddit ${subreddit}: HTTP ${res.status}`);
  const data = await res.json();
  return (data.data?.children ?? []).map((post: Record<string, Record<string, unknown>>) => {
    const d = post.data;
    const title = String(d.title ?? '');
    return {
      id: String(d.id),
      title,
      url: `https://reddit.com${d.permalink}`,
      source: `r/${subreddit}`,
      publishedAt: new Date((d.created_utc as number) * 1000),
      sentiment: inferSentiment(title, d.ups as number, d.downs as number),
      currencies: extractCurrencies(title),
      type: 'reddit' as NewsSource,
      votes: {
        positive: (d.ups as number) ?? 0,
        negative: (d.downs as number) ?? 0,
        comments: (d.num_comments as number) ?? 0,
      },
      thumbnail: String(d.thumbnail ?? '').startsWith('http') ? String(d.thumbnail) : undefined,
    };
  });
}

export async function getRedditNews(subreddits = SUBREDDITS): Promise<NewsItem[]> {
  const results = await Promise.allSettled(subreddits.map((r) => fetchSubreddit(r)));
  const items: NewsItem[] = [];
  results.forEach((r) => { if (r.status === 'fulfilled') items.push(...r.value); });
  return items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

// ─── CryptoPanic API ──────────────────────────────────────────────────────────

export async function getCryptoPanicNews(currencies?: string[]): Promise<NewsItem[]> {
  const token = getCryptoPanicToken();
  if (!token) return [];

  try {
    const params = new URLSearchParams({ auth_token: token, public: 'true', kind: 'news' });
    if (currencies?.length) params.set('currencies', currencies.slice(0, 5).join(','));

    const res = await fetch(`/cryptopanic/api/v1/posts/?${params}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return (data.results ?? []).map((item: Record<string, unknown>) => {
      const votes = (item.votes as Record<string, number>) ?? {};
      const title = String(item.title ?? '');
      return {
        id: String(item.id),
        title,
        url: String(item.url ?? '#'),
        source: (item.source as Record<string, string>)?.title ?? 'CryptoPanic',
        publishedAt: new Date(String(item.published_at)),
        sentiment: inferSentiment(title, votes.positive ?? 0, votes.negative ?? 0),
        currencies: ((item.currencies as Array<Record<string, string>>) ?? []).map((c) => c.code),
        type: 'cryptopanic' as NewsSource,
        votes: {
          positive: votes.positive ?? 0,
          negative: votes.negative ?? 0,
          comments: votes.comments ?? 0,
        },
      };
    });
  } catch {
    return [];
  }
}

// ─── CoinGecko trending coins ──────────────────────────────────────────────────

export async function getTrendingCoins(): Promise<TrendingCoin[]> {
  try {
    const res = await fetch('/coingecko/api/v3/search/trending');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return (data.coins ?? []).map((c: Record<string, Record<string, unknown>>) => ({
      id: String(c.item.id),
      name: String(c.item.name),
      symbol: String(c.item.symbol).toUpperCase(),
      rank: (c.item.market_cap_rank as number) ?? 999,
      thumb: c.item.thumb ? String(c.item.thumb) : undefined,
    }));
  } catch {
    return [];
  }
}

// ─── Aggregated fetch ────────────────────────────────────────────────────────

export interface AggregatedFeed {
  items: NewsItem[];
  fearGreed: FearGreedData | null;
  trending: TrendingCoin[];
  fetchedAt: Date;
}

export async function fetchAll(currencies?: string[]): Promise<AggregatedFeed> {
  const [cpNews, redditNews, trending, fearGreed] = await Promise.all([
    getCryptoPanicNews(currencies),
    getRedditNews(),
    getTrendingCoins(),
    getFearGreed(),
  ]);

  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const item of [...cpNews, ...redditNews]) {
    const key = item.title.slice(0, 60).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
  }

  items.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  return { items, fearGreed, trending, fetchedAt: new Date() };
}

// ─── Sentiment summary ─────────────────────────────────────────────────────────

export function summariseSentiment(items: NewsItem[]): SentimentSummary {
  const positive = items.filter((i) => i.sentiment === 'positive').length;
  const negative = items.filter((i) => i.sentiment === 'negative').length;
  const neutral = items.filter((i) => i.sentiment === 'neutral').length;
  const total = items.length;
  const score = total === 0 ? 0 : (positive - negative) / total;
  const label: Sentiment = score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral';
  return { score, label, positive, negative, neutral, total };
}
