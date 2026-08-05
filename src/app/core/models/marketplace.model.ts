/**
 * Marketplace domain models.
 *
 * Interfaces shared by the service layer, NgRx store, and components.
 * Keeping them in a dedicated model file avoids circular imports when
 * multiple features need to reference the same shapes.
 */

// ─── Order Book ───────────────────────────────────────────────────────────────

export interface OrderBookEntry {
  price: number;
  amount: string;
  total: string;
  count: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

// ─── Listings ─────────────────────────────────────────────────────────────────

export interface MarketplaceListing {
  id: string;
  projectId: string;
  projectName: string;
  sellerId: string;
  sellerName?: string;
  amount: string;
  price: number;
  totalValue: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  expiresAt?: string;
  createdAt: string;
}

export interface CreateListingRequest {
  projectId: string;
  amount: string;
  price: number;
  expiresAt?: string;
}

// ─── Price History / OHLC ─────────────────────────────────────────────────────

/** Supported time ranges for the price chart. */
export type PriceChartTimeRange = '1H' | '6H' | '24H' | '7D' | '30D';

/** Seconds per candle for each time range. */
export const CANDLE_INTERVALS: Record<PriceChartTimeRange, number> = {
  '1H': 60,       // 1-minute candles
  '6H': 300,      // 5-minute candles
  '24H': 900,     // 15-minute candles
  '7D': 3600,     // 1-hour candles
  '30D': 14400,   // 4-hour candles
};

/** OHLC candle as returned by the API. */
export interface OhlcCandle {
  /** Unix timestamp in seconds (start of candle). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Aggregate traded volume for the candle. */
  volume: number;
}

/** Parameters accepted by the price-history endpoint. */
export interface PriceHistoryParams {
  projectId: string;
  range: PriceChartTimeRange;
}

/** API response shape for price history. */
export interface PriceHistoryResponse {
  projectId: string;
  range: PriceChartTimeRange;
  candles: OhlcCandle[];
}

// ─── WebSocket marketplace events ─────────────────────────────────────────────

/** Emitted when a new trade is executed (marketplace:trade). */
export interface MarketplaceTradeEvent {
  projectId: string;
  price: number;
  amount: string;
  /** Unix timestamp in seconds. */
  timestamp: number;
}

/** Emitted when the order book snapshot changes (marketplace:orderbook). */
export interface MarketplaceOrderBookEvent {
  projectId: string;
  orderBook: OrderBook;
}

/** Emitted when a new OHLC candle closes or is updated (marketplace:price). */
export interface MarketplacePriceEvent {
  projectId: string;
  candle: OhlcCandle;
}
