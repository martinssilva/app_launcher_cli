import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Card, ErrorState, LoadingState, Screen, Text } from '@/components';
import { SummaryRow } from '@/features/cart/components/SummaryRow';
import { ProductImage } from '@/features/catalog/components/ProductImage';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetOrderQuery } from '../api/ordersApi';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { shippingMethodLabel } from '../labels';
import type { Order } from '../types';

export function OrderDetailsScreen({
  route,
}: RootStackScreenProps<'OrderDetails'>) {
  const { t } = useTranslation();
  const {
    data: order,
    error,
    isLoading,
    refetch,
  } = useGetOrderQuery(route.params.id);

  let content = null;
  if (isLoading) {
    content = <LoadingState />;
  } else if (error || !order) {
    content = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  } else {
    content = <OrderDetails order={order} />;
  }

  return (
    <Screen scroll testID={testIDs.orderDetails.screen}>
      {content}
    </Screen>
  );
}

function OrderDetails({ order }: { order: Order }) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const formatMoney = useFormatMoney();
  const { address, payment } = order;

  return (
    <>
      <View style={styles.header}>
        <Text variant="title" testID={testIDs.orderDetails.number}>
          {t('orders.number', { number: order.number })}
        </Text>
        <OrderStatusBadge
          status={order.status}
          testID={testIDs.orderDetails.status}
        />
        <Text tone="muted">
          {t('orderDetails.placedOn', {
            date: new Date(order.createdAt).toLocaleDateString(i18n.language, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}
        </Text>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('orderDetails.items')}
        </Text>
        <Card>
          {order.items.map(item => (
            <View key={item.productId} style={styles.item}>
              <ProductImage uri={item.image} style={styles.image} />
              <View style={styles.itemText}>
                <Text variant="label" numberOfLines={2}>
                  {item.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {t('orderDetails.quantityTimesPrice', {
                    quantity: item.quantity,
                    price: formatMoney(item.price),
                  })}
                </Text>
              </View>
              <Text variant="label">
                {formatMoney(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('checkout.address')}
        </Text>
        <Card>
          <Text>{address.fullName}</Text>
          <Text tone="muted">
            {[address.street, address.complement].filter(Boolean).join(', ')}
          </Text>
          <Text tone="muted">
            {address.city}, {address.state} {address.postalCode}
          </Text>
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('checkout.delivery')} · {t('checkout.payment')}
        </Text>
        <Card>
          <Text>{shippingMethodLabel(order.shippingMethod, t)}</Text>
          <Text tone="muted">
            {payment.method === 'card'
              ? t('orderDetails.cardEnding', { last4: payment.last4 })
              : t('checkout.cash')}
          </Text>
        </Card>
      </View>

      <Card>
        <SummaryRow
          label={t('checkout.subtotal')}
          value={formatMoney(order.subtotal)}
        />
        <SummaryRow
          label={t('checkout.shipping')}
          value={
            order.shippingCost === 0
              ? t('checkout.free')
              : formatMoney(order.shippingCost)
          }
        />
        <SummaryRow
          label={t('checkout.total')}
          value={formatMoney(order.total)}
          emphasized
          testID={testIDs.orderDetails.total}
        />
      </Card>
    </>
  );
}

const useStyles = makeStyles(theme => ({
  header: {
    gap: theme.spacing.sm,
  },
  section: {
    gap: theme.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  image: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.sm,
  },
  itemText: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
