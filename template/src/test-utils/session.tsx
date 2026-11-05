import React from 'react';

import { NavigationRoot } from '@/app/navigation/NavigationRoot';
import type { RootState } from '@/app/store/types';
import type { User } from '@/features/auth/types';
import { issueTokens } from '@/services/api/mock/db';
import { tokenStorage } from '@/services/storage';

import { renderWithProviders } from './index';

export const testUser: User = {
  id: '1',
  name: 'Jane',
  email: 'jane@example.com',
};

/** Renders the whole app (navigation included) with a valid mock API session. */
export async function renderSignedInApp(
  user: User = testUser,
  preloadedState: Partial<RootState> = {},
) {
  // The mock session keeps (and may update) its own copy of the user.
  await tokenStorage.setTokens(issueTokens({ ...user }));
  return renderWithProviders(<NavigationRoot />, {
    preloadedState: { ...preloadedState, auth: { user } },
  });
}
