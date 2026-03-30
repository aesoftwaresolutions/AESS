import React, { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, ExternalLink, Filter, TrendingUp, TrendingDown,
  Minus, Flame, MessageSquare, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import {
  fetchAll, AggregatedFeed, summariseSentiment,
  NewsItem, Sentiment, NewsSource, getCryptoPanicToken,
} from '../services/news';
import { NEWS_REFRESH_MS } from '../constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_ICONS: Record<Sentiment, React.ReactNode> = {
  positive: <TrendingUp size={12} className="text-emerald-400" />,
  negative: <TrendingDown size={12} className="text-red-400" />,
  neutral:  <Minus size={12} className="text-slate-400" />,
};

const SENTIMENT_COLORS: Record<Sentiment, string> = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral:  'text-slate-400',
};

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ─── News card ─────────────────────────────────────────────────────────────────

const NewsCard: React.FC<{ item: NewsItem }> = ({ item }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noopener noreferrer"
    className="flex gap-3 p-4 hover:bg-slate-750 transition-colors border-b border-slate-700 last:border-0 group"
  >
    {item.thumbnail && (
      <img
        src={item.thumbnail}
        alt=""
        className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-slate-700"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    )}
    <div className="flex-1 min-w-0 space-y-1">
      <p className="text-sm text-slate-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
        {item.title}
      </p>
      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
        <span className="font-medium text-slate-400">{item.source}</span>
        <span>·</span>
        <span>{timeAgo(item.publishedAt)}</span>
        {item.currencies.length > 0 && (
          <>
            <span>·</span>
            {item.currencies.slice(0, 4).map((c) => (
              <span key={c} className="text-blue-400 font-medium">{c}</span>
            ))}
          </>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className={`flex items-center gap-0.5 ${SENTIMENT_COLORS[item.sentiment]}`}>
          {SENTIMENT_ICONS[item.sentiment]}
          {item.sentiment}
        </span>
        {item.votes.positive > 0 && (
          <span className="flex items-center gap-0.5 text-slate-500">
            <ThumbsUp size={10} /> {item.votes.positive}
          </span>
        )}
        {item.votes.negative > 0 && (
          <span className="flex items-center gap-0.5 text-slate-500">
            <ThumbsDown size={10} /> {item.votes.negative}
          </span>
        )}
        {item.votes.comments > 0 && (
          <span className="flex items-center gap-0.5 text-slate-500">
            <MessageSquare size={10} /> {item.votes.comments}
          </span>
        )}
        <ExternalLink size={9} className="ml-auto text-slate-600 group-hover:text-slate-400" />
      </div>
    </div>
  </a>
);

// ─── Main component ───────────────────────────────────────────────────────────

type SentimentFilter = 'all' | Sentiment;
type SourceFilter = 'all' | NewsSource;

const News: React.FC = () => {
  const [feed, setFeed] = useState<AggregatedFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');
  const hasCpToken = !!getCryptoPanicToken();

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAll();
      setFeed(data);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, NEWS_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadFeed]);

  const filtered = (feed?.items ?? []).filter((item) => {
    if (sentimentFilter !== 'all' && item.sentiment !== sentimentFilter) return false;
    if (sourceFilter !== 'all' && item.type !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.currencies.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const summary = feed ? summariseSentiment(feed.items.slice(0, 200)) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">News & Social</h1>
          <p className="text-slate-400 text-sm">
            Reddit · CryptoPanic · CoinGecko trending · Auto-refreshes every 5 min
          </p>
        </div>
        <button
          onClick={loadFeed}
          disabled={loading}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Refresh'}
        </button>
      </div>

      {/* Sentiment summary */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Articles', value: summary.total, color: 'text-slate-200' },
            { label: 'Bullish', value: summary.positive, color: 'text-emerald-400' },
            { label: 'Bearish', value: summary.negative, color: 'text-red-400' },
            { label: 'Neutral', value: summary.neutral, color: 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Trending */}
      {feed?.trending && feed.trending.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={14} className="text-orange-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Trending on CoinGecko</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {feed.trending.map((coin) => (
              <div
                key={coin.id}
                className="flex items-center gap-1.5 bg-slate-700 px-2.5 py-1.5 rounded-lg text-xs text-slate-200"
              >
                {coin.thumb && (
                  <img src={coin.thumb} alt={coin.symbol} className="w-4 h-4 rounded-full" />
                )}
                <span className="font-semibold">{coin.symbol}</span>
                {coin.rank && <span className="text-slate-500">#{coin.rank}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />

        {/* Sentiment filter */}
        <div className="flex gap-1">
          {(['all', 'positive', 'negative', 'neutral'] as SentimentFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setSentimentFilter(f)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
                sentimentFilter === f
                  ? f === 'positive' ? 'bg-emerald-700 text-emerald-100' :
                    f === 'negative' ? 'bg-red-800 text-red-100' :
                    'bg-slate-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-slate-700" />

        {/* Source filter */}
        <div className="flex gap-1">
          {([
            { id: 'all', label: 'All' },
            { id: 'reddit', label: 'Reddit' },
            { id: 'cryptopanic', label: 'CryptoPanic' },
          ] as { id: SourceFilter; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSourceFilter(id)}
              disabled={id === 'cryptopanic' && !hasCpToken}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
                sourceFilter === id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title={id === 'cryptopanic' && !hasCpToken ? 'Add CryptoPanic token in Settings' : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search headlines, coins…"
          className="ml-auto bg-slate-900 border border-slate-600 rounded px-2.5 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48"
        />
      </div>

      {/* Articles */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        {loading && !feed ? (
          <div className="divide-y divide-slate-700">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="p-4 space-y-1.5">
                <div className="h-3 w-4/5 bg-slate-700 rounded animate-pulse" />
                <div className="h-3 w-3/5 bg-slate-700 rounded animate-pulse" />
                <div className="h-2 w-2/5 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 space-y-2">
            <p className="text-lg">No articles found</p>
            {!hasCpToken && (
              <p className="text-sm">
                Add a <span className="text-blue-400">CryptoPanic token</span> in Settings for more news sources.
              </p>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((item) => (
              <NewsCard key={`${item.type}-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default News;
