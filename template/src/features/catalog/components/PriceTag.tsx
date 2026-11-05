import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { makeStyles } from '@/theme';

interface PriceTagProps {
  price: number;
  compareAtPrice: number | null;
  size?: 'small' | 'large';
  testID?: string;
}

export function PriceTag({
  price,
  compareAtPrice,
  size = 'small',
  testID,
}: PriceTagProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const formatMoney = useFormatMoney();
  const onSale = compareAtPrice !== null && compareAtPrice > price;

  return (
    <View style={styles.row}>
      <Text
        variant={size === 'large' ? 'title' : 'label'}
        tone={onSale ? 'danger' : 'default'}
        testID={testID}
      >
        {formatMoney(price)}
      </Text>
      {onSale ? (
        <Text
          variant="caption"
          tone="muted"
          style={styles.original}
          accessibilityLabel={t('catalog.originalPrice', {
            price: formatMoney(compareAtPrice),
          })}
        >
          {formatMoney(compareAtPrice)}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    columnGap: theme.spacing.sm,
  },
  original: {
    textDecorationLine: 'line-through',
  },
}));
