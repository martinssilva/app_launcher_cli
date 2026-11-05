import React from 'react';
import { Alert } from 'react-native';
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
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { deleteWorkout, saveWorkout } from '../actions';
import { ExerciseFields } from '../components/ExerciseFields';
import {
  createWorkoutSchema,
  emptyExercise,
  toExercise,
  toExerciseValues,
} from '../schemas';
import { selectWorkout } from '../selectors';

/** Creates a workout for a member, or edits/deletes one. Works offline. */
export function WorkoutFormScreen({
  navigation,
  route,
}: RootStackScreenProps<'WorkoutForm'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { memberId, workoutId } = route.params;
  const workout = useAppSelector(state =>
    workoutId ? selectWorkout(state, workoutId) : undefined,
  );
  const { control, handleSubmit } = useZodForm(createWorkoutSchema, {
    defaultValues: {
      name: workout?.name ?? '',
      notes: workout?.notes ?? '',
      exercises: workout?.exercises.map(toExerciseValues) ?? [emptyExercise],
    },
  });

  if (workoutId && !workout) {
    return (
      <Screen>
        <EmptyState message={t('errors.notFound')} />
      </Screen>
    );
  }

  const onSubmit = handleSubmit(values => {
    dispatch(
      saveWorkout(
        {
          memberId,
          name: values.name,
          notes: values.notes,
          exercises: values.exercises.map(toExercise),
        },
        workoutId,
      ),
    );
    navigation.goBack();
  });

  const confirmDelete = () => {
    if (!workoutId) {
      return;
    }
    Alert.alert(
      t('workouts.deleteConfirmTitle'),
      t('workouts.deleteConfirmMessage'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.delete'),
          style: 'destructive',
          onPress: () => {
            dispatch(deleteWorkout(workoutId));
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <Screen scroll testID={testIDs.workoutForm.screen}>
      <FormTextField
        control={control}
        name="name"
        label={t('workouts.name')}
        placeholder={t('workouts.namePlaceholder')}
        testID={testIDs.workoutForm.nameInput}
      />
      <FormTextField
        control={control}
        name="notes"
        label={t('workouts.notes')}
        placeholder={t('workouts.notesPlaceholder')}
        multiline
        style={styles.multiline}
        testID={testIDs.workoutForm.notesInput}
      />
      <ExerciseFields control={control} />
      <Button
        title={t('actions.save')}
        onPress={onSubmit}
        testID={testIDs.workoutForm.saveButton}
      />
      {workoutId ? (
        <Button
          title={t('workouts.deleteWorkout')}
          variant="ghost"
          onPress={confirmDelete}
          testID={testIDs.workoutForm.deleteButton}
        />
      ) : null}
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  multiline: {
    minHeight: 72,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
}));
