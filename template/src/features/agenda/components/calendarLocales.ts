import { LocaleConfig } from 'react-native-calendars';

import type { SupportedLanguage } from '@/i18n/languages';

/** Month and day names for react-native-calendars ('' is its built-in English). */
LocaleConfig.locales['pt-BR'] = {
  monthNames: [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  monthNamesShort: [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ],
  dayNames: [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
  today: 'Hoje',
};

export function setCalendarLanguage(language: string) {
  const supported: Partial<Record<SupportedLanguage, string>> = {
    'pt-BR': 'pt-BR',
  };
  LocaleConfig.defaultLocale = supported[language as SupportedLanguage] ?? '';
}
