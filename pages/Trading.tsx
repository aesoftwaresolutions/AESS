import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, RefreshCw, AlertCircle, CheckCircle,
  Loader, ArrowRight, Search, Star, StarOff,
} from 'lucide-react';
import * as coinbase from '../services/coinbase';
import { usePrices } from '../contexts/PriceContext';
import { addToWatchlist, removeFromWatchlist, getWatchlist } from '../services/news';
import { Product, Candle, Order, Granularity } from '../types';
import { DEFAULT_PRODUCT, GRANULARITY_OPTIONS } from '../constants';

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT';

const Trading: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { prices, subscribe } = usePrices();

  // ── Product selection ──────────────────────────────────────────────────────
  const [productId, setProductId] = useState(searchParams.get('product') || DEFAULT_PRODUCT);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);

  // ── Chart ──────────────────────────────────────────────────────────────────
  const [candles, setCandles] = useState<Candle[]>([]);
  const [granularity, setGranularity] = useState<Granularity>('ONE_HOUR');
  const [chartLoading, setChartLoading] = useState(false);

  // ── Order form ─────────────────────────────────────────────────────────────
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [baseSize, setBaseSize] = useState('');
  const [quoteSize, setQuoteSize] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [useSizeInQuote, setUseSizeInQuote] = useState(true);

  // ── Balances ───────────────────────────────────────────────────────────────
  const [baseBalance, setBaseBalance] = useState<number | null>(null);
  const [quoteBalance, setQuoteBalance] = useState<number | null>(null);

  // ── Order state ────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasCredentials = !!coinbase.getCredentials();
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live price from WebSocket ──────────────────────────────────────────────
  const live = prices[productId];
  const livePrice = live?.price;
  const priceChange = live?.change24h ?? (product ? parseFloat(product.price_percentage_change_24h) : 0);
  const positive = priceChange >= 0;

  // ── Load all products once ─────────────────────────────────────────────────
  useEffect(() => {
    coinbase.listProducts().then(setAllProducts).catch(() => {});
  }, []);

  // ── Load selected product ──────────────────────────────────────────────────
  const loadProduct = useCallback(async () => {
    setError(null);
    try {
      const prod = await coinbase.getProduct(productId);
      setProduct(prod);
      if (!limitPrice) setLimitPrice(parseFloat(prod.price).toFixed(2));
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
    } catch { /* silent */ } finally {
      setChartLoading(false);
    }
  }, [productId, granularity]);

  const loadOpenOrders = useCallback(async () => {
    if (!hasCredentials) return;
    try {
      const orders = await coinbase.listOrders('OPEN', productId);
      setOpenOrders(orders);
    } catch { /* silent */ }
  }, [productId, hasCredentials]);

  // Load balances for the selected pair
  const loadBalances = useCallback(async () => {
    if (!hasCredentials || !product) return;
    try {
      const accounts = await coinbase.getAccounts();
      const baseCur = product.base_currency_id;
      const quoteCur = product.quote_currency_id;
      const baseAcct = accounts.find((a) => a.currency === baseCur);
      const quoteAcct = accounts.find((a) => a.currency === quoteCur);
      setBaseBalance(baseAcct ? parseFloat(baseAcct.available_balance.value) : 0);
      setQuoteBalance(quoteAcct ? parseFloat(quoteAcct.available_balance.value) : 0);
    } catch { /* silent */ }
  }, [hasCredentials, product]);

  useEffect(() => {
    setLimitPrice('');
    setBaseBalance(null);
    setQuoteBalance(null);
    setInWatchlist(getWatchlist().includes(productId));
    subscribe([productId]);
    loadProduct();
    loadCandles();
    loadOpenOrders();
    refreshTimer.current = setInterval(loadOpenOrders, 15000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (product) loadBalances();
  }, [product, loadBalances]);

  useEffect(() => {
    loadCandles();
  }, [granularity, loadCandles]);

  // Filtered product search
  const filteredProducts = allProducts
    .filter((p) => {
      if (!productSearch) return true;
      const q = productSearch.toUpperCase();
      return p.product_id.includes(q) || p.base_name?.toUpperCase().includes(q);
    })
    .slice(0, 30);

  const chartData = candles.map((c) => ({
    time: new Date(Number(c.start) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: parseFloat(c.close),
  }));

  // Displayed price: prefer live WS price, fall back to REST
  const displayPrice = livePrice ?? (product ? parseFloat(product.price) : null);

  // Max buy/sell helpers
  const handleMaxBuy = () => {
    if (quoteBalance !== null) setQuoteSize(quoteBalance.toFixed(2));
  };
  const handleMaxSell = () => {
    if (baseBalance !== null) setBaseSize(
      parseFloat(baseBalance.toFixed(8)).toString()
    );
  };

  const handleSelectProduct = (pid: string) => {
    setProductId(pid);
    setShowSearch(false);
    setProductSearch('');
    setOrderSuccess(null);
    setOrderError(null);
  };

  const handleToggleWatchlist = () => {
    if (inWatchlist) { removeFromWatchlist(productId); setInWatchlist(false); }
    else { addToWatchlist(productId); setInWatchlist(true); }
  };

  const handleSubmitOrder = async () => {
    if (!product) return;
    setSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);
    try {
      const clientOrderId = coinbase.generateClientOrderId();
      let orderConfig: object;
      if (orderType === 'MARKET') {
        orderConfig = useSizeInQuote
          ? { market_market_ioc: { quote_size: quoteSize } }
          : { market_market_ioc: { base_size: baseSize } };
      } else {
        orderConfig = {
          limit_limit_gtc: { base_size: baseSize, limit_price: limitPrice, post_only: false },
        };
      }
      const result = await coinbase.createOrder({
        client_order_id: clientOrderId,
        product_id: productId,
        side,
        order_configuration: orderConfig,
      });
      if (result.success) {
        setOrderSuccess(`Order placed! ID: ${result.order_id}`);
        setBaseSize(''); setQuoteSize('');
        loadOpenOrders();
        loadBalances();
      } else {
        setOrderError('Order rejected. Check size/price constraints.');
      }
    } catch (e: unknown) {
      setOrderError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try { await coinbase.cancelOrders([orderId]); loadOpenOrders(); }
    catch { /* silent */ } finally { setCancellingId(null); }
  };

  if (!hasCredentials) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <p className="text-xl font-semibold text-slate-200">No credentials configured</p>
        <Link to="/settings" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2">
          Configure API Keys <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Trading</h1>
        {error && <div className="flex items-center gap-2 text-red-400 text-sm"><AlertCircle size={14} />{error}</div>}
      </div>

      {/* Product header */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-wrap items-center gap-3">
        {/* Product selector */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 bg-slate-900 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none hover:border-blue-500"
          >
            <Search size={13} className="text-slate-400" />
            {productId}
          </button>
          {showSearch && (
            <div className="absolute left-0 top-full mt-1 w-72 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl z-20">
              <input
                autoFocus
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products…"
                className="w-full bg-transparent border-b border-slate-700 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800">
                {filteredProducts.map((p) => (
                  <button
                    key={p.product_id}
                    onClick={() => handleSelectProduct(p.product_id)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-800 text-sm"
                  >
                    <span className="text-slate-200 font-medium">{p.product_id}</span>
                    <div className="text-right">
                      <span className="text-slate-400 font-mono text-xs">${coinbase.fmtPrice(p.price)}</span>
                      <span className={`ml-2 text-xs ${parseFloat(p.price_percentage_change_24h) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {coinbase.fmtChange(p.price_percentage_change_24h)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live price display */}
        {displayPrice !== null && (
          <div className="flex items-center gap-4 flex-wrap">
            <span className={`text-2xl font-bold font-mono ${live ? 'text-white' : 'text-slate-300'}`}>
              ${coinbase.fmtPrice(displayPrice)}
              {live && <span className="ml-1 text-xs text-emerald-500 font-normal">●</span>}
            </span>
            <span className={`flex items-center gap-1 text-sm font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {positive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {coinbase.fmtChange(priceChange)}
            </span>
            {live && (
              <span className="text-xs text-slate-500">
                H: ${coinbase.fmtPrice(live.high24h)} · L: ${coinbase.fmtPrice(live.low24h)}
              </span>
            )}
          </div>
        )}

        {/* Watchlist toggle */}
        <button
          onClick={handleToggleWatchlist}
          className={`ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
            inWatchlist ? 'text-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/30' : 'text-slate-400 hover:text-yellow-400'
          }`}
          title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {inWatchlist ? <Star size={13} fill="currentColor" /> : <StarOff size={13} />}
          {inWatchlist ? 'Watching' : 'Watch'}
        </button>

        <button onClick={() => { loadProduct(); loadCandles(); }} className="text-slate-400 hover:text-white">
          <RefreshCw size={14} className={chartLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex gap-1">
            {GRANULARITY_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setGranularity(opt.value as Granularity)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  granularity === opt.value ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
          {chartLoading && candles.length === 0 ? (
            <div className="h-56 flex items-center justify-center"><Loader size={20} className="animate-spin text-slate-500" /></div>
          ) : chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-500 text-sm">No chart data</div>
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
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${Number(v).toLocaleString()}`} width={72} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px', color: '#e2e8f0' }}
                  formatter={(v: number) => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']} />
                <Area type="monotone" dataKey="price" stroke={positive ? '#10b981' : '#ef4444'} strokeWidth={2}
                  fill="url(#priceGrad)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order form */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-4">
          {/* Buy/Sell tabs */}
          <div className="flex rounded-lg overflow-hidden border border-slate-600">
            <button onClick={() => setSide('BUY')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${side === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Buy
            </button>
            <button onClick={() => setSide('SELL')}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${side === 'SELL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              Sell
            </button>
          </div>

          {/* Balance display */}
          {product && (
            <div className="bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-400 space-y-0.5">
              {side === 'BUY' && quoteBalance !== null && (
                <div className="flex justify-between">
                  <span>Available {product.quote_currency_id}</span>
                  <span className="text-slate-200">${coinbase.fmtPrice(quoteBalance)}</span>
                </div>
              )}
              {side === 'SELL' && baseBalance !== null && (
                <div className="flex justify-between">
                  <span>Available {product.base_currency_id}</span>
                  <span className="text-slate-200">{coinbase.fmtPrice(baseBalance, 8)}</span>
                </div>
              )}
            </div>
          )}

          {/* Order type */}
          <div className="flex gap-2">
            {(['MARKET', 'LIMIT'] as OrderType[]).map((t) => (
              <button key={t} onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 rounded text-xs font-semibold transition-colors ${
                  orderType === t ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Market order inputs */}
          {orderType === 'MARKET' && (
            <>
              <div className="flex gap-2 text-xs mb-1">
                <button onClick={() => setUseSizeInQuote(true)}
                  className={`px-2 py-1 rounded ${useSizeInQuote ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
                  USD
                </button>
                <button onClick={() => setUseSizeInQuote(false)}
                  className={`px-2 py-1 rounded ${!useSizeInQuote ? 'bg-slate-600 text-white' : 'text-slate-400'}`}>
                  {product?.base_currency_id || 'Coin'}
                </button>
              </div>
              {useSizeInQuote ? (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs text-slate-400">Amount (USD)</label>
                    {side === 'BUY' && quoteBalance !== null && (
                      <button onClick={handleMaxBuy} className="text-xs text-blue-400 hover:text-blue-300">Max</button>
                    )}
                  </div>
                  <input type="number" min="0" step="any" value={quoteSize}
                    onChange={(e) => setQuoteSize(e.target.value)} placeholder="e.g. 100"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  {product && quoteSize && displayPrice && (
                    <p className="text-xs text-slate-500">
                      ≈ {(parseFloat(quoteSize) / displayPrice).toFixed(8)} {product.base_currency_id}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-xs text-slate-400">Amount ({product?.base_currency_id})</label>
                    {side === 'SELL' && baseBalance !== null && (
                      <button onClick={handleMaxSell} className="text-xs text-blue-400 hover:text-blue-300">Max</button>
                    )}
                  </div>
                  <input type="number" min="0" step="any" value={baseSize}
                    onChange={(e) => setBaseSize(e.target.value)} placeholder="e.g. 0.001"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
                  {product && baseSize && displayPrice && (
                    <p className="text-xs text-slate-500">
                      ≈ ${coinbase.fmtPrice(parseFloat(baseSize) * displayPrice)} USD
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Limit order inputs */}
          {orderType === 'LIMIT' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Limit Price (USD)</label>
                <input type="number" min="0" step="any" value={limitPrice}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs text-slate-400">Amount ({product?.base_currency_id})</label>
                  {side === 'SELL' && baseBalance !== null && (
                    <button onClick={handleMaxSell} className="text-xs text-blue-400 hover:text-blue-300">Max</button>
                  )}
                </div>
                <input type="number" min="0" step="any" value={baseSize}
                  onChange={(e) => setBaseSize(e.target.value)} placeholder="e.g. 0.001"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              </div>
              {baseSize && limitPrice && (
                <div className="bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-400 flex justify-between">
                  <span>Total</span>
                  <span className="text-slate-200 font-mono">
                    ${coinbase.fmtPrice(parseFloat(baseSize) * parseFloat(limitPrice))}
                  </span>
                </div>
              )}
              {product && (
                <p className="text-xs text-slate-500">
                  Min size: {product.base_min_size} {product.base_currency_id}
                </p>
              )}
            </>
          )}

          {/* Submit */}
          <button onClick={handleSubmitOrder}
            disabled={
              submitting || !product ||
              (orderType === 'MARKET' && useSizeInQuote && !quoteSize) ||
              (orderType === 'MARKET' && !useSizeInQuote && !baseSize) ||
              (orderType === 'LIMIT' && (!baseSize || !limitPrice))
            }
            className={`w-full py-3 rounded-lg font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
            }`}>
            {submitting ? <><Loader size={14} className="animate-spin" /> Placing…</> : `${side} ${productId.split('-')[0]}`}
          </button>

          {orderSuccess && (
            <div className="flex items-start gap-2 text-emerald-400 text-xs bg-emerald-900/30 border border-emerald-700 rounded-lg px-3 py-2">
              <CheckCircle size={13} className="flex-shrink-0 mt-0.5" />{orderSuccess}
            </div>
          )}
          {orderError && (
            <div className="flex items-start gap-2 text-red-400 text-xs bg-red-900/30 border border-red-700 rounded-lg px-3 py-2">
              <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />{orderError}
            </div>
          )}
        </div>
      </div>

      {/* Open orders */}
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
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    order.side === 'BUY' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                  }`}>{order.side}</span>
                  <span className="text-xs text-slate-400 uppercase">{order.order_type}</span>
                  {limitCfg && (
                    <span className="text-sm text-slate-200 font-mono">
                      {limitCfg.base_size} @ ${coinbase.fmtPrice(limitCfg.limit_price)}
                    </span>
                  )}
                  {mktCfg && (
                    <span className="text-sm text-slate-200 font-mono">
                      {mktCfg.quote_size ? `$${mktCfg.quote_size}` : mktCfg.base_size}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{new Date(order.created_time).toLocaleString()}</span>
                  <button onClick={() => handleCancelOrder(order.order_id)}
                    disabled={cancellingId === order.order_id}
                    className="ml-auto text-xs text-red-400 hover:text-red-300 disabled:opacity-50">
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
