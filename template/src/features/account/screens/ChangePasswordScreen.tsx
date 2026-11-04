import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button, FormTextField, Screen, Text, useZodForm } from '@/components';
import { getErrorMessage, testIDs } from '@/utils';

import { useChangePasswordMutation } from '../api/accountApi';
import { createChangePasswordSchema } from '../schemas';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const [changePassword, { isLoading, isSuccess, error, reset: resetResult }] =
    useChangePasswordMutation();
  const { control, handleSubmit, reset, setFocus } = useZodForm(
    createChangePasswordSchema,
    { defaultValues: EMPTY },
  );

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    resetResult();
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      reset(EMPTY);
    } catch {
      // Shown below through the mutation error.
    }
  });

  return (
    <Screen scroll testID={testIDs.account.passwordScreen}>
      <FormTextField
        control={control}
        name="currentPassword"
        label={t('account.currentPassword')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('newPassword')}
        testID={testIDs.account.currentPasswordInput}
      />
      <FormTextField
        control={control}
        name="newPassword"
        label={t('account.newPassword')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('confirmPassword')}
        testID={testIDs.account.newPasswordInput}
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('register.confirmPassword')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={() => onSubmit()}
        testID={testIDs.account.confirmPasswordInput}
      />
      {error ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.account.passwordErrorMessage}
        >
          {getErrorMessage(error, t, {
            BAD_REQUEST: t('account.wrongCurrentPassword'),
          })}
        </Text>
      ) : null}
      {isSuccess ? (
        <Text
          tone="success"
          align="center"
          testID={testIDs.account.passwordChangedMessage}
        >
          {t('account.passwordChanged')}
        </Text>
      ) : null}
      <Button
        title={t('account.changePassword')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.account.changePasswordSubmit}
      />
    </Screen>
  );
}
