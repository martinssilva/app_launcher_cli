import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';
import { signedOut } from '@/features/auth/authSlice';
import {
  type ProductSummary,
  toProductSummary,
} from '@/features/catalog/types';

/**
 * Favorites are kept on the device (persisted slice) as product snapshots, so
 * the list shows up instantly and offline. To sync them with an account, add
 * `/favorites` endpoints and replace this slice with RTK Query.
 */
export interface FavoritesState {
  items: ProductSummary[];
}

const initialState: FavoritesState = {
  items: [],
};

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    favoriteToggled(state, action: PayloadAction<ProductSummary>) {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        // Newest first.
        state.items.unshift(toProductSummary(action.payload));
      }
    },
    favoritesCleared() {
      return initialState;
    },
  },
  extraReducers: builder => {
    builder.addCase(signedOut, () => initialState);
  },
});

export const { favoriteToggled, favoritesCleared } = favoritesSlice.actions;
export const favoritesReducer = favoritesSlice.reducer;

export const selectFavorites = (state: RootState) => state.favorites.items;
export const selectIsFavorite = (state: RootState, productId: string) =>
  state.favorites.items.some(item => item.id === productId);
