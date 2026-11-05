import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  Button,
  EmptyState,
  FormTextField,
  Screen,
  useZodForm,
} from '@/components';
import { testIDs } from '@/utils/testIDs';
import { todayString } from '@/utils/dates';

import { logSession } from '../actions';
import { ChoiceField } from '../components/ChoiceField';
import { DatePickerField } from '../components/DatePickerField';
import { ExerciseFields } from '../components/ExerciseFields';
import { createSessionSchema, toExercise, toExerciseValues } from '../schemas';
import { selectWorkoutsByMember } from '../selectors';

/** Logs a session (check-in + loads used) for a member. Works offline. */
export function SessionFormScreen({
  navigation,
  route,
}: RootStackScreenProps<'SessionForm'>) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { memberId } = route.params;
  const workouts = useAppSelector(state =>
    selectWorkoutsByMember(state, memberId),
  );
  const first = workouts[0];
  const { control, handleSubmit, setValue } = useZodForm(createSessionSchema, {
    defaultValues: {
      workoutId: first?.id ?? '',
      date: todayString(),
      durationMinutes: '60',
      exercises: first?.exercises.map(toExerciseValues) ?? [],
    },
  });

  if (!first) {
    return (
      <Screen testID={testIDs.sessionForm.needsWorkout}>
        <EmptyState message={t('sessions.needsWorkout')} />
        <Button
          title={t('members.newWorkout')}
          onPress={() => navigation.replace('WorkoutForm', { memberId })}
        />
      </Screen>
    );
  }

  // Picking a workout fills the exercises with its plan.
  const selectWorkout = (workoutId: string) => {
    const workout = workouts.find(item => item.id === workoutId);
    if (workout) {
      setValue('exercises', workout.exercises.map(toExerciseValues));
    }
  };

  const onSubmit = handleSubmit(values => {
    const workout = workouts.find(item => item.id === values.workoutId);
    dispatch(
      logSession({
        memberId,
        workoutId: values.workoutId,
        workoutName: workout?.name ?? '',
        date: values.date,
        durationMinutes: Number(values.durationMinutes),
        exercises: values.exercises.map(toExercise),
      }),
    );
    navigation.goBack();
  });

  return (
    <Screen scroll testID={testIDs.sessionForm.screen}>
      <ChoiceField
        control={control}
        name="workoutId"
        label={t('sessions.workout')}
        options={workouts.map(workout => ({
          value: workout.id,
          label: workout.name,
          testID: testIDs.sessionForm.workoutOption(workout.id),
        }))}
        onSelect={selectWorkout}
      />
      <DatePickerField
        control={control}
        name="date"
        label={t('sessions.date')}
        testID={testIDs.sessionForm.dateField}
      />
      <FormTextField
        control={control}
        name="durationMinutes"
        label={t('sessions.duration')}
        keyboardType="number-pad"
        maxLength={3}
        testID={testIDs.sessionForm.durationInput}
      />
      <ExerciseFields control={control} hint={t('sessions.exercisesHint')} />
      <Button
        title={t('actions.save')}
        onPress={onSubmit}
        testID={testIDs.sessionForm.saveButton}
      />
    </Screen>
  );
}
