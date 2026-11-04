import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { AuthTokens, TokenStorage } from '@/services/storage';

import { ApiError } from '../errors';
import { setupInterceptors } from '../interceptors';

function createMemoryTokenStorage(initial: AuthTokens | null) {
  let tokens = initial;
  const storage: TokenStorage & { current: () => AuthTokens | null } = {
    getTokens: async () => tokens,
    setTokens: async next => {
      tokens = next;
    },
    clearTokens: async () => {
      tokens = null;
    },
    current: () => tokens,
  };
  return storage;
}

function reply(
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown = {},
): AxiosResponse {
  const response = { status, statusText: '', headers: {}, config, data };
  if (status >= 200 && status < 300) {
    return response;
  }
  throw new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    config,
    undefined,
    response,
  );
}

const OLD: AuthTokens = {
  accessToken: 'old-access',
  refreshToken: 'old-refresh',
};
const NEW: AuthTokens = {
  accessToken: 'new-access',
  refreshToken: 'new-refresh',
};

/** Fake backend: only `new-access` is a valid token. */
function setup(initialTokens: AuthTokens | null, refreshResult?: AuthTokens) {
  const tokenStorage = createMemoryTokenStorage(initialTokens);
  const seenAuthorization: (string | undefined)[] = [];
  const client = axios.create({
    adapter: async config => {
      const authorization = config.headers.get('Authorization') as
        string | undefined;
      seenAuthorization.push(authorization);
      return authorization === 'Bearer new-access'
        ? reply(config, 200, { ok: true })
        : reply(config, 401, { message: 'Unauthorized' });
    },
  });
  const refreshTokens = jest.fn(async () => {
    if (!refreshResult) {
      throw new Error('refresh rejected');
    }
    return refreshResult;
  });
  const onSessionExpired = jest.fn();
  setupInterceptors(client, { tokenStorage, refreshTokens, onSessionExpired });
  return {
    client,
    tokenStorage,
    refreshTokens,
    onSessionExpired,
    seenAuthorization,
  };
}

describe('setupInterceptors', () => {
  it('sends the access token', async () => {
    const { client, seenAuthorization } = setup(NEW);
    await client.get('/me');
    expect(seenAuthorization).toEqual(['Bearer new-access']);
  });

  it('does not send the token when skipAuth is set', async () => {
    const { client, seenAuthorization, refreshTokens } = setup(NEW);
    await expect(
      client.get('/public', { skipAuth: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(seenAuthorization).toEqual([undefined]);
    expect(refreshTokens).not.toHaveBeenCalled();
  });

  it('refreshes the tokens on 401 and replays the request', async () => {
    const { client, tokenStorage, refreshTokens, onSessionExpired } = setup(
      OLD,
      NEW,
    );

    const response = await client.get('/me');

    expect(response.data).toEqual({ ok: true });
    expect(refreshTokens).toHaveBeenCalledWith('old-refresh');
    expect(tokenStorage.current()).toEqual(NEW);
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('shares a single refresh between concurrent requests', async () => {
    const { client, refreshTokens } = setup(OLD, NEW);

    const responses = await Promise.all([
      client.get('/a'),
      client.get('/b'),
      client.get('/c'),
    ]);

    expect(responses.map(r => r.status)).toEqual([200, 200, 200]);
    expect(refreshTokens).toHaveBeenCalledTimes(1);
  });

  it('ends the session when the refresh fails', async () => {
    const { client, tokenStorage, onSessionExpired } = setup(OLD);

    const error = await client.get('/me').catch(e => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(tokenStorage.current()).toBeNull();
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not try to refresh requests sent without a token', async () => {
    const { client, refreshTokens, onSessionExpired } = setup(null);

    await expect(client.get('/me')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    expect(refreshTokens).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('normalizes network errors', async () => {
    const tokenStorage = createMemoryTokenStorage(null);
    const client = axios.create({
      adapter: async config => {
        throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
      },
    });
    const onError = jest.fn();
    setupInterceptors(client, {
      tokenStorage,
      refreshTokens: jest.fn(),
      onSessionExpired: jest.fn(),
      onError,
    });

    await expect(client.get('/me')).rejects.toMatchObject({
      status: null,
      code: 'NETWORK',
    });
    expect(onError).toHaveBeenCalledWith(expect.any(ApiError));
  });
});
