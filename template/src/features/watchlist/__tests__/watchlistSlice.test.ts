import { makePersistedStore } from '@/app/store/store';
import { signedOut } from '@/features/auth/authSlice';
import { appStorage } from '@/services/storage';
import { waitFor } from '@/test-utils';

import {
  addedToWatchlist,
  DEFAULT_WATCHLIST,
  removedFromWatchlist,
  watchlistReducer,
} from '../watchlistSlice';

describe('watchlistSlice', () => {
  it('adds symbols once, in order, and removes them', () => {
    let state = watchlistReducer(undefined, { type: 'init' });
    expect(state.symbols).toEqual(DEFAULT_WATCHLIST);

    state = watchlistReducer(state, addedToWatchlist('SOL'));
    state = watchlistReducer(state, addedToWatchlist('SOL'));
    state = watchlistReducer(state, removedFromWatchlist('AAPL'));

    expect(state.symbols).toEqual(['NVDA', 'BTC', 'ETH', 'SOL']);
  });

  it('goes back to the defaults on sign-out', () => {
    const state = watchlistReducer({ symbols: ['SOL'] }, signedOut());
    expect(state.symbols).toEqual(DEFAULT_WATCHLIST);
  });

  it('is persisted and restored by redux-persist', async () => {
    const first = makePersistedStore();
    await waitFor(() =>
      expect(first.persistor.getState().bootstrapped).toBe(true),
    );

    first.store.dispatch(addedToWatchlist('DOGE'));
    await first.persistor.flush();
    const saved = JSON.parse(appStorage.getString('persist:root') ?? '{}');
    expect(JSON.parse(saved.watchlist).symbols).toContain('DOGE');
    first.persistor.pause();

    // A new app start reads it back.
    const second = makePersistedStore();
    await waitFor(() =>
      expect(second.persistor.getState().bootstrapped).toBe(true),
    );
    expect(second.store.getState().watchlist.symbols).toEqual([
      ...DEFAULT_WATCHLIST,
      'DOGE',
    ]);
    second.persistor.pause();
  });
});
