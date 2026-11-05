import React from 'react';
import { Pressable, View } from 'react-native';
import {
  type ArrayPath,
  type Control,
  type FieldArray,
  type FieldValues,
  type Path,
  useFieldArray,
  useFormState,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, FormTextField, Text } from '@/components';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { emptyExercise, type ExerciseFormValues } from '../schemas';

type WithExercises = FieldValues & { exercises: ExerciseFormValues[] };

interface ExerciseFieldsProps<T extends WithExercises> {
  control: Control<T>;
  /** Shown under the title (e.g. what the values mean in this form). */
  hint?: string;
}

/** Editable list of exercises (react-hook-form `useFieldArray`). */
export function ExerciseFields<T extends WithExercises>({
  control,
  hint,
}: ExerciseFieldsProps<T>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const name = 'exercises' as ArrayPath<T>;
  const { fields, append, remove } = useFieldArray({ control, name });
  const { errors } = useFormState({ control, name: name as Path<T> });
  const listError = errors.exercises as
    { message?: string; root?: { message?: string } } | undefined;
  const fieldName = (index: number, key: keyof ExerciseFormValues) =>
    `exercises.${index}.${key}` as Path<T>;

  return (
    <View style={styles.container}>
      <Text variant="subtitle">{t('workouts.exercises')}</Text>
      {hint ? <Text tone="muted">{hint}</Text> : null}
      {fields.map((item, index) => (
        <View key={item.id} style={styles.exercise}>
          <View style={styles.header}>
            <Text variant="label" style={styles.flex}>
              {t('workouts.exercise', { number: index + 1 })}
            </Text>
            {fields.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('workouts.removeExercise', {
                  number: index + 1,
                })}
                hitSlop={8}
                onPress={() => remove(index)}
                testID={testIDs.exerciseFields.remove(index)}
              >
                <Text variant="label" tone="danger">
                  {t('actions.delete')}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <FormTextField
            control={control}
            name={fieldName(index, 'name')}
            label={t('workouts.exerciseName')}
            placeholder={t('workouts.exerciseNamePlaceholder')}
            testID={testIDs.exerciseFields.name(index)}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <FormTextField
                control={control}
                name={fieldName(index, 'sets')}
                label={t('workouts.sets')}
                keyboardType="number-pad"
                maxLength={2}
                testID={testIDs.exerciseFields.sets(index)}
              />
            </View>
            <View style={styles.flex}>
              <FormTextField
                control={control}
                name={fieldName(index, 'reps')}
                label={t('workouts.reps')}
                keyboardType="number-pad"
                maxLength={3}
                testID={testIDs.exerciseFields.reps(index)}
              />
            </View>
            <View style={styles.flex}>
              <FormTextField
                control={control}
                name={fieldName(index, 'weightKg')}
                label={t('workouts.weight')}
                keyboardType="decimal-pad"
                maxLength={6}
                testID={testIDs.exerciseFields.weight(index)}
              />
            </View>
          </View>
        </View>
      ))}
      {listError?.message || listError?.root?.message ? (
        <Text variant="caption" tone="danger">
          {listError.message ?? listError.root?.message}
        </Text>
      ) : null}
      <Button
        title={t('workouts.addExercise')}
        variant="ghost"
        onPress={() => append(emptyExercise as FieldArray<T, ArrayPath<T>>)}
        testID={testIDs.exerciseFields.addButton}
      />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing.md,
  },
  exercise: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  flex: {
    flex: 1,
  },
}));
