import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import HeartFilledIcon from '@/assets/icons/heart-filled.svg';
import HeartIcon from '@/assets/icons/heart.svg';
import type { ProductSummary } from '@/features/catalog/types';
import { makeStyles, useTheme } from '@/theme';

import { favoriteToggled, selectIsFavorite } from '../favoritesSlice';

interface FavoriteButtonProps {
  product: ProductSummary;
  /** `overlay` adds a background so the icon stays visible over photos. */
  variant?: 'plain' | 'overlay';
  testID?: string;
}

export function FavoriteButton({
  product,
  variant = 'plain',
  testID,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const isFavorite = useAppSelector(state =>
    selectIsFavorite(state, product.id),
  );
  const Icon = isFavorite ? HeartFilledIcon : HeartIcon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isFavorite
          ? t('catalog.removeFavorite', { name: product.name })
          : t('catalog.addFavorite', { name: product.name })
      }
      accessibilityState={{ selected: isFavorite }}
      hitSlop={8}
      onPress={() => dispatch(favoriteToggled(product))}
      style={({ pressed }) => [
        styles.button,
        variant === 'overlay' && styles.overlay,
        pressed && styles.pressed,
      ]}
      testID={testID}
    >
      <Icon
        color={isFavorite ? theme.colors.danger : theme.colors.textMuted}
        width={22}
        height={22}
      />
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
  },
  overlay: {
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    opacity: 0.6,
  },
}));
