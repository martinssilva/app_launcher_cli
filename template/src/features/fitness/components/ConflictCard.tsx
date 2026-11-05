import type { TFunction } from 'i18next';
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { Button, Card, Text } from '@/components';
import { makeStyles } from '@/theme';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { formatDate } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

import { resolveConflict } from '../actions';
import { formatNumber } from '../format';
import type {
  EntityType,
  FitnessEntities,
  Member,
  QueuedMutation,
  TrainingSession,
  Workout,
} from '../types';

interface Line {
  label: string;
  value: string;
}

/** The fields of a record the user can compare. */
function describe(
  entity: EntityType,
  record: FitnessEntities[EntityType],
  t: TFunction,
  locale: string,
): Line[] {
  const exercises = (items: Workout['exercises']) =>
    items
      .map(
        item =>
          `${item.name}: ${t('workouts.exerciseSummary', {
            sets: item.sets,
            reps: item.reps,
            weight: formatNumber(item.weightKg, locale),
          })}`,
      )
      .join('\n');
  switch (entity) {
    case 'members': {
      const member = record as Member;
      return [
        { label: t('memberForm.name'), value: member.name },
        { label: t('members.email'), value: member.email },
        { label: t('members.phone'), value: member.phone },
        { label: t('members.goal'), value: t(`goals.${member.goal}`) },
        { label: t('members.notes'), value: member.notes },
      ];
    }
    case 'workouts': {
      const workout = record as Workout;
      return [
        { label: t('workouts.name'), value: workout.name },
        { label: t('workouts.notes'), value: workout.notes },
        { label: t('workouts.exercises'), value: exercises(workout.exercises) },
      ];
    }
    case 'sessions': {
      const session = record as TrainingSession;
      return [
        { label: t('sessions.workout'), value: session.workoutName },
        { label: t('sessions.date'), value: formatDate(session.date, locale) },
        {
          label: t('sessions.duration'),
          value: String(session.durationMinutes),
        },
        { label: t('workouts.exercises'), value: exercises(session.exercises) },
      ];
    }
  }
}

interface VersionProps {
  title: string;
  lines: Line[] | null;
  /** Labels whose values differ between the two versions. */
  changed: Set<string>;
  fallback: string;
}

function Version({ title, lines, changed, fallback }: VersionProps) {
  const styles = useStyles();
  return (
    <View style={styles.version}>
      <Text variant="label">{title}</Text>
      {lines ? (
        lines
          .filter(line => line.value)
          .map(line => (
            <Text
              key={line.label}
              tone={changed.has(line.label) ? 'primary' : 'muted'}
            >
              {line.label}: {line.value}
            </Text>
          ))
      ) : (
        <Text tone="muted">{fallback}</Text>
      )}
    </View>
  );
}

interface ConflictCardProps {
  mutation: QueuedMutation;
  /** Number of other changes waiting behind this one. */
  waiting: number;
}

/** Explains why the server refused a queued change and lets the user choose. */
export function ConflictCard({ mutation, waiting }: ConflictCardProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const local = useAppSelector(
    state =>
      (
        state.fitness[mutation.entity] as Record<
          string,
          FitnessEntities[EntityType]
        >
      )[mutation.entityId],
  );
  const conflict = mutation.conflict;
  if (!conflict) {
    return null;
  }
  const name = mutation.label;
  const resolve = (choice: 'mine' | 'theirs') =>
    dispatch(resolveConflict(mutation.id, choice));

  const mine =
    mutation.action === 'delete'
      ? null
      : describe(mutation.entity, local ?? mutation.data!, t, i18n.language);
  const theirs = conflict.server
    ? describe(mutation.entity, conflict.server, t, i18n.language)
    : null;
  const changed = new Set(
    (mine ?? [])
      .filter(
        line =>
          theirs?.find(other => other.label === line.label)?.value !==
          line.value,
      )
      .map(line => line.label),
  );

  let title = t('sync.changedTitle');
  let message = t('sync.changedMessage', { name });
  let mineLabel = t('sync.keepMine');
  let theirsLabel = t('sync.keepTheirs');
  if (conflict.kind === 'deleted') {
    title = t('sync.deletedTitle');
    message = t('sync.deletedMessage', { name });
    mineLabel = t('sync.restore');
    theirsLabel = t('sync.discard');
  } else if (conflict.kind === 'rejected') {
    title = t('sync.rejectedTitle');
    message = `${t('sync.rejectedMessage', { name })} ${getErrorMessage(conflict.error, t)}`;
    theirsLabel = t('sync.discard');
  }

  return (
    <Card style={styles.card} testID={testIDs.sync.conflict}>
      <Text variant="subtitle" tone="danger">
        {title}
      </Text>
      <Text>{message}</Text>
      {conflict.kind === 'changed' ? (
        <>
          <Version
            title={t('sync.yours')}
            lines={mine}
            changed={changed}
            fallback={t(`sync.changes.delete.${mutation.entity}`)}
          />
          <Version
            title={t('sync.theirs')}
            lines={theirs}
            changed={changed}
            fallback="—"
          />
        </>
      ) : null}
      {conflict.kind !== 'rejected' ? (
        <Button
          title={mineLabel}
          onPress={() => resolve('mine')}
          testID={testIDs.sync.keepMineButton}
        />
      ) : null}
      <Button
        title={theirsLabel}
        variant="secondary"
        onPress={() => resolve('theirs')}
        testID={testIDs.sync.keepTheirsButton}
      />
      {waiting > 0 ? (
        <Text variant="caption" tone="muted">
          {t('sync.blocked')}
        </Text>
      ) : null}
    </Card>
  );
}

const useStyles = makeStyles(theme => ({
  card: {
    gap: theme.spacing.md,
    borderColor: theme.colors.danger,
  },
  version: {
    gap: theme.spacing.xxs,
  },
}));
