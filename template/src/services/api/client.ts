import axios from 'axios';

import { env } from '@/config';
import { type AuthTokens, tokenStorage } from '@/services/storage';
import { logger } from '@/utils/logger';

import { setupInterceptors } from './interceptors';
import { createMockAdapter } from './mock';

/**
 * The single HTTP client of the app. Every request (RTK Query or not) goes
 * through it, so auth headers, token refresh and error normalization are
 * applied consistently.
 */
export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  ...(env.useMockApi ? { adapter: createMockAdapter() } : {}),
});

let sessionExpiredHandler: (() => void) | undefined;

/**
 * Registers what happens when the session cannot be recovered. The store does
 * it when it is created (src/app/store/store.ts), so this layer never imports
 * the store (no circular dependency).
 */
export function setSessionExpiredHandler(handler: (() => void) | undefined) {
  sessionExpiredHandler = handler;
}

setupInterceptors(apiClient, {
  tokenStorage,
  // Contract: POST /auth/refresh { refreshToken } -> { accessToken, refreshToken }
  refreshTokens: async refreshToken => {
    const response = await apiClient.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true },
    );
    return response.data;
  },
  onSessionExpired: () => sessionExpiredHandler?.(),
  onError: error => {
    if (error.code !== 'CANCELLED') {
      logger.warn(
        `[api] ${error.code}${error.status ? ` (${error.status})` : ''}: ${error.message}`,
      );
    }
  },
});
