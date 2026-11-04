import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, FormTextField, Text, useZodForm } from '@/components';
import { env } from '@/config';
import { getErrorMessage, testIDs } from '@/utils';

import { useResetPasswordMutation } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { createResetPasswordSchema } from '../schemas';

export function ResetPasswordScreen({
  navigation,
  route,
}: RootStackScreenProps<'ResetPassword'>) {
  const { t } = useTranslation();
  const { email } = route.params;
  const [resetPassword, { isLoading, error }] = useResetPasswordMutation();
  const { control, handleSubmit, setFocus } = useZodForm(
    createResetPasswordSchema,
    { defaultValues: { code: '', password: '', confirmPassword: '' } },
  );

  const onSubmit = handleSubmit(async ({ code, password }) => {
    try {
      await resetPassword({ email, code, password }).unwrap();
      navigation.popTo('Login', { email, passwordReset: true });
    } catch {
      // Shown below through the mutation `error`.
    }
  });

  return (
    <AuthLayout
      title={t('resetPassword.title')}
      subtitle={t('resetPassword.subtitle', { email })}
      testID={testIDs.resetPassword.screen}
    >
      <FormTextField
        control={control}
        name="code"
        label={t('resetPassword.code')}
        placeholder={t('resetPassword.codePlaceholder')}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
        testID={testIDs.resetPassword.codeInput}
      />
      <FormTextField
        control={control}
        name="password"
        label={t('resetPassword.newPassword')}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('confirmPassword')}
        testID={testIDs.resetPassword.passwordInput}
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('register.confirmPassword')}
        placeholder={t('register.confirmPasswordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => onSubmit()}
        testID={testIDs.resetPassword.confirmPasswordInput}
      />

      {error ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.resetPassword.errorMessage}
        >
          {getErrorMessage(error, t, {
            BAD_REQUEST: t('resetPassword.invalidCode'),
          })}
        </Text>
      ) : null}

      <Button
        title={t('resetPassword.submit')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.resetPassword.submitButton}
      />

      {env.useMockApi ? (
        <Text variant="caption" tone="muted" align="center">
          {t('resetPassword.mockHint')}
        </Text>
      ) : null}
    </AuthLayout>
  );
}
