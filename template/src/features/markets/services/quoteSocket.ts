import { logger } from '@/utils/logger';

import type { Quote } from '../types';

/**
 * The part of the WebSocket API this service uses. React Native's `WebSocket`
 * and the mock quotes server (`services/api/mock/finance/quoteServer.ts`)
 * both provide it.
 */
export interface WebSocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: (() => void) | null;
  onmessage: ((event: { data?: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: { code?: number; reason?: string }) => void) | null;
}

export type ConnectionStatus =
  /** No subscriptions, so no connection. */
  | 'idle'
  | 'connecting'
  | 'open'
  /** The connection was lost; waiting to retry or retrying. */
  | 'reconnecting'
  /** The app is in the background; reconnects when it comes back. */
  | 'paused';

export type QuoteListener = (quotes: Quote[]) => void;

export interface QuoteSocketOptions {
  url: string;
  /** Creates the connection. Defaults to React Native's `WebSocket`. */
  createSocket?: (url: string) => WebSocketLike;
  /** How often a `ping` is sent while connected. */
  heartbeatIntervalMs?: number;
  /** After a `ping`, how long to wait for any message before reconnecting. */
  heartbeatTimeoutMs?: number;
  /** First reconnection delay; doubles on every failed attempt... */
  reconnectBaseDelayMs?: number;
  /** ...up to this value. */
  reconnectMaxDelayMs?: number;
  /** Random extra delay (fraction of the delay) so clients don't retry in sync. */
  reconnectJitter?: number;
  random?: () => number;
}

// WebSocket.readyState values (the global may not exist in tests).
const CONNECTING = 0;
const OPEN = 1;

type ServerMessage =
  | { type: 'quotes'; data: Quote[] }
  | { type: 'pong' }
  | { type: 'error'; message?: string };

function parseMessage(data: unknown): ServerMessage | null {
  if (typeof data !== 'string') {
    return null;
  }
  try {
    const message: unknown = JSON.parse(data);
    if (typeof message !== 'object' || message === null) {
      return null;
    }
    const { type } = message as { type?: unknown };
    if (type === 'quotes') {
      const quotes = (message as { data?: unknown }).data;
      return Array.isArray(quotes)
        ? { type, data: quotes.filter(isQuote) }
        : null;
    }
    if (type === 'pong' || type === 'error') {
      return message as ServerMessage;
    }
    return null;
  } catch {
    return null;
  }
}

function isQuote(value: unknown): value is Quote {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Quote).symbol === 'string' &&
    typeof (value as Quote).price === 'number'
  );
}

function defaultCreateSocket(url: string): WebSocketLike {
  // RN's handler types use richer event objects than the ones read here.
  return new WebSocket(url) as unknown as WebSocketLike;
}

interface Subscription {
  symbols: ReadonlySet<string>;
  listener: QuoteListener;
}

/**
 * Real-time quotes over one WebSocket, shared by every screen:
 *
 * - **Per-symbol subscriptions**, reference counted: the server gets
 *   `subscribe` for a symbol once, and `unsubscribe` when the last listener
 *   of that symbol leaves. The socket opens with the first subscription and
 *   closes with the last one.
 * - **Exponential reconnection** (1s, 2s, 4s... up to 30s, with jitter) when
 *   the connection drops or cannot be opened; every symbol is subscribed
 *   again once it is back.
 * - **Heartbeat**: a `ping` every `heartbeatIntervalMs`; if nothing arrives
 *   within `heartbeatTimeoutMs`, the connection is considered dead (mobile
 *   networks often drop sockets without a close event) and replaced.
 * - **pause()/resume()** for when the app goes to the background.
 */
export class QuoteSocket {
  private readonly url: string;
  private readonly createSocket: (url: string) => WebSocketLike;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private readonly reconnectBaseDelayMs: number;
  private readonly reconnectMaxDelayMs: number;
  private readonly reconnectJitter: number;
  private readonly random: () => number;

  private socket: WebSocketLike | null = null;
  private status: ConnectionStatus = 'idle';
  private paused = false;
  /** Failed attempts since the last successful connection. */
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private heartbeatDeadline: ReturnType<typeof setTimeout> | undefined;

  private readonly subscriptions = new Set<Subscription>();
  private readonly symbolCounts = new Map<string, number>();
  private readonly statusListeners = new Set<() => void>();

  constructor(options: QuoteSocketOptions) {
    this.url = options.url;
    this.createSocket = options.createSocket ?? defaultCreateSocket;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 15_000;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 10_000;
    this.reconnectBaseDelayMs = options.reconnectBaseDelayMs ?? 1_000;
    this.reconnectMaxDelayMs = options.reconnectMaxDelayMs ?? 30_000;
    this.reconnectJitter = options.reconnectJitter ?? 0.2;
    this.random = options.random ?? Math.random;
  }

  // Arrow functions: they are passed around (useSyncExternalStore).
  getStatus = (): ConnectionStatus => this.status;

  onStatusChange = (listener: () => void): (() => void) => {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  };

  /** Symbols currently subscribed (for debugging and tests). */
  get symbols(): string[] {
    return [...this.symbolCounts.keys()];
  }

