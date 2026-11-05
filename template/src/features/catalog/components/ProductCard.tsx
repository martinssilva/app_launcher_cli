import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { makeStyles } from '@/theme';

import type { ProductSummary } from '../types';
import { PriceTag } from './PriceTag';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: ProductSummary;
  onPress: (product: ProductSummary) => void;
  testID?: string;
  favoriteTestID?: string;
}

function ProductCardComponent({
  product,
  onPress,
  testID,
  favoriteTestID,
}: ProductCardProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const rating = product.rating.toFixed(1);

  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={product.name}
        onPress={() => onPress(product)}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        testID={testID}
      >
        <ProductImage uri={product.images[0]} style={styles.image} />
        <View style={styles.body}>
          <Text variant="label" numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>
          <PriceTag
            price={product.price}
            compareAtPrice={product.compareAtPrice}
          />
          {product.stock > 0 ? (
            <Text
              variant="caption"
              tone="muted"
              accessibilityLabel={t('catalog.ratingLabel', {
                rating,
                count: product.reviewCount,
              })}
            >
              {t('catalog.rating', { rating, count: product.reviewCount })}
            </Text>
          ) : (
            <Text variant="caption" tone="danger">
              {t('catalog.outOfStock')}
            </Text>
          )}
        </View>
      </Pressable>
      <View style={styles.favorite}>
        <FavoriteButton
          product={product}
          variant="overlay"
          testID={favoriteTestID}
        />
      </View>
    </View>
  );
}

export const ProductCard = memo(ProductCardComponent);

const useStyles = makeStyles(theme => ({
  cell: {
    flex: 1,
    padding: theme.spacing.xs,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  body: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  name: {
    minHeight: 40,
  },
  favorite: {
    position: 'absolute',
    top: theme.spacing.md,
    right: theme.spacing.md,
  },
}));
