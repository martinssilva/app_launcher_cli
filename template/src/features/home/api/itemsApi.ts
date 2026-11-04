import { baseApi } from '@/services/api';

import type { Item, PageParams, Paginated } from '../types';

export const itemsApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Item'] })
  .injectEndpoints({
    endpoints: build => ({
      getItems: build.query<Paginated<Item>, PageParams | void>({
        query: (params?: PageParams) => ({
          url: '/items',
          params: { page: params?.page ?? 1, limit: params?.limit ?? 20 },
        }),
        providesTags: result => [
          { type: 'Item' as const, id: 'LIST' },
          ...(result?.data.map(({ id }) => ({ type: 'Item' as const, id })) ??
            []),
        ],
      }),
      getItem: build.query<Item, string>({
        query: id => `/items/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Item', id }],
      }),
    }),
  });

export const { useGetItemsQuery, useGetItemQuery } = itemsApi;
