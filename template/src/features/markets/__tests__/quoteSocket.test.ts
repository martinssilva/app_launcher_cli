import { QuoteSocket, type WebSocketLike } from '../services/quoteSocket';
import type { Quote } from '../types';

/** A WebSocket whose "server side" is driven by the test. */
class FakeSocket implements WebSocketLike {
  static instances: FakeSocket[] = [];

  readyState = 0;
  readonly sent: unknown[] = [];
  readonly close = jest.fn(() => {
    this.readyState = 3;
  });
  onopen: (() => void) | null = null;
  onmessage: ((event: { data?: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: { code?: number; reason?: string }) => void) | null = null;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  send(data: string) {
    this.sent.push(JSON.parse(data));
  }

  // Server side
  accept() {
    this.readyState = 1;
    this.onopen?.();
  }

  receive(message: object) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  drop() {
    this.readyState = 3;
    this.onerror?.({ message: 'lost' });
    this.onclose?.({ code: 1006, reason: 'lost' });
  }
}

function latestSocket(): FakeSocket {
  const socket = FakeSocket.instances[FakeSocket.instances.length - 1];
  if (!socket) {
    throw new Error('No socket was created');
  }
  return socket;
}

function quote(symbol: string, price: number): Quote {
  return {
    symbol,
    price,
    change: 0,
    changePercent: 0,
    open: price,
    high: price,
    low: price,
    previousClose: price,
    volume: 0,
    timestamp: Date.now(),
  };
}

function createQuoteSocket() {
  return new QuoteSocket({
    url: 'wss://quotes.test',
    createSocket: url => new FakeSocket(url),
    heartbeatIntervalMs: 15_000,
    heartbeatTimeoutMs: 5_000,
    reconnectBaseDelayMs: 1_000,
    reconnectMaxDelayMs: 8_000,
    reconnectJitter: 0,
  });
}

describe('QuoteSocket', () => {
  let socket: QuoteSocket;

  beforeEach(() => {
    jest.useFakeTimers();
    FakeSocket.instances = [];
    socket = createQuoteSocket();
  });

  afterEach(() => {
    socket.reset();
    jest.useRealTimers();
  });

  it('connects on the first subscription and subscribes once per symbol', () => {
    expect(socket.getStatus()).toBe('idle');
    expect(FakeSocket.instances).toHaveLength(0);

    const first = jest.fn();
    const second = jest.fn();
    socket.subscribe(['AAPL', 'BTC'], first);
    socket.subscribe(['BTC'], second);
    expect(socket.getStatus()).toBe('connecting');
    expect(FakeSocket.instances).toHaveLength(1);

    latestSocket().accept();
    expect(socket.getStatus()).toBe('open');
    expect(latestSocket().sent).toEqual([
      { type: 'subscribe', symbols: ['AAPL', 'BTC'] },
    ]);

    latestSocket().receive({
      type: 'quotes',
      data: [quote('AAPL', 230), quote('BTC', 70_000), quote('ETH', 3_500)],
    });
    expect(first).toHaveBeenCalledWith([
      quote('AAPL', 230),
      quote('BTC', 70_000),
    ]);
    expect(second).toHaveBeenCalledWith([quote('BTC', 70_000)]);
  });

  it('unsubscribes a symbol when its last listener leaves, then closes', () => {
    const unsubscribeFirst = socket.subscribe(['AAPL', 'BTC'], jest.fn());
    const unsubscribeSecond = socket.subscribe(['BTC'], jest.fn());
    latestSocket().accept();

    unsubscribeFirst();
    expect(latestSocket().sent).toContainEqual({
      type: 'unsubscribe',
      symbols: ['AAPL'],
    });
    expect(socket.symbols).toEqual(['BTC']);

    // Subscribing while open sends only the new symbols.
    socket.subscribe(['BTC', 'SOL'], jest.fn());
    expect(latestSocket().sent).toContainEqual({
      type: 'subscribe',
      symbols: ['SOL'],
    });

    unsubscribeSecond();
    unsubscribeSecond(); // calling it twice is harmless
    expect(socket.symbols).toEqual(['BTC', 'SOL']);
    expect(latestSocket().close).not.toHaveBeenCalled();

    socket.reset();
    expect(latestSocket().close).toHaveBeenCalled();
    expect(socket.getStatus()).toBe('idle');
  });

  it('reconnects with exponential backoff and subscribes again', () => {
    const listener = jest.fn();
    socket.subscribe(['AAPL'], listener);
    latestSocket().accept();

    latestSocket().drop();
    expect(socket.getStatus()).toBe('reconnecting');
    expect(FakeSocket.instances).toHaveLength(1);

    // 1st retry after 1s fails, 2nd after 2s fails, 3rd after 4s...
    jest.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(1);
    jest.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);
    latestSocket().drop();

    jest.advanceTimersByTime(1_999);
    expect(FakeSocket.instances).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(3);
    latestSocket().drop();

    jest.advanceTimersByTime(4_000);
    expect(FakeSocket.instances).toHaveLength(4);
    expect(socket.getStatus()).toBe('reconnecting');

    // ...and succeeds: every symbol is subscribed again.
    latestSocket().accept();
    expect(socket.getStatus()).toBe('open');
    expect(latestSocket().sent).toEqual([
      { type: 'subscribe', symbols: ['AAPL'] },
    ]);
    latestSocket().receive({ type: 'quotes', data: [quote('AAPL', 231)] });
    expect(listener).toHaveBeenLastCalledWith([quote('AAPL', 231)]);

    // A successful connection resets the backoff.
    latestSocket().drop();
    jest.advanceTimersByTime(1_000);
    expect(FakeSocket.instances).toHaveLength(5);
  });

  it('caps the reconnection delay', () => {
    expect([0, 1, 2, 3, 4, 10].map(n => socket.reconnectDelay(n))).toEqual([
      1_000, 2_000, 4_000, 8_000, 8_000, 8_000,
    ]);

    const withJitter = new QuoteSocket({
      url: 'wss://quotes.test',
      reconnectBaseDelayMs: 1_000,
      reconnectJitter: 0.5,
      random: () => 1,
    });
    expect(withJitter.reconnectDelay(1)).toBe(3_000);
  });

  it('replaces a connection that stops answering the heartbeat', () => {
    socket.subscribe(['AAPL'], jest.fn());
    latestSocket().accept();

    // Any message within the timeout keeps the connection.
    jest.advanceTimersByTime(15_000);
    expect(latestSocket().sent).toContainEqual({ type: 'ping' });
    latestSocket().receive({ type: 'pong' });
    jest.advanceTimersByTime(5_000);
    expect(socket.getStatus()).toBe('open');
    expect(FakeSocket.instances).toHaveLength(1);

    // No answer: the socket is closed and a new one is opened.
    jest.advanceTimersByTime(10_000 + 5_000);
    expect(latestSocket().close).toHaveBeenCalled();
    expect(socket.getStatus()).toBe('reconnecting');
    jest.advanceTimersByTime(1_000);
    expect(FakeSocket.instances).toHaveLength(2);
  });

  it('pauses in the background and resumes without backoff', () => {
    const statuses: string[] = [];
    socket.onStatusChange(() => statuses.push(socket.getStatus()));
    socket.subscribe(['AAPL'], jest.fn());
    latestSocket().accept();

    socket.pause();
    expect(latestSocket().close).toHaveBeenCalled();
    expect(socket.getStatus()).toBe('paused');
    jest.advanceTimersByTime(60_000);
    expect(FakeSocket.instances).toHaveLength(1);

    socket.resume();
    expect(FakeSocket.instances).toHaveLength(2);
    latestSocket().accept();
    expect(latestSocket().sent).toEqual([
      { type: 'subscribe', symbols: ['AAPL'] },
    ]);
    expect(statuses).toEqual([
      'connecting',
      'open',
      'paused',
      'connecting',
      'open',
    ]);
  });

  it('retries when the socket cannot be created', () => {
    let calls = 0;
    const flaky = new QuoteSocket({
      url: 'wss://quotes.test',
      reconnectJitter: 0,
      createSocket: url => {
        calls += 1;
        if (calls === 1) {
          throw new Error('Invalid URL');
        }
        return new FakeSocket(url);
      },
    });

    flaky.subscribe(['AAPL'], jest.fn());
    expect(flaky.getStatus()).toBe('reconnecting');
    jest.advanceTimersByTime(1_000);
    expect(calls).toBe(2);
    latestSocket().accept();
    expect(flaky.getStatus()).toBe('open');
    flaky.reset();
  });
});
