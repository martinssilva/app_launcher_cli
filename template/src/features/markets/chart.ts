import type { Candle } from './types';

export interface LinePoint {
  timestamp: number;
  value: number;
}

/**
 * Makes the last candle follow the live price, so the chart ends where the
 * price header is.
 */
export function withLivePrice(
  candles: Candle[],
  price: number | undefined,
): Candle[] {
  const last = candles[candles.length - 1];
  if (!last || price === undefined || last.close === price) {
    return candles;
  }
  return [
    ...candles.slice(0, -1),
    {
      ...last,
      close: price,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
    },
  ];
}

/** Line chart points: the first open, then every close. */
export function toLinePoints(candles: Candle[]): LinePoint[] {
  const first = candles[0];
  if (!first) {
    return [];
  }
  return [
    { timestamp: first.timestamp, value: first.open },
    ...candles.map(({ timestamp, close }) => ({ timestamp, value: close })),
  ];
}

export interface PeriodSummary {
  change: number;
  changePercent: number;
  high: number;
  low: number;
}

/** Change from the first open to the last close, and the period range. */
export function summarizeCandles(candles: Candle[]): PeriodSummary | null {
  const first = candles[0];
  const last = candles[candles.length - 1];
  if (!first || !last) {
    return null;
  }
  const change = last.close - first.open;
  return {
    change,
    changePercent: first.open === 0 ? 0 : (change / first.open) * 100,
    high: Math.max(...candles.map(candle => candle.high)),
    low: Math.min(...candles.map(candle => candle.low)),
  };
}
