import { findSession, type MockUser } from '../db';
import type { MockRequest, MockResponse, MockRoute } from '../handlers';
import {
  buildCandles,
  findAsset,
  getQuote,
  isChartPeriod,
  listAssets,
  marketCapOf,
  type MockQuote,
} from './data';

const unauthorized: MockResponse = {
  status: 401,
  data: { message: 'Unauthorized' },
};
const assetNotFound: MockResponse = {
  status: 404,
  data: { message: 'Asset not found' },
};

function sessionUser(request: MockRequest): MockUser | undefined {
  const token = request.authorization?.replace(/^Bearer\s+/i, '');
  return token ? findSession(token)?.user : undefined;
}

/** Wraps a handler so it only runs for signed-in users. */
function authed(
  handler: (request: MockRequest) => MockResponse,
): (request: MockRequest) => MockResponse {
  return request => (sessionUser(request) ? handler(request) : unauthorized);
}

/** `AAPL,btc, ETH` -> `['AAPL', 'BTC', 'ETH']` */
function readSymbols(value: unknown): string[] {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map(symbol => symbol.trim().toUpperCase())
    .filter(Boolean);
}

export const financeMockRoutes: MockRoute[] = [
  {
    method: 'GET',
    path: '/assets',
    handler: authed(({ query }) => {
      const search =
        typeof query.search === 'string' ? query.search.trim() : '';
      const type = query.type;
      const symbols = readSymbols(query.symbols);
      const needle = search.toLowerCase();

      let assets = listAssets()
        .filter(asset => !type || type === 'all' || asset.type === type)
        .filter(
          asset =>
            !needle ||
            asset.symbol.toLowerCase().includes(needle) ||
            asset.name.toLowerCase().includes(needle),
        );
      if (symbols.length > 0) {
        assets = symbols.flatMap(symbol =>
          assets.filter(asset => asset.symbol === symbol),
        );
      }
      // The list does not carry descriptions (see GET /assets/:symbol).
      return {
        status: 200,
        data: assets.map(({ description: _description, ...asset }) => asset),
      };
    }),
  },
  {
    method: 'GET',
    path: '/assets/:symbol',
    handler: authed(({ params }) => {
      const asset = findAsset(params.symbol ?? '');
      if (!asset) {
        return assetNotFound;
      }
      return {
        status: 200,
        data: { ...asset, marketCap: marketCapOf(asset.symbol) },
      };
    }),
  },
  {
    method: 'GET',
    path: '/assets/:symbol/candles',
    handler: authed(({ params, query }) => {
      const asset = findAsset(params.symbol ?? '');
      if (!asset) {
        return assetNotFound;
      }
      if (!isChartPeriod(query.period)) {
        return {
          status: 400,
          data: { message: 'period must be one of 1D, 1W, 1M, 1Y' },
        };
      }
      return {
        status: 200,
        data: {
          symbol: asset.symbol,
          period: query.period,
          candles: buildCandles(asset.symbol, query.period),
        },
      };
    }),
  },
  {
    method: 'GET',
    path: '/quotes',
    handler: authed(({ query }) => {
      const symbols = readSymbols(query.symbols);
      if (symbols.length === 0) {
        return { status: 400, data: { message: 'symbols is required' } };
      }
      // Unknown symbols are skipped, like most market data APIs do.
      const quotes = symbols
        .map(getQuote)
        .filter((quote): quote is MockQuote => quote !== undefined);
      return { status: 200, data: quotes };
    }),
  },
];
