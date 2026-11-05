import { renderSignedInApp } from '@/test-utils/session';
import { screen, userEvent, within } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

describe('orders', () => {
  it('lists past orders and shows their details', async () => {
    const user = userEvent.setup();
    await renderSignedInApp();
    await user.press(await screen.findByTestId(testIDs.tabs.settings));
    await user.press(screen.getByTestId(testIDs.orders.openButton));

    const latest = await screen.findByTestId(testIDs.orders.item('o2'));
    expect(within(latest).getByText('Order #10002')).toBeOnTheScreen();
    expect(within(latest).getByText('Shipped')).toBeOnTheScreen();
    expect(within(latest).getByText('$124.69')).toBeOnTheScreen();
    expect(
      within(screen.getByTestId(testIDs.orders.item('o1'))).getByText(
        'Delivered',
      ),
    ).toBeOnTheScreen();

    await user.press(latest);

    expect(
      await screen.findByTestId(testIDs.orderDetails.number),
    ).toHaveTextContent('Order #10002');
    expect(screen.getByText('Ceramic Mug Set')).toBeOnTheScreen();
    expect(screen.getByText('2 × $29.90')).toBeOnTheScreen();
    expect(screen.getByText('Express')).toBeOnTheScreen();
    expect(screen.getByText('Credit card ending in 4242')).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.orderDetails.total)).toHaveTextContent(
      '$124.69',
    );
  });
});
