import { makeStore } from '@/app/store/store';
import { signedIn, signedOut } from '@/features/auth/authSlice';

import {
  addedToCart,
  cartCleared,
  MAX_QUANTITY_PER_ITEM,
  quantityChanged,
  removedFromCart,
  selectCartCount,
  selectCartQuantity,
  selectCartSubtotal,
} from '../cartSlice';

const mug = {
  id: 'p13',
  name: 'Ceramic Mug Set',
  images: ['https://example.com/mug.jpg'],
  price: 2990,
  stock: 25,
};
const keyboard = {
  id: 'p5',
  name: 'Mechanical Keyboard',
  images: [],
  price: 8900,
  stock: 2,
};

describe('cartSlice', () => {
  it('adds products, merges lines and computes the totals', () => {
    const store = makeStore();
    store.dispatch(addedToCart({ product: mug }));
    store.dispatch(addedToCart({ product: mug, quantity: 2 }));
    store.dispatch(addedToCart({ product: keyboard }));

    const state = store.getState();
    expect(state.cart.items).toHaveLength(2);
    expect(state.cart.items[0]).toEqual({
      productId: 'p13',
      name: 'Ceramic Mug Set',
      image: 'https://example.com/mug.jpg',
      price: 2990,
      stock: 25,
      quantity: 3,
    });
    expect(state.cart.items[1]?.image).toBeNull();
    expect(selectCartCount(state)).toBe(4);
    expect(selectCartSubtotal(state)).toBe(3 * 2990 + 8900);
    expect(selectCartQuantity(state, 'p13')).toBe(3);
    expect(selectCartQuantity(state, 'unknown')).toBe(0);
  });

  it('limits quantities to the stock and to the maximum per item', () => {
    const store = makeStore();
    store.dispatch(addedToCart({ product: keyboard, quantity: 5 }));
    store.dispatch(addedToCart({ product: mug, quantity: 50 }));
    store.dispatch(
      addedToCart({ product: { ...mug, id: 'sold-out', stock: 0 } }),
    );

    const state = store.getState();
    expect(selectCartQuantity(state, 'p5')).toBe(2);
    expect(selectCartQuantity(state, 'p13')).toBe(MAX_QUANTITY_PER_ITEM);
    expect(selectCartQuantity(state, 'sold-out')).toBe(0);
  });

  it('changes quantities and removes lines', () => {
    const store = makeStore();
    store.dispatch(addedToCart({ product: mug }));
    store.dispatch(addedToCart({ product: keyboard }));

    store.dispatch(quantityChanged({ productId: 'p13', quantity: 4 }));
    expect(selectCartQuantity(store.getState(), 'p13')).toBe(4);

    store.dispatch(quantityChanged({ productId: 'p13', quantity: 0 }));
    expect(selectCartQuantity(store.getState(), 'p13')).toBe(0);

    store.dispatch(removedFromCart('p5'));
    expect(store.getState().cart.items).toEqual([]);
  });

  it('is emptied by cartCleared and on sign out', () => {
    const store = makeStore();
    store.dispatch(addedToCart({ product: mug }));
    store.dispatch(cartCleared());
    expect(store.getState().cart.items).toEqual([]);

    store.dispatch(
      signedIn({ id: '1', name: 'Jane', email: 'jane@example.com' }),
    );
    store.dispatch(addedToCart({ product: mug }));
    store.dispatch(signedOut());
    expect(store.getState().cart.items).toEqual([]);
  });
});
