import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MainTabScreenProps } from '@/app/navigation/types';
import { EmptyState, ErrorState, LoadingState, Text } from '@/components';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import {
  useGetCategoriesQuery,
  useGetProductsInfiniteQuery,
} from '../api/catalogApi';
import { FilterChip } from '../components/FilterChip';
import { ProductCard } from '../components/ProductCard';
import type { ProductFilters, ProductSort, ProductSummary } from '../types';

const SORTS: ProductSort[] = [
  'featured',
  'price_asc',
  'price_desc',
  'rating',
  'newest',
];

export function CatalogScreen({ navigation }: MainTabScreenProps<'Shop'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<ProductSort>('featured');
  const [onSale, setOnSale] = useState(false);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const filters = useMemo<ProductFilters>(
    () => ({ search: debouncedSearch, category, sort, onSale }),
    [debouncedSearch, category, sort, onSale],
  );

  const { data: categories } = useGetCategoriesQuery();
  const {
    currentData,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetProductsInfiniteQuery(filters);
  const { isRefreshing, refresh } = useRefreshByUser(refetch);

  const products = useMemo(
    () => currentData?.pages.flatMap(page => page.data) ?? [],
    [currentData],
  );
  const total = currentData?.pages[0]?.total ?? 0;

  const openProduct = useCallback(
    (product: ProductSummary) =>
      navigation.navigate('ProductDetails', {
        id: product.id,
        name: product.name,
      }),
    [navigation],
  );

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const sortLabels: Record<ProductSort, string> = {
    featured: t('catalog.sortFeatured'),
    price_asc: t('catalog.sortPriceAsc'),
    price_desc: t('catalog.sortPriceDesc'),
    rating: t('catalog.sortRating'),
    newest: t('catalog.sortNewest'),
  };

  let emptyComponent = (
    <View testID={testIDs.catalog.empty}>
      <EmptyState message={t('catalog.empty')} />
    </View>
  );
  if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <View style={styles.root} testID={testIDs.catalog.screen}>
      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('catalog.searchPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={t('catalog.searchPlaceholder')}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={styles.search}
          testID={testIDs.catalog.searchInput}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label={t('catalog.allCategories')}
            selected={category === 'all'}
            onPress={() => setCategory('all')}
            testID={testIDs.catalog.categoryFilter('all')}
          />
          {categories?.map(item => (
            <FilterChip
              key={item.id}
              label={item.name}
              selected={category === item.id}
              onPress={() => setCategory(item.id)}
              testID={testIDs.catalog.categoryFilter(item.id)}
            />
          ))}
        </ScrollView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label={t('catalog.onSale')}
            selected={onSale}
            onPress={() => setOnSale(value => !value)}
            testID={testIDs.catalog.onSaleFilter}
          />
          {SORTS.map(value => (
            <FilterChip
              key={value}
              label={sortLabels[value]}
              selected={sort === value}
              onPress={() => setSort(value)}
              testID={testIDs.catalog.sortOption(value)}
            />
          ))}
        </ScrollView>
        {currentData ? (
          <Text variant="caption" tone="muted" testID={testIDs.catalog.count}>
            {t('catalog.count', { shown: products.length, total })}
          </Text>
        ) : null}
      </View>

      {/* The grid mounts with the first page of the current filters, so it
          starts at the top whenever a filter changes. */}
      {!currentData && isFetching ? (
        <LoadingState />
      ) : (
        <FlashList
          testID={testIDs.catalog.list}
          data={products}
          numColumns={2}
          keyExtractor={product => product.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={openProduct}
              testID={testIDs.catalog.product(item.id)}
              favoriteTestID={testIDs.catalog.favoriteButton(item.id)}
            />
          )}
          contentContainerStyle={styles.content}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator
                color={theme.colors.primary}
                style={styles.footer}
                testID={testIDs.catalog.loadingMore}
              />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
          refreshing={isRefreshing}
          onRefresh={refresh}
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
  chips: {
    gap: theme.spacing.sm,
  },
  content: {
    padding: theme.spacing.md,
  },
  footer: {
    padding: theme.spacing.lg,
  },
}));
