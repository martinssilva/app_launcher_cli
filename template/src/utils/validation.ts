import type { TFunction } from 'i18next';
import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 6;

/**
 * Field schemas shared by every form. Messages are translated when the schema
 * is created, so build schemas through `useZodForm` (it recreates them when
 * the language changes).
 */
export function createFieldSchemas(t: TFunction) {
  const requiredText = z.string().trim().min(1, t('validation.required'));
  return {
    requiredText,
    email: requiredText.pipe(z.email(t('validation.email'))),
    /** Password with the app's strength rules (sign-up, reset, change). */
    newPassword: z
      .string()
      .min(
        PASSWORD_MIN_LENGTH,
        t('validation.passwordTooShort', { min: PASSWORD_MIN_LENGTH }),
      ),
    /** Existing password: only required (rules may have changed since). */
    currentPassword: z.string().min(1, t('validation.required')),
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, t('validation.code')),
  };
}
