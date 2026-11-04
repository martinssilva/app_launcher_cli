import axios, { type AxiosInstance } from 'axios';

import type { AuthTokens, TokenStorage } from '@/services/storage';

import { type ApiError, toApiError } from './errors';

export interface InterceptorOptions {
  tokenStorage: TokenStorage;
  /** Exchanges a refresh token for a new token pair. Must not use the auth flow (`skipAuth: true`). */
  refreshTokens: (refreshToken: string) => Promise<AuthTokens>;
  /** Called once the session cannot be recovered (refresh failed or no refresh token). */
  onSessionExpired: () => void;
  /** Called for every failed request, after normalization (logging, analytics...). */
  onError?: (error: ApiError) => void;
}

const bearer = (token: string) => `Bearer ${token}`;

/**
 * Installs the auth + error interceptors on an axios instance:
 *
 * 1. Adds `Authorization: Bearer <accessToken>` to every request (unless `skipAuth`).
 * 2. On `401`, refreshes the tokens once (concurrent 401s share the same refresh)
 *    and replays the original request.
 * 3. If the refresh fails, clears the tokens and calls `onSessionExpired`.
 * 4. Always rejects with a normalized `ApiError`.
 *
 * Returns a function that removes the interceptors.
 */
export function setupInterceptors(
  client: AxiosInstance,
  options: InterceptorOptions,
): () => void {
  const { tokenStorage, refreshTokens, onSessionExpired, onError } = options;
  let refreshInFlight: Promise<string | null> | null = null;

  const refreshAccessToken = (): Promise<string | null> => {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const tokens = await tokenStorage.getTokens();
        if (!tokens?.refreshToken) {
          return null;
        }
        try {
          const next = await refreshTokens(tokens.refreshToken);
          await tokenStorage.setTokens(next);
          return next.accessToken;
        } catch {
          return null;
        }
      })().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  };

  const requestInterceptor = client.interceptors.request.use(async config => {
    if (config.skipAuth) {
      return config;
    }
    const tokens = await tokenStorage.getTokens();
    if (tokens?.accessToken) {
      config.headers.set('Authorization', bearer(tokens.accessToken));
    }
    return config;
  });

  const responseInterceptor = client.interceptors.response.use(
    response => response,
    async (error: unknown) => {
      const config = axios.isAxiosError(error) ? error.config : undefined;
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

      // Only authenticated requests can "expire": a 401 on a request sent
      // without a token is just an error (and must not trigger a refresh loop).
      const sentAuthorization = config?.headers.get('Authorization');
      if (
        status === 401 &&
        config &&
        sentAuthorization &&
        !config.skipAuth &&
        !config._retried
      ) {
        config._retried = true;

        // Another request may have refreshed the tokens while this one was in flight.
        const current = await tokenStorage.getTokens();
        if (
          current?.accessToken &&
          sentAuthorization !== bearer(current.accessToken)
        ) {
          return client.request(config);
        }

        const accessToken = await refreshAccessToken();
        if (accessToken) {
          return client.request(config);
        }

        await tokenStorage.clearTokens();
        onSessionExpired();
      }

      const apiError = toApiError(error);
      onError?.(apiError);
      throw apiError;
    },
  );

  return () => {
    client.interceptors.request.eject(requestInterceptor);
    client.interceptors.response.eject(responseInterceptor);
  };
}
