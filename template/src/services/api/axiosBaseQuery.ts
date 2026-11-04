import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

import { type ApiErrorData, toApiError } from './errors';

export type AxiosQueryArgs = Pick<
  AxiosRequestConfig,
  'method' | 'data' | 'params' | 'headers' | 'timeout' | 'skipAuth'
> & { url: string };

/**
 * RTK Query base query that delegates to our axios instance, so RTK Query
 * endpoints get the same interceptors (auth, refresh, error normalization).
 */
export function axiosBaseQuery(
  client: AxiosInstance,
): BaseQueryFn<AxiosQueryArgs | string, unknown, ApiErrorData> {
  return async (args, { signal }) => {
    const config = typeof args === 'string' ? { url: args } : args;
    try {
      const response = await client.request({ ...config, signal });
      return { data: response.data };
    } catch (error) {
      return { error: toApiError(error).toJSON() };
    }
  };
}
