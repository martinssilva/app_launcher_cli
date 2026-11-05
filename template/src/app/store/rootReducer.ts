import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/authSlice';
import { fitnessReducer } from '@/features/fitness/fitnessSlice';
import { fitnessSyncReducer } from '@/features/fitness/syncSlice';
import { networkReducer } from '@/features/network/networkSlice';
import { settingsReducer } from '@/features/settings/settingsSlice';
import { baseApi } from '@/services/api';

export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  // Fitness
  network: networkReducer,
  fitness: fitnessReducer,
  fitnessSync: fitnessSyncReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
