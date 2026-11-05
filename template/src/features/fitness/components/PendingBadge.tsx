import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import { Text } from '@/components';
import { useTheme } from '@/theme';

import { selectIsPending } from '../selectors';
import type { EntityType } from '../types';

interface PendingBadgeProps {
  entity: EntityType;
  id: string;
  testID?: string;
}

/** "Not synced" label for records with changes still in the queue. */
export function PendingBadge({ entity, id, testID }: PendingBadgeProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const pending = useAppSelector(state => selectIsPending(state, entity, id));
  if (!pending) {
    return null;
  }
  return (
    <Text
      variant="caption"
      style={{ color: theme.colors.warning }}
      testID={testID}
    >
      {t('sync.notSynced')}
    </Text>
  );
}
