import type { TFunction } from 'i18next';
import { z } from 'zod';

import { createFieldSchemas } from '@/utils/validation';

const PASSWORDS_MATCH = (values: {
  password: string;
  confirmPassword: string;
}) => values.password === values.confirmPassword;

export function createLoginSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z.object({
    email: fields.email,
    password: fields.currentPassword,
  });
}

export function createRegisterSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z
    .object({
      name: fields.requiredText,
      email: fields.email,
      password: fields.newPassword,
      confirmPassword: z.string(),
    })
    .refine(PASSWORDS_MATCH, {
      error: t('validation.passwordsDontMatch'),
      path: ['confirmPassword'],
    });
}

export function createForgotPasswordSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z.object({ email: fields.email });
}

export function createResetPasswordSchema(t: TFunction) {
  const fields = createFieldSchemas(t);
  return z
    .object({
      code: fields.code,
      password: fields.newPassword,
      confirmPassword: z.string(),
    })
    .refine(PASSWORDS_MATCH, {
      error: t('validation.passwordsDontMatch'),
      path: ['confirmPassword'],
    });
}

export type LoginFormValues = z.output<ReturnType<typeof createLoginSchema>>;
export type RegisterFormValues = z.output<
  ReturnType<typeof createRegisterSchema>
>;
export type ForgotPasswordFormValues = z.output<
  ReturnType<typeof createForgotPasswordSchema>
>;
export type ResetPasswordFormValues = z.output<
  ReturnType<typeof createResetPasswordSchema>
>;
