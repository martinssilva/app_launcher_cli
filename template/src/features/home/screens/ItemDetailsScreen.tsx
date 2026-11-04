import React from 'react';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { ErrorState, LoadingState, Screen, Text } from '@/components';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetItemQuery } from '../api/itemsApi';

export function ItemDetailsScreen({
  route,
}: RootStackScreenProps<'ItemDetails'>) {
  const { t, i18n } = useTranslation();
  const {
    data: item,
    error,
    isLoading,
    refetch,
  } = useGetItemQuery(route.params.id);

  let content = null;
  if (isLoading) {
    content = <LoadingState />;
  } else if (error || !item) {
    content = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  } else {
    content = (
      <>
        <Text variant="title" testID={testIDs.itemDetails.title}>
          {item.title}
        </Text>
        <Text tone="muted">
          {t('itemDetails.createdAt', {
            date: new Date(item.createdAt).toLocaleDateString(i18n.language, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}
        </Text>
        <Text>{item.description}</Text>
      </>
    );
  }

  return (
    <Screen scroll testID={testIDs.itemDetails.screen}>
      {content}
    </Screen>
  );
}
