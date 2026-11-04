import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { App } from '@/app/App';
import { testIDs } from '@/utils/testIDs';

test('renders the login screen when there is no session', async () => {
  await render(<App />);

  expect(await screen.findByTestId(testIDs.login.screen)).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeOnTheScreen();
});
