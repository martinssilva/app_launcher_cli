import { type AppEnv, env } from '@/config';

/**
 * Quotes WebSocket endpoint per environment. It lives in the feature (not in
 * `config/env.ts`) so the finance template does not change the base config.
 * In `development` the in-app quotes emitter is used instead (`env.useMockApi`).
 */
const QUOTES_SOCKET_URLS: Record<AppEnv, string> = {
  development: 'wss://stream.dev.example.com/quotes',
  staging: 'wss://stream.staging.example.com/quotes',
  production: 'wss://stream.example.com/quotes',
};

export const marketsConfig = {
  quotesSocketUrl: QUOTES_SOCKET_URLS[env.name],
  useMockQuotes: env.useMockApi,
  heartbeatIntervalMs: 15_000,
  heartbeatTimeoutMs: 10_000,
  reconnectBaseDelayMs: 1_000,
  reconnectMaxDelayMs: 30_000,
  /** How long a quotes subscription survives after its last screen unmounts. */
  keepQuotesForSeconds: 15,
};
