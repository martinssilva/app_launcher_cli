import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, Text } from '@/components';
import { testIDs } from '@/utils/testIDs';

import type { Workout } from '../types';
import { PendingBadge } from './PendingBadge';

interface WorkoutCardProps {
  workout: Workout;
  onPress: (workout: Workout) => void;
}

function WorkoutCardComponent({ workout, onPress }: WorkoutCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      onPress={() => onPress(workout)}
      accessibilityLabel={workout.name}
      testID={testIDs.memberDetails.workout(workout.id)}
    >
      <Text variant="subtitle">{workout.name}</Text>
      <Text tone="muted" numberOfLines={2}>
        {workout.exercises.map(exercise => exercise.name).join(' · ')}
      </Text>
      <Text variant="caption" tone="muted">
        {t('workouts.exerciseCount', { count: workout.exercises.length })}
      </Text>
      <PendingBadge entity="workouts" id={workout.id} />
    </Card>
  );
}

export const WorkoutCard = memo(WorkoutCardComponent);
