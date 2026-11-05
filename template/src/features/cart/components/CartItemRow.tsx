import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '@/app/store/hooks';
import { Text } from '@/components';
import { ProductImage } from '@/features/catalog/components/ProductImage';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { makeStyles } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import {
  type CartItem,
  maxQuantity,
  quantityChanged,
  removedFromCart,
} from '../cartSlice';
import { QuantityStepper } from './QuantityStepper';

interface CartItemRowProps {
  item: CartItem;
  onOpen: (item: CartItem) => void;
}

function CartItemRowComponent({ item, onOpen }: CartItemRowProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const formatMoney = useFormatMoney();

  return (
    <View style={styles.row} testID={testIDs.cart.item(item.productId)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.name}
        onPress={() => onOpen(item)}
      >
        <ProductImage uri={item.image} style={styles.image} />
      </Pressable>
      <View style={styles.info}>
        <Text variant="label" numberOfLines={2}>
          {item.name}
        </Text>
        <Text variant="caption" tone="muted">
          {t('cart.each', { price: formatMoney(item.price) })}
        </Text>
        <View style={styles.actions}>
          <QuantityStepper
            value={item.quantity}
            min={0}
            max={maxQuantity(item.stock)}
            onChange={quantity =>
              dispatch(quantityChanged({ productId: item.productId, quantity }))
            }
            testIDs={{
              value: testIDs.cart.quantity(item.productId),
              increase: testIDs.cart.increase(item.productId),
              decrease: testIDs.cart.decrease(item.productId),
            }}
          />
          <Text variant="label">{formatMoney(item.price * item.quantity)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('cart.removeLabel', { name: item.name })}
          hitSlop={8}
          onPress={() => dispatch(removedFromCart(item.productId))}
          style={styles.remove}
          testID={testIDs.cart.remove(item.productId)}
        >
          <Text variant="caption" tone="danger">
            {t('cart.remove')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export const CartItemRow = memo(CartItemRowComponent);

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.md,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  remove: {
    alignSelf: 'flex-start',
  },
}));
