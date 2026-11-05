import { addedToCart } from '@/features/cart/cartSlice';
import { renderSignedInApp } from '@/test-utils/session';
import { settleLists } from '@/test-utils/shopping';
import { act, screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

const mug = {
  id: 'p13',
  name: 'Ceramic Mug Set',
  images: [],
  price: 2990,
  stock: 25,
};

describe('cart screen', () => {
  it('shows an empty state that leads to the shop', async () => {
    const user = userEvent.setup();
    await renderSignedInApp();
    await user.press(await screen.findByTestId(testIDs.shoppingTabs.cart));

    expect(await screen.findByTestId(testIDs.cart.empty)).toBeOnTheScreen();
    await user.press(screen.getByTestId(testIDs.cart.browseButton));
    expect(await screen.findByTestId(testIDs.catalog.screen)).toBeOnTheScreen();
    await settleLists();
  });

  it('changes quantities and removes items', async () => {
    const user = userEvent.setup();
    const { store } = await renderSignedInApp();
    await act(() => {
      store.dispatch(addedToCart({ product: mug, quantity: 2 }));
    });
    await user.press(await screen.findByTestId(testIDs.shoppingTabs.cart));

    expect(screen.getByTestId(testIDs.cart.subtotal)).toHaveTextContent(
      '$59.80',
    );
    await user.press(screen.getByTestId(testIDs.cart.increase('p13')));
    expect(screen.getByTestId(testIDs.cart.quantity('p13'))).toHaveTextContent(
      '3',
    );
    expect(screen.getByText('Subtotal (3 items)')).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.cart.remove('p13')));
    expect(await screen.findByTestId(testIDs.cart.empty)).toBeOnTheScreen();
    expect(store.getState().cart.items).toEqual([]);
  });
});
