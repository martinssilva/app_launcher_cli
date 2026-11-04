import React from 'react';

import { NavigationRoot } from '@/app/navigation/NavigationRoot';
import { MOCK_TAKEN_EMAIL } from '@/services/api/mock';
import { tokenStorage } from '@/services/storage';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

async function openRegister() {
  const user = userEvent.setup();
  const result = await renderWithProviders(<NavigationRoot />);
  await user.press(screen.getByTestId(testIDs.login.registerButton));
  expect(await screen.findByTestId(testIDs.register.screen)).toBeOnTheScreen();
  return { user, ...result };
}

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  values: { name: string; email: string; password: string; confirm: string },
) {
  await user.type(screen.getByTestId(testIDs.register.nameInput), values.name);
  await user.type(
    screen.getByTestId(testIDs.register.emailInput),
    values.email,
  );
  await user.type(
    screen.getByTestId(testIDs.register.passwordInput),
    values.password,
  );
  await user.type(
    screen.getByTestId(testIDs.register.confirmPasswordInput),
    values.confirm,
  );
  await user.press(screen.getByTestId(testIDs.register.submitButton));
}

describe('sign-up', () => {
  it('checks that the passwords match', async () => {
    const { user } = await openRegister();

    await fillForm(user, {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'secret123',
      confirm: 'secret124',
    });

    expect(
      await screen.findByText("The passwords don't match."),
    ).toBeOnTheScreen();
  });

  it('shows an error when the e-mail is already registered', async () => {
    const { user } = await openRegister();

    await fillForm(user, {
      name: 'Jane',
      email: MOCK_TAKEN_EMAIL,
      password: 'secret123',
      confirm: 'secret123',
    });

    expect(
      await screen.findByTestId(testIDs.register.errorMessage),
    ).toHaveTextContent('This e-mail is already registered.');
    expect(await tokenStorage.getTokens()).toBeNull();
  });

  it('creates the account and signs the user in', async () => {
    const { user, store } = await openRegister();

    await fillForm(user, {
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'secret123',
      confirm: 'secret123',
    });

    expect(await screen.findByText('Hello, Jane Doe!')).toBeOnTheScreen();
    expect(store.getState().auth.user).toMatchObject({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(await tokenStorage.getTokens()).not.toBeNull();
  });
});
