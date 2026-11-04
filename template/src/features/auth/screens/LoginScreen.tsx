import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import LogoIcon from '@/assets/icons/logo.svg';
import { Button, Screen, Text, TextField } from '@/components';
import { env } from '@/config';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, hasMinLength, isValidEmail, testIDs } from '@/utils';

import { useLoginMutation } from '../api/authApi';

const MIN_PASSWORD_LENGTH = 6;

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [login, { isLoading, error }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validate = (): FormErrors => {
    const errors: FormErrors = {};
    if (!isValidEmail(email)) {
      errors.email = t('auth.invalidEmail');
    }
    if (!hasMinLength(password, MIN_PASSWORD_LENGTH)) {
      errors.password = t('auth.passwordTooShort', {
        min: MIN_PASSWORD_LENGTH,
      });
    }
    return errors;
  };

  const handleSubmit = () => {
    const errors = validate();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    // Success is handled in authApi (tokens + signedIn); the navigator reacts to it.
    login({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        scroll
        edges={['top', 'bottom', 'left', 'right']}
        contentStyle={styles.content}
        testID={testIDs.login.screen}
      >
        <View style={styles.header}>
          <LogoIcon width={64} height={64} color={theme.colors.primary} />
          <Text variant="title" align="center">
            {t('auth.title')}
          </Text>
          <Text tone="muted" align="center">
            {t('auth.subtitle')}
          </Text>
        </View>

        <TextField
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={setEmail}
          error={formErrors.email}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          testID={testIDs.login.emailInput}
        />
        <TextField
          label={t('auth.password')}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={setPassword}
          error={formErrors.password}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          testID={testIDs.login.passwordInput}
        />

        {error ? (
          <Text
            tone="danger"
            align="center"
            testID={testIDs.login.errorMessage}
          >
            {getErrorMessage(error, t, {
              UNAUTHORIZED: t('auth.invalidCredentials'),
            })}
          </Text>
        ) : null}

        <Button
          title={t('auth.submit')}
          onPress={handleSubmit}
          loading={isLoading}
          testID={testIDs.login.submitButton}
        />

        {env.useMockApi ? (
          <Text variant="caption" tone="muted" align="center">
            {t('auth.mockHint')}
          </Text>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(theme => ({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
}));
