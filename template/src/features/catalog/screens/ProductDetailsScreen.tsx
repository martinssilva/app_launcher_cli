import React, { useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components';
import {
  addedToCart,
  maxQuantity,
  selectCartQuantity,
} from '@/features/cart/cartSlice';
import { QuantityStepper } from '@/features/cart/components/QuantityStepper';
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetProductQuery } from '../api/catalogApi';
import { PriceTag } from '../components/PriceTag';
import { ProductImage } from '../components/ProductImage';
import type { Product } from '../types';

export function ProductDetailsScreen({
  route,
  navigation,
}: RootStackScreenProps<'ProductDetails'>) {
  const { t } = useTranslation();
  const {
    data: product,
    error,
    isLoading,
    refetch,
  } = useGetProductQuery(route.params.id);

  let content = null;
  if (isLoading) {
    content = <LoadingState />;
  } else if (error || !product) {
    content = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  } else {
    content = (
      <ProductDetails
        product={product}
        onGoToCart={() => navigation.popTo('MainTabs', { screen: 'Cart' })}
      />
    );
  }

  return (
    <Screen scroll padded={false} testID={testIDs.productDetails.screen}>
      {content}
    </Screen>
  );
}

function ProductDetails({
  product,
  onGoToCart,
}: {
  product: Product;
  onGoToCart: () => void;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const inCart = useAppSelector(state => selectCartQuantity(state, product.id));
  const [quantity, setQuantity] = useState(1);

  const available = maxQuantity(product.stock) - inCart;
  const selected = Math.max(1, Math.min(quantity, available));
  const rating = product.rating.toFixed(1);
  const discount =
    product.compareAtPrice !== null && product.compareAtPrice > product.price
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  let stockLabel = t('productDetails.inStock');
  if (product.stock === 0) {
    stockLabel = t('catalog.outOfStock');
  } else if (product.stock <= 5) {
    stockLabel = t('productDetails.lowStock', { count: product.stock });
  }

  const addToCart = () => {
    dispatch(addedToCart({ product, quantity: selected }));
    setQuantity(1);
  };

  return (
    <>
      <Gallery images={product.images} name={product.name} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            variant="title"
            style={styles.title}
            testID={testIDs.productDetails.name}
          >
            {product.name}
          </Text>
          <FavoriteButton
            product={product}
            testID={testIDs.productDetails.favoriteButton}
          />
        </View>
        <Text tone="muted">
          {product.category.name} ·{' '}
          {t('catalog.rating', { rating, count: product.reviewCount })}
        </Text>
        <View style={styles.priceRow}>
          <PriceTag
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="large"
            testID={testIDs.productDetails.price}
          />
          {discount > 0 ? (
            <View style={styles.badge}>
              <Text variant="caption" style={styles.badgeText}>
                {t('productDetails.discount', { percent: discount })}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          variant="label"
          tone={product.stock === 0 ? 'danger' : 'success'}
          testID={testIDs.productDetails.stock}
        >
          {stockLabel}
        </Text>
        <Text>{product.description}</Text>

        {product.stock > 0 && available > 0 ? (
          <View style={styles.buy}>
            <Text variant="label" tone="muted">
              {t('productDetails.quantity')}
            </Text>
            <QuantityStepper
              value={selected}
              max={available}
              onChange={setQuantity}
              testIDs={{
                value: testIDs.productDetails.quantity,
                increase: testIDs.productDetails.increaseQuantity,
                decrease: testIDs.productDetails.decreaseQuantity,
              }}
            />
            <Button
              title={t('productDetails.addToCart')}
              onPress={addToCart}
              testID={testIDs.productDetails.addToCartButton}
            />
          </View>
        ) : null}
        {product.stock > 0 && available <= 0 ? (
          <Text tone="muted">{t('productDetails.maxInCart')}</Text>
        ) : null}

        {inCart > 0 ? (
          <View style={styles.inCart}>
            <Text
              tone="success"
              variant="label"
              accessibilityLiveRegion="polite"
              testID={testIDs.productDetails.addedMessage}
            >
              {t('productDetails.added', { count: inCart })}
            </Text>
            <Button
              title={t('productDetails.goToCart')}
              variant="secondary"
              onPress={onGoToCart}
              testID={testIDs.productDetails.goToCartButton}
            />
          </View>
        ) : null}
      </View>
    </>
  );
}

function Gallery({ images, name }: { images: string[]; name: string }) {
  const { t } = useTranslation();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View>
      <FlatList
        testID={testIDs.productDetails.gallery}
        data={images.length > 0 ? images : ['']}
        keyExtractor={(uri, position) => `${position}-${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item, index: position }) => (
          <ProductImage
            uri={item}
            style={{ width, height: width }}
            accessibilityLabel={`${name}, ${t('productDetails.image', {
              index: position + 1,
              count: images.length,
            })}`}
          />
        )}
      />
      {images.length > 1 ? (
        <View
          style={styles.dots}
          importantForAccessibility="no-hide-descendants"
        >
          {images.map((uri, position) => (
            <View
              key={uri}
              style={[styles.dot, position === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  body: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.danger,
  },
  badgeText: {
    color: theme.colors.onDanger,
    fontWeight: '600',
  },
  buy: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  inCart: {
    gap: theme.spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
}));
