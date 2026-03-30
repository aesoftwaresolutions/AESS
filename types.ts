export interface CoinbaseCredentials {
  apiKeyName: string;
  privateKey: string;
}

export interface Account {
  uuid: string;
  name: string;
  currency: string;
  available_balance: { value: string; currency: string };
  default: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  type: string;
  ready: boolean;
  hold: { value: string; currency: string };
}

export interface Product {
  product_id: string;
  price: string;
  price_percentage_change_24h: string;
  volume_24h: string;
  volume_percentage_change_24h: string;
  base_increment: string;
  quote_increment: string;
  quote_min_size: string;
  quote_max_size: string;
  base_min_size: string;
  base_max_size: string;
  base_name: string;
  quote_name: string;
  watched: boolean;
  is_disabled: boolean;
  new: boolean;
  status: string;
  cancel_only: boolean;
  limit_only: boolean;
  post_only: boolean;
  trading_disabled: boolean;
  auction_mode: boolean;
  product_type: string;
  quote_currency_id: string;
  base_currency_id: string;
  display_name: string;
  product_venue: string;
  approximate_quote_24h_volume: string;
}

export interface Candle {
  start: string;
  low: string;
  high: string;
  open: string;
  close: string;
  volume: string;
}

export interface OrderConfiguration {
  market_market_ioc?: {
    quote_size?: string;
    base_size?: string;
  };
  limit_limit_gtc?: {
    base_size: string;
    limit_price: string;
    post_only: boolean;
  };
  limit_limit_gtd?: {
    base_size: string;
    limit_price: string;
    end_time: string;
    post_only: boolean;
  };
  stop_limit_stop_limit_gtc?: {
    base_size: string;
    limit_price: string;
    stop_price: string;
    stop_direction: string;
  };
}

export interface Order {
  order_id: string;
  product_id: string;
  user_id: string;
  order_configuration: OrderConfiguration;
  side: 'BUY' | 'SELL';
  client_order_id: string;
  status: string;
  time_in_force: string;
  created_time: string;
  completion_percentage: string;
  filled_size: string;
  average_filled_price: string;
  fee: string;
  number_of_fills: string;
  filled_value: string;
  pending_cancel: boolean;
  size_in_quote: boolean;
  total_fees: string;
  size_inclusive_of_fees: boolean;
  total_value_after_fees: string;
  trigger_status: string;
  order_type: string;
  reject_reason: string;
  settled: boolean;
  product_type: string;
  reject_message: string;
  cancel_message: string;
  outstanding_hold_amount: string;
  is_liquidation: boolean;
  last_fill_time: string;
  leverage: string;
  retail_portfolio_id: string;
}

export interface Fill {
  entry_id: string;
  trade_id: string;
  order_id: string;
  trade_time: string;
  trade_type: string;
  price: string;
  size: string;
  commission: string;
  product_id: string;
  sequence_timestamp: string;
  liquidity_indicator: string;
  size_in_quote: boolean;
  user_id: string;
  side: string;
  retail_portfolio_id: string;
}

export interface BestBidAsk {
  pricebooks: {
    product_id: string;
    bids: { price: string; size: string }[];
    asks: { price: string; size: string }[];
    time: string;
  }[];
}

export interface CreateOrderRequest {
  client_order_id: string;
  product_id: string;
  side: 'BUY' | 'SELL';
  order_configuration: OrderConfiguration;
}

export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT';
export type Granularity =
  | 'ONE_MINUTE'
  | 'FIVE_MINUTE'
  | 'FIFTEEN_MINUTE'
  | 'THIRTY_MINUTE'
  | 'ONE_HOUR'
  | 'TWO_HOUR'
  | 'SIX_HOUR'
  | 'ONE_DAY';
