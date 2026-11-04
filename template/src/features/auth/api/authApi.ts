import { baseApi } from '@/services/api';
import { tokenStorage } from '@/services/storage';

import { signedIn, userUpdated } from '../authSlice';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Me'] })
  .injectEndpoints({
    endpoints: build => ({
      login: build.mutation<LoginResponse, LoginRequest>({
        query: body => ({
          url: '/auth/login',
          method: 'POST',
          data: body,
          skipAuth: true,
        }),
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            await tokenStorage.setTokens(data.tokens);
            dispatch(signedIn(data.user));
          } catch {
            // The error is exposed by the `useLoginMutation` hook.
          }
        },
      }),
      getMe: build.query<User, void>({
        query: () => '/me',
        providesTags: ['Me'],
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(userUpdated(data));
          } catch {
            // Handled by the query hook / interceptors.
          }
        },
      }),
    }),
  });

export const { useLoginMutation, useGetMeQuery } = authApi;
