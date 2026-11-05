import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { formatNumber } from '../format';
import type { TrainingSession } from '../types';
import { PendingBadge } from './PendingBadge';

interface SessionCardProps {
  session: TrainingSession;
  onDelete: (session: TrainingSession) => void;
}

function SessionCardComponent({ session, onDelete }: SessionCardProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  return (
    <Card testID={testIDs.progress.session(session.id)}>
      <View style={styles.header}>
        <Text variant="subtitle" style={styles.title}>
          {t('sessions.summary', {
            workout: session.workoutName,
            minutes: session.durationMinutes,
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('sessions.deleteLabel', {
            name: session.workoutName,
          })}
          hitSlop={8}
          onPress={() => onDelete(session)}
          testID={testIDs.progress.deleteSession(session.id)}
        >
          <Text variant="label" tone="danger">
            {t('actions.delete')}
          </Text>
        </Pressable>
      </View>
      {session.exercises.map((exercise, index) => (
        <Text key={`${exercise.name}-${index}`} tone="muted">
          {exercise.name}:{' '}
          {t('workouts.exerciseSummary', {
            sets: exercise.sets,
            reps: exercise.reps,
            weight: formatNumber(exercise.weightKg, i18n.language),
          })}
        </Text>
      ))}
      <PendingBadge entity="sessions" id={session.id} />
    </Card>
  );
}

export const SessionCard = memo(SessionCardComponent);

const useStyles = makeStyles(theme => ({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    flex: 1,
  },
}));
