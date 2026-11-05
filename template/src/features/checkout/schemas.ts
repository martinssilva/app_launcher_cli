import type { TFunction } from 'i18next';
import { z } from 'zod';

import { createFieldSchemas } from '@/utils/validation';

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** Luhn checksum used by every card network. */
export function isValidCardNumber(value: string): boolean {
  const digits = digitsOnly(value);
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/** `MM/YY` → `'invalid' | 'expired' | 'valid'` (valid through the end of that month). */
export function checkExpiry(
  value: string,
  now: Date = new Date(),
): 'invalid' | 'expired' | 'valid' {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  const month = Number(match?.[1]);
  if (!match || month < 1 || month > 12) {
    return 'invalid';
  }
  const year = 2000 + Number(match[2]);
  const current = now.getFullYear() * 12 + now.getMonth();
  return year * 12 + (month - 1) < current ? 'expired' : 'valid';
}

export function createCheckoutSchema(t: TFunction) {
  const { requiredText } = createFieldSchemas(t);
  return z
    .object({
      fullName: requiredText,
      street: requiredText,
      complement: z.string().trim(),
      city: requiredText,
      state: requiredText,
      postalCode: requiredText,
      shippingMethod: z.enum(['standard', 'express']),
      paymentMethod: z.enum(['card', 'cash']),
      cardNumber: z.string(),
      cardExpiry: z.string(),
      cardCvc: z.string(),
    })
    .superRefine((values, ctx) => {
      if (values.paymentMethod !== 'card') {
        return;
      }
      if (!isValidCardNumber(values.cardNumber)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardNumber'],
          message: t('checkout.invalidCardNumber'),
        });
      }
      const expiry = checkExpiry(values.cardExpiry);
      if (expiry !== 'valid') {
        ctx.addIssue({
          code: 'custom',
          path: ['cardExpiry'],
          message:
            expiry === 'expired'
              ? t('checkout.expiredCard')
              : t('checkout.invalidExpiry'),
        });
      }
      if (!/^\d{3,4}$/.test(values.cardCvc.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardCvc'],
          message: t('checkout.invalidCvc'),
        });
      }
    });
}

export type CheckoutFormInput = z.input<
  ReturnType<typeof createCheckoutSchema>
>;
export type CheckoutFormValues = z.output<
  ReturnType<typeof createCheckoutSchema>
>;
