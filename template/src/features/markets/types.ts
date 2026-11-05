export type AssetType = 'stock' | 'crypto';

export interface Asset {
  symbol: string;
  name: string;
  type: AssetType;
  /** Exchange or venue, e.g. `NASDAQ`. */
  exchange: string;
  /** ISO 4217 code used to format prices. */
  currency: string;
}

export interface AssetDetails extends Asset {
  description: string;
  marketCap: number;
}

/** Latest market data of one asset. Sent by `GET /quotes` and by the quotes WebSocket. */
export interface Quote {
  symbol: string;
  price: number;
  /** Change since the previous close (absolute and in percent). */
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  /** Epoch milliseconds of the last trade. */
  timestamp: number;
}

export type QuoteMap = Record<string, Quote>;

export const CHART_PERIODS = ['1D', '1W', '1M', '1Y'] as const;
export type ChartPeriod = (typeof CHART_PERIODS)[number];

export type ChartType = 'line' | 'candle';

export interface Candle {
  /** Epoch milliseconds of the candle start. */
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleSeries {
  symbol: string;
  period: ChartPeriod;
  candles: Candle[];
}

export interface AssetFilters {
  search?: string;
  type?: AssetType | 'all';
  /** Only these symbols, in this order. */
  symbols?: string[];
}
