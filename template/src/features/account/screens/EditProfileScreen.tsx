import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { Button, FormTextField, Screen, Text, useZodForm } from '@/components';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { getErrorMessage, testIDs } from '@/utils';

import { useUpdateProfileMutation } from '../api/accountApi';
import { createProfileSchema } from '../schemas';

export function EditProfileScreen({
  navigation,
}: RootStackScreenProps<'EditProfile'>) {
  const { t } = useTranslation();
  const user = useAppSelector(selectCurrentUser);
  const [updateProfile, { isLoading, error }] = useUpdateProfileMutation();
  const { control, handleSubmit, setFocus } = useZodForm(createProfileSchema, {
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '' },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      await updateProfile(values).unwrap();
      navigation.goBack();
    } catch {
      // Shown below through the mutation error.
    }
  });

  return (
    <Screen scroll testID={testIDs.account.profileScreen}>
      <FormTextField
        control={control}
        name="name"
        label={t('register.name')}
        placeholder={t('register.namePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => setFocus('email')}
        testID={testIDs.account.nameInput}
      />
      <FormTextField
        control={control}
        name="email"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        returnKeyType="done"
        onSubmitEditing={() => onSubmit()}
        testID={testIDs.account.emailInput}
      />
      {error ? (
        <Text
          tone="danger"
          align="center"
          testID={testIDs.account.errorMessage}
        >
          {getErrorMessage(error, t, { CONFLICT: t('register.emailTaken') })}
        </Text>
      ) : null}
      <Button
        title={t('actions.save')}
        onPress={onSubmit}
        loading={isLoading}
        testID={testIDs.account.saveButton}
      />
    </Screen>
  );
}
