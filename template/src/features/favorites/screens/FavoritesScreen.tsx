import { FlashList } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MainTabScreenProps } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { EmptyState } from '@/components';
import { ProductCard } from '@/features/catalog/components/ProductCard';
import type { ProductSummary } from '@/features/catalog/types';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { selectFavorites } from '../favoritesSlice';

export function FavoritesScreen({
  navigation,
}: MainTabScreenProps<'Favorites'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const favorites = useAppSelector(selectFavorites);

  const openProduct = useCallback(
    (product: ProductSummary) =>
      navigation.navigate('ProductDetails', {
        id: product.id,
        name: product.name,
      }),
    [navigation],
  );

  return (
    <View style={styles.root} testID={testIDs.favorites.screen}>
      <FlashList
        testID={testIDs.favorites.list}
        data={favorites}
        numColumns={2}
        keyExtractor={product => product.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={openProduct}
            testID={testIDs.favorites.product(item.id)}
            favoriteTestID={testIDs.favorites.favoriteButton(item.id)}
          />
        )}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View testID={testIDs.favorites.empty}>
            <EmptyState message={t('favorites.empty')} />
          </View>
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
  content: {
    padding: theme.spacing.md,
  },
}));
