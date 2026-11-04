import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, FormTextField, Text, useZodForm } from '@/components';
import { env } from '@/config';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useLoginMutation } from '../api/authApi';
import { AuthLayout } from '../components/AuthLayout';
import { createLoginSchema } from '../schemas';

export function LoginScreen({
  navigation,
  route,
}: RootStackScreenProps<'Login'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const [login, { isLoading, error }] = useLoginMutation();
  const { control, handleSubmit, setFocus, setValue } = useZodForm(
    createLoginSchema,
    { defaultValues: { email: route.params?.email ?? '', password: '' } },
  );

  // Coming back from the password reset: prefill the e-mail.
  const emailParam = route.params?.email;
  useEffect(() => {
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [emailParam, setValue]);

  // Success is handled in authApi (tokens + signedIn); the navigator reacts to it.
  const onSubmit = handleSubmit(values => login(values));

  return (
    <AuthLayout
      title={t('auth.title')}
      subtitle={t('auth.subtitle')}
      showLogo
      withHeader={false}
      testID={testIDs.login.screen}
    >
      {route.params?.passwordReset ? (
        <Text tone="success" align="center" testID={testIDs.login.notice}>
          {t('auth.passwordResetDone')}
        </Text>
      ) : null}

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
        testID={testIDs.login.emailInput}
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={() => onSubmit()}
        testID={testIDs.login.passwordInput}
      />
      <Button
        title={t('auth.forgotPassword')}
        variant="ghost"
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotPassword}
        testID={testIDs.login.forgotPasswordButton}
      />

      {error ? (
        <Text tone="danger" align="center" testID={testIDs.login.errorMessage}>
          {getErrorMessage(error, t, {
            UNAUTHORIZED: t('auth.invalidCredentials'),
          })}
        </Text>
      ) : null}

      <Button
        title={t('auth.submit')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.login.submitButton}
      />

      <View style={styles.footer}>
        <Text tone="muted">{t('auth.noAccount')}</Text>
        <Button
          title={t('auth.createAccount')}
          variant="ghost"
          onPress={() => navigation.navigate('Register')}
          testID={testIDs.login.registerButton}
        />
      </View>

      {env.useMockApi ? (
        <Text variant="caption" tone="muted" align="center">
          {t('auth.mockHint')}
        </Text>
      ) : null}
    </AuthLayout>
  );
}

const useStyles = makeStyles(theme => ({
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
}));
