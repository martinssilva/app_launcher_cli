import { buildCandles, getQuote, resetFinanceData } from '../data';
import {
  MockQuoteSocket,
  mockQuoteServer,
  mockQuoteServerConfig,
} from '../quoteServer';

interface Message {
  type: string;
  data?: { symbol: string; price: number }[];
}

/** Opens a mock connection and records what the "server" sends. */
function connect() {
  const socket = new MockQuoteSocket('wss://mock');
  const messages: Message[] = [];
  const closes: { code?: number }[] = [];
  socket.onmessage = event => messages.push(JSON.parse(String(event.data)));
  socket.onclose = event => closes.push(event);
  jest.advanceTimersByTime(0); // mock latency is 0 in tests
  return { socket, messages, closes };
}

describe('mock quotes server', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetFinanceData();
  });

  afterEach(() => {
    mockQuoteServer.reset();
    mockQuoteServerConfig.tickIntervalMs = 1000;
    jest.useRealTimers();
  });

  it('sends a snapshot on subscribe and then a tick every interval', () => {
    const { socket, messages } = connect();
    expect(socket.readyState).toBe(MockQuoteSocket.OPEN);

    socket.send(
      JSON.stringify({ type: 'subscribe', symbols: ['aapl', 'NOPE'] }),
    );
    jest.advanceTimersByTime(0);
    const initialPrice = getQuote('AAPL')?.price;
    expect(messages).toEqual([
      {
        type: 'quotes',
        data: [
          expect.objectContaining({ symbol: 'AAPL', price: initialPrice }),
        ],
      },
    ]);

    // Messages sent from a timer callback arrive 1ms later (Node timers).
    jest.advanceTimersByTime(1001);
    expect(messages).toHaveLength(2);
    const tick = messages[1]?.data?.[0];
    expect(tick?.symbol).toBe('AAPL');
    expect(tick?.price).not.toBe(initialPrice);

    jest.advanceTimersByTime(3000);
    expect(messages).toHaveLength(5);

    socket.send(JSON.stringify({ type: 'unsubscribe', symbols: ['AAPL'] }));
    jest.advanceTimersByTime(5000);
    expect(messages).toHaveLength(5);
  });

  it('answers pings and rejects invalid messages', () => {
    const { socket, messages } = connect();

    socket.send(JSON.stringify({ type: 'ping' }));
    socket.send('not json');
    jest.advanceTimersByTime(0);

    expect(messages).toEqual([
      { type: 'pong' },
      { type: 'error', message: 'Invalid message' },
    ]);
  });

  it('pushes prices set by tests only to subscribers', () => {
    mockQuoteServerConfig.tickIntervalMs = 0;
    const btc = connect();
    const eth = connect();
    btc.socket.send(JSON.stringify({ type: 'subscribe', symbols: ['BTC'] }));
    eth.socket.send(JSON.stringify({ type: 'subscribe', symbols: ['ETH'] }));
    jest.advanceTimersByTime(10_000);
    expect(btc.messages).toHaveLength(1);

    mockQuoteServer.setPrice('BTC', 70_123.456);
    jest.advanceTimersByTime(0);

    expect(btc.messages[1]?.data?.[0]).toMatchObject({
      symbol: 'BTC',
      price: 70_123.46,
    });
    expect(eth.messages).toHaveLength(1);
  });

  it('drops connections and refuses new ones while offline', () => {
    const { socket, closes } = connect();
    expect(mockQuoteServer.connectionCount).toBe(1);

    mockQuoteServer.setOffline(true);
    jest.advanceTimersByTime(0);
    expect(socket.readyState).toBe(MockQuoteSocket.CLOSED);
    expect(closes).toEqual([{ code: 1006, reason: 'Connection lost' }]);

    const retry = connect();
    expect(retry.socket.readyState).toBe(MockQuoteSocket.CLOSED);
    expect(retry.closes).toEqual([
      { code: 1006, reason: 'Network unreachable' },
    ]);

    mockQuoteServer.setOffline(false);
    expect(connect().socket.readyState).toBe(MockQuoteSocket.OPEN);
  });

  it('builds candles that end at the current price', () => {
    const quote = getQuote('NVDA');
    const day = buildCandles('NVDA', '1D');
    const year = buildCandles('NVDA', '1Y');

    expect(day).toHaveLength(48);
    expect(day[0]?.open).toBe(quote?.previousClose);
    expect(day[day.length - 1]?.close).toBe(quote?.price);
    expect(year).toHaveLength(52);
    expect(year[year.length - 1]?.close).toBe(quote?.price);
    // Same input, same candles (seeded per symbol and period).
    expect(buildCandles('NVDA', '1Y')).toEqual(year);
    day.forEach(candle => {
      expect(candle.high).toBeGreaterThanOrEqual(
        Math.max(candle.open, candle.close),
      );
      expect(candle.low).toBeLessThanOrEqual(
        Math.min(candle.open, candle.close),
      );
    });
  });
});
