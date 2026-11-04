import React from 'react';

import { NavigationRoot } from '@/app/navigation/NavigationRoot';
import { MOCK_RESET_CODE } from '@/services/api/mock';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

describe('password recovery', () => {
  it('sends a code, rejects a wrong one and resets the password', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NavigationRoot />);

    // Login -> forgot password
    await user.press(screen.getByTestId(testIDs.login.forgotPasswordButton));
    await user.type(
      await screen.findByTestId(testIDs.forgotPassword.emailInput),
      'jane@example.com',
    );
    await user.press(screen.getByTestId(testIDs.forgotPassword.submitButton));

    // Reset password screen shows where the code was sent
    expect(
      await screen.findByText(
        'Enter the code sent to jane@example.com and choose a new password.',
      ),
    ).toBeOnTheScreen();

    await user.type(
      screen.getByTestId(testIDs.resetPassword.codeInput),
      '000000',
    );
    await user.type(
      screen.getByTestId(testIDs.resetPassword.passwordInput),
      'newSecret1',
    );
    await user.type(
      screen.getByTestId(testIDs.resetPassword.confirmPasswordInput),
      'newSecret1',
    );
    await user.press(screen.getByTestId(testIDs.resetPassword.submitButton));
    expect(
      await screen.findByTestId(testIDs.resetPassword.errorMessage),
    ).toHaveTextContent('Invalid or expired code.');

    await user.clear(screen.getByTestId(testIDs.resetPassword.codeInput));
    await user.type(
      screen.getByTestId(testIDs.resetPassword.codeInput),
      MOCK_RESET_CODE,
    );
    await user.press(screen.getByTestId(testIDs.resetPassword.submitButton));

    // Back on login with a notice and the e-mail filled in
    expect(await screen.findByTestId(testIDs.login.notice)).toHaveTextContent(
      'Password updated. Sign in with your new password.',
    );
    expect(screen.getByTestId(testIDs.login.emailInput)).toHaveDisplayValue(
      'jane@example.com',
    );
  });

  it('validates the code format', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NavigationRoot />);

    await user.press(screen.getByTestId(testIDs.login.forgotPasswordButton));
    await user.type(
      await screen.findByTestId(testIDs.forgotPassword.emailInput),
      'jane@example.com',
    );
    await user.press(screen.getByTestId(testIDs.forgotPassword.submitButton));

    await user.type(
      await screen.findByTestId(testIDs.resetPassword.codeInput),
      '12',
    );
    await user.press(screen.getByTestId(testIDs.resetPassword.submitButton));

    expect(
      await screen.findByText('Enter the 6-digit code.'),
    ).toBeOnTheScreen();
  });
});
