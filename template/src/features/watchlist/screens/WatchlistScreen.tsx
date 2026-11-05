import { skipToken } from '@reduxjs/toolkit/query';
import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import type { MainTabScreenProps } from '@/app/navigation/types';
import { Button, EmptyState, ErrorState, LoadingState } from '@/components';
import { useGetAssetsQuery } from '@/features/markets/api/marketsApi';
import { AssetRow } from '@/features/markets/components/AssetRow';
import { ConnectionBadge } from '@/features/markets/components/ConnectionBadge';
import { QuotesError } from '@/features/markets/components/QuotesError';
import { useLiveQuotes } from '@/features/markets/hooks/useLiveQuotes';
import type { Asset } from '@/features/markets/types';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { selectWatchlistSymbols } from '../watchlistSlice';

type Row = Pick<Asset, 'symbol' | 'name' | 'currency'>;

export function WatchlistScreen({
  navigation,
}: MainTabScreenProps<'Watchlist'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const symbols = useAppSelector(selectWatchlistSymbols);
  const isEmpty = symbols.length === 0;

  const assetsQuery = useGetAssetsQuery(isEmpty ? skipToken : { symbols });
  const quotesQuery = useLiveQuotes(symbols);
  const { data: assets, error, isLoading } = assetsQuery;
  const quotes = quotesQuery.data;

  // Rows follow the watchlist order. A symbol that was just added shows up
  // right away; its name arrives with the next assets response.
  const rows = useMemo<Row[]>(
    () =>
      symbols.map(
        symbol =>
          assets?.find(asset => asset.symbol === symbol) ?? {
            symbol,
            name: '',
            currency: 'USD',
          },
      ),
    [assets, symbols],
  );

  const { refetch: refetchAssets } = assetsQuery;
  const { refetch: refetchQuotes } = quotesQuery;
  const refetchAll = useCallback(
    () =>
      isEmpty ? undefined : Promise.all([refetchAssets(), refetchQuotes()]),
    [isEmpty, refetchAssets, refetchQuotes],
  );
  const { isRefreshing, refresh } = useRefreshByUser(refetchAll);

  const openAsset = useCallback(
    ({ symbol }: Pick<Asset, 'symbol'>) =>
      navigation.navigate('AssetDetails', { symbol }),
    [navigation],
  );

  if (isEmpty) {
    return (
      <View style={styles.root} testID={testIDs.watchlist.screen}>
        <View style={styles.empty} testID={testIDs.watchlist.empty}>
          <EmptyState message={t('watchlist.empty')} />
          <Button
            title={t('watchlist.browseMarkets')}
            variant="secondary"
            onPress={() => navigation.navigate('Markets')}
            testID={testIDs.watchlist.browseButton}
          />
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.root} testID={testIDs.watchlist.screen}>
      <View style={styles.header}>
        <ConnectionBadge />
        {quotesQuery.error ? (
          <QuotesError error={quotesQuery.error} onRetry={refetchQuotes} />
        ) : null}
      </View>
      <FlatList
        testID={testIDs.watchlist.list}
        style={styles.list}
        contentContainerStyle={styles.content}
        data={error ? [] : rows}
        keyExtractor={row => row.symbol}
        renderItem={({ item }) => (
          <AssetRow
            asset={item}
            quote={quotes?.[item.symbol]}
            onPress={openAsset}
            ids={testIDs.watchlist}
          />
        )}
        ListEmptyComponent={
          error ? (
            <ErrorState
              message={getErrorMessage(error, t)}
              onRetry={refetchAll}
            />
          ) : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  list: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
}));
