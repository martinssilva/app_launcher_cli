import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';

export interface NetworkState {
  /** Assumed online until NetInfo reports otherwise (requests fail gracefully). */
  isOnline: boolean;
}

const initialState: NetworkState = {
  isOnline: true,
};

export const networkSlice = createSlice({
  name: 'network',
  initialState,
  reducers: {
    connectivityChanged(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
  },
});

export const { connectivityChanged } = networkSlice.actions;
export const networkReducer = networkSlice.reducer;

export const selectIsOnline = (state: RootState) => state.network.isOnline;
