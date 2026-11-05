import { combineReducers } from '@reduxjs/toolkit';

import { authReducer } from '@/features/auth/authSlice';
import { cartReducer } from '@/features/cart/cartSlice';
import { favoritesReducer } from '@/features/favorites/favoritesSlice';
import { settingsReducer } from '@/features/settings/settingsSlice';
import { baseApi } from '@/services/api';

export const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  // Shopping
  cart: cartReducer,
  favorites: favoritesReducer,
  [baseApi.reducerPath]: baseApi.reducer,
});

export type RootState = ReturnType<typeof rootReducer>;
