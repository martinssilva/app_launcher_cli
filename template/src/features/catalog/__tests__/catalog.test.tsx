import { renderSignedInApp } from '@/test-utils/session';
import { settleLists } from '@/test-utils/shopping';
import { screen, userEvent, within } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

async function openShop() {
  const user = userEvent.setup();
  await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.shoppingTabs.shop));
  expect(await screen.findByText('12 of 36 products')).toBeOnTheScreen();
  await settleLists();
  return user;
}

describe('catalog', () => {
  it('loads the next page at the end of the grid', async () => {
    const user = await openShop();

    await user.scrollTo(screen.getByTestId(testIDs.catalog.list), {
      y: 1500,
      contentSize: { width: 400, height: 2000 },
      layoutMeasurement: { width: 400, height: 500 },
    });

    expect(await screen.findByText('24 of 36 products')).toBeOnTheScreen();
    await settleLists();
  });

  it('filters by category, search and sale', async () => {
    const user = await openShop();

    await user.press(
      await screen.findByTestId(testIDs.catalog.categoryFilter('electronics')),
    );
    expect(await screen.findByText('6 of 6 products')).toBeOnTheScreen();
    await settleLists();

    await user.press(screen.getByTestId(testIDs.catalog.onSaleFilter));
    expect(await screen.findByText('2 of 2 products')).toBeOnTheScreen();
    await settleLists();

    await user.press(screen.getByTestId(testIDs.catalog.categoryFilter('all')));
    await user.press(screen.getByTestId(testIDs.catalog.onSaleFilter));
    await user.type(screen.getByTestId(testIDs.catalog.searchInput), 'mug');
    expect(await screen.findByText('1 of 1 products')).toBeOnTheScreen();
    await settleLists();
    expect(screen.getByText('Ceramic Mug Set')).toBeOnTheScreen();

    await user.type(screen.getByTestId(testIDs.catalog.searchInput), 'xyz');
    expect(await screen.findByTestId(testIDs.catalog.empty)).toBeOnTheScreen();
    await settleLists();
  });

  it('sorts by price', async () => {
    const user = await openShop();

    await user.press(
      screen.getByTestId(testIDs.catalog.sortOption('price_asc')),
    );

    const cheapest = await screen.findByTestId(testIDs.catalog.product('p34'));
    await settleLists();
    expect(within(cheapest).getByText('Lip Balm Trio')).toBeOnTheScreen();
    expect(within(cheapest).getByText('$11.90')).toBeOnTheScreen();
  });

  it('marks products as favorites from the grid', async () => {
    const user = await openShop();

    await user.press(screen.getByTestId(testIDs.catalog.favoriteButton('p2')));
    expect(
      screen.getByRole('button', { name: 'Remove Smart Watch from favorites' }),
    ).toBeOnTheScreen();

    await user.press(screen.getByTestId(testIDs.shoppingTabs.favorites));
    expect(
      await screen.findByTestId(testIDs.favorites.product('p2')),
    ).toBeOnTheScreen();
    await settleLists();

    await user.press(
      screen.getByTestId(testIDs.favorites.favoriteButton('p2')),
    );
    expect(
      await screen.findByTestId(testIDs.favorites.empty),
    ).toBeOnTheScreen();
  });
});
