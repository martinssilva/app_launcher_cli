import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

interface SummaryRowProps {
  label: string;
  value: string;
  /** Bigger and bolder, for totals. */
  emphasized?: boolean;
  testID?: string;
}

/** A label/value line of a price summary (cart, checkout, order details). */
export function SummaryRow({
  label,
  value,
  emphasized = false,
  testID,
}: SummaryRowProps) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text
        variant={emphasized ? 'subtitle' : 'body'}
        tone={emphasized ? 'default' : 'muted'}
      >
        {label}
      </Text>
      <Text variant={emphasized ? 'subtitle' : 'body'} testID={testID}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.spacing.md,
  },
}));
