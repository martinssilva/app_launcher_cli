import React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { Card, EmptyState, ErrorState, LoadingState, Text } from '@/components';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetOrdersQuery } from '../api/ordersApi';
import { OrderStatusBadge } from '../components/OrderStatusBadge';

export function OrdersScreen({ navigation }: RootStackScreenProps<'Orders'>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const formatMoney = useFormatMoney();
  const { data, error, isLoading, refetch } = useGetOrdersQuery();
  const { isRefreshing, refresh } = useRefreshByUser(refetch);

  let emptyComponent = (
    <View testID={testIDs.orders.empty} style={styles.fill}>
      <EmptyState message={t('orders.empty')} />
    </View>
  );
  if (isLoading) {
    emptyComponent = <LoadingState />;
  } else if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <FlatList
      testID={testIDs.orders.list}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data ?? []}
      keyExtractor={order => order.id}
      renderItem={({ item: order }) => {
        const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return (
          <Card
            onPress={() =>
              navigation.navigate('OrderDetails', {
                id: order.id,
                number: order.number,
              })
            }
            accessibilityLabel={t('orders.number', { number: order.number })}
            testID={testIDs.orders.item(order.id)}
          >
            <View style={styles.row}>
              <Text variant="subtitle">
                {t('orders.number', { number: order.number })}
              </Text>
              <OrderStatusBadge status={order.status} />
            </View>
            <View style={styles.row}>
              <Text tone="muted">
                {new Date(order.createdAt).toLocaleDateString(i18n.language)} ·{' '}
                {t('cart.itemCount', { count })}
              </Text>
              <Text variant="label">{formatMoney(order.total)}</Text>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={emptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    />
  );
}

const useStyles = makeStyles(theme => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  fill: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
}));
