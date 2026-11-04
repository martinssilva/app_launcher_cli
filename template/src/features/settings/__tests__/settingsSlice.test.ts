import { makeStore } from '@/app/store/store';

import {
  languagePreferenceChanged,
  selectLanguagePreference,
  selectThemePreference,
  themePreferenceChanged,
} from '../settingsSlice';

describe('settingsSlice', () => {
  it('follows the system by default', () => {
    const store = makeStore();
    expect(selectThemePreference(store.getState())).toBe('system');
    expect(selectLanguagePreference(store.getState())).toBe('system');
  });

  it('stores the user preferences', () => {
    const store = makeStore();
    store.dispatch(themePreferenceChanged('dark'));
    store.dispatch(languagePreferenceChanged('pt-BR'));
    expect(selectThemePreference(store.getState())).toBe('dark');
    expect(selectLanguagePreference(store.getState())).toBe('pt-BR');
  });
});
