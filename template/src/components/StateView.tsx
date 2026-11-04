import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { makeStyles, useTheme } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { Button } from './Button';
import { Text } from './Text';

export function LoadingState() {
  const theme = useTheme();
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View
      style={styles.container}
      testID={testIDs.stateView.loading}
      accessibilityLabel={t('common.loading')}
    >
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.container} testID={testIDs.stateView.error}>
      <Text align="center" tone="muted">
        {message}
      </Text>
      {onRetry ? (
        <Button
          title={t('common.retry')}
          variant="secondary"
          onPress={onRetry}
          testID={testIDs.stateView.retryButton}
        />
      ) : null}
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const styles = useStyles();
  return (
    <View style={styles.container} testID={testIDs.stateView.empty}>
      <Text align="center" tone="muted">
        {message}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
}));
