export const SUPPORTED_LANGUAGES = ['en', 'pt-BR'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type LanguagePreference = 'system' | SupportedLanguage;

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

interface LocaleLike {
  languageTag: string;
  languageCode: string;
}

/** Picks the first supported language from the device locales (exact tag first, then language code). */
export function matchLanguage(
  locales: readonly LocaleLike[],
): SupportedLanguage {
  for (const { languageTag, languageCode } of locales) {
    const exact = SUPPORTED_LANGUAGES.find(
      language => language.toLowerCase() === languageTag.toLowerCase(),
    );
    if (exact) {
      return exact;
    }
    const sameCode = SUPPORTED_LANGUAGES.find(
      language => language.split('-')[0] === languageCode.toLowerCase(),
    );
    if (sameCode) {
      return sameCode;
    }
  }
  return DEFAULT_LANGUAGE;
}
