import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Button, ErrorState, LoadingState, Screen, Text } from '@/components';
import {
  useGetOrderQuery,
  useGetShippingOptionsQuery,
} from '@/features/orders/api/ordersApi';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

export function OrderConfirmationScreen({
  route,
  navigation,
}: RootStackScreenProps<'OrderConfirmation'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const formatMoney = useFormatMoney();
  const {
    data: order,
    error,
    isLoading,
    refetch,
  } = useGetOrderQuery(route.params.orderId);
  const { data: shippingOptions } = useGetShippingOptionsQuery();

  if (isLoading) {
    return (
      <Screen testID={testIDs.orderConfirmation.screen}>
        <LoadingState />
      </Screen>
    );
  }
  if (error || !order) {
    return (
      <Screen testID={testIDs.orderConfirmation.screen}>
        <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
      </Screen>
    );
  }

  const option = shippingOptions?.find(({ id }) => id === order.shippingMethod);

  return (
    <Screen
      testID={testIDs.orderConfirmation.screen}
      contentStyle={styles.content}
    >
      <View style={styles.icon}>
        <Text variant="display" style={styles.check}>
          ✓
        </Text>
      </View>
      <Text variant="title" align="center">
        {t('orderConfirmation.heading')}
      </Text>
      <Text
        tone="muted"
        align="center"
        testID={testIDs.orderConfirmation.number}
      >
        {t('orderConfirmation.message', {
          number: order.number,
          total: formatMoney(order.total),
          min: option?.minDays ?? '?',
          max: option?.maxDays ?? '?',
        })}
      </Text>
      <View style={styles.actions}>
        <Button
          title={t('orderConfirmation.viewOrder')}
          onPress={() =>
            navigation.replace('OrderDetails', {
              id: order.id,
              number: order.number,
            })
          }
          testID={testIDs.orderConfirmation.viewOrderButton}
        />
        <Button
          title={t('orderConfirmation.continueShopping')}
          variant="ghost"
          onPress={() => navigation.popTo('MainTabs', { screen: 'Shop' })}
          testID={testIDs.orderConfirmation.continueShoppingButton}
        />
      </View>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  content: {
    justifyContent: 'center',
  },
  icon: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.success,
  },
  check: {
    color: theme.colors.onPrimary,
  },
  actions: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
}));
