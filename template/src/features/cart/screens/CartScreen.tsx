import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { MainTabScreenProps } from '@/app/navigation/types';
import { useAppSelector } from '@/app/store/hooks';
import { Button, EmptyState, Text } from '@/components';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import {
  type CartItem,
  selectCartCount,
  selectCartItems,
  selectCartSubtotal,
} from '../cartSlice';
import { CartItemRow } from '../components/CartItemRow';
import { SummaryRow } from '../components/SummaryRow';

export function CartScreen({ navigation }: MainTabScreenProps<'Cart'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const formatMoney = useFormatMoney();
  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  const openProduct = useCallback(
    (item: CartItem) =>
      navigation.navigate('ProductDetails', {
        id: item.productId,
        name: item.name,
      }),
    [navigation],
  );

  if (items.length === 0) {
    return (
      <View style={[styles.root, styles.empty]} testID={testIDs.cart.screen}>
        <View testID={testIDs.cart.empty}>
          <EmptyState message={t('cart.empty')} />
        </View>
        <Button
          title={t('cart.browse')}
          variant="secondary"
          onPress={() => navigation.navigate('Shop')}
          testID={testIDs.cart.browseButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testIDs.cart.screen}>
      <FlatList
        testID={testIDs.cart.list}
        style={styles.list}
        contentContainerStyle={styles.content}
        data={items}
        keyExtractor={item => item.productId}
        renderItem={({ item }) => (
          <CartItemRow item={item} onOpen={openProduct} />
        )}
      />
      <View style={styles.footer}>
        <SummaryRow
          label={`${t('cart.subtotal')} (${t('cart.itemCount', { count })})`}
          value={formatMoney(subtotal)}
          emphasized
          testID={testIDs.cart.subtotal}
        />
        <Text variant="caption" tone="muted">
          {t('cart.shippingNote')}
        </Text>
        <Button
          title={t('cart.checkout')}
          onPress={() => navigation.navigate('Checkout')}
          testID={testIDs.cart.checkoutButton}
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  empty: {
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  list: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  footer: {
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
}));
