import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { AppThunk, RootState } from '@/app/store/types';
import { apiClient, baseApi } from '@/services/api';
import { tokenStorage } from '@/services/storage';

import type { User } from './types';

export interface AuthState {
  user: User | null;
}

const initialState: AuthState = {
  user: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    userUpdated(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    signedOut() {
      return initialState;
    },
  },
});

export const { signedIn, signedOut, userUpdated } = authSlice.actions;
export const authReducer = authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) =>
  state.auth.user !== null;

/**
 * Clears the local session: tokens, user and every cached API response.
 * Used when the session expires (refresh failed) and by `logout`.
 */
export const endSession = (): AppThunk<Promise<void>> => async dispatch => {
  await tokenStorage.clearTokens();
  dispatch(signedOut());
  dispatch(baseApi.util.resetApiState());
};

/** User-initiated sign out: revokes the session on the server (best effort), then clears it locally. */
export const logout = (): AppThunk<Promise<void>> => async dispatch => {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Signing out locally must never fail because of the network.
  }
  await dispatch(endSession());
};
