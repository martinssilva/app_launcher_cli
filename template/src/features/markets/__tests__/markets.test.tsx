import { mockQuoteServer } from '@/services/api/mock/finance/quoteServer';
import { financeMockRoutes } from '@/services/api/mock/finance/routes';
import { act, screen, userEvent, waitFor, within } from '@/test-utils';
import { renderSignedInApp } from '@/test-utils/session';
import { testIDs } from '@/utils/testIDs';

import { quoteStream } from '../services/quoteStream';

// Prices only change when a test pushes them.
beforeAll(() => {
  mockQuoteServer.config.tickIntervalMs = 0;
});

async function openTab(testID: string) {
  const user = userEvent.setup();
  await renderSignedInApp();
  await user.press(await screen.findByTestId(testID));
  return user;
}

/** Waits until the quotes socket is open (status updates happen outside act). */
async function waitForLiveQuotes() {
  await waitFor(() =>
    expect(
      screen.getByTestId(testIDs.quotes.connectionStatus),
    ).toHaveTextContent('Live'),
  );
}

const priceOf = (testID: string) =>
  screen.getByTestId(testID).props.children as string;

describe('real-time quotes', () => {
  afterEach(() => {
    mockQuoteServer.reset();
  });

  it('updates a price on screen when the socket pushes a quote', async () => {
    await openTab(testIDs.financeTabs.watchlist);

    expect(
      await screen.findByTestId(testIDs.watchlist.price('AAPL')),
    ).toHaveTextContent('$228.17');
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.quotes.connectionStatus),
      ).toHaveTextContent('Live'),
    );

    await act(async () => {
      mockQuoteServer.setPrice('AAPL', 250.5);
    });

    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.watchlist.price('AAPL')),
      ).toHaveTextContent('$250.50'),
    );
    expect(
      screen.getByTestId(testIDs.watchlist.change('AAPL')),
    ).toHaveTextContent('+9.63%');
    // Other rows are untouched.
    expect(
      screen.getByTestId(testIDs.watchlist.price('NVDA')),
    ).toHaveTextContent(priceOf(testIDs.watchlist.price('NVDA')));
  });

  it('reconnects after the connection drops and keeps streaming', async () => {
    await openTab(testIDs.financeTabs.watchlist);
    const status = await screen.findByTestId(testIDs.quotes.connectionStatus);
    await waitFor(() => expect(status).toHaveTextContent('Live'));

    await act(async () => {
      mockQuoteServer.dropConnections();
    });
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.quotes.connectionStatus),
      ).toHaveTextContent('Reconnecting…'),
    );

    // First retry after ~1s (with jitter); symbols are subscribed again.
    await waitFor(
      () =>
        expect(
          screen.getByTestId(testIDs.quotes.connectionStatus),
        ).toHaveTextContent('Live'),
      { timeout: 3000 },
    );
    expect(quoteStream.symbols.sort()).toEqual(['AAPL', 'BTC', 'ETH', 'NVDA']);
    await waitFor(() =>
      expect(mockQuoteServer.subscribedSymbols().sort()).toEqual([
        'AAPL',
        'BTC',
        'ETH',
        'NVDA',
      ]),
    );

    await act(async () => {
      mockQuoteServer.setPrice('BTC', 71_000);
    });
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.watchlist.price('BTC')),
      ).toHaveTextContent('$71,000.00'),
    );
  });
});

describe('markets', () => {
  it('filters by asset type and search', async () => {
    const user = await openTab(testIDs.financeTabs.markets);
    expect(
      await screen.findByTestId(testIDs.markets.row('KO')),
    ).toBeOnTheScreen();
    expect(screen.getByTestId(testIDs.markets.row('BTC'))).toBeOnTheScreen();
    await waitForLiveQuotes();

    await user.press(screen.getByTestId(testIDs.markets.typeFilter('crypto')));
    expect(
      await screen.findByTestId(testIDs.markets.row('DOGE')),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId(testIDs.markets.row('KO')),
    ).not.toBeOnTheScreen();
    // Prices with 4 decimals below $1.
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.markets.price('DOGE')),
      ).toHaveTextContent(/^\$0\.\d{4}$/),
    );

    await user.type(screen.getByTestId(testIDs.markets.searchInput), 'ether');
    // Debounced: the list changes once the new results arrive.
    await waitFor(() => {
      expect(
        screen.queryByTestId(testIDs.markets.row('BTC')),
      ).not.toBeOnTheScreen();
      expect(screen.getByTestId(testIDs.markets.row('ETH'))).toBeOnTheScreen();
    });

    await user.clear(screen.getByTestId(testIDs.markets.searchInput));
    await user.type(screen.getByTestId(testIDs.markets.searchInput), 'zzz');
    expect(await screen.findByTestId(testIDs.markets.empty)).toBeOnTheScreen();
  });
});

