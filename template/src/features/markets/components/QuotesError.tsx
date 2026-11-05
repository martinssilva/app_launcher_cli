import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Text } from '@/components';
import { makeStyles } from '@/theme';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { testIDs } from '@/utils/testIDs';

interface QuotesErrorProps {
  error: unknown;
  onRetry: () => void;
}

/**
 * Shown when the quotes snapshot fails: live updates only start after it
 * loads, so the user needs a way to try again.
 */
export function QuotesError({ error, onRetry }: QuotesErrorProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  return (
    <View style={styles.container} testID={testIDs.quotes.error}>
      <Text variant="caption" tone="danger" style={styles.message}>
        {`${t('quotes.unavailable')} ${getErrorMessage(error, t)}`}
      </Text>
      <Button
        title={t('common.retry')}
        variant="ghost"
        onPress={onRetry}
        testID={testIDs.quotes.retryButton}
      />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  message: {
    flex: 1,
  },
}));
