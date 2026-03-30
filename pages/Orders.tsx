import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, AlertCircle, ClipboardList, ArrowRight, XCircle } from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { Order, Fill } from '../types';

type Tab = 'open' | 'history' | 'fills';

const Orders: React.FC = () => {
  const [tab, setTab] = useState<Tab>('open');
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const hasCredentials = !!coinbase.getCredentials();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [open, history, fillList] = await Promise.all([
        coinbase.listOrders('OPEN'),
        coinbase.listOrders('FILLED'),
        coinbase.listFills(),
      ]);
      setOpenOrders(open);
      setHistoryOrders(history);
      setFills(fillList);
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

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await coinbase.cancelOrders([orderId]);
      setOpenOrders((prev) => prev.filter((o) => o.order_id !== orderId));
    } catch {
      // silent
    } finally {
      setCancellingId(null);
    }
  };

  if (!hasCredentials) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <ClipboardList size={48} className="text-slate-600" />
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

  const getOrderSize = (order: Order) => {
    const cfg = order.order_configuration;
    const limit = cfg.limit_limit_gtc || cfg.limit_limit_gtd;
    const mkt = cfg.market_market_ioc;
    if (limit) return `${limit.base_size} @ $${coinbase.fmtPrice(limit.limit_price)}`;
    if (mkt) {
      if (mkt.quote_size) return `$${mkt.quote_size} (market)`;
      if (mkt.base_size) return `${mkt.base_size} (market)`;
    }
    return '–';
  };

  const OrderTable = ({ orders }: { orders: Order[] }) => (
    <div className="overflow-x-auto">
      {orders.length === 0 ? (
        <p className="px-5 py-8 text-slate-500 text-sm text-center">No orders found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {['Product', 'Side', 'Type', 'Size / Price', 'Status', 'Filled', 'Time', ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {orders.map((order) => (
              <tr key={order.order_id} className="hover:bg-slate-750 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200 whitespace-nowrap">
                  {order.product_id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.side === 'BUY'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {order.side}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs uppercase whitespace-nowrap">
                  {order.order_type}
                </td>
                <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                  {getOrderSize(order)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      order.status === 'FILLED'
                        ? 'text-emerald-400 bg-emerald-900/30'
                        : order.status === 'CANCELLED'
                        ? 'text-slate-500 bg-slate-700'
                        : order.status === 'OPEN'
                        ? 'text-blue-400 bg-blue-900/30'
                        : 'text-slate-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                  {order.filled_size || '–'}
                  {order.average_filled_price && order.average_filled_price !== '0'
                    ? ` @ $${coinbase.fmtPrice(order.average_filled_price)}`
                    : ''}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(order.created_time).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {order.status === 'OPEN' && (
                    <button
                      onClick={() => handleCancel(order.order_id)}
                      disabled={cancellingId === order.order_id}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                    >
                      <XCircle size={12} />
                      {cancellingId === order.order_id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const FillsTable = () => (
    <div className="overflow-x-auto">
      {fills.length === 0 ? (
        <p className="px-5 py-8 text-slate-500 text-sm text-center">No fills found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {['Product', 'Side', 'Size', 'Price', 'Commission', 'Time'].map((h) => (
                <th
                  key={h}
                  className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {fills.map((fill) => (
              <tr key={fill.entry_id} className="hover:bg-slate-750 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">{fill.product_id}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      fill.side === 'BUY'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {fill.side}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-300">{fill.size}</td>
                <td className="px-4 py-3 font-mono text-slate-300">
                  ${coinbase.fmtPrice(fill.price)}
                </td>
                <td className="px-4 py-3 font-mono text-slate-400 text-xs">
                  ${coinbase.fmtPrice(fill.commission, 4)}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                  {new Date(fill.trade_time).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Orders', value: loading ? '–' : String(openOrders.length), color: 'text-blue-400' },
          { label: 'Filled Orders', value: loading ? '–' : String(historyOrders.length), color: 'text-emerald-400' },
          { label: 'Total Fills', value: loading ? '–' : String(fills.length), color: 'text-slate-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-slate-700">
          {([
            { id: 'open', label: `Open (${openOrders.length})` },
            { id: 'history', label: 'History' },
            { id: 'fills', label: 'Fills' },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                tab === id
                  ? 'text-white border-b-2 border-blue-500 bg-slate-750'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="divide-y divide-slate-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-3 flex gap-4">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="h-3 flex-1 bg-slate-700 rounded animate-pulse" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            {tab === 'open' && <OrderTable orders={openOrders} />}
            {tab === 'history' && <OrderTable orders={historyOrders} />}
            {tab === 'fills' && <FillsTable />}
          </>
        )}
      </div>
    </div>
  );
};

export default Orders;
