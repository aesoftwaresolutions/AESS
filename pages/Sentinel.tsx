import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, TrendingUp, TrendingDown, Bell, BellOff,
  RefreshCw, AlertCircle, Wifi, WifiOff, Newspaper, ArrowRight,
} from 'lucide-react';
import { usePrices } from '../contexts/PriceContext';
import { fmtPrice, fmtChange, getCredentials } from '../services/coinbase';
import {
  fetchAll, AggregatedFeed, summariseSentiment, getFearGreed,
  FearGreedData, getWatchlist, addToWatchlist, removeFromWatchlist,
} from '../services/news';
import { NEWS_REFRESH_MS, DATA_REFRESH_MS } from '../constants';

// ─── Price Alert types ────────────────────────────────────────────────────────

interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number;
  direction: 'above' | 'below';
  triggered: boolean;
}

function loadAlerts(): PriceAlert[] {
  try { return JSON.parse(localStorage.getItem('price_alerts') ?? '[]'); } catch { return []; }
}
function saveAlerts(alerts: PriceAlert[]): void {
  localStorage.setItem('price_alerts', JSON.stringify(alerts));
}

// ─── Fear & Greed gauge ───────────────────────────────────────────────────────

const FearGreedGauge: React.FC<{ data: FearGreedData | null; loading?: boolean }> = ({ data, loading }) => {
  if (loading) return <div className="h-20 bg-slate-700 rounded-xl animate-pulse" />;
  if (!data) return null;

  const v = data.value;
  const color =
    v <= 25 ? '#ef4444' :
    v <= 45 ? '#f97316' :
    v <= 55 ? '#eab308' :
    v <= 75 ? '#22c55e' :
              '#10b981';

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
      <p className="text-xs text-slate-400 mb-2 uppercase tracking-wider">Fear & Greed Index</p>
      <div className="text-5xl font-black" style={{ color }}>{v}</div>
      <p className="text-sm font-semibold mt-1" style={{ color }}>{data.classification}</p>
      <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${v}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Fear</span>
        <span>Greed</span>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {data.timestamp.toLocaleDateString()}
      </p>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Sentinel: React.FC = () => {
  const { prices, wsStatus, subscribe } = usePrices();
  const [watchlist, setWatchlist] = useState<string[]>(getWatchlist());
  const [feed, setFeed] = useState<AggregatedFeed | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [fgLoading, setFgLoading] = useState(true);
  const [lastFeedAt, setLastFeedAt] = useState<Date | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>(loadAlerts);
  const [newAlertProduct, setNewAlertProduct] = useState('');
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [newAlertDir, setNewAlertDir] = useState<'above' | 'below'>('above');
  const [notifPermission, setNotifPermission] = useState(Notification.permission);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  const hasCredentials = !!getCredentials();

  // ─── Subscribe watchlist to live WS ────────────────────────────────────────
  useEffect(() => {
    subscribe(watchlist);
  }, [watchlist, subscribe]);

  // ─── News feed refresh ──────────────────────────────────────────────────────
  const refreshFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await fetchAll();
      setFeed(data);
      setLastFeedAt(new Date());
    } finally {
      setFeedLoading(false);
    }
  }, []);

  const refreshFG = useCallback(async () => {
    setFgLoading(true);
    try {
      const fg = await getFearGreed();
      if (fg) setFearGreed(fg);
    } finally {
      setFgLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFeed();
    refreshFG();
    const newsFi = setInterval(refreshFeed, NEWS_REFRESH_MS);
    const fgFi = setInterval(refreshFG, 60 * 60 * 1000); // every hour
    return () => { clearInterval(newsFi); clearInterval(fgFi); };
  }, [refreshFeed, refreshFG]);

  // ─── Price alert checks ─────────────────────────────────────────────────────
  useEffect(() => {
    const current = alertsRef.current;
    let changed = false;
    const updated = current.map((alert) => {
      if (alert.triggered) return alert;
      const live = prices[alert.productId];
      if (!live) return alert;
      const hit =
        (alert.direction === 'above' && live.price >= alert.targetPrice) ||
        (alert.direction === 'below' && live.price <= alert.targetPrice);
      if (hit) {
        changed = true;
        // Fire browser notification
        if (Notification.permission === 'granted') {
          new Notification(`${alert.productId} Alert`, {
            body: `Price ${alert.direction === 'above' ? '≥' : '≤'} $${fmtPrice(alert.targetPrice)} — now $${fmtPrice(live.price)}`,
            icon: '/favicon.ico',
          });
        }
        return { ...alert, triggered: true };
      }
      return alert;
    });
    if (changed) {
      setAlerts(updated);
      saveAlerts(updated);
    }
  }, [prices]);

  // ─── Watchlist management ───────────────────────────────────────────────────
  const handleAddToWatchlist = (id: string) => {
    if (!id.trim() || watchlist.includes(id.toUpperCase())) return;
    const pid = id.toUpperCase();
    addToWatchlist(pid);
    setWatchlist(getWatchlist());
    subscribe([pid]);
  };

  const handleRemoveFromWatchlist = (id: string) => {
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  };

  // ─── Alert management ───────────────────────────────────────────────────────
  const handleAddAlert = () => {
    if (!newAlertProduct.trim() || !newAlertPrice) return;
    const alert: PriceAlert = {
      id: `${Date.now()}`,
      productId: newAlertProduct.toUpperCase(),
      targetPrice: parseFloat(newAlertPrice),
      direction: newAlertDir,
      triggered: false,
    };
    const updated = [...alerts, alert];
    setAlerts(updated);
    saveAlerts(updated);
    setNewAlertProduct('');
    setNewAlertPrice('');
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    setAlerts(updated);
    saveAlerts(updated);
  };

  const requestNotifications = async () => {
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const sentiment = feed ? summariseSentiment(feed.items.slice(0, 100)) : null;

  const wsColor =
    wsStatus === 'open' ? 'text-emerald-400' :
    wsStatus === 'connecting' ? 'text-yellow-400' :
    'text-red-400';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sentinel</h1>
          <p className="text-slate-400 text-sm">24/7 monitoring — prices, news, sentiment</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WS status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${wsColor}`}>
            {wsStatus === 'open' ? <Wifi size={13} /> : <WifiOff size={13} />}
            Live feed {wsStatus}
          </div>
          {/* News refresh */}
          <button
            onClick={refreshFeed}
            disabled={feedLoading}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm"
          >
            <RefreshCw size={13} className={feedLoading ? 'animate-spin' : ''} />
            {lastFeedAt ? lastFeedAt.toLocaleTimeString() : 'Refresh news'}
          </button>
        </div>
      </div>

      {/* Notification permission banner */}
      {notifPermission !== 'granted' && (
        <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-amber-300">Enable browser notifications to receive price alerts.</span>
          <button
            onClick={requestNotifications}
            className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            Enable Alerts
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* ── Left column (3/4) ──────────────────────────────────────────── */}
        <div className="xl:col-span-3 space-y-4">
          {/* Live price grid */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                <Activity size={15} className="text-emerald-400" />
                Live Prices
              </h2>
              <Link to="/trading" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                Trade <ArrowRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-slate-700">
              {watchlist.map((pid) => {
                const live = prices[pid];
                const positive = (live?.change24h ?? 0) >= 0;
                return (
                  <div key={pid} className="bg-slate-800 p-3 hover:bg-slate-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-slate-300">{pid.split('-')[0]}</p>
                      <button
                        onClick={() => handleRemoveFromWatchlist(pid)}
                        className="text-slate-600 hover:text-red-400 text-xs leading-none"
                        title="Remove from watchlist"
                      >
                        ×
                      </button>
                    </div>
                    {live ? (
                      <>
                        <p className="text-sm font-mono font-bold text-white mt-1">
                          ${fmtPrice(live.price)}
                        </p>
                        <p className={`text-xs flex items-center gap-0.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {fmtChange(live.change24h)}
                        </p>
                      </>
                    ) : (
                      <div className="mt-1 space-y-1">
                        <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                        <div className="h-2 w-12 bg-slate-700 rounded animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Add to watchlist */}
              <div className="bg-slate-800 p-3 flex items-center justify-center">
                <AddWatchlistInline onAdd={handleAddToWatchlist} />
              </div>
            </div>
          </div>

          {/* Sentiment summary */}
          {sentiment && sentiment.total > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h2 className="font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <Newspaper size={15} />
                News Sentiment ({sentiment.total} articles)
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className="h-3 flex">
                    <div
                      className="bg-emerald-500 h-3"
                      style={{ width: `${(sentiment.positive / sentiment.total) * 100}%` }}
                    />
                    <div
                      className="bg-slate-500 h-3"
                      style={{ width: `${(sentiment.neutral / sentiment.total) * 100}%` }}
                    />
                    <div
                      className="bg-red-500 h-3"
                      style={{ width: `${(sentiment.negative / sentiment.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-emerald-400">{sentiment.positive} bullish</span>
                  <span className="text-slate-400">{sentiment.neutral} neutral</span>
                  <span className="text-red-400">{sentiment.negative} bearish</span>
                </div>
              </div>
            </div>
          )}

          {/* Latest news headlines */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
              <h2 className="font-semibold text-slate-200">Latest Headlines</h2>
              <Link to="/news" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1">
                Full feed <ArrowRight size={12} />
              </Link>
            </div>
            {feedLoading && !feed ? (
              <div className="divide-y divide-slate-700">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="px-5 py-3 space-y-1">
                    <div className="h-3 w-3/4 bg-slate-700 rounded animate-pulse" />
                    <div className="h-2 w-1/4 bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-700 max-h-96 overflow-y-auto">
                {(feed?.items ?? []).slice(0, 20).map((item) => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-5 py-3 hover:bg-slate-750 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                          item.sentiment === 'positive' ? 'bg-emerald-400' :
                          item.sentiment === 'negative' ? 'bg-red-400' :
                          'bg-slate-500'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 leading-snug line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span>{item.source}</span>
                          <span>·</span>
                          <span>{item.publishedAt.toLocaleTimeString()}</span>
                          {item.currencies.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-blue-400">{item.currencies.slice(0, 3).join(' ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
                {feed?.items.length === 0 && (
                  <p className="px-5 py-6 text-slate-500 text-sm text-center">
                    No news yet. Add a CryptoPanic token in Settings for more sources.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Trending coins */}
          {feed?.trending && feed.trending.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <h2 className="font-semibold text-slate-200 mb-3">Trending on CoinGecko</h2>
              <div className="flex flex-wrap gap-2">
                {feed.trending.map((coin) => (
                  <button
                    key={coin.id}
                    onClick={() => handleAddToWatchlist(`${coin.symbol}-USD`)}
                    className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 transition-colors"
                    title={`Add ${coin.symbol}-USD to watchlist`}
                  >
                    {coin.thumb && (
                      <img src={coin.thumb} alt={coin.symbol} className="w-4 h-4 rounded-full" />
                    )}
                    {coin.symbol}
                    {coin.rank && <span className="text-slate-500">#{coin.rank}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column (1/4) ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Fear & Greed */}
          <FearGreedGauge data={fearGreed} loading={fgLoading && !fearGreed} />

          {/* Price Alerts */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700">
              <Bell size={14} className="text-yellow-400" />
              <h2 className="font-semibold text-slate-200 text-sm">Price Alerts</h2>
            </div>

            {/* Add new alert */}
            <div className="p-3 border-b border-slate-700 space-y-2">
              <input
                type="text"
                value={newAlertProduct}
                onChange={(e) => setNewAlertProduct(e.target.value)}
                placeholder="BTC-USD"
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={newAlertPrice}
                  onChange={(e) => setNewAlertPrice(e.target.value)}
                  placeholder="Price"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={newAlertDir}
                  onChange={(e) => setNewAlertDir(e.target.value as 'above' | 'below')}
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="above">↑ Above</option>
                  <option value="below">↓ Below</option>
                </select>
              </div>
              <button
                onClick={handleAddAlert}
                disabled={!newAlertProduct || !newAlertPrice}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs py-1.5 rounded font-semibold"
              >
                Add Alert
              </button>
            </div>

            {/* Alert list */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-700">
              {alerts.length === 0 ? (
                <p className="px-4 py-4 text-xs text-slate-500 text-center">No alerts set.</p>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`px-4 py-2.5 flex items-center justify-between gap-2 ${
                      alert.triggered ? 'opacity-50' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-200">{alert.productId}</p>
                      <p className="text-xs text-slate-500">
                        {alert.direction === 'above' ? '↑' : '↓'} ${fmtPrice(alert.targetPrice)}
                        {alert.triggered && <span className="text-yellow-400 ml-1">✓ triggered</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="text-slate-500 hover:text-red-400 text-xs"
                    >
                      <BellOff size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* No credentials warning */}
          {!hasCredentials && (
            <div className="bg-slate-800 border border-amber-700/50 rounded-xl p-4 text-sm">
              <p className="text-amber-300 font-medium mb-1">Not connected</p>
              <p className="text-slate-400 text-xs mb-3">
                Prices are live via WebSocket. Connect your Coinbase API keys to trade.
              </p>
              <Link
                to="/settings"
                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
              >
                Configure keys <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Inline add-to-watchlist control ─────────────────────────────────────────

const AddWatchlistInline: React.FC<{ onAdd: (id: string) => void }> = ({ onAdd }) => {
  const [val, setVal] = useState('');
  return (
    <form
      className="flex flex-col items-center gap-1"
      onSubmit={(e) => { e.preventDefault(); onAdd(val); setVal(''); }}
    >
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add pair…"
        className="w-20 bg-slate-900 border border-slate-600 rounded px-1.5 py-1 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 text-center"
      />
      <button
        type="submit"
        disabled={!val.trim()}
        className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30"
      >
        + Add
      </button>
    </form>
  );
};

export default Sentinel;
