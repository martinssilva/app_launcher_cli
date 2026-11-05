import { baseApi } from '@/services/api';

import { marketsConfig } from '../config';
import { quoteStream } from '../services/quoteStream';
import type {
  Asset,
  AssetDetails,
  AssetFilters,
  CandleSeries,
  ChartPeriod,
  Quote,
  QuoteMap,
} from '../types';

/**
 * Skips updates older than the cached quote, and repeats of it (the server
 * sends the current quote again on every subscribe), so nothing re-renders
 * for nothing.
 */
function isNewer(quote: Quote, current: Quote | undefined): boolean {
  if (!current || quote.timestamp > current.timestamp) {
    return true;
  }
  return quote.timestamp === current.timestamp && quote.price !== current.price;
}

function toQuoteMap(quotes: Quote[]): QuoteMap {
  return Object.fromEntries(quotes.map(quote => [quote.symbol, quote]));
}

export const marketsApi = baseApi.injectEndpoints({
  endpoints: build => ({
    getAssets: build.query<Asset[], AssetFilters>({
      query: ({ search, type, symbols }) => ({
        url: '/assets',
        params: {
          ...(search ? { search } : {}),
          ...(type && type !== 'all' ? { type } : {}),
          ...(symbols ? { symbols: symbols.join(',') } : {}),
        },
      }),
    }),
    getAsset: build.query<AssetDetails, string>({
      query: symbol => `/assets/${encodeURIComponent(symbol)}`,
    }),
    getCandles: build.query<
      CandleSeries,
      { symbol: string; period: ChartPeriod }
    >({
      query: ({ symbol, period }) => ({
        url: `/assets/${encodeURIComponent(symbol)}/candles`,
        params: { period },
      }),
    }),
    /**
     * Live quotes: a REST snapshot (`GET /quotes`), then every WebSocket
     * update for these symbols is written into this cache entry, so every
     * component reading it re-renders with the new prices. The subscription
     * ends when the cache entry is removed (no component used it for
     * `keepQuotesForSeconds`).
     */
    getQuotes: build.query<QuoteMap, string[]>({
      query: symbols => ({
        url: '/quotes',
        params: { symbols: symbols.join(',') },
      }),
      transformResponse: (quotes: Quote[]) => toQuoteMap(quotes),
      keepUnusedDataFor: marketsConfig.keepQuotesForSeconds,
      async onCacheEntryAdded(
        symbols,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved },
      ) {
        let unsubscribe: (() => void) | undefined;
        try {
          await cacheDataLoaded;
          unsubscribe = quoteStream.subscribe(symbols, quotes => {
            updateCachedData(draft => {
              quotes.forEach(quote => {
                if (isNewer(quote, draft[quote.symbol])) {
                  draft[quote.symbol] = quote;
                }
              });
            });
          });
        } catch {
          // The entry was removed before the first response arrived.
        }
        await cacheEntryRemoved;
        unsubscribe?.();
      },
    }),
  }),
});

export const {
  useGetAssetQuery,
  useGetAssetsQuery,
  useGetCandlesQuery,
  useGetQuotesQuery,
} = marketsApi;
