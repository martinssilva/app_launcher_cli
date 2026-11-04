import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { RootState } from '@/app/store/types';
import type { LanguagePreference } from '@/i18n/languages';
import type { ThemePreference } from '@/theme';

export interface SettingsState {
  theme: ThemePreference;
  language: LanguagePreference;
}

const initialState: SettingsState = {
  theme: 'system',
  language: 'system',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themePreferenceChanged(state, action: PayloadAction<ThemePreference>) {
      state.theme = action.payload;
    },
    languagePreferenceChanged(
      state,
      action: PayloadAction<LanguagePreference>,
    ) {
      state.language = action.payload;
    },
  },
});

export const { themePreferenceChanged, languagePreferenceChanged } =
  settingsSlice.actions;
export const settingsReducer = settingsSlice.reducer;

export const selectThemePreference = (state: RootState) => state.settings.theme;
export const selectLanguagePreference = (state: RootState) =>
  state.settings.language;
