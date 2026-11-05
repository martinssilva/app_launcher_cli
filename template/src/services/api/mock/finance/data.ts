/**
 * In-memory market for the finance mock API (REST routes and the local quotes
 * emitter). Prices are random walks from a seeded generator, so tests that
 * reset the mock API always see the same numbers.
 */
export type MockAssetType = 'stock' | 'crypto';

export interface MockAsset {
  symbol: string;
  name: string;
  type: MockAssetType;
  exchange: string;
  currency: string;
  description: string;
}

interface AssetSeed extends MockAsset {
  /** Previous close used as the starting price. */
  price: number;
  /** Shares outstanding (stocks) or circulating supply (crypto). */
  supply: number;
  /** Typical daily volume. */
  volume: number;
}

export interface MockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  timestamp: number;
}

export const MOCK_CHART_PERIODS = ['1D', '1W', '1M', '1Y'] as const;
export type MockChartPeriod = (typeof MOCK_CHART_PERIODS)[number];

export interface MockCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const ASSETS: AssetSeed[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Designs smartphones, computers, wearables and services. Sample data from the mock API.',
    price: 228.5,
    supply: 15.2e9,
    volume: 52e6,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Software, cloud computing and gaming. Sample data from the mock API.',
    price: 415.2,
    supply: 7.43e9,
    volume: 21e6,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Graphics processors and accelerated computing. Sample data from the mock API.',
    price: 135.4,
    supply: 24.5e9,
    volume: 240e6,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Online retail, logistics and cloud services. Sample data from the mock API.',
    price: 186.3,
    supply: 10.5e9,
    volume: 38e6,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Search, advertising, cloud and other bets. Sample data from the mock API.',
    price: 168.9,
    supply: 12.3e9,
    volume: 25e6,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    exchange: 'NASDAQ',
    currency: 'USD',
    description:
      'Electric vehicles and energy storage. Sample data from the mock API.',
    price: 252.1,
    supply: 3.2e9,
    volume: 90e6,
  },
  {
    symbol: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'stock',
    exchange: 'NYSE',
    currency: 'USD',
    description:
      'Banking and financial services. Sample data from the mock API.',
    price: 212.6,
    supply: 2.85e9,
    volume: 9e6,
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Co.',
    type: 'stock',
    exchange: 'NYSE',
    currency: 'USD',
    description: 'Beverages. Sample data from the mock API.',
    price: 69.8,
    supply: 4.31e9,
    volume: 13e6,
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    type: 'crypto',
    exchange: 'Crypto',
    currency: 'USD',
    description:
      'Decentralized digital currency. Sample data from the mock API.',
    price: 68450,
    supply: 19.8e6,
    volume: 32e3,
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    type: 'crypto',
    exchange: 'Crypto',
    currency: 'USD',
    description:
      'Smart contract platform and its native token. Sample data from the mock API.',
    price: 3520.4,
    supply: 120.3e6,
    volume: 410e3,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    type: 'crypto',
    exchange: 'Crypto',
    currency: 'USD',
    description: 'High-throughput blockchain. Sample data from the mock API.',
    price: 172.35,
    supply: 470e6,
    volume: 2.1e6,
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    type: 'crypto',
    exchange: 'Crypto',
    currency: 'USD',
    description: 'Meme cryptocurrency. Sample data from the mock API.',
    price: 0.1642,
    supply: 146e9,
    volume: 1.2e9,
  },
];

/* eslint-disable no-bitwise -- PRNG and hash need 32-bit integer math */
/** Deterministic pseudo-random generator (mulberry32). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}
/* eslint-enable no-bitwise */

