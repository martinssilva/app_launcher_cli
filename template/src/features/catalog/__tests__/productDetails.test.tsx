import { renderSignedInApp } from '@/test-utils/session';
import { settleLists } from '@/test-utils/shopping';
import { screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

async function openProduct(id: string) {
  const user = userEvent.setup();
  const result = await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.shoppingTabs.shop));
  await screen.findByTestId(testIDs.catalog.product(id));
  await settleLists();
  await user.press(screen.getByTestId(testIDs.catalog.product(id)));
  await screen.findByTestId(testIDs.productDetails.name);
  return { user, ...result };
}

describe('product details', () => {
  it('adds the chosen quantity to the cart', async () => {
    const { user, store } = await openProduct('p1');

    expect(screen.getByTestId(testIDs.productDetails.name)).toHaveTextContent(
      'Wireless Headphones',
    );
    expect(screen.getByTestId(testIDs.productDetails.price)).toHaveTextContent(
      '$129.99',
    );
    expect(screen.getByText('19% off')).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.productDetails.stock)).toHaveTextContent(
      'In stock',
    );

    await user.press(
      screen.getByTestId(testIDs.productDetails.increaseQuantity),
    );
    await user.press(
      screen.getByTestId(testIDs.productDetails.addToCartButton),
    );

    expect(
      await screen.findByTestId(testIDs.productDetails.addedMessage),
    ).toHaveTextContent('In your cart: 2');
    expect(store.getState().cart.items).toEqual([
      expect.objectContaining({ productId: 'p1', quantity: 2, price: 12999 }),
    ]);

    await user.press(screen.getByTestId(testIDs.productDetails.goToCartButton));
    expect(
      await screen.findByTestId(testIDs.cart.item('p1')),
    ).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.cart.subtotal)).toHaveTextContent(
      '$259.98',
    );
  });

  it('does not sell more than the stock', async () => {
    const { user } = await openProduct('p5');

    expect(screen.getByTestId(testIDs.productDetails.stock)).toHaveTextContent(
      'Only 2 left',
    );
    await user.press(
      screen.getByTestId(testIDs.productDetails.increaseQuantity),
    );
    expect(
      screen.getByTestId(testIDs.productDetails.increaseQuantity),
    ).toBeDisabled();
    await user.press(
      screen.getByTestId(testIDs.productDetails.addToCartButton),
    );

    expect(
      await screen.findByText(
        'You have the maximum quantity of this product in your cart.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId(testIDs.productDetails.addToCartButton),
    ).not.toBeOnTheScreen();
  });

  it('shows sold-out products without the add button', async () => {
    await openProduct('p6');

    expect(screen.getByTestId(testIDs.productDetails.stock)).toHaveTextContent(
      'Out of stock',
    );
    expect(
      screen.queryByTestId(testIDs.productDetails.addToCartButton),
    ).not.toBeOnTheScreen();
  });

  it('toggles the favorite', async () => {
    const { user, store } = await openProduct('p3');

    await user.press(screen.getByTestId(testIDs.productDetails.favoriteButton));
    expect(store.getState().favorites.items.map(({ id }) => id)).toEqual([
      'p3',
    ]);

    await user.press(screen.getByTestId(testIDs.productDetails.favoriteButton));
    expect(store.getState().favorites.items).toEqual([]);
  });
});
