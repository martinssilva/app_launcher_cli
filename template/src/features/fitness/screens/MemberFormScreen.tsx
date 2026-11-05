import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  Button,
  EmptyState,
  FormTextField,
  Screen,
  useZodForm,
} from '@/components';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { saveMember } from '../actions';
import { ChoiceField } from '../components/ChoiceField';
import { createMemberSchema } from '../schemas';
import { selectMember } from '../selectors';
import { MEMBER_GOALS } from '../types';

/** Creates a member, or edits one when `memberId` is given. Works offline. */
export function MemberFormScreen({
  navigation,
  route,
}: RootStackScreenProps<'MemberForm'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const memberId = route.params?.memberId;
  const member = useAppSelector(state =>
    memberId ? selectMember(state, memberId) : undefined,
  );
  const { control, handleSubmit } = useZodForm(createMemberSchema, {
    defaultValues: {
      name: member?.name ?? '',
      email: member?.email ?? '',
      phone: member?.phone ?? '',
      goal: member?.goal ?? 'hypertrophy',
      notes: member?.notes ?? '',
    },
  });

  if (memberId && !member) {
    return (
      <Screen>
        <EmptyState message={t('members.notFound')} />
      </Screen>
    );
  }

  // Saved locally right away (optimistic); the sync engine sends it.
  const onSubmit = handleSubmit(values => {
    dispatch(saveMember(values, memberId));
    navigation.goBack();
  });

  return (
    <Screen scroll testID={testIDs.memberForm.screen}>
      <FormTextField
        control={control}
        name="name"
        label={t('memberForm.name')}
        placeholder={t('memberForm.namePlaceholder')}
        autoCapitalize="words"
        testID={testIDs.memberForm.nameInput}
      />
      <FormTextField
        control={control}
        name="email"
        label={t('members.email')}
        placeholder={t('memberForm.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        testID={testIDs.memberForm.emailInput}
      />
      <FormTextField
        control={control}
        name="phone"
        label={t('members.phone')}
        placeholder={t('memberForm.phonePlaceholder')}
        keyboardType="phone-pad"
        testID={testIDs.memberForm.phoneInput}
      />
      <ChoiceField
        control={control}
        name="goal"
        label={t('members.goal')}
        options={MEMBER_GOALS.map(goal => ({
          value: goal,
          label: t(`goals.${goal}`),
          testID: testIDs.memberForm.goalOption(goal),
        }))}
      />
      <FormTextField
        control={control}
        name="notes"
        label={t('members.notes')}
        placeholder={t('memberForm.notesPlaceholder')}
        multiline
        style={styles.multiline}
        testID={testIDs.memberForm.notesInput}
      />
      <Button
        title={t('actions.save')}
        onPress={onSubmit}
        testID={testIDs.memberForm.saveButton}
      />
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  multiline: {
    minHeight: 96,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
}));
