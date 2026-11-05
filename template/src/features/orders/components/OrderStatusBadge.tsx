import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

import { orderStatusLabel } from '../labels';
import type { OrderStatus } from '../types';

const TONE: Record<OrderStatus, 'warning' | 'primary' | 'success' | 'danger'> =
  {
    processing: 'warning',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
  };

export function OrderStatusBadge({
  status,
  testID,
}: {
  status: OrderStatus;
  testID?: string;
}) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={[styles.badge, styles[TONE[status]]]}>
      <Text variant="caption" style={styles.text} testID={testID}>
        {orderStatusLabel(status, t)}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.pill,
  },
  text: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
  },
  warning: { backgroundColor: theme.colors.warning },
  primary: { backgroundColor: theme.colors.primary },
  success: { backgroundColor: theme.colors.success },
  danger: { backgroundColor: theme.colors.danger },
}));
