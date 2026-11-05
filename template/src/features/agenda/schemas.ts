import type { TFunction } from 'i18next';
import { z } from 'zod';

import { isValidDateString } from '@/utils/dates';
import { createFieldSchemas } from '@/utils/validation';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function createEventSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  const time = z.string().trim().regex(TIME, t('agenda.invalidTime'));
  return z
    .object({
      title: fields.requiredText,
      date: z.string().refine(isValidDateString, t('agenda.invalidDate')),
      startTime: time,
      endTime: time,
      location: z.string().trim(),
      description: z.string().trim(),
    })
    .refine(values => values.endTime > values.startTime, {
      error: t('agenda.endBeforeStart'),
      path: ['endTime'],
    });
}

export type EventFormValues = z.output<ReturnType<typeof createEventSchema>>;
