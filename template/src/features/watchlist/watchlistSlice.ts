import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';
import { signedOut } from '@/features/auth/authSlice';

export interface WatchlistState {
  /** Symbols in the order the user added them. */
  symbols: string[];
}

/** What a new user (or a signed-out device) starts with. */
export const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'BTC', 'ETH'];

const initialState: WatchlistState = {
  symbols: DEFAULT_WATCHLIST,
};

/**
 * Persisted to MMKV (see the redux-persist whitelist in app/store/store.ts).
 * It is local to the device and goes back to the defaults on sign-out; move
 * it to the backend if it must follow the user across devices.
 */
export const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {
    addedToWatchlist(state, action: PayloadAction<string>) {
      if (!state.symbols.includes(action.payload)) {
        state.symbols.push(action.payload);
      }
    },
    removedFromWatchlist(state, action: PayloadAction<string>) {
      state.symbols = state.symbols.filter(symbol => symbol !== action.payload);
    },
  },
  extraReducers: builder => {
    builder.addCase(signedOut, () => initialState);
  },
});

export const { addedToWatchlist, removedFromWatchlist } =
  watchlistSlice.actions;
export const watchlistReducer = watchlistSlice.reducer;

export const selectWatchlistSymbols = (state: RootState) =>
  state.watchlist.symbols;
export const selectIsInWatchlist = (state: RootState, symbol: string) =>
  state.watchlist.symbols.includes(symbol);