describe('asset details', () => {
  async function openNvidia() {
    const user = await openTab(testIDs.financeTabs.markets);
    const row = await screen.findByTestId(testIDs.markets.row('NVDA'));
    await waitForLiveQuotes();
    await user.press(row);
    expect(
      await screen.findByTestId(testIDs.assetDetails.name),
    ).toHaveTextContent('NVIDIA Corp.');
    return user;
  }

  it('shows the live quote, statistics and a line chart', async () => {
    await openNvidia();

    const price = await screen.findByTestId(testIDs.assetDetails.price);
    await waitFor(() => expect(price).toHaveTextContent(/^\$\d+\.\d{2}$/));
    expect(
      await screen.findByTestId(testIDs.assetDetails.lineChart),
    ).toBeOnTheScreen();
    expect(screen.getByText('Previous close')).toBeOnTheScreen();
    expect(screen.getByText('Market cap')).toBeOnTheScreen();

    await act(async () => {
      mockQuoteServer.setPrice('NVDA', 140);
    });
    await waitFor(() =>
      expect(screen.getByTestId(testIDs.assetDetails.price)).toHaveTextContent(
        '$140.00',
      ),
    );
  });

  it('changes the chart period and type', async () => {
    const user = await openNvidia();

    const dayChange = await screen.findByTestId(
      testIDs.assetDetails.periodChange,
    );
    // The 1D chart starts at the previous close, so it matches the quote.
    const quoteChange = screen.getByTestId(testIDs.assetDetails.change);
    const dayPercent = (quoteChange.props.children as string).match(
      /\(([^)]+)\)/,
    )?.[1];
    expect(dayChange).toHaveTextContent(`${dayPercent} over 1 day`);
    const dayRange = screen.getByTestId(testIDs.assetDetails.periodRange).props
      .children as string;

    await user.press(screen.getByTestId(testIDs.assetDetails.period('1Y')));

    expect(screen.getByTestId(testIDs.assetDetails.period('1Y'))).toBeChecked();
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.assetDetails.periodChange),
      ).toHaveTextContent(/over 1 year$/),
    );
    expect(
      screen.getByTestId(testIDs.assetDetails.periodChange),
    ).not.toHaveTextContent(`${dayPercent} over 1 year`);
    expect(
      screen.getByTestId(testIDs.assetDetails.periodRange),
    ).not.toHaveTextContent(dayRange);

    await user.press(
      screen.getByTestId(testIDs.assetDetails.chartType('candle')),
    );
    expect(
      screen.getByTestId(testIDs.assetDetails.candleChart),
    ).toBeOnTheScreen();
    expect(
      screen.queryByTestId(testIDs.assetDetails.lineChart),
    ).not.toBeOnTheScreen();
    expect(
      within(screen.getByTestId(testIDs.assetDetails.screen)).getByTestId(
        testIDs.assetDetails.period('1Y'),
      ),
    ).toBeChecked();
  });
});

/** Makes a finance mock route answer 500 until `restore()` is called. */
function failRoute(path: string) {
  const route = financeMockRoutes.find(candidate => candidate.path === path);
  if (!route) {
    throw new Error(`No mock route for ${path}`);
  }
  const { handler } = route;
  route.handler = () => ({ status: 500, data: { message: 'Down' } });
  return () => {
    route.handler = handler;
  };
}

describe('error states', () => {
  it('shows when prices fail to load and retries', async () => {
    const restore = failRoute('/quotes');
    const user = await openTab(testIDs.financeTabs.watchlist);

    expect(await screen.findByTestId(testIDs.quotes.error)).toHaveTextContent(
      /^Prices are unavailable\. Something went wrong on our side\./,
    );
    expect(
      screen.getByTestId(testIDs.watchlist.price('AAPL')),
    ).toHaveTextContent('—');

    restore();
    await user.press(screen.getByTestId(testIDs.quotes.retryButton));
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.watchlist.price('AAPL')),
      ).toHaveTextContent('$228.17'),
    );
    expect(screen.queryByTestId(testIDs.quotes.error)).not.toBeOnTheScreen();
    // Live updates start once the snapshot is loaded.
    await waitFor(() =>
      expect(
        screen.getByTestId(testIDs.quotes.connectionStatus),
      ).toHaveTextContent('Live'),
    );
  });

  it('shows the markets error state and retries', async () => {
    const restore = failRoute('/assets');
    const user = await openTab(testIDs.financeTabs.markets);

    expect(
      await screen.findByTestId(testIDs.stateView.error),
    ).toBeOnTheScreen();

    restore();
    await user.press(screen.getByTestId(testIDs.stateView.retryButton));
    expect(
      await screen.findByTestId(testIDs.markets.row('AAPL')),
    ).toBeOnTheScreen();
  });

  it('shows a chart error and retries', async () => {
    const user = await openTab(testIDs.financeTabs.markets);
    const row = await screen.findByTestId(testIDs.markets.row('TSLA'));
    await waitForLiveQuotes();
    const restore = failRoute('/assets/:symbol/candles');
    await user.press(row);

    expect(
      await screen.findByTestId(testIDs.assetDetails.chartError),
    ).toBeOnTheScreen();

    restore();
    await user.press(screen.getByTestId(testIDs.stateView.retryButton));
    expect(
      await screen.findByTestId(testIDs.assetDetails.lineChart),
    ).toBeOnTheScreen();
  });
});
