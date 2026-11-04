import { zodResolver } from '@hookform/resolvers/zod';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { type FieldValues, useForm, type UseFormProps } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

/**
 * `useForm` + Zod with translated messages.
 *
 *   const form = useZodForm(createLoginSchema, { defaultValues: { email: '', password: '' } });
 *
 * `createSchema` receives `t`, so validation messages follow the app language.
 * Keep it a module-level function (a new function on every render recreates the schema).
 */
export function useZodForm<
  TInput extends FieldValues,
  TOutput extends FieldValues,
>(
  createSchema: (t: TFunction) => z.ZodType<TOutput, TInput>,
  options?: Omit<UseFormProps<TInput, unknown, TOutput>, 'resolver'>,
) {
  const { t } = useTranslation();
  const schema = useMemo(() => createSchema(t), [createSchema, t]);
  return useForm<TInput, unknown, TOutput>({
    mode: 'onTouched',
    ...options,
    resolver: zodResolver(schema),
  });
}
