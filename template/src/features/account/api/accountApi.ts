import { userUpdated } from '@/features/auth/authSlice';
import type { User } from '@/features/auth/types';
import { baseApi } from '@/services/api';

import type { ChangePasswordRequest, UpdateProfileRequest } from '../types';

export const accountApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['Me'] })
  .injectEndpoints({
    endpoints: build => ({
      updateProfile: build.mutation<User, UpdateProfileRequest>({
        query: data => ({ url: '/me', method: 'PATCH', data }),
        invalidatesTags: ['Me'],
        async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(userUpdated(data));
          } catch {
            // Exposed by the mutation hook.
          }
        },
      }),
      changePassword: build.mutation<void, ChangePasswordRequest>({
        query: data => ({
          url: '/auth/change-password',
          method: 'POST',
          data,
        }),
      }),
    }),
  });

export const { useChangePasswordMutation, useUpdateProfileMutation } =
  accountApi;
