import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import { Button, Card, Screen, Text } from '@/components';
import { selectIsOnline } from '@/features/network/networkSlice';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { ConflictCard } from '../components/ConflictCard';
import {
  selectConflict,
  selectLastSyncedAt,
  selectQueue,
  selectSyncState,
} from '../selectors';
import { syncFitness } from '../sync/syncEngine';

/** Connection, sync status, conflicts and the queue of local changes. */
export function SyncScreen() {
  const { t, i18n } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(selectIsOnline);
  const lastSyncedAt = useAppSelector(selectLastSyncedAt);
  const { status, error } = useAppSelector(selectSyncState);
  const queue = useAppSelector(selectQueue);
  const conflict = useAppSelector(selectConflict);

  let statusText = t('sync.upToDate');
  if (status === 'syncing') {
    statusText = t('sync.syncingLabel');
  } else if (status === 'failed') {
    statusText = getErrorMessage(error, t);
  } else if (queue.length > 0) {
    statusText = t('sync.pending', { count: queue.length });
  }

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });

  const rows = [
    {
      label: t('sync.connection'),
      value: isOnline ? t('sync.online') : t('sync.offlineLabel'),
      testID: testIDs.sync.connection,
    },
    {
      label: t('sync.lastSync'),
      value: lastSyncedAt
        ? new Date(lastSyncedAt).toLocaleString(i18n.language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : t('sync.never'),
    },
    { label: t('sync.status'), value: statusText, testID: testIDs.sync.status },
  ];

  return (
    <Screen scroll testID={testIDs.sync.screen}>
      <Card>
        {rows.map(row => (
          <View key={row.label} style={styles.row}>
            <Text tone="muted">{row.label}</Text>
            <Text style={styles.value} testID={row.testID}>
              {row.value}
            </Text>
          </View>
        ))}
      </Card>
      <Button
        title={t('sync.syncNow')}
        variant="secondary"
        disabled={!isOnline}
        loading={status === 'syncing'}
        onPress={() => dispatch(syncFitness())}
        testID={testIDs.sync.syncNowButton}
      />

      {conflict ? (
        <ConflictCard mutation={conflict} waiting={queue.length - 1} />
      ) : null}

      <Text variant="subtitle">{t('sync.queue')}</Text>
      {queue.length === 0 ? (
        <Text tone="muted" testID={testIDs.sync.queueEmpty}>
          {t('sync.queueEmpty')}
        </Text>
      ) : (
        queue.map(mutation => (
          <Card key={mutation.id} testID={testIDs.sync.queueItem(mutation.id)}>
            <Text variant="label">
              {t(`sync.changes.${mutation.action}.${mutation.entity}`)}
            </Text>
            <Text>{mutation.label}</Text>
            <Text
              variant="caption"
              tone={mutation.conflict ? 'danger' : 'muted'}
            >
              {mutation.conflict
                ? t('sync.needsAttention')
                : t('sync.queuedAt', { time: time(mutation.queuedAt) })}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xxs,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
}));
