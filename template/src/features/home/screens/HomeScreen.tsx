import React, { useCallback } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import type { MainTabScreenProps } from '@/app/navigation/types';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components';
import { selectCurrentUser } from '@/features/auth/authSlice';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetItemsQuery } from '../api/itemsApi';
import { ItemCard } from '../components/ItemCard';
import type { Item } from '../types';

export function HomeScreen({ navigation }: MainTabScreenProps<'Home'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const user = useAppSelector(selectCurrentUser);
  const { data, error, isLoading, refetch } = useGetItemsQuery();
  const { isRefreshing, refresh } = useRefreshByUser(refetch);

  const openItem = useCallback(
    (item: Item) =>
      navigation.navigate('ItemDetails', { id: item.id, title: item.title }),
    [navigation],
  );

  const header = (
    <View style={styles.header}>
      <Text variant="title" testID={testIDs.home.greeting}>
        {t('home.greeting', { name: user?.name ?? '' })}
      </Text>
      <Text tone="muted">{t('home.subtitle')}</Text>
    </View>
  );

  let emptyComponent = <EmptyState message={t('home.empty')} />;
  if (isLoading) {
    emptyComponent = <LoadingState />;
  } else if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <FlatList
      testID={testIDs.home.list}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data?.data ?? []}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <ItemCard item={item} onPress={openItem} />}
      ListHeaderComponent={header}
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
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
}));
