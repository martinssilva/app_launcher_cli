import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import StarFilledIcon from '@/assets/icons/star-filled.svg';
import StarIcon from '@/assets/icons/star.svg';
import { makeStyles, useTheme } from '@/theme';

import { useWatchlistToggle } from '../useWatchlistToggle';

interface WatchlistButtonProps {
  symbol: string;
  testID?: string;
}

/** Star that adds `symbol` to (or removes it from) the watchlist. */
export function WatchlistButton({ symbol, testID }: WatchlistButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { inWatchlist, toggle } = useWatchlistToggle(symbol);
  const Icon = inWatchlist ? StarFilledIcon : StarIcon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t(
        inWatchlist ? 'watchlist.removeSymbol' : 'watchlist.addSymbol',
        { symbol },
      )}
      accessibilityState={{ selected: inWatchlist }}
      hitSlop={8}
      onPress={toggle}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      testID={testID}
    >
      <Icon
        color={inWatchlist ? theme.colors.warning : theme.colors.textMuted}
        width={24}
        height={24}
      />
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  button: {
    padding: theme.spacing.xs,
  },
  pressed: {
    opacity: 0.6,
  },
}));
