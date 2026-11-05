import { addedToCart } from '@/features/cart/cartSlice';
import { renderSignedInApp } from '@/test-utils/session';
import { act, screen, userEvent, waitFor } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

const headphones = {
  id: 'p1',
  name: 'Wireless Headphones',
  images: [],
  price: 12_999,
  stock: 15,
};

const nextYear = String((new Date().getFullYear() + 1) % 100).padStart(2, '0');

type User = ReturnType<typeof userEvent.setup>;

async function startCheckout(
  product: Parameters<typeof addedToCart>[0]['product'] = headphones,
  quantity = 1,
) {
  const user = userEvent.setup();
  const result = await renderSignedInApp();
  await act(() => {
    result.store.dispatch(addedToCart({ product, quantity }));
  });
  await user.press(await screen.findByTestId(testIDs.shoppingTabs.cart));
  await user.press(screen.getByTestId(testIDs.cart.checkoutButton));
  // Wait for the shipping options.
  await screen.findByTestId(testIDs.checkout.shippingOption('standard'));
  return { user, ...result };
}

async function fillAddress(user: User) {
  await user.type(
    screen.getByTestId(testIDs.checkout.streetInput),
    '1 Infinite Loop',
  );
  await user.type(screen.getByTestId(testIDs.checkout.cityInput), 'Cupertino');
  await user.type(screen.getByTestId(testIDs.checkout.stateInput), 'CA');
  await user.type(
    screen.getByTestId(testIDs.checkout.postalCodeInput),
    '95014',
  );
}

async function fillCard(user: User, number = '4242 4242 4242 4242') {
  await user.type(screen.getByTestId(testIDs.checkout.cardNumberInput), number);
  await user.type(
    screen.getByTestId(testIDs.checkout.cardExpiryInput),
    `12/${nextYear}`,
  );
  await user.type(screen.getByTestId(testIDs.checkout.cardCvcInput), '123');
}

describe('checkout', () => {
  it('places an order and empties the cart', async () => {
    const { user, store } = await startCheckout();

    // Prefilled with the signed-in user; standard shipping is free over $100.
    expect(
      screen.getByTestId(testIDs.checkout.fullNameInput),
    ).toHaveDisplayValue('Jane');
    expect(screen.getByTestId(testIDs.checkout.shipping)).toHaveTextContent(
      'Free',
    );
    expect(screen.getByTestId(testIDs.checkout.total)).toHaveTextContent(
      '$129.99',
    );

    await fillAddress(user);
    await fillCard(user);
    await user.press(screen.getByTestId(testIDs.checkout.placeOrderButton));

    expect(
      await screen.findByTestId(testIDs.orderConfirmation.number),
    ).toHaveTextContent(
      'Order #10003 ($129.99) is being processed. Delivery in 5–8 business days.',
    );
    expect(store.getState().cart.items).toEqual([]);

    await user.press(
      screen.getByTestId(testIDs.orderConfirmation.viewOrderButton),
    );
    expect(
      await screen.findByTestId(testIDs.orderDetails.number),
    ).toHaveTextContent('Order #10003');
    expect(screen.getByTestId(testIDs.orderDetails.status)).toHaveTextContent(
      'Processing',
    );
    expect(screen.getByText('Credit card ending in 4242')).toBeOnTheScreen();
    expect(screen.getByText('1 Infinite Loop')).toBeOnTheScreen();
  });

  it('charges express shipping and accepts payment on delivery', async () => {
    const { user } = await startCheckout();

    await user.press(
      screen.getByTestId(testIDs.checkout.shippingOption('express')),
    );
    expect(screen.getByTestId(testIDs.checkout.shipping)).toHaveTextContent(
      '$14.99',
    );
    expect(screen.getByTestId(testIDs.checkout.total)).toHaveTextContent(
      '$144.98',
    );

    await user.press(
      screen.getByTestId(testIDs.checkout.paymentOption('cash')),
    );
    expect(
      screen.queryByTestId(testIDs.checkout.cardNumberInput),
    ).not.toBeOnTheScreen();

    await fillAddress(user);
    await user.press(screen.getByTestId(testIDs.checkout.placeOrderButton));
    await user.press(
      await screen.findByTestId(testIDs.orderConfirmation.viewOrderButton),
    );

    expect(await screen.findByText('Pay on delivery')).toBeOnTheScreen();
    expect(screen.getByText('Express')).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.orderDetails.total)).toHaveTextContent(
      '$144.98',
    );
  });

  it('validates the form before calling the API', async () => {
    const { user } = await startCheckout();

    await user.type(
      screen.getByTestId(testIDs.checkout.cardNumberInput),
      '1234 5678',
    );
    await user.type(
      screen.getByTestId(testIDs.checkout.cardExpiryInput),
      '01/20',
    );
    await user.press(screen.getByTestId(testIDs.checkout.placeOrderButton));

    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      4,
    );
    expect(screen.getByText('Enter a valid card number.')).toBeOnTheScreen();
    expect(screen.getByText('This card has expired.')).toBeOnTheScreen();
    expect(screen.getByText('Enter the 3 or 4 digit code.')).toBeOnTheScreen();
    expect(
      screen.queryByTestId(testIDs.orderConfirmation.screen),
    ).not.toBeOnTheScreen();
  });

  it('keeps the cart when the card is declined', async () => {
    const { user, store } = await startCheckout();

    await fillAddress(user);
    await fillCard(user, '4000 0000 0000 0002');
    await user.press(screen.getByTestId(testIDs.checkout.placeOrderButton));

    expect(
      await screen.findByTestId(testIDs.checkout.errorMessage),
    ).toHaveTextContent(
      'Your card was declined. Try another card or payment method.',
    );
    expect(store.getState().cart.items).toHaveLength(1);
  });

  it('reports items that are out of stock', async () => {
    // The cart snapshot thinks there are 10 keyboards; the server has 2.
    const { user } = await startCheckout(
      {
        id: 'p5',
        name: 'Mechanical Keyboard',
        images: [],
        price: 8900,
        stock: 10,
      },
      3,
    );

    await fillAddress(user);
    await fillCard(user);
    await user.press(screen.getByTestId(testIDs.checkout.placeOrderButton));

    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.checkout.errorMessage),
      ).toHaveTextContent(
        'Some items are not available in this quantity anymore.',
        { exact: false },
      ),
    );
  });
});
