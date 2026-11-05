import { mockQuoteServer } from '@/services/api/mock/finance/quoteServer';
import { screen, userEvent, waitFor } from '@/test-utils';
import { renderSignedInApp } from '@/test-utils/session';
import { testIDs } from '@/utils/testIDs';

beforeAll(() => {
  mockQuoteServer.config.tickIntervalMs = 0;
});

/** Waits until the quotes socket is open (status updates happen outside act). */
async function waitForLiveQuotes() {
  await waitFor(() =>
    expect(
      screen.getByTestId(testIDs.quotes.connectionStatus),
    ).toHaveTextContent('Live'),
  );
}

describe('watchlist', () => {
  it('shows the default watchlist with live prices', async () => {
    const user = userEvent.setup();
    await renderSignedInApp();
    await user.press(await screen.findByTestId(testIDs.financeTabs.watchlist));

    for (const symbol of ['AAPL', 'NVDA', 'BTC', 'ETH']) {
      expect(
        await screen.findByTestId(testIDs.watchlist.row(symbol)),
      ).toBeOnTheScreen();
    }
    expect(await screen.findByText('Apple Inc.')).toBeOnTheScreen();
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.watchlist.price('ETH')),
      ).toHaveTextContent(/^\$3,\d{3}\.\d{2}$/),
    );
    await waitForLiveQuotes();
  });

  it('adds an asset from Markets and removes it from the Watchlist', async () => {
    const user = userEvent.setup();
    const { store } = await renderSignedInApp();

    await user.press(await screen.findByTestId(testIDs.financeTabs.markets));
    const star = await screen.findByTestId(testIDs.markets.toggle('MSFT'));
    await waitForLiveQuotes();
    expect(star).toHaveAccessibleName('Add MSFT to watchlist');
    await user.press(star);
    expect(star).toHaveAccessibleName('Remove MSFT from watchlist');
    expect(store.getState().watchlist.symbols).toEqual([
      'AAPL',
      'NVDA',
      'BTC',
      'ETH',
      'MSFT',
    ]);

    await user.press(screen.getByTestId(testIDs.financeTabs.watchlist));
    expect(
      await screen.findByTestId(testIDs.watchlist.row('MSFT')),
    ).toBeOnTheScreen();
    expect(await screen.findByText('Microsoft Corp.')).toBeOnTheScreen();
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.watchlist.price('MSFT')),
      ).not.toHaveTextContent('—'),
    );

    await user.press(screen.getByTestId(testIDs.watchlist.toggle('MSFT')));
    expect(
      screen.queryByTestId(testIDs.watchlist.row('MSFT')),
    ).not.toBeOnTheScreen();
    expect(store.getState().watchlist.symbols).not.toContain('MSFT');
  });

  it('adds and removes from the asset details', async () => {
    const user = userEvent.setup();
    const { store } = await renderSignedInApp();
    await user.press(await screen.findByTestId(testIDs.financeTabs.markets));
    const row = await screen.findByTestId(testIDs.markets.row('KO'));
    await waitForLiveQuotes();
    await user.press(row);

    const button = await screen.findByTestId(
      testIDs.assetDetails.watchlistButton,
    );
    expect(button).toHaveTextContent('Add to watchlist');
    await user.press(button);
    expect(button).toHaveTextContent('Remove from watchlist');
    expect(store.getState().watchlist.symbols).toContain('KO');

    await user.press(button);
    expect(button).toHaveTextContent('Add to watchlist');
    expect(store.getState().watchlist.symbols).not.toContain('KO');
  });

  it('shows an empty state that leads to Markets', async () => {
    const user = userEvent.setup();
    await renderSignedInApp(undefined, { watchlist: { symbols: [] } });
    await user.press(await screen.findByTestId(testIDs.financeTabs.watchlist));

    expect(
      await screen.findByText(
        'Your watchlist is empty. Add assets from the Markets tab.',
      ),
    ).toBeOnTheScreen();
    await user.press(screen.getByTestId(testIDs.watchlist.browseButton));

    expect(await screen.findByTestId(testIDs.markets.screen)).toBeOnTheScreen();
  });
});
