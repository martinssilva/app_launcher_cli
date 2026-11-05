import {
  configureStore,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppState } from 'react-native';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  type PersistConfig,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';

import { endSession } from '@/features/auth/authSlice';
import { baseApi, setSessionExpiredHandler } from '@/services/api';
import { reduxStorage } from '@/services/storage';

import { rootReducer, type RootState } from './rootReducer';

/** Only these slices are saved to disk. RTK Query cache is never persisted. */
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  version: 1,
  storage: reduxStorage,
  whitelist: ['auth', 'settings', 'watchlist'],
  // MMKV reads are synchronous, so the default 5s rehydration timeout is useless.
  timeout: 0,
};

function connectStore(dispatch: AppDispatch) {
  // RTK Query `refetchOnFocus` support for React Native (app comes to foreground).
  setupListeners(dispatch, (innerDispatch, { onFocus, onFocusLost }) => {
    const subscription = AppState.addEventListener('change', state => {
      innerDispatch(state === 'active' ? onFocus() : onFocusLost());
    });
    return () => subscription.remove();
  });
  // The API layer calls this when the refresh token is rejected.
  setSessionExpiredHandler(() => {
    dispatch(endSession());
  });
}

/** In-memory store (no persistence). Used by tests and tooling. */
export function makeStore(preloadedState?: Partial<RootState>) {
  const store = configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
  connectStore(store.dispatch);
  return store;
}

/** The app store: `auth` and `settings` are persisted to MMKV. */
export function makePersistedStore() {
  const store = configureStore({
    reducer: persistReducer(persistConfig, rootReducer),
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(baseApi.middleware),
  });
  const persistor = persistStore(store);
  connectStore(store.dispatch);
  return { store, persistor };
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  UnknownAction
>;
