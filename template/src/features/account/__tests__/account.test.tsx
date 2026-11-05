import { renderSignedInApp } from '@/test-utils/session';
import { screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

async function openSettings() {
  const user = userEvent.setup();
  const result = await renderSignedInApp();
  await user.press(await screen.findByTestId(testIDs.tabs.settings));
  return { user, ...result };
}

describe('account', () => {
  it('edits the profile', async () => {
    const { user, store } = await openSettings();

    await user.press(
      await screen.findByTestId(testIDs.account.editProfileButton),
    );
    const name = await screen.findByTestId(testIDs.account.nameInput);
    await user.clear(name);
    await user.type(name, 'Jane Smith');
    await user.clear(screen.getByTestId(testIDs.account.emailInput));
    await user.type(
      screen.getByTestId(testIDs.account.emailInput),
      'jane.smith@example.com',
    );
    await user.press(screen.getByTestId(testIDs.account.saveButton));

    expect(
      await screen.findByText('Signed in as jane.smith@example.com'),
    ).toBeOnTheScreen();
    expect(store.getState().auth.user).toMatchObject({
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
    });
  });

  it('changes the password', async () => {
    const { user } = await openSettings();

    await user.press(
      await screen.findByTestId(testIDs.account.changePasswordButton),
    );
    await user.type(
      await screen.findByTestId(testIDs.account.currentPasswordInput),
      'wrong-password',
    );
    await user.type(
      screen.getByTestId(testIDs.account.newPasswordInput),
      'newSecret1',
    );
    await user.type(
      screen.getByTestId(testIDs.account.confirmPasswordInput),
      'newSecret1',
    );
    await user.press(screen.getByTestId(testIDs.account.changePasswordSubmit));
    expect(
      await screen.findByTestId(testIDs.account.passwordErrorMessage),
    ).toHaveTextContent('The current password is incorrect.');

    await user.clear(screen.getByTestId(testIDs.account.currentPasswordInput));
    await user.type(
      screen.getByTestId(testIDs.account.currentPasswordInput),
      'oldSecret1',
    );
    await user.press(screen.getByTestId(testIDs.account.changePasswordSubmit));

    expect(
      await screen.findByTestId(testIDs.account.passwordChangedMessage),
    ).toHaveTextContent('Your password was changed.');
    expect(
      screen.getByTestId(testIDs.account.currentPasswordInput),
    ).toHaveDisplayValue('');
  });

  it('rejects a new password equal to the current one', async () => {
    const { user } = await openSettings();

    await user.press(
      await screen.findByTestId(testIDs.account.changePasswordButton),
    );
    await user.type(
      await screen.findByTestId(testIDs.account.currentPasswordInput),
      'secret123',
    );
    await user.type(
      screen.getByTestId(testIDs.account.newPasswordInput),
      'secret123',
    );
    await user.type(
      screen.getByTestId(testIDs.account.confirmPasswordInput),
      'secret123',
    );
    await user.press(screen.getByTestId(testIDs.account.changePasswordSubmit));

    expect(
      await screen.findByText(
        'Choose a password different from the current one.',
      ),
    ).toBeOnTheScreen();
  });
});
