import { useSyncExternalStore } from 'react';

import { quoteStream } from '../services/quoteStream';

/** Status of the quotes WebSocket (`open`, `reconnecting`...). */
export function useQuoteConnectionStatus() {
  return useSyncExternalStore(
    quoteStream.onStatusChange,
    quoteStream.getStatus,
  );
}
