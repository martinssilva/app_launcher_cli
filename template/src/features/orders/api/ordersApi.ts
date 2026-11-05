import { baseApi } from '@/services/api';

import type { CreateOrderRequest, Order, ShippingOption } from '../types';

export const ordersApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Order', 'Product'] })
  .injectEndpoints({
    endpoints: build => ({
      getShippingOptions: build.query<ShippingOption[], void>({
        query: () => '/shipping-options',
      }),
      getOrders: build.query<Order[], void>({
        query: () => '/orders',
        providesTags: result => [
          { type: 'Order' as const, id: 'LIST' },
          ...(result?.map(({ id }) => ({ type: 'Order' as const, id })) ?? []),
        ],
      }),
      getOrder: build.query<Order, string>({
        query: id => `/orders/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Order', id }],
      }),
      createOrder: build.mutation<Order, CreateOrderRequest>({
        query: data => ({ url: '/orders', method: 'POST', data }),
        // Stock changed: refetch the catalog and the ordered products.
        invalidatesTags: (_result, _error, { items }) => [
          { type: 'Order', id: 'LIST' },
          { type: 'Product', id: 'LIST' },
          ...items.map(({ productId }) => ({
            type: 'Product' as const,
            id: productId,
          })),
        ],
      }),
    }),
  });

export const {
  useCreateOrderMutation,
  useGetOrderQuery,
  useGetOrdersQuery,
  useGetShippingOptionsQuery,
} = ordersApi;
