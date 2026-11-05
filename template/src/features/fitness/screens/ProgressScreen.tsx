import React, { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MarkedDates } from 'react-native-calendars/src/types';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, EmptyState, Screen, Text } from '@/components';
import { makeStyles } from '@/theme';
import { formatDate, todayString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

import { deleteSession } from '../actions';
import { AppCalendar } from '../components/AppCalendar';
import { ChoiceChips } from '../components/ChoiceChips';
import { ProgressChart } from '../components/ProgressChart';
import { SessionCard } from '../components/SessionCard';
import { StatTile } from '../components/StatTile';
import { SyncBanner } from '../components/SyncBanner';
import { formatNumber } from '../format';
import { exerciseNames, loadSeries, summarizeAttendance } from '../progress';
import { selectMember, selectSessionsByMember } from '../selectors';
import type { TrainingSession } from '../types';

/** History of a member: attendance (calendar) and load evolution (chart). */
export function ProgressScreen({
  navigation,
  route,
}: RootStackScreenProps<'MemberProgress'>) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { memberId } = route.params;
  const member = useAppSelector(state => selectMember(state, memberId));
  const sessions = useAppSelector(state =>
    selectSessionsByMember(state, memberId),
  );
  const [selectedDate, setSelectedDate] = useState(
    () => sessions[0]?.date ?? todayString(),
  );
  const [chosenExercise, setChosenExercise] = useState<string>();

  const summary = useMemo(() => summarizeAttendance(sessions), [sessions]);
  const exercises = useMemo(() => exerciseNames(sessions), [sessions]);
  const exercise =
    chosenExercise && exercises.includes(chosenExercise)
      ? chosenExercise
      : exercises[0];
  const points = useMemo(
    () => (exercise ? loadSeries(sessions, exercise) : []),
    [exercise, sessions],
  );

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const session of sessions) {
      marks[session.date] = { marked: true };
    }
    marks[selectedDate] = { ...marks[selectedDate], selected: true };
    return marks;
  }, [selectedDate, sessions]);

  const daySessions = sessions.filter(session => session.date === selectedDate);

  const confirmDelete = useCallback(
    (session: TrainingSession) =>
      Alert.alert(
        t('sessions.deleteConfirmTitle'),
        t('sessions.deleteConfirmMessage'),
        [
          { text: t('actions.cancel'), style: 'cancel' },
          {
            text: t('actions.delete'),
            style: 'destructive',
            onPress: () => dispatch(deleteSession(session.id)),
          },
        ],
      ),
    [dispatch, t],
  );

  if (!member) {
    return (
      <Screen>
        <EmptyState message={t('members.notFound')} />
      </Screen>
    );
  }

  if (sessions.length === 0) {
    return (
      <Screen testID={testIDs.progress.screen}>
        <SyncBanner />
        <View style={styles.fill} testID={testIDs.progress.empty}>
          <EmptyState message={t('progress.empty')} />
        </View>
        <Button
          title={t('members.logSession')}
          onPress={() => navigation.navigate('SessionForm', { memberId })}
        />
      </Screen>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const best = Math.max(...points.map(point => point.value));
  const change = first && last ? last.value - first.value : 0;

  return (
    <Screen scroll testID={testIDs.progress.screen}>
      <SyncBanner />
      <View style={styles.row}>
        <StatTile
          label={t('progress.thisMonth')}
          value={String(summary.thisMonth)}
          testID={testIDs.progress.thisMonth}
        />
        <StatTile
          label={t('progress.last30Days')}
          value={String(summary.last30Days)}
          testID={testIDs.progress.last30Days}
        />
        <StatTile
          label={t('progress.total')}
          value={String(summary.total)}
          testID={testIDs.progress.total}
        />
      </View>

      <Text variant="subtitle">{t('progress.evolution')}</Text>
      <ChoiceChips
        options={exercises.map(name => ({
          value: name,
          label: name,
          testID: testIDs.progress.exerciseOption(name),
        }))}
        value={exercise}
        onChange={setChosenExercise}
        accessibilityLabel={t('progress.evolution')}
      />
      {first && last && points.length >= 2 ? (
        <>
          <ProgressChart points={points} />
          <Text tone="muted">
            {t('progress.best', { value: formatNumber(best, i18n.language) })}
            {' · '}
            {t('progress.change', {
              value: `${change >= 0 ? '+' : ''}${formatNumber(change, i18n.language)}`,
              date: formatDate(first.date, i18n.language, {
                day: 'numeric',
                month: 'short',
              }),
            })}
          </Text>
        </>
      ) : (
        <Text tone="muted">{t('progress.notEnoughData')}</Text>
      )}

      <Text variant="subtitle">{t('progress.attendance')}</Text>
      <AppCalendar
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={day => setSelectedDate(day.dateString)}
        style={styles.calendar}
        testID={testIDs.progress.calendar}
      />
      <Text variant="label">
        {t('progress.sessionsOn', {
          date: formatDate(selectedDate, i18n.language, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
        })}
      </Text>
      {daySessions.length === 0 ? (
        <Text tone="muted">{t('progress.noSessionsOnDay')}</Text>
      ) : (
        daySessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onDelete={confirmDelete}
          />
        ))
      )}
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  fill: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  calendar: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
}));
