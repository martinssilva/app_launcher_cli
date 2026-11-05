import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MainTabScreenProps } from '@/app/navigation/types';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SegmentedControl,
  type SegmentedOption,
} from '@/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetAssetsQuery } from '../api/marketsApi';
import { AssetRow } from '../components/AssetRow';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { QuotesError } from '../components/QuotesError';
import { useLiveQuotes } from '../hooks/useLiveQuotes';
import type { Asset, AssetType } from '../types';

type TypeFilter = AssetType | 'all';

export function MarketsScreen({ navigation }: MainTabScreenProps<'Markets'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { currentData, error, isFetching, refetch } = useGetAssetsQuery({
    search: debouncedSearch,
    type,
  });
  const assets = useMemo(() => currentData ?? [], [currentData]);
  const {
    data: quotes,
    error: quotesError,
    refetch: refetchQuotes,
  } = useLiveQuotes(assets.map(asset => asset.symbol));
  const refetchAll = useCallback(
    () => Promise.all([refetch(), quotes ? refetchQuotes() : undefined]),
    [quotes, refetch, refetchQuotes],
  );
  const { isRefreshing, refresh } = useRefreshByUser(refetchAll);

  const openAsset = useCallback(
    ({ symbol }: Pick<Asset, 'symbol'>) =>
      navigation.navigate('AssetDetails', { symbol }),
    [navigation],
  );

  const typeOptions: SegmentedOption<TypeFilter>[] = [
    {
      value: 'all',
      label: t('markets.typeAll'),
      testID: testIDs.markets.typeFilter('all'),
    },
    {
      value: 'stock',
      label: t('markets.typeStock'),
      testID: testIDs.markets.typeFilter('stock'),
    },
    {
      value: 'crypto',
      label: t('markets.typeCrypto'),
      testID: testIDs.markets.typeFilter('crypto'),
    },
  ];

  let emptyComponent = (
    <View testID={testIDs.markets.empty}>
      <EmptyState message={t('markets.empty')} />
    </View>
  );
  if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <View style={styles.root} testID={testIDs.markets.screen}>
      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('markets.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t('markets.searchPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.search}
          testID={testIDs.markets.searchInput}
        />
        <SegmentedControl
          accessibilityLabel={t('markets.typeFilter')}
          options={typeOptions}
          value={type}
          onChange={setType}
        />
        <ConnectionBadge />
        {quotesError ? (
          <QuotesError error={quotesError} onRetry={refetchQuotes} />
        ) : null}
      </View>

      {!currentData && isFetching ? (
        <LoadingState />
      ) : (
        <FlatList
          testID={testIDs.markets.list}
          style={styles.list}
          contentContainerStyle={styles.content}
          data={assets}
          keyExtractor={asset => asset.symbol}
          renderItem={({ item }) => (
            <AssetRow
              asset={item}
              quote={quotes?.[item.symbol]}
              onPress={openAsset}
              ids={testIDs.markets}
            />
          )}
          ListEmptyComponent={emptyComponent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  filters: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  search: {
    ...theme.typography.body,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
  },
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
}));
