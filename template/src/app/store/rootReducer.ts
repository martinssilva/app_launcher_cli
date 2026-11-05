import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/authSlice';
import { settingsReducer } from '@/features/settings/settingsSlice';
import { watchlistReducer } from '@/features/watchlist/watchlistSlice';
import { baseApi } from '@/services/api';

export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  // Finance
  watchlist: watchlistReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
