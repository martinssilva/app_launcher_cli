import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MarkedDates } from 'react-native-calendars/src/types';

import type { MainTabScreenProps } from '@/app/navigation/types';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Text,
} from '@/components';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';
import { formatDate, monthRange, todayString } from '@/utils/dates';

import { useGetEventsQuery } from '../api/agendaApi';
import { AppCalendar } from '../components/AppCalendar';
import { EventCard } from '../components/EventCard';
import type { CalendarEvent } from '../types';

export function AgendaScreen({ navigation }: MainTabScreenProps<'Agenda'>) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [visibleMonth, setVisibleMonth] = useState(todayString);
  const range = useMemo(() => monthRange(visibleMonth), [visibleMonth]);
  const { data: events, error, isLoading, refetch } = useGetEventsQuery(range);

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const event of events ?? []) {
      marks[event.date] = { marked: true };
    }
    marks[selectedDate] = { ...marks[selectedDate], selected: true };
    return marks;
  }, [events, selectedDate]);

  const dayEvents = useMemo(
    () =>
      (events ?? [])
        .filter(event => event.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDate],
  );

  const openEvent = useCallback(
    (event: CalendarEvent) =>
      navigation.navigate('EventForm', { eventId: event.id }),
    [navigation],
  );

  let emptyComponent = (
    <View testID={testIDs.agenda.empty}>
      <EmptyState message={t('agenda.noEvents')} />
    </View>
  );
  if (isLoading) {
    emptyComponent = <LoadingState />;
  } else if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <FlatList
      testID={testIDs.agenda.screen}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={dayEvents}
      keyExtractor={event => event.id}
      renderItem={({ item }) => <EventCard event={item} onPress={openEvent} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppCalendar
            current={visibleMonth}
            markedDates={markedDates}
            onDayPress={day => setSelectedDate(day.dateString)}
            onMonthChange={month => setVisibleMonth(month.dateString)}
            style={styles.calendar}
            testID={testIDs.agenda.calendar}
          />
          <View style={styles.dayHeader}>
            <Text variant="subtitle" style={styles.dayTitle}>
              {t('agenda.eventsOn', {
                date: formatDate(selectedDate, i18n.language, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                }),
              })}
            </Text>
            <Button
              title={t('agenda.newEvent')}
              variant="secondary"
              onPress={() =>
                navigation.navigate('EventForm', { date: selectedDate })
              }
              testID={testIDs.agenda.newEventButton}
            />
          </View>
        </View>
      }
      ListEmptyComponent={emptyComponent}
    />
  );
}

const useStyles = makeStyles(theme => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.lg,
  },
  calendar: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  dayTitle: {
    flex: 1,
  },
}));
