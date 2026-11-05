import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, type CalendarProps } from 'react-native-calendars';

import { useTheme } from '@/theme';

import { setCalendarLanguage } from './calendarLocales';

/** `Calendar` from react-native-calendars with the app theme and language. */
export function AppCalendar(props: CalendarProps) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  setCalendarLanguage(i18n.language);

  const calendarTheme = useMemo(
    () => ({
      calendarBackground: theme.colors.surface,
      dayTextColor: theme.colors.text,
      textDisabledColor: theme.colors.textMuted,
      monthTextColor: theme.colors.text,
      textSectionTitleColor: theme.colors.textMuted,
      todayTextColor: theme.colors.primary,
      selectedDayBackgroundColor: theme.colors.primary,
      selectedDayTextColor: theme.colors.onPrimary,
      arrowColor: theme.colors.primary,
      dotColor: theme.colors.primary,
      selectedDotColor: theme.colors.onPrimary,
    }),
    [theme],
  );

  return (
    <Calendar
      // The library caches theme styles: remount when the theme or language changes.
      key={`${theme.name}-${i18n.language}`}
      theme={calendarTheme}
      enableSwipeMonths
      {...props}
    />
  );
}
