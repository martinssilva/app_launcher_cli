import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo } from 'react';

import { useGetQuotesQuery } from '../api/marketsApi';

/**
 * Quotes of `symbols`, kept up to date by the quotes WebSocket. The symbols
 * are de-duplicated and sorted, so the same set always shares one cache entry
 * (and one subscription).
 */
export function useLiveQuotes(symbols: readonly string[]) {
  const key = [...new Set(symbols)].sort().join(',');
  const arg = useMemo(() => (key ? key.split(',') : skipToken), [key]);
  return useGetQuotesQuery(arg);
}
