import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button, FormTextField, Text, useZodForm } from '@/components';
import { getErrorMessage, testIDs } from '@/utils';

import { useRegisterMutation } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { createRegisterSchema } from '../schemas';

export function RegisterScreen() {
  const { t } = useTranslation();
  const [register, { isLoading, error }] = useRegisterMutation();
  const { control, handleSubmit, setFocus } = useZodForm(createRegisterSchema, {
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  // On success authApi signs the user in and the navigator shows the app.
  const onSubmit = handleSubmit(({ name, email, password }) =>
    register({ name, email, password }),
  );

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      testID={testIDs.register.screen}
    >
      <FormTextField
        control={control}
        name="name"
        label={t('register.name')}
        placeholder={t('register.namePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        testID={testIDs.register.nameInput}
      />
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('password')}
        testID={testIDs.register.emailInput}
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('confirmPassword')}
        testID={testIDs.register.passwordInput}
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
        testID={testIDs.register.confirmPasswordInput}
      />

      {error ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.register.errorMessage}
        >
          {getErrorMessage(error, t, { CONFLICT: t('register.emailTaken') })}
        </Text>
      ) : null}

      <Button
        title={t('register.submit')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.register.submitButton}
      />
    </AuthLayout>
  );
}
