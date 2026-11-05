import { mockApiConfig } from '../db';
import { getQuote, type MockQuote, setPrice, tickPrice } from './data';

/**
 * Local quotes "server" used instead of a real WebSocket when
 * `env.useMockApi` is on. `MockQuoteSocket` has the same surface as the
 * WebSocket API (`readyState`, `send`, `close`, `on*` handlers) and speaks the
 * protocol expected by `features/markets/services/quoteSocket.ts`:
 *
 *   client -> server  { type: 'subscribe' | 'unsubscribe', symbols: string[] }
 *                     { type: 'ping' }
 *   server -> client  { type: 'quotes', data: Quote[] }   (snapshot on subscribe, then ticks)
 *                     { type: 'pong' }
 *                     { type: 'error', message: string }
 *
 * Everything runs on timers (no network), so it works with Jest fake timers.
 */

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export const mockQuoteServerConfig = {
  /** Interval between random price moves. `0` disables them (tests push prices instead). */
  tickIntervalMs: 1000,
};

type ClientMessage =
  { type: 'subscribe' | 'unsubscribe'; symbols: string[] } | { type: 'ping' };

type ServerMessage =
  | { type: 'quotes'; data: MockQuote[] }
  | { type: 'pong' }
  | { type: 'error'; message: string };

const connections = new Set<MockQuoteSocket>();
let ticker: ReturnType<typeof setInterval> | undefined;
let offline = false;

function readClientMessage(data: string): ClientMessage | null {
  try {
    const message: unknown = JSON.parse(data);
    if (typeof message !== 'object' || message === null) {
      return null;
    }
    const { type, symbols } = message as Record<string, unknown>;
    if (type === 'ping') {
      return { type };
    }
    if (
      (type === 'subscribe' || type === 'unsubscribe') &&
      Array.isArray(symbols)
    ) {
      return {
        type,
        symbols: symbols.filter(
          (symbol): symbol is string => typeof symbol === 'string',
        ),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export class MockQuoteSocket {
  static readonly CONNECTING = CONNECTING;
  static readonly OPEN = OPEN;
  static readonly CLOSING = CLOSING;
  static readonly CLOSED = CLOSED;

  readonly url: string;
  readyState = CONNECTING;
  // Same handler signatures as the WebSocket API (as seen by the app).
  onopen: (() => void) | null = null;
  onmessage: ((event: { data?: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onclose: ((event: { code?: number; reason?: string }) => void) | null = null;

  /** Symbols this connection is subscribed to. */
  readonly symbols = new Set<string>();

  constructor(url: string) {
    this.url = url;
    setTimeout(() => this.accept(), mockApiConfig.delayMs);
  }

  send(data: string): void {
    if (this.readyState !== OPEN) {
      throw new Error('WebSocket is not open');
    }
    const message = readClientMessage(data);
    if (!message) {
      this.push({ type: 'error', message: 'Invalid message' });
      return;
    }
    switch (message.type) {
      case 'ping':
        this.push({ type: 'pong' });
        break;
      case 'subscribe': {
        const added = message.symbols
          .map(symbol => symbol.toUpperCase())
          .filter(symbol => !this.symbols.has(symbol) && getQuote(symbol));
        added.forEach(symbol => this.symbols.add(symbol));
        // Current quotes first, so a (re)subscribed client is never stale.
        const snapshot = added
          .map(getQuote)
          .filter((quote): quote is MockQuote => quote !== undefined);
        if (snapshot.length > 0) {
          this.push({ type: 'quotes', data: snapshot });
        }
        break;
      }
      case 'unsubscribe':
        message.symbols.forEach(symbol =>
          this.symbols.delete(symbol.toUpperCase()),
        );
        break;
    }
  }

  close(code = 1000, reason = ''): void {
    if (this.readyState === CLOSING || this.readyState === CLOSED) {
      return;
    }
    this.terminate();
    setTimeout(() => this.onclose?.({ code, reason }), 0);
  }

  /** Server side: the connection is lost (no close handshake). */
  drop(reason = 'Connection lost'): void {
    if (this.readyState !== OPEN) {
      return;
    }
    this.terminate();
    setTimeout(() => this.onclose?.({ code: 1006, reason }), 0);
  }

  /** Delivers a message asynchronously, like a real network. */
  push(message: ServerMessage): void {
    const data = JSON.stringify(message);
    setTimeout(() => {
      if (this.readyState === OPEN) {
        this.onmessage?.({ data });
      }
    }, 0);
  }

  private accept() {
    if (this.readyState !== CONNECTING) {
      return; // closed before it opened
    }
    if (offline) {
      this.readyState = CLOSED;
      this.onerror?.({ message: 'Network unreachable' });
      this.onclose?.({ code: 1006, reason: 'Network unreachable' });
      return;
    }
    this.readyState = OPEN;
    connections.add(this);
    updateTicker();
    this.onopen?.();
  }

  private terminate() {
    this.readyState = CLOSED;
    this.symbols.clear();
    connections.delete(this);
    updateTicker();
  }
}

function broadcast(quotes: MockQuote[]) {
  connections.forEach(connection => {
    const data = quotes.filter(quote => connection.symbols.has(quote.symbol));
    if (data.length > 0) {
      connection.push({ type: 'quotes', data });
    }
  });
}

function subscribedSymbols(): string[] {
  const symbols = new Set<string>();
  connections.forEach(connection =>
    connection.symbols.forEach(symbol => symbols.add(symbol)),
  );
  return [...symbols];
}

function tick() {
  broadcast(subscribedSymbols().map(tickPrice));
}

function updateTicker() {
  const shouldRun =
    connections.size > 0 && mockQuoteServerConfig.tickIntervalMs > 0;
  if (shouldRun && !ticker) {
    ticker = setInterval(tick, mockQuoteServerConfig.tickIntervalMs);
  } else if (!shouldRun && ticker) {
    clearInterval(ticker);
    ticker = undefined;
  }
}

/** Controls for tests and demos. */
export const mockQuoteServer = {
  config: mockQuoteServerConfig,
  /** Sets the price of an asset and pushes the new quote to subscribers. */
  setPrice(symbol: string, price: number): MockQuote {
    const quote = setPrice(symbol, price);
    broadcast([quote]);
    return quote;
  },
  /** Moves every subscribed price once, right now. */
  tick,
  /** Drops every open connection, like a network failure. */
  dropConnections(): void {
    [...connections].forEach(connection => connection.drop());
  },
  /** While offline, every new connection fails. */
  setOffline(value: boolean): void {
    offline = value;
    if (value) {
      mockQuoteServer.dropConnections();
    }
  },
  get connectionCount(): number {
    return connections.size;
  },
  subscribedSymbols,
  /** Drops every connection and goes back online. */
  reset(): void {
    offline = false;
    [...connections].forEach(connection => connection.drop());
  },
};