  /**
   * Calls `listener` with the quotes of `symbols` as they arrive.
   * Returns the function that cancels this subscription.
   */
  subscribe(symbols: readonly string[], listener: QuoteListener): () => void {
    const subscription: Subscription = { symbols: new Set(symbols), listener };
    this.subscriptions.add(subscription);

    const added: string[] = [];
    subscription.symbols.forEach(symbol => {
      const count = this.symbolCounts.get(symbol) ?? 0;
      this.symbolCounts.set(symbol, count + 1);
      if (count === 0) {
        added.push(symbol);
      }
    });

    if (this.status === 'open') {
      this.sendSymbols('subscribe', added);
    } else if (this.paused) {
      this.setStatus('paused');
    } else {
      this.ensureConnection();
    }

    let active = true;
    return () => {
      if (!active) {
        return;
      }
      active = false;
      this.unsubscribe(subscription);
    };
  }

  /** Closes the connection but keeps the subscriptions (app in background). */
  pause(): void {
    if (this.paused) {
      return;
    }
    this.paused = true;
    this.clearReconnect();
    this.closeSocket();
    if (this.subscriptions.size > 0) {
      this.setStatus('paused');
    }
  }

  /** Reconnects right away (no backoff) if anything is subscribed. */
  resume(): void {
    if (!this.paused) {
      return;
    }
    this.paused = false;
    this.attempt = 0;
    if (this.subscriptions.size > 0) {
      this.connect();
    } else {
      this.setStatus('idle');
    }
  }

  /** Drops every subscription and closes the connection. */
  reset(): void {
    this.subscriptions.clear();
    this.symbolCounts.clear();
    this.paused = false;
    this.disconnect();
  }

  private unsubscribe(subscription: Subscription) {
    this.subscriptions.delete(subscription);
    const removed: string[] = [];
    subscription.symbols.forEach(symbol => {
      const count = this.symbolCounts.get(symbol) ?? 0;
      if (count <= 1) {
        this.symbolCounts.delete(symbol);
        removed.push(symbol);
      } else {
        this.symbolCounts.set(symbol, count - 1);
      }
    });

    if (this.subscriptions.size === 0) {
      this.disconnect();
    } else {
      this.sendSymbols('unsubscribe', removed);
    }
  }

  private ensureConnection() {
    if (!this.socket && !this.reconnectTimer) {
      this.connect();
    }
  }

  private connect() {
    this.clearReconnect();
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');

    let socket: WebSocketLike;
    try {
      socket = this.createSocket(this.url);
    } catch (error) {
      logger.warn('[quotes] could not open the socket', error);
      this.handleConnectionLost();
      return;
    }
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }
      this.attempt = 0;
      this.setStatus('open');
      this.startHeartbeat();
      this.sendSymbols('subscribe', this.symbols);
    };
    socket.onmessage = event => {
      if (this.socket === socket) {
        this.handleMessage(event.data);
      }
    };
    // An error is always followed by a close event.
    socket.onerror = () => undefined;
    socket.onclose = event => {
      if (this.socket === socket) {
        logger.warn(
          `[quotes] connection closed (${event.code ?? '?'} ${event.reason ?? ''})`,
        );
        this.handleConnectionLost();
      }
    };
  }

  private handleConnectionLost() {
    this.closeSocket();
    if (this.paused) {
      this.setStatus('paused');
    } else if (this.subscriptions.size === 0) {
      this.setStatus('idle');
    } else {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    const delay = this.reconnectDelay(this.attempt);
    this.attempt += 1;
    this.setStatus('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect();
    }, delay);
  }

  /** `base * 2^attempt`, capped, plus up to `jitter` of random extra time. */
  reconnectDelay(attempt: number): number {
    const delay = Math.min(
      this.reconnectMaxDelayMs,
      this.reconnectBaseDelayMs * 2 ** attempt,
    );
    return Math.round(delay * (1 + this.reconnectJitter * this.random()));
  }

  private handleMessage(data: unknown) {
    // Any message proves the connection is alive.
    this.clearHeartbeatDeadline();
    const message = parseMessage(data);
    if (!message) {
      logger.warn('[quotes] ignored an unknown message');
      return;
    }
    if (message.type === 'error') {
      logger.warn(`[quotes] server error: ${message.message ?? ''}`);
    } else if (message.type === 'quotes') {
      this.subscriptions.forEach(({ symbols, listener }) => {
        const quotes = message.data.filter(quote => symbols.has(quote.symbol));
        if (quotes.length > 0) {
          listener(quotes);
        }
      });
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
      this.heartbeatDeadline ??= setTimeout(() => {
        this.heartbeatDeadline = undefined;
        logger.warn('[quotes] heartbeat timeout');
        this.handleConnectionLost();
      }, this.heartbeatTimeoutMs);
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
    this.clearHeartbeatDeadline();
  }

  private clearHeartbeatDeadline() {
    clearTimeout(this.heartbeatDeadline);
    this.heartbeatDeadline = undefined;
  }

  private clearReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private sendSymbols(type: 'subscribe' | 'unsubscribe', symbols: string[]) {
    if (symbols.length > 0) {
      this.send({ type, symbols });
    }
  }

  private send(message: object) {
    if (this.socket?.readyState !== OPEN) {
      return;
    }
    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.warn('[quotes] send failed', error);
    }
  }

  /** Stops timers and closes the socket without triggering a reconnection. */
  private closeSocket() {
    this.stopHeartbeat();
    const socket = this.socket;
    this.socket = null;
    if (!socket) {
      return;
    }
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    if (socket.readyState === CONNECTING || socket.readyState === OPEN) {
      try {
        socket.close(1000, 'Client closed');
      } catch {
        // Already closing.
      }
    }
  }

  private disconnect() {
    this.clearReconnect();
    this.closeSocket();
    this.attempt = 0;
    this.setStatus('idle');
  }

  private setStatus(status: ConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => listener());
    }
  }
}
