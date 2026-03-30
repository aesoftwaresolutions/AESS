import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, AlertCircle, ArrowRight, Activity } from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { usePrices } from '../contexts/PriceContext';
import { getFearGreed, FearGreedData, getWatchlist, summariseSentiment, fetchAll } from '../services/news';
import { Account, Fill } from '../types';
import { DATA_REFRESH_MS } from '../constants';

const Dashboard: React.FC = () => {
  const { prices, wsStatus, subscribe } = usePrices();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const hasCredentials = !!coinbase.getCredentials();
  const watchlist = getWatchlist();

  // Subscribe watchlist to live prices
  useEffect(() => { subscribe(watchlist); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const promises: Promise<unknown>[] = [getFearGreed()];
      if (hasCredentials) {
        promises.push(coinbase.getAccounts(), coinbase.listFills(undefined, undefined, 10));
      }
      const results = await Promise.all(promises);
      const fg = results[0] as FearGreedData | null;
      if (fg) setFearGreed(fg);
      if (hasCredentials) {
        const accts = results[1] as Account[];
        setAccounts(
          accts.filter(
            (a) => parseFloat(a.available_balance.value) > 0 || parseFloat(a.hold.value) > 0
          )
        );
        setFills(results[2] as Fill[]);
      }
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [hasCredentials]);

  // Load sentiment summary quietly
  useEffect(() => {
    fetchAll().then((feed) => {
      const s = summariseSentiment(feed.items.slice(0, 100));
      setSentimentScore(s.score);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, DATA_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadData]);

  // Compute portfolio value using live WS prices
  const portfolioValue = accounts.reduce((total, acct) => {
    const bal =
      parseFloat(acct.available_balance.value) + parseFloat(acct.hold.value);
    if (acct.currency === 'USD' || acct.currency === 'USDC') return total + bal;
    const live = prices[`${acct.currency}-USD`];
    if (live) return total + bal * live.price;
    return total;
  }, 0);

  const fgColor =
    !fearGreed ? 'text-slate-400' :
    fearGreed.value <= 25 ? 'text-red-400' :
    fearGreed.value <= 45 ? 'text-orange-400' :
    fearGreed.value <= 55 ? 'text-yellow-400' :
    fearGreed.value <= 75 ? 'text-green-400' :
    'text-emerald-400';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${
            wsStatus === 'open' ? 'text-emerald-400' :
            wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            <Activity size={12} />
            {wsStatus === 'open' ? 'Live' : wsStatus}
          </div>
          <button onClick={loadData} disabled={loading}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm disabled:opacity-50">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Refresh'}
          </button>
        </div>
      </div>

      {!hasCredentials && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 font-medium">Connect your Coinbase account</p>
            <p className="text-blue-400/80 text-sm">Live prices are streaming. Add API keys to see balances and trade.</p>
          </div>
          <Link to="/settings"
            className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            Configure <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Portfolio value */}
        <div className="sm:col-span-1 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5">
          <p className="text-blue-200 text-xs font-medium mb-1">Portfolio Value (est.)</p>
          {!hasCredentials ? (
            <p className="text-slate-300 text-sm">—</p>
          ) : loading ? (
            <div className="h-9 w-32 bg-blue-500/40 rounded-lg animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-white">${coinbase.fmtPrice(portfolioValue)}</p>
          )}
        </div>

        {/* Fear & Greed */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-400 mb-1">Fear & Greed Index</p>
          {fearGreed ? (
            <div>
              <span className={`text-3xl font-black ${fgColor}`}>{fearGreed.value}</span>
              <span className={`ml-2 text-sm font-semibold ${fgColor}`}>{fearGreed.classification}</span>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${fearGreed.value}%`, backgroundColor: fgColor.replace('text-', '').replace('-400', '') === 'red' ? '#f87171' : '#34d399' }} />
              </div>
            </div>
          ) : (
            <div className="h-9 w-20 bg-slate-700 rounded animate-pulse" />
          )}
        </div>

        {/* News sentiment */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col justify-between">
          <p className="text-xs text-slate-400 mb-1">News Sentiment</p>
          {sentimentScore !== null ? (
            <div>
              <span className={`text-3xl font-black ${sentimentScore > 0.1 ? 'text-emerald-400' : sentimentScore < -0.1 ? 'text-red-400' : 'text-slate-400'}`}>
                {sentimentScore > 0.1 ? 'Bullish' : sentimentScore < -0.1 ? 'Bearish' : 'Neutral'}
              </span>
              <p className="text-xs text-slate-500 mt-1">Score: {(sentimentScore * 100).toFixed(0)}</p>
            </div>
          ) : (
            <div className="h-9 w-20 bg-slate-700 rounded animate-pulse" />
          )}
        </div>
      </div>

      {/* Live watchlist */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-200">Live Market</h2>
          <Link to="/sentinel" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            Sentinel <ArrowRight size={13} />
          </Link>
        </div>
        <div className="divide-y divide-slate-700">
          {watchlist.map((pid) => {
            const live = prices[pid];
            const positive = (live?.change24h ?? 0) >= 0;
            return (
              <Link key={pid} to={`/trading?product=${pid}`}
                className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-750 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{pid}</p>
                  {live && (
                    <p className="text-xs text-slate-500">
                      H: ${coinbase.fmtPrice(live.high24h)} · L: ${coinbase.fmtPrice(live.low24h)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {live ? (
                    <>
                      <p className="text-sm font-mono font-semibold text-slate-100">
                        ${coinbase.fmtPrice(live.price)}
                      </p>
                      <p className={`text-xs flex items-center gap-0.5 justify-end ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {coinbase.fmtChange(live.change24h)}
                      </p>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-3 w-20 bg-slate-700 rounded animate-pulse" />
                      <div className="h-2 w-12 bg-slate-700 rounded animate-pulse" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Account balances */}
      {hasCredentials && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200 flex items-center gap-2">
              <Wallet size={15} /> Account Balances
            </h2>
            <Link to="/portfolio" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
              Portfolio <ArrowRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-700">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between">
                  <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="px-5 py-6 text-slate-500 text-sm">No non-zero balances.</p>
          ) : (
            <div className="divide-y divide-slate-700">
              {accounts.slice(0, 8).map((acct) => {
                const available = parseFloat(acct.available_balance.value);
                const hold = parseFloat(acct.hold.value);
                const live = prices[`${acct.currency}-USD`];
                const isStable = acct.currency === 'USD' || acct.currency === 'USDC';
                const usdValue = isStable
                  ? available + hold
                  : live ? (available + hold) * live.price : null;

                return (
                  <div key={acct.uuid} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {acct.currency.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{acct.currency}</p>
                        {live && !isStable && (
                          <p className={`text-xs ${live.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${coinbase.fmtPrice(live.price)} · {coinbase.fmtChange(live.change24h)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-slate-200">
                        {coinbase.fmtPrice(available, 6)} {acct.currency}
                      </p>
                      {usdValue !== null && (
                        <p className="text-xs text-slate-500">${coinbase.fmtPrice(usdValue)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent fills */}
      {fills.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200">Recent Trades</h2>
            <Link to="/orders" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
              All orders <ArrowRight size={13} />
            </Link>
          </div>
          <div className="divide-y divide-slate-700">
            {fills.slice(0, 5).map((fill) => (
              <div key={fill.entry_id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    fill.side === 'BUY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>{fill.side}</span>
                  <span className="text-sm text-slate-300">{fill.product_id}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-slate-200">
                    {fill.size} @ ${coinbase.fmtPrice(fill.price)}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(fill.trade_time).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
