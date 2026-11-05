import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { WatchlistButton } from '@/features/watchlist/components/WatchlistButton';
import { makeStyles } from '@/theme';

import { formatPercent, formatPrice } from '../format';
import type { Asset, Quote } from '../types';
import { LivePrice } from './LivePrice';
import { PriceChange } from './PriceChange';

/** testID builders of a list (`testIDs.markets` or `testIDs.watchlist`). */
export interface AssetRowTestIDs {
  row: (symbol: string) => string;
  price: (symbol: string) => string;
  change: (symbol: string) => string;
  toggle: (symbol: string) => string;
}

interface AssetRowProps {
  asset: Pick<Asset, 'symbol' | 'name' | 'currency'>;
  quote: Quote | undefined;
  onPress: (asset: Pick<Asset, 'symbol'>) => void;
  ids: AssetRowTestIDs;
}

const NO_VALUE = '—';

function AssetRowComponent({ asset, quote, onPress, ids }: AssetRowProps) {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const { symbol } = asset;
  const price = quote
    ? formatPrice(quote.price, asset.currency, i18n.language)
    : NO_VALUE;
  const change = quote
    ? formatPercent(quote.changePercent, i18n.language)
    : NO_VALUE;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('markets.rowLabel', {
          symbol,
          name: asset.name,
          price,
          change,
        })}
        onPress={() => onPress(asset)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        testID={ids.row(symbol)}
      >
        <View style={styles.names}>
          <Text variant="subtitle">{symbol}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {asset.name}
          </Text>
        </View>
        <View style={styles.values}>
          <LivePrice price={quote?.price} testID={ids.price(symbol)}>
            {price}
          </LivePrice>
          {quote ? (
            <PriceChange
              changePercent={quote.changePercent}
              variant="caption"
              testID={ids.change(symbol)}
            />
          ) : (
            <Text variant="caption" tone="muted">
              {NO_VALUE}
            </Text>
          )}
        </View>
      </Pressable>
      <WatchlistButton symbol={symbol} testID={ids.toggle(symbol)} />
    </View>
  );
}

export const AssetRow = memo(AssetRowComponent);

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  names: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  values: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
}));
