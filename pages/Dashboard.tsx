import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { Account, Product, Fill } from '../types';
import { WATCHLIST_PRODUCTS } from '../constants';

const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const hasCredentials = !!coinbase.getCredentials();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accts, prods, recentFills] = await Promise.all([
        coinbase.getAccounts(),
        Promise.all(
          WATCHLIST_PRODUCTS.map((id) =>
            coinbase.getProduct(id).catch(() => null)
          )
        ),
        coinbase.listFills(undefined, undefined, 10),
      ]);

      setAccounts(
        accts.filter(
          (a) =>
            parseFloat(a.available_balance.value) > 0 ||
            parseFloat(a.hold.value) > 0
        )
      );
      setProducts(prods.filter(Boolean) as Product[]);
      setFills(recentFills);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasCredentials) {
      setLoading(false);
      return;
    }
    loadData();
  }, [hasCredentials, loadData]);

  // Compute portfolio value in USD
  const portfolioValue = accounts.reduce((total, acct) => {
    const bal = parseFloat(acct.available_balance.value) + parseFloat(acct.hold.value);
    if (acct.currency === 'USD' || acct.currency === 'USDC') return total + bal;
    const prod = products.find((p) => p.base_currency_id === acct.currency);
    if (prod) return total + bal * parseFloat(prod.price);
    return total;
  }, 0);

  if (!hasCredentials) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <Wallet size={48} className="text-slate-600" />
        <div>
          <p className="text-xl font-semibold text-slate-200">No credentials configured</p>
          <p className="text-slate-400 text-sm mt-1">Connect your Coinbase account to get started.</p>
        </div>
        <Link
          to="/settings"
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2"
        >
          Configure API Keys <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Failed to load data</p>
            <p className="text-red-400 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Portfolio value card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg">
        <p className="text-blue-200 text-sm font-medium mb-1">Total Portfolio Value</p>
        {loading ? (
          <div className="h-10 w-48 bg-blue-500/40 rounded-lg animate-pulse" />
        ) : (
          <p className="text-4xl font-bold text-white">
            ${coinbase.fmtPrice(portfolioValue)}
          </p>
        )}
        <p className="text-blue-300 text-xs mt-2">Estimated across all Coinbase accounts</p>
      </div>

      {/* Account balances */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-200">Account Balances</h2>
          <Link to="/portfolio" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            View all <ArrowRight size={13} />
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
          <p className="px-5 py-6 text-slate-500 text-sm">No non-zero balances found.</p>
        ) : (
          <div className="divide-y divide-slate-700">
            {accounts.slice(0, 8).map((acct) => {
              const available = parseFloat(acct.available_balance.value);
              const hold = parseFloat(acct.hold.value);
              const prod = products.find((p) => p.base_currency_id === acct.currency);
              const usdValue =
                acct.currency === 'USD' || acct.currency === 'USDC'
                  ? available + hold
                  : prod
                  ? (available + hold) * parseFloat(prod.price)
                  : null;

              return (
                <div key={acct.uuid} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                      {acct.currency.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">{acct.currency}</p>
                      <p className="text-xs text-slate-500">{acct.name}</p>
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

      {/* Market watchlist */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-200">Market Watchlist</h2>
          <Link to="/trading" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
            Trade <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div className="divide-y divide-slate-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex justify-between">
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                <div className="h-4 w-28 bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {products.map((prod) => {
              const change = parseFloat(prod.price_percentage_change_24h);
              const positive = change >= 0;
              return (
                <Link
                  key={prod.product_id}
                  to={`/trading?product=${prod.product_id}`}
                  className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-slate-750 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{prod.product_id}</p>
                    <p className="text-xs text-slate-500">
                      Vol {coinbase.fmtPrice(prod.approximate_quote_24h_volume)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold text-slate-100">
                      ${coinbase.fmtPrice(prod.price)}
                    </p>
                    <p className={`text-xs flex items-center gap-0.5 justify-end ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {coinbase.fmtChange(change)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      fill.side === 'BUY'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {fill.side}
                  </span>
                  <span className="text-sm text-slate-300">{fill.product_id}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-slate-200">
                    {fill.size} @ ${coinbase.fmtPrice(fill.price)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(fill.trade_time).toLocaleString()}
                  </p>
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
