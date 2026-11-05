import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { signedOut } from '@/features/auth/authSlice';
import type { ApiErrorData } from '@/services/api/errors';

export type SyncStatus = 'idle' | 'syncing' | 'failed';

/** Runtime state of the sync engine (not persisted). */
export interface FitnessSyncState {
  status: SyncStatus;
  /** Why the last sync stopped (network, server...); retried on the next sync. */
  error: ApiErrorData | null;
}

const initialState: FitnessSyncState = {
  status: 'idle',
  error: null,
};

export const fitnessSyncSlice = createSlice({
  name: 'fitnessSync',
  initialState,
  reducers: {
    syncStarted(state) {
      state.status = 'syncing';
    },
    syncFinished(state) {
      state.status = 'idle';
      state.error = null;
    },
    syncFailed(state, action: PayloadAction<ApiErrorData>) {
      state.status = 'failed';
      state.error = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(signedOut, () => initialState);
  },
});

export const { syncFailed, syncFinished, syncStarted } =
  fitnessSyncSlice.actions;
export const fitnessSyncReducer = fitnessSyncSlice.reducer;
