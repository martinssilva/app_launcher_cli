import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import { Text } from '@/components';
import { selectIsOnline } from '@/features/network/networkSlice';
import { makeStyles, type ThemeColors, useTheme } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { selectConflict, selectQueue, selectSyncState } from '../selectors';

/**
 * Connection and sync status shown on top of the fitness screens: offline,
 * changes waiting, sync failure or a conflict to resolve. Opens the sync screen.
 */
export function SyncBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const navigation = useNavigation();
  const isOnline = useAppSelector(selectIsOnline);
  const queue = useAppSelector(selectQueue);
  const conflict = useAppSelector(selectConflict);
  const { status } = useAppSelector(selectSyncState);
  const count = queue.length;

  let message: string | null = null;
  let tone: keyof ThemeColors = 'warning';
  if (conflict) {
    message = t('sync.conflict');
    tone = 'danger';
  } else if (!isOnline) {
    message =
      count > 0 ? t('sync.offlinePending', { count }) : t('sync.offline');
  } else if (status === 'failed') {
    message = t('sync.failed');
    tone = 'danger';
  } else if (count > 0) {
    message =
      status === 'syncing' ? t('sync.syncing') : t('sync.pending', { count });
    tone = 'primary';
  }

  if (!message) {
    return null;
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => navigation.navigate('Sync')}
      style={[styles.banner, { borderColor: theme.colors[tone] }]}
      testID={testIDs.sync.banner}
    >
      <Text variant="label" style={{ color: theme.colors[tone] }}>
        {message}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  banner: {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    backgroundColor: theme.colors.surface,
  },
}));
