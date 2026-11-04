import type { UnknownAction } from '@reduxjs/toolkit';

import { baseApi } from '@/services/api';
import { tokenStorage } from '@/services/storage';

import { signedIn, userUpdated } from '../authSlice';
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  User,
} from '../types';

/** Saves the tokens and signs the user in once login/register succeeds. */
async function startSession(
  queryFulfilled: Promise<{ data: LoginResponse }>,
  dispatch: (action: UnknownAction) => unknown,
) {
  try {
    const { data } = await queryFulfilled;
    await tokenStorage.setTokens(data.tokens);
    dispatch(signedIn(data.user));
  } catch {
    // The error is exposed by the mutation hook.
  }
}

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
        onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
          startSession(queryFulfilled, dispatch),
      }),
      register: build.mutation<LoginResponse, RegisterRequest>({
        query: body => ({
          url: '/auth/register',
          method: 'POST',
          data: body,
          skipAuth: true,
        }),
        onQueryStarted: (_arg, { dispatch, queryFulfilled }) =>
          startSession(queryFulfilled, dispatch),
      }),
      forgotPassword: build.mutation<void, ForgotPasswordRequest>({
        query: body => ({
          url: '/auth/forgot-password',
          method: 'POST',
          data: body,
          skipAuth: true,
        }),
      }),
      resetPassword: build.mutation<void, ResetPasswordRequest>({
        query: body => ({
          url: '/auth/reset-password',
          method: 'POST',
          data: body,
          skipAuth: true,
        }),
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

export const {
  useForgotPasswordMutation,
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useResetPasswordMutation,
} = authApi;
