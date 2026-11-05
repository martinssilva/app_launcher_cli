import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';

import {
  addedToWatchlist,
  removedFromWatchlist,
  selectIsInWatchlist,
} from './watchlistSlice';

export function useWatchlistToggle(symbol: string) {
  const dispatch = useAppDispatch();
  const inWatchlist = useAppSelector(state =>
    selectIsInWatchlist(state, symbol),
  );
  const toggle = useCallback(() => {
    dispatch(
      inWatchlist ? removedFromWatchlist(symbol) : addedToWatchlist(symbol),
    );
  }, [dispatch, inWatchlist, symbol]);
  return { inWatchlist, toggle };
}
