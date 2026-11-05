import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { makeStyles, type ThemeColors, useTheme } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { useQuoteConnectionStatus } from '../hooks/useQuoteConnectionStatus';
import type { ConnectionStatus } from '../services/quoteSocket';

const DOT_COLOR: Record<ConnectionStatus, keyof ThemeColors> = {
  open: 'success',
  connecting: 'warning',
  reconnecting: 'warning',
  paused: 'textMuted',
  idle: 'textMuted',
};

/** Status of the real-time quotes connection ("Live", "Reconnecting…"). */
export function ConnectionBadge() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const status = useQuoteConnectionStatus();
  const label = t(`quotes.${status}`);

  return (
    <View
      accessible
      accessibilityLabel={t('quotes.statusLabel', { status: label })}
      accessibilityLiveRegion="polite"
      style={styles.badge}
      testID={testIDs.quotes.connectionStatus}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: theme.colors[DOT_COLOR[status]] },
        ]}
      />
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceVariant,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
}));
