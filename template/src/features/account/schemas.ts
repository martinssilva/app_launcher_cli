import type { TFunction } from 'i18next';
import { z } from 'zod';

import { createFieldSchemas } from '@/utils/validation';

export function createProfileSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z.object({
    name: fields.requiredText,
    email: fields.email,
  });
}

export function createChangePasswordSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z
    .object({
      currentPassword: fields.currentPassword,
      newPassword: fields.newPassword,
      confirmPassword: z.string(),
    })
    .refine(values => values.newPassword === values.confirmPassword, {
      error: t('validation.passwordsDontMatch'),
      path: ['confirmPassword'],
    })
    .refine(values => values.newPassword !== values.currentPassword, {
      error: t('account.samePassword'),
      path: ['newPassword'],
    });
}
