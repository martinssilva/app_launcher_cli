import React from 'react';

import { NavigationRoot } from '@/app/navigation/NavigationRoot';
import type { User } from '@/features/auth/types';
import { issueTokens } from '@/services/api/mock/db';
import { tokenStorage } from '@/services/storage';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

const jane: User = { id: '1', name: 'Jane', email: 'jane@example.com' };

/** Starts the app with a valid session on the mock API. */
async function renderSignedIn() {
  await tokenStorage.setTokens(issueTokens(jane));
  return renderWithProviders(<NavigationRoot />, {
    preloadedState: { auth: { user: jane } },
  });
}

describe('auth flow', () => {
  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NavigationRoot />);

    await user.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findAllByText('This field is required.')).toHaveLength(
      2,
    );

    await user.type(screen.getByLabelText('E-mail'), 'not-an-email');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));
    expect(
      await screen.findByText('Enter a valid e-mail address.'),
    ).toBeOnTheScreen();
    expect(await tokenStorage.getTokens()).toBeNull();
  });

  it('shows an error for invalid credentials', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NavigationRoot />);

    await user.type(screen.getByLabelText('E-mail'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByTestId(testIDs.login.errorMessage),
    ).toHaveTextContent('Invalid e-mail or password.');
    expect(await tokenStorage.getTokens()).toBeNull();
  });

  it('signs in and shows the home screen', async () => {
    const user = userEvent.setup();
    const { store } = await renderWithProviders(<NavigationRoot />);

    await user.type(screen.getByLabelText('E-mail'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Hello, Jane!')).toBeOnTheScreen();
    expect(await screen.findByText('Item 1')).toBeOnTheScreen();
    expect(store.getState().auth.user?.email).toBe('jane@example.com');
    expect(await tokenStorage.getTokens()).toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
  });

  it('opens the item details', async () => {
    const user = userEvent.setup();
    await renderSignedIn();

    await user.press(await screen.findByTestId(testIDs.home.item('3')));

    expect(
      await screen.findByTestId(testIDs.itemDetails.title),
    ).toHaveTextContent('Item 3');
  });

  it('signs out from the settings screen', async () => {
    const user = userEvent.setup();
    const { store } = await renderSignedIn();

    await user.press(await screen.findByTestId(testIDs.tabs.settings));
    await user.press(await screen.findByTestId(testIDs.settings.logoutButton));

    expect(await screen.findByTestId(testIDs.login.screen)).toBeOnTheScreen();
    expect(store.getState().auth.user).toBeNull();
    expect(await tokenStorage.getTokens()).toBeNull();
  });

  it('returns to login when the session cannot be refreshed', async () => {
    await tokenStorage.setTokens({
      accessToken: 'revoked-access',
      refreshToken: 'revoked-refresh',
    });
    const { store } = await renderWithProviders(<NavigationRoot />, {
      preloadedState: { auth: { user: jane } },
    });

    expect(await screen.findByTestId(testIDs.login.screen)).toBeOnTheScreen();
    expect(store.getState().auth.user).toBeNull();
  });
});
