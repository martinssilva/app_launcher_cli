import { baseApi } from '@/services/api';

import type { Category, Product, ProductFilters, ProductPage } from '../types';

export const PRODUCTS_PAGE_SIZE = 12;

export const catalogApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Product', 'Category'] })
  .injectEndpoints({
    endpoints: build => ({
      getCategories: build.query<Category[], void>({
        query: () => '/categories',
        providesTags: [{ type: 'Category', id: 'LIST' }],
      }),
      /** Paginated catalog: `useGetProductsInfiniteQuery(filters)` + `fetchNextPage()`. */
      getProducts: build.infiniteQuery<ProductPage, ProductFilters, number>({
        infiniteQueryOptions: {
          initialPageParam: 1,
          getNextPageParam: lastPage =>
            lastPage.hasMore ? lastPage.page + 1 : undefined,
        },
        query: ({ queryArg, pageParam }) => ({
          url: '/products',
          params: {
            ...(queryArg.search ? { search: queryArg.search } : {}),
            ...(queryArg.category !== 'all'
              ? { category: queryArg.category }
              : {}),
            ...(queryArg.sort !== 'featured' ? { sort: queryArg.sort } : {}),
            ...(queryArg.onSale ? { onSale: true } : {}),
            page: pageParam,
            limit: PRODUCTS_PAGE_SIZE,
          },
        }),
        providesTags: [{ type: 'Product', id: 'LIST' }],
      }),
      getProduct: build.query<Product, string>({
        query: id => `/products/${encodeURIComponent(id)}`,
        providesTags: (_result, _error, id) => [{ type: 'Product', id }],
      }),
    }),
  });

export const {
  useGetCategoriesQuery,
  useGetProductQuery,
  useGetProductsInfiniteQuery,
} = catalogApi;
