import React from 'react';

import { i18n } from '@/i18n';
import { renderWithProviders, screen, userEvent } from '@/test-utils';
import { testIDs } from '@/utils/testIDs';

import { SettingsScreen } from '../screens/SettingsScreen';

afterEach(async () => {
  await i18n.changeLanguage('en');
});

describe('SettingsScreen', () => {
  it('changes the theme and the language', async () => {
    const user = userEvent.setup();
    const { store } = await renderWithProviders(<SettingsScreen />, {
      withNavigation: true,
    });

    await user.press(screen.getByTestId(testIDs.settings.themeOption('dark')));
    expect(store.getState().settings.theme).toBe('dark');
    expect(
      screen.getByTestId(testIDs.settings.themeOption('dark')),
    ).toBeChecked();

    await user.press(
      screen.getByTestId(testIDs.settings.languageOption('pt-BR')),
    );
    expect(store.getState().settings.language).toBe('pt-BR');
    expect(await screen.findByText('Aparência')).toBeOnTheScreen();
  });
});