/** 2 decimals, or 4 below 1 (e.g. DOGE). */
export function roundPrice(value: number): number {
  const factor = Math.abs(value) < 1 ? 10_000 : 100;
  return Math.round(value * factor) / factor;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/** Price move per tick: crypto moves more than stocks. */
const TICK_VOLATILITY: Record<MockAssetType, number> = {
  stock: 0.0015,
  crypto: 0.004,
};

interface MarketEntry {
  seed: AssetSeed;
  quote: MockQuote;
}

const MARKET_SEED = 20261105;

function seedMarket(): Map<string, MarketEntry> {
  const now = Date.now();
  const random = createRandom(MARKET_SEED);
  const market = new Map<string, MarketEntry>();
  for (const seed of ASSETS) {
    // The day starts a little away from the previous close.
    const open = roundPrice(seed.price * (1 + (random() - 0.5) * 0.01));
    const price = roundPrice(open * (1 + (random() - 0.5) * 0.02));
    market.set(seed.symbol, {
      seed,
      quote: buildQuote(seed.symbol, {
        price,
        open,
        high: Math.max(open, price),
        low: Math.min(open, price),
        previousClose: seed.price,
        volume: Math.round(seed.volume * (0.3 + random() * 0.4)),
        timestamp: now,
      }),
    });
  }
  return market;
}

function buildQuote(
  symbol: string,
  fields: Omit<MockQuote, 'symbol' | 'change' | 'changePercent'>,
): MockQuote {
  const change = roundPrice(fields.price - fields.previousClose);
  return {
    symbol,
    ...fields,
    change,
    changePercent: round2((change / fields.previousClose) * 100),
  };
}

export const financeDb = {
  market: seedMarket(),
  random: createRandom(MARKET_SEED),
};

export function resetFinanceData(): void {
  financeDb.market = seedMarket();
  financeDb.random = createRandom(MARKET_SEED);
}

export function listAssets(): MockAsset[] {
  return Array.from(financeDb.market.values(), ({ seed }) => toAsset(seed));
}

function toAsset({
  symbol,
  name,
  type,
  exchange,
  currency,
  description,
}: AssetSeed): MockAsset {
  return { symbol, name, type, exchange, currency, description };
}

export function findAsset(symbol: string): MockAsset | undefined {
  const entry = financeDb.market.get(symbol.toUpperCase());
  return entry ? toAsset(entry.seed) : undefined;
}

export function marketCapOf(symbol: string): number {
  const entry = financeDb.market.get(symbol);
  return entry ? Math.round(entry.quote.price * entry.seed.supply) : 0;
}

export function getQuote(symbol: string): MockQuote | undefined {
  return financeDb.market.get(symbol.toUpperCase())?.quote;
}

/** Sets a new last price (high, low and change follow). */
export function setPrice(symbol: string, price: number): MockQuote {
  const entry = financeDb.market.get(symbol);
  if (!entry) {
    throw new Error(`Unknown mock asset: ${symbol}`);
  }
  const { quote } = entry;
  const rounded = roundPrice(price);
  entry.quote = buildQuote(symbol, {
    price: rounded,
    open: quote.open,
    high: Math.max(quote.high, rounded),
    low: Math.min(quote.low, rounded),
    previousClose: quote.previousClose,
    volume:
      quote.volume +
      Math.round(entry.seed.volume * 0.001 * (0.5 + financeDb.random())),
    timestamp: Math.max(Date.now(), quote.timestamp + 1),
  });
  return entry.quote;
}

/** Moves the price of `symbol` one random step. */
export function tickPrice(symbol: string): MockQuote {
  const entry = financeDb.market.get(symbol);
  if (!entry) {
    throw new Error(`Unknown mock asset: ${symbol}`);
  }
  const step =
    (financeDb.random() - 0.5) * 2 * TICK_VOLATILITY[entry.seed.type];
  return setPrice(symbol, entry.quote.price * (1 + step));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Candle count, size and volatility of each chart period. */
const PERIODS: Record<
  MockChartPeriod,
  { count: number; intervalMs: number; stepVolatility: number; drift: number }
> = {
  '1D': { count: 48, intervalMs: 30 * MINUTE, stepVolatility: 0.002, drift: 0 },
  '1W': { count: 42, intervalMs: 4 * HOUR, stepVolatility: 0.006, drift: 0.05 },
  '1M': { count: 30, intervalMs: DAY, stepVolatility: 0.012, drift: 0.1 },
  '1Y': { count: 52, intervalMs: 7 * DAY, stepVolatility: 0.03, drift: 0.35 },
};

const CRYPTO_FACTOR = 2.5;

export function isChartPeriod(value: unknown): value is MockChartPeriod {
  return MOCK_CHART_PERIODS.includes(value as MockChartPeriod);
}

/**
 * Candles for a period, ending at the current price (so the chart and the
 * live quote agree). The 1D series starts at the previous close. The shape is
 * deterministic per symbol and period.
 */
export function buildCandles(
  symbol: string,
  period: MockChartPeriod,
  now = Date.now(),
): MockCandle[] {
  const entry = financeDb.market.get(symbol);
  if (!entry) {
    return [];
  }
  const { seed, quote } = entry;
  const { count, intervalMs, stepVolatility, drift } = PERIODS[period];
  const factor = seed.type === 'crypto' ? CRYPTO_FACTOR : 1;
  const random = createRandom(hashString(`${symbol}:${period}`));
  const volatility = stepVolatility * factor;

  const start =
    period === '1D'
      ? quote.previousClose
      : quote.price / (1 + (random() - 0.4) * 2 * drift * factor);

  // Random walk in log space, then bent so it ends exactly at the price.
  const walk = [0];
  for (let i = 1; i <= count; i += 1) {
    walk.push((walk[i - 1] as number) + (random() - 0.5) * 2 * volatility);
  }
  const target = Math.log(quote.price / start);
  const last = walk[count] as number;
  const levels = walk.map(
    (value, i) => start * Math.exp(value + ((target - last) * i) / count),
  );
  levels[count] = quote.price;

  const lastStart = Math.floor(now / intervalMs) * intervalMs;
  return Array.from({ length: count }, (_, i) => {
    const open = roundPrice(levels[i] as number);
    const close = roundPrice(levels[i + 1] as number);
    return {
      timestamp: lastStart - (count - 1 - i) * intervalMs,
      open,
      high: roundPrice(Math.max(open, close) * (1 + random() * volatility)),
      low: roundPrice(Math.min(open, close) * (1 - random() * volatility)),
      close,
      volume: Math.round((seed.volume / count) * (0.5 + random())),
    };
  });
}
