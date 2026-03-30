import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowRight,
} from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { Product, Candle, Order, Granularity } from '../types';
import { WATCHLIST_PRODUCTS, DEFAULT_PRODUCT, GRANULARITY_OPTIONS } from '../constants';

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT';

const Trading: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Product selection
  const [productId, setProductId] = useState(
    searchParams.get('product') || DEFAULT_PRODUCT
  );
  const [product, setProduct] = useState<Product | null>(null);

  // Chart
  const [candles, setCandles] = useState<Candle[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('ONE_HOUR');
  const [chartLoading, setChartLoading] = useState(false);

  // Order form
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [baseSize, setBaseSize] = useState('');
  const [quoteSize, setQuoteSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [useSizeInQuote, setUseSizeInQuote] = useState(true);

  // Order status
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Open orders for this product
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Generic error
  const [error, setError] = useState<string | null>(null);

  const hasCredentials = !!coinbase.getCredentials();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load product info + candles
  const loadProduct = useCallback(async () => {
    setError(null);
    try {
      const [prod] = await Promise.all([coinbase.getProduct(productId)]);
      setProduct(prod);
      if (prod.price && !limitPrice) {
        setLimitPrice(parseFloat(prod.price).toFixed(2));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCandles = useCallback(async () => {
    setChartLoading(true);
    try {
      const opt = GRANULARITY_OPTIONS.find((o) => o.value === granularity)!;
      const now = Math.floor(Date.now() / 1000);
      const data = await coinbase.getCandles(productId, granularity, now - opt.windowSeconds, now);
      setCandles(data);
    } catch {
      // silent - chart just stays empty
    } finally {
      setChartLoading(false);
    }
  }, [productId, granularity]);

  const loadOpenOrders = useCallback(async () => {
    try {
      const orders = await coinbase.listOrders('OPEN', productId);
      setOpenOrders(orders);
    } catch {
      // silent
    }
  }, [productId]);

  useEffect(() => {
    if (!hasCredentials) return;
    setLimitPrice('');
    loadProduct();
    loadCandles();
    loadOpenOrders();

    // Auto-refresh price every 15s
    refreshTimer.current = setInterval(loadProduct, 15000);
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [hasCredentials, productId, loadProduct, loadCandles, loadOpenOrders]);

  useEffect(() => {
    if (!hasCredentials) return;
    loadCandles();
  }, [granularity, hasCredentials, loadCandles]);

  const chartData = candles.map((c) => ({
    time: new Date(Number(c.start) * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    price: parseFloat(c.close),
    low: parseFloat(c.low),
    high: parseFloat(c.high),
  }));

  const priceChange = product ? parseFloat(product.price_percentage_change_24h) : 0;
  const positive = priceChange >= 0;

  const handleSubmitOrder = async () => {
    if (!product) return;
    setSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const clientOrderId = coinbase.generateClientOrderId();
      let orderConfig: ReturnType<typeof coinbase.generateClientOrderId> | object;

      if (orderType === 'MARKET') {
        if (useSizeInQuote) {
          orderConfig = { market_market_ioc: { quote_size: quoteSize } };
        } else {
          orderConfig = { market_market_ioc: { base_size: baseSize } };
        }
      } else {
        orderConfig = {
          limit_limit_gtc: {
            base_size: baseSize,
            limit_price: limitPrice,
            post_only: false,
          },
        };
      }

      const result = await coinbase.createOrder({
        client_order_id: clientOrderId,
        product_id: productId,
        side,
        order_configuration: orderConfig as object,
      });

      if (result.success) {
        setOrderSuccess(`Order placed! ID: ${result.order_id}`);
        setBaseSize('');
        setQuoteSize('');
        loadOpenOrders();
      } else {
        setOrderError('Order rejected by Coinbase. Check size/price constraints.');
      }
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await coinbase.cancelOrders([orderId]);
      loadOpenOrders();
    } catch {
      // silent
    } finally {
      setCancellingId(null);
    }
  };

  if (!hasCredentials) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Trading</h1>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Product selector + price header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-4">
        <select
          value={productId}
          onChange={(e) => { setProductId(e.target.value); setOrderSuccess(null); setOrderError(null); }}
          className="bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          {WATCHLIST_PRODUCTS.map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>

        {product ? (
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-2xl font-bold text-white font-mono">
                ${coinbase.fmtPrice(product.price)}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {coinbase.fmtChange(priceChange)}
            </div>
            <div className="text-xs text-slate-500 space-x-3">
              <span>Vol: ${coinbase.fmtPrice(product.approximate_quote_24h_volume)}</span>
            </div>
          </div>
        ) : (
          <div className="h-7 w-36 bg-slate-700 rounded animate-pulse" />
        )}

        <button
          onClick={() => { loadProduct(); loadCandles(); }}
          className="ml-auto text-slate-400 hover:text-white"
        >
          <RefreshCw size={15} className={chartLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart (2/3 width on large) */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          {/* Granularity selector */}
          <div className="flex gap-1">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value as Granularity)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  granularity === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {chartLoading && candles.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500">
              <Loader size={20} className="animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
              No chart data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={positive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
                  width={72}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                  formatter={(v: number) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={positive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  fill="url(#priceGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order form (1/3 width) */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          {/* Buy / Sell tabs */}
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button
              onClick={() => setSide('BUY')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                side === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setSide('SELL')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                side === 'SELL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Order type */}
          <div className="flex gap-2">
            {(['MARKET', 'LIMIT'] as OrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                  orderType === t
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Size input(s) */}
          {orderType === 'MARKET' && (
            <>
              <div className="flex gap-2 text-xs mb-1">
                <button
                  onClick={() => setUseSizeInQuote(true)}
                  className={`px-2 py-1 rounded ${useSizeInQuote ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  USD Amount
                </button>
                <button
                  onClick={() => setUseSizeInQuote(false)}
                  className={`px-2 py-1 rounded ${!useSizeInQuote ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
                >
                  {product?.base_currency_id || 'Coin'} Amount
                </button>
              </div>
              {useSizeInQuote ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Amount (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={quoteSize}
                    onChange={(e) => setQuoteSize(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Amount ({product?.base_currency_id})</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={baseSize}
                    onChange={(e) => setBaseSize(e.target.value)}
                    placeholder="e.g. 0.001"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {orderType === 'LIMIT' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Limit Price (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Amount ({product?.base_currency_id})</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={baseSize}
                  onChange={(e) => setBaseSize(e.target.value)}
                  placeholder="e.g. 0.001"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Order summary */}
          {product && orderType === 'LIMIT' && baseSize && limitPrice && (
            <div className="bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-400 space-y-0.5">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-slate-200 font-mono">
                  ${coinbase.fmtPrice(parseFloat(baseSize) * parseFloat(limitPrice))}
                </span>
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmitOrder}
            disabled={
              submitting ||
              !product ||
              (orderType === 'MARKET' && useSizeInQuote && !quoteSize) ||
              (orderType === 'MARKET' && !useSizeInQuote && !baseSize) ||
              (orderType === 'LIMIT' && (!baseSize || !limitPrice))
            }
            className={`w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              side === 'BUY'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {submitting ? (
              <>
                <Loader size={14} className="animate-spin" />
                Placing…
              </>
            ) : (
              `${side} ${productId.split('-')[0]}`
            )}
          </button>

          {/* Feedback */}
          {orderSuccess && (
            <div className="flex items-start gap-2 text-emerald-400 text-xs bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              <CheckCircle size={13} className="flex-shrink-0 mt-0.5" />
              {orderSuccess}
            </div>
          )}
          {orderError && (
            <div className="flex items-start gap-2 text-red-400 text-xs bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
              {orderError}
            </div>
          )}
        </div>
      </div>

      {/* Open orders for this product */}
      {openOrders.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-200">Open Orders — {productId}</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {openOrders.map((order) => {
              const cfg = order.order_configuration;
              const limitCfg = cfg.limit_limit_gtc || cfg.limit_limit_gtd;
              const mktCfg = cfg.market_market_ioc;
              return (
                <div key={order.order_id} className="px-5 py-3 flex items-center gap-4 flex-wrap">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.side === 'BUY'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-red-900/50 text-red-400'
                    }`}
                  >
                    {order.side}
                  </span>
                  <span className="text-xs text-slate-400 uppercase">{order.order_type}</span>
                  {limitCfg && (
                    <span className="text-sm text-slate-200 font-mono">
                      {limitCfg.base_size} @ ${coinbase.fmtPrice(limitCfg.limit_price)}
                    </span>
                  )}
                  {mktCfg && (
                    <span className="text-sm text-slate-200 font-mono">
                      {mktCfg.quote_size ? `$${mktCfg.quote_size}` : `${mktCfg.base_size}`}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">
                    {new Date(order.created_time).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleCancelOrder(order.order_id)}
                    disabled={cancellingId === order.order_id}
                    className="ml-auto text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                  >
                    {cancellingId === order.order_id ? 'Cancelling…' : 'Cancel'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Trading;
