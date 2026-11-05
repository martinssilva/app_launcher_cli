import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidDateString } from '@/utils/dates';
import { createFieldSchemas } from '@/utils/validation';

import { parseDecimal } from './format';
import { type Exercise, MEMBER_GOALS } from './types';

const PHONE = /^\+?[\d\s().-]{8,20}$/;

/**
 * Numbers are typed as text and stay strings in the form values (inputs and
 * output share one type, as `FormTextField` expects); screens convert them
 * with `toExercise` when saving.
 */
function wholeNumber(t: TFunction, min: number, max: number) {
  return z
    .string()
    .trim()
    .refine(
      value =>
        /^\d+$/.test(value) && Number(value) >= min && Number(value) <= max,
      t('workouts.invalidNumber', { min, max }),
    );
}

function decimal(t: TFunction, min: number, max: number) {
  return z
    .string()
    .trim()
    .refine(
      value =>
        /^\d+([.,]\d+)?$/.test(value) &&
        parseDecimal(value) >= min &&
        parseDecimal(value) <= max,
      t('workouts.invalidNumber', { min, max }),
    );
}

export function createMemberSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z.object({
    name: fields.requiredText,
    email: fields.email,
    phone: z
      .string()
      .trim()
      .refine(
        value => value === '' || PHONE.test(value),
        t('memberForm.invalidPhone'),
      ),
    goal: z.enum(MEMBER_GOALS),
    notes: z.string().trim(),
  });
}

function createExercisesSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z
    .array(
      z.object({
        name: fields.requiredText,
        sets: wholeNumber(t, 1, 20),
        reps: wholeNumber(t, 1, 100),
        weightKg: decimal(t, 0, 500),
      }),
    )
    .min(1, t('workouts.noExercises'));
}

export function createWorkoutSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z.object({
    name: fields.requiredText,
    notes: z.string().trim(),
    exercises: createExercisesSchema(t),
  });
}

export function createSessionSchema(t: TFunction) {
  return z.object({
    workoutId: z.string().min(1, t('sessions.chooseWorkout')),
    date: z.string().refine(isValidDateString, t('validation.required')),
    durationMinutes: wholeNumber(t, 1, 300),
    exercises: createExercisesSchema(t),
  });
}

export type MemberFormValues = z.output<ReturnType<typeof createMemberSchema>>;
export type WorkoutFormValues = z.output<
  ReturnType<typeof createWorkoutSchema>
>;
export type SessionFormValues = z.output<
  ReturnType<typeof createSessionSchema>
>;
export type ExerciseFormValues = WorkoutFormValues['exercises'][number];

export const toExercise = (values: ExerciseFormValues): Exercise => ({
  name: values.name,
  sets: Number(values.sets),
  reps: Number(values.reps),
  weightKg: parseDecimal(values.weightKg),
});

export const toExerciseValues = (exercise: Exercise): ExerciseFormValues => ({
  name: exercise.name,
  sets: String(exercise.sets),
  reps: String(exercise.reps),
  weightKg: String(exercise.weightKg),
});

export const emptyExercise: ExerciseFormValues = {
  name: '',
  sets: '3',
  reps: '10',
  weightKg: '0',
};
