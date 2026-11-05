import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';
import { signedOut } from '@/features/auth/authSlice';
import type { Product } from '@/features/catalog/types';

/** Most units of one product a cart line can hold (besides the stock). */
export const MAX_QUANTITY_PER_ITEM = 10;

/**
 * A cart line keeps a snapshot of the product, so the cart works offline and
 * after an app restart (the slice is persisted). The server recalculates
 * prices and checks the stock when the order is placed.
 */
export interface CartItem {
  productId: string;
  name: string;
  image: string | null;
  price: number;
  stock: number;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

export function maxQuantity(stock: number): number {
  return Math.max(0, Math.min(stock, MAX_QUANTITY_PER_ITEM));
}

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addedToCart(
      state,
      action: PayloadAction<{
        product: Pick<Product, 'id' | 'name' | 'images' | 'price' | 'stock'>;
        quantity?: number;
      }>,
    ) {
      const { product, quantity = 1 } = action.payload;
      const limit = maxQuantity(product.stock);
      const existing = state.items.find(item => item.productId === product.id);
      if (existing) {
        // Refresh the snapshot with the latest product data.
        existing.name = product.name;
        existing.image = product.images[0] ?? null;
        existing.price = product.price;
        existing.stock = product.stock;
        existing.quantity = Math.min(existing.quantity + quantity, limit);
      } else if (limit > 0) {
        state.items.push({
          productId: product.id,
          name: product.name,
          image: product.images[0] ?? null,
          price: product.price,
          stock: product.stock,
          quantity: Math.min(quantity, limit),
        });
      }
    },
    quantityChanged(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>,
    ) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(entry => entry.productId === productId);
      if (!item) {
        return;
      }
      if (quantity <= 0) {
        state.items = state.items.filter(entry => entry !== item);
      } else {
        item.quantity = Math.min(quantity, maxQuantity(item.stock));
      }
    },
    removedFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        item => item.productId !== action.payload,
      );
    },
    cartCleared() {
      return initialState;
    },
  },
  extraReducers: builder => {
    // A cart belongs to the person who filled it.
    builder.addCase(signedOut, () => initialState);
  },
});

export const { addedToCart, quantityChanged, removedFromCart, cartCleared } =
  cartSlice.actions;
export const cartReducer = cartSlice.reducer;

export const selectCartItems = (state: RootState) => state.cart.items;

export const selectCartCount = createSelector([selectCartItems], items =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

export const selectCartSubtotal = createSelector([selectCartItems], items =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0),
);

export const selectCartQuantity = (state: RootState, productId: string) =>
  state.cart.items.find(item => item.productId === productId)?.quantity ?? 0;
