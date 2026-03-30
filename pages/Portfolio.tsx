import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RefreshCw, AlertCircle, Wallet, ArrowRight } from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { Account, Product } from '../types';
import { WATCHLIST_PRODUCTS } from '../constants';

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#64748b',
];

const Portfolio: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const hasCredentials = !!coinbase.getCredentials();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [accts, prods] = await Promise.all([
        coinbase.getAccounts(),
        Promise.all(
          WATCHLIST_PRODUCTS.map((id) => coinbase.getProduct(id).catch(() => null))
        ),
      ]);
      setAccounts(accts);
      setProducts(prods.filter(Boolean) as Product[]);
      setLastUpdated(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasCredentials) { setLoading(false); return; }
    loadData();
  }, [hasCredentials, loadData]);

  if (!hasCredentials) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <Wallet size={48} className="text-slate-600" />
        <p className="text-xl font-semibold text-slate-200">No credentials configured</p>
        <Link
          to="/settings"
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2"
        >
          Configure API Keys <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  // Build enriched account list with USD values
  const enriched = accounts.map((acct) => {
    const available = parseFloat(acct.available_balance.value);
    const hold = parseFloat(acct.hold.value);
    const total = available + hold;
    const isStable = acct.currency === 'USD' || acct.currency === 'USDC';
    const prod = products.find((p) => p.base_currency_id === acct.currency);
    const price = prod ? parseFloat(prod.price) : isStable ? 1 : 0;
    const usdValue = total * price;
    return { ...acct, total, usdValue, price };
  });

  const totalUSD = enriched.reduce((s, a) => s + a.usdValue, 0);

  const nonZero = enriched
    .filter((a) => a.total > 0)
    .sort((a, b) => b.usdValue - a.usdValue);

  const pieData = nonZero
    .filter((a) => a.usdValue > 0)
    .map((a) => ({ name: a.currency, value: a.usdValue }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Portfolio</h1>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Total value */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
        <p className="text-blue-200 text-sm font-medium mb-1">Total Portfolio Value</p>
        {loading ? (
          <div className="h-10 w-48 bg-blue-500/40 rounded-lg animate-pulse" />
        ) : (
          <p className="text-4xl font-bold text-white">${coinbase.fmtPrice(totalUSD)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        {!loading && pieData.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <h2 className="font-semibold text-slate-200 mb-4">Allocation</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(v: number) => [`$${coinbase.fmtPrice(v)}`, '']}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Balances table */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200">All Balances</h2>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-700">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between">
                  <div className="h-4 w-20 bg-slate-700 rounded animate-pulse" />
                  <div className="h-4 w-28 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : nonZero.length === 0 ? (
            <p className="px-5 py-6 text-slate-500 text-sm">No non-zero balances found.</p>
          ) : (
            <div className="divide-y divide-slate-700 max-h-80 overflow-y-auto">
              {nonZero.map((acct, i) => (
                <div key={acct.uuid} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{acct.currency}</p>
                      <p className="text-xs text-slate-500">{acct.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-slate-200">
                      {coinbase.fmtPrice(acct.total, 6)}
                    </p>
                    {acct.usdValue > 0 && (
                      <p className="text-xs text-slate-500">${coinbase.fmtPrice(acct.usdValue)}</p>
                    )}
                  </div>
                  <div className="text-right min-w-[4rem]">
                    <p className="text-xs text-slate-500">
                      {totalUSD > 0 ? ((acct.usdValue / totalUSD) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full accounts list including zero balances */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-200">All Accounts</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Currency
                </th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Available
                </th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  On Hold
                </th>
                <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  USD Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(4)].map((_, j) => (
                        <td key={j} className="px-5 py-3">
                          <div className="h-3 bg-slate-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : enriched.map((acct) => (
                    <tr key={acct.uuid} className="hover:bg-slate-750 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-200">{acct.currency}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-300">
                        {coinbase.fmtPrice(parseFloat(acct.available_balance.value), 6)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-400">
                        {coinbase.fmtPrice(parseFloat(acct.hold.value), 6)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-slate-200">
                        {acct.usdValue > 0 ? `$${coinbase.fmtPrice(acct.usdValue)}` : '–'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
