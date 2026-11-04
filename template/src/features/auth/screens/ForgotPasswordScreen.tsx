import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, FormTextField, Text, useZodForm } from '@/components';
import { getErrorMessage, testIDs } from '@/utils';

import { useForgotPasswordMutation } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { createForgotPasswordSchema } from '../schemas';

export function ForgotPasswordScreen({
  navigation,
}: RootStackScreenProps<'ForgotPassword'>) {
  const { t } = useTranslation();
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();
  const { control, handleSubmit } = useZodForm(createForgotPasswordSchema, {
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await forgotPassword({ email }).unwrap();
      navigation.navigate('ResetPassword', { email });
    } catch {
      // Shown below through the mutation `error`.
    }
  });

  return (
    <AuthLayout
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
      testID={testIDs.forgotPassword.screen}
    >
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => onSubmit()}
        testID={testIDs.forgotPassword.emailInput}
      />

      {error ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.forgotPassword.errorMessage}
        >
          {getErrorMessage(error, t)}
        </Text>
      ) : null}

      <Button
        title={t('forgotPassword.submit')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.forgotPassword.submitButton}
      />
    </AuthLayout>
  );
}
