import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/authSlice';
import { settingsReducer } from '@/features/settings/settingsSlice';
import { baseApi } from '@/services/api';

export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
