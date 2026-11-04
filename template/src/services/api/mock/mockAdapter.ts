import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  CanceledError,
  type InternalAxiosRequestConfig,
} from 'axios';

import { mockApiConfig } from './db';
import { findMockRoute } from './handlers';

const wait = (ms: number) =>
  ms > 0 ? new Promise<void>(resolve => setTimeout(resolve, ms)) : undefined;

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}

/** Returns the request path relative to `baseURL`, without the query string. */
function resolvePath(config: InternalAxiosRequestConfig): string | null {
  const url = config.url ?? '';
  const baseURL = config.baseURL ?? '';
  let path = url;
  if (/^https?:\/\//i.test(url)) {
    if (!baseURL || !url.startsWith(baseURL)) {
      return null; // absolute URL to another host: never mocked
    }
    path = url.slice(baseURL.length);
  }
  const [pathname = ''] = path.split('?');
  return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

function parseQuery(config: InternalAxiosRequestConfig) {
  const query: Record<string, unknown> = {};
  const search = (config.url ?? '').split('?')[1];
  if (search) {
    for (const pair of search.split('&')) {
      const [key = '', value = ''] = pair.split('=');
      if (key) {
        query[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    }
  }
  return { ...query, ...(config.params as Record<string, unknown>) };
}

function throwIfAborted(config: InternalAxiosRequestConfig) {
  const signal = config.signal as AbortSignal | undefined;
  if (signal?.aborted) {
    throw new CanceledError(undefined, undefined, config);
  }
}

/**
 * Axios adapter that answers known routes (./handlers.ts) locally.
 * Unknown routes fall through to the real network adapter, so you can mock
 * only what the backend does not provide yet.
 */
export function createMockAdapter(): AxiosAdapter {
  let networkAdapter: AxiosAdapter | undefined;

  return async config => {
    const method = (config.method ?? 'get').toUpperCase();
    const path = resolvePath(config);
    const match = path ? findMockRoute(method, path) : null;

    if (!path || !match) {
      networkAdapter ??= axios.getAdapter(axios.defaults.adapter);
      return networkAdapter(config);
    }

    throwIfAborted(config);
    await wait(mockApiConfig.delayMs);
    throwIfAborted(config);

    const authorization = config.headers.get('Authorization');
    const result = match.route.handler({
      method,
      path,
      params: match.params,
      query: parseQuery(config),
      body: parseBody(config.data),
      authorization:
        typeof authorization === 'string' ? authorization : undefined,
    });

    const response: AxiosResponse = {
      data: result.data ?? null,
      status: result.status,
      statusText: String(result.status),
      headers: {},
      config,
    };

    const validateStatus =
      config.validateStatus ??
      ((status: number) => status >= 200 && status < 300);
    if (validateStatus(result.status)) {
      return response;
    }

    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500
        ? AxiosError.ERR_BAD_RESPONSE
        : AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    );
  };
}
