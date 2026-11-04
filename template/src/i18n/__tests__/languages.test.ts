import { en } from '../locales/en';
import { ptBR } from '../locales/pt-BR';
import { matchLanguage } from '../languages';

const locale = (languageTag: string) => ({
  languageTag,
  languageCode: languageTag.split('-')[0] ?? languageTag,
});

describe('matchLanguage', () => {
  it('matches exact tags first', () => {
    expect(matchLanguage([locale('pt-BR')])).toBe('pt-BR');
    expect(matchLanguage([locale('en-US')])).toBe('en');
  });

  it('matches by language code', () => {
    expect(matchLanguage([locale('pt-PT')])).toBe('pt-BR');
  });

  it('uses the first supported locale and falls back to English', () => {
    expect(matchLanguage([locale('fr-FR'), locale('pt-BR')])).toBe('pt-BR');
    expect(matchLanguage([locale('de-DE')])).toBe('en');
    expect(matchLanguage([])).toBe('en');
  });
});

describe('locales', () => {
  const keysOf = (value: object, prefix = ''): string[] =>
    Object.entries(value).flatMap(([key, child]) =>
      typeof child === 'object'
        ? keysOf(child as object, `${prefix}${key}.`)
        : [`${prefix}${key}`],
    );

  it('pt-BR has exactly the same keys as en', () => {
    expect(keysOf(ptBR).sort()).toEqual(keysOf(en).sort());
  });
});
