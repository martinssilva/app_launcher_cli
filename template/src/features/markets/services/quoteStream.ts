import { AppState } from 'react-native';

import { MockQuoteSocket } from '@/services/api/mock/finance/quoteServer';

import { marketsConfig } from '../config';
import { QuoteSocket } from './quoteSocket';

/** The app-wide quotes connection (see `QuoteSocket`). */
export const quoteStream = new QuoteSocket({
  url: marketsConfig.quotesSocketUrl,
  createSocket: marketsConfig.useMockQuotes
    ? url => new MockQuoteSocket(url)
    : undefined,
  heartbeatIntervalMs: marketsConfig.heartbeatIntervalMs,
  heartbeatTimeoutMs: marketsConfig.heartbeatTimeoutMs,
  reconnectBaseDelayMs: marketsConfig.reconnectBaseDelayMs,
  reconnectMaxDelayMs: marketsConfig.reconnectMaxDelayMs,
});

// Mobile OSes suspend sockets in the background: close it there and
// reconnect (and resubscribe) as soon as the app is active again.
AppState.addEventListener('change', state => {
  if (state === 'background') {
    quoteStream.pause();
  } else if (state === 'active') {
    quoteStream.resume();
  }
});
