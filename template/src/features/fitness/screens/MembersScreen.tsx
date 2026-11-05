import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import type { MainTabScreenProps } from '@/app/navigation/types';
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  TextField,
} from '@/components';
import { selectIsOnline } from '@/features/network/networkSlice';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { MemberCard } from '../components/MemberCard';
import { SyncBanner } from '../components/SyncBanner';
import {
  selectLastSyncedAt,
  selectMembers,
  selectSyncState,
  selectWorkoutCountByMember,
} from '../selectors';
import { syncFitness } from '../sync/syncEngine';
import type { Member } from '../types';

export function MembersScreen({ navigation }: MainTabScreenProps<'Members'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectMembers);
  const workoutCounts = useAppSelector(selectWorkoutCountByMember);
  const lastSyncedAt = useAppSelector(selectLastSyncedAt);
  const isOnline = useAppSelector(selectIsOnline);
  const { status, error } = useAppSelector(selectSyncState);
  const [search, setSearch] = useState('');

  const sync = useCallback(() => dispatch(syncFitness()), [dispatch]);
  const { isRefreshing, refresh } = useRefreshByUser(sync);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? members.filter(
          member =>
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query),
        )
      : members;
  }, [members, search]);

  const openMember = useCallback(
    (member: Member) =>
      navigation.navigate('MemberDetails', { memberId: member.id }),
    [navigation],
  );

  // Data is read from the offline store; before the first download, show
  // the state of that download instead of an empty list.
  let emptyComponent = (
    <View testID={testIDs.members.empty}>
      <EmptyState
        message={search ? t('members.noResults') : t('members.empty')}
      />
    </View>
  );
  if (lastSyncedAt === null && members.length === 0) {
    if (!isOnline) {
      emptyComponent = <EmptyState message={t('members.offlineNoData')} />;
    } else if (status === 'failed') {
      emptyComponent = (
        <ErrorState message={getErrorMessage(error, t)} onRetry={sync} />
      );
    } else {
      emptyComponent = <LoadingState />;
    }
  }

  return (
    <FlatList
      testID={testIDs.members.screen}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={visible}
      keyExtractor={member => member.id}
      renderItem={({ item }) => (
        <MemberCard
          member={item}
          workoutCount={workoutCounts[item.id] ?? 0}
          onPress={openMember}
        />
      )}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <SyncBanner />
          <TextField
            label={t('members.search')}
            placeholder={t('members.searchPlaceholder')}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            testID={testIDs.members.searchInput}
          />
          <Button
            title={t('members.newMember')}
            variant="secondary"
            onPress={() => navigation.navigate('MemberForm')}
            testID={testIDs.members.newButton}
          />
        </View>
      }
      ListEmptyComponent={emptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    />
  );
}

const useStyles = makeStyles(theme => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.md,
  },
}));
