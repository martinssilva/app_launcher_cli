import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'react-native-localize';

import {
  DEFAULT_LANGUAGE,
  type LanguagePreference,
  matchLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './languages';
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

export const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
} as const satisfies Record<SupportedLanguage, unknown>;

export function getDeviceLanguage(): SupportedLanguage {
  return matchLanguage(getLocales());
}

export function resolveLanguage(
  preference: LanguagePreference,
): SupportedLanguage {
  return preference === 'system' ? getDeviceLanguage() : preference;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  initAsync: false, // resources are bundled: initialize synchronously
});

export { i18n };
export * from './languages';
