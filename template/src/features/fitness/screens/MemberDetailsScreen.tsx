import React, { useLayoutEffect } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, Card, EmptyState, Screen, Text } from '@/components';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { deleteMember } from '../actions';
import { PendingBadge } from '../components/PendingBadge';
import { SyncBanner } from '../components/SyncBanner';
import { WorkoutCard } from '../components/WorkoutCard';
import { selectMember, selectWorkoutsByMember } from '../selectors';

export function MemberDetailsScreen({
  navigation,
  route,
}: RootStackScreenProps<'MemberDetails'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { memberId } = route.params;
  const member = useAppSelector(state => selectMember(state, memberId));
  const workouts = useAppSelector(state =>
    selectWorkoutsByMember(state, memberId),
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: member?.name ?? t('members.details') });
  }, [member?.name, navigation, t]);

  if (!member) {
    // Deleted here or (after a sync) on another device.
    return (
      <Screen testID={testIDs.memberDetails.notFound}>
        <EmptyState message={t('members.notFound')} />
      </Screen>
    );
  }

  const confirmDelete = () => {
    Alert.alert(
      t('members.deleteConfirmTitle', { name: member.name }),
      t('members.deleteConfirmMessage'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        {
          text: t('actions.delete'),
          style: 'destructive',
          onPress: () => {
            dispatch(deleteMember(member.id));
            navigation.goBack();
          },
        },
      ],
    );
  };

  const details = [
    { label: t('members.email'), value: member.email },
    { label: t('members.phone'), value: member.phone },
    { label: t('members.goal'), value: t(`goals.${member.goal}`) },
    { label: t('members.notes'), value: member.notes },
  ].filter(item => item.value);

  return (
    <Screen scroll testID={testIDs.memberDetails.screen}>
      <SyncBanner />
      <Card>
        <Text variant="title" testID={testIDs.memberDetails.name}>
          {member.name}
        </Text>
        {details.map(item => (
          <View key={item.label} style={styles.detail}>
            <Text variant="caption" tone="muted">
              {item.label}
            </Text>
            <Text>{item.value}</Text>
          </View>
        ))}
        <PendingBadge entity="members" id={member.id} />
      </Card>
      <View style={styles.row}>
        <Button
          title={t('actions.edit')}
          variant="secondary"
          style={styles.flex}
          onPress={() => navigation.navigate('MemberForm', { memberId })}
          testID={testIDs.memberDetails.editButton}
        />
        <Button
          title={t('members.progress')}
          variant="secondary"
          style={styles.flex}
          onPress={() => navigation.navigate('MemberProgress', { memberId })}
          testID={testIDs.memberDetails.progressButton}
        />
      </View>
      <Button
        title={t('members.logSession')}
        onPress={() => navigation.navigate('SessionForm', { memberId })}
        testID={testIDs.memberDetails.logSessionButton}
      />

      <Text variant="subtitle">{t('members.workouts')}</Text>
      {workouts.length === 0 ? (
        <Text tone="muted">{t('members.noWorkouts')}</Text>
      ) : (
        workouts.map(workout => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onPress={item =>
              navigation.navigate('WorkoutForm', {
                memberId,
                workoutId: item.id,
              })
            }
          />
        ))
      )}
      <Button
        title={t('members.newWorkout')}
        variant="secondary"
        onPress={() => navigation.navigate('WorkoutForm', { memberId })}
        testID={testIDs.memberDetails.newWorkoutButton}
      />
      <Button
        title={t('members.deleteMember')}
        variant="ghost"
        onPress={confirmDelete}
        testID={testIDs.memberDetails.deleteButton}
      />
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  detail: {
    marginTop: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
}));
