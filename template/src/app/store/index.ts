import { makePersistedStore } from './store';

/** App-wide store singleton. Tests should use `makeStore()` instead. */
export const { store, persistor } = makePersistedStore();

export { makeStore } from './store';
export { useAppDispatch, useAppSelector } from './hooks';
export type { AppDispatch, AppStore, AppThunk, RootState } from './types';
