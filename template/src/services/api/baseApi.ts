import { createApi } from '@reduxjs/toolkit/query/react';

import { axiosBaseQuery } from './axiosBaseQuery';
import { apiClient } from './client';

/**
 * Root RTK Query API. Features add their endpoints with
 * `baseApi.enhanceEndpoints({ addTagTypes }).injectEndpoints(...)`,
 * which keeps the base free of domain code.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery(apiClient),
  endpoints: () => ({}),
});
