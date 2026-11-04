import React, { useCallback } from 'react';
import { Alert, FlatList, Linking, RefreshControl, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  Text,
} from '@/components';
import { useRefreshByUser } from '@/hooks/useRefreshByUser';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import {
  useDeleteDocumentMutation,
  useGetDocumentsQuery,
} from '../api/documentsApi';
import { DocumentRow } from '../components/DocumentRow';
import { ProgressBar } from '../components/ProgressBar';
import { useDocumentUpload } from '../hooks/useDocumentUpload';
import type { DocumentFile } from '../types';

export function DocumentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { data, error, isLoading, refetch } = useGetDocumentsQuery();
  const [deleteDocument] = useDeleteDocumentMutation();
  const { state, pickAndUpload, retry, dismissError } = useDocumentUpload();
  const { isRefreshing, refresh } = useRefreshByUser(refetch);

  const openDocument = useCallback(
    (document: DocumentFile) => {
      Linking.openURL(document.url).catch(() =>
        Alert.alert(t('documents.openFailed')),
      );
    },
    [t],
  );

  const confirmDelete = useCallback(
    (document: DocumentFile) => {
      Alert.alert(
        t('documents.deleteConfirmTitle'),
        t('documents.deleteConfirmMessage', { name: document.name }),
        [
          { text: t('actions.cancel'), style: 'cancel' },
          {
            text: t('actions.delete'),
            style: 'destructive',
            onPress: () => {
              deleteDocument(document.id);
            },
          },
        ],
      );
    },
    [deleteDocument, t],
  );

  let emptyComponent = (
    <View testID={testIDs.documents.empty}>
      <EmptyState message={t('documents.empty')} />
    </View>
  );
  if (isLoading) {
    emptyComponent = <LoadingState />;
  } else if (error) {
    emptyComponent = (
      <ErrorState message={getErrorMessage(error, t)} onRetry={refetch} />
    );
  }

  return (
    <FlatList
      testID={testIDs.documents.screen}
      style={styles.list}
      contentContainerStyle={styles.content}
      data={data ?? []}
      keyExtractor={document => document.id}
      renderItem={({ item }) => (
        <DocumentRow
          document={item}
          onOpen={openDocument}
          onDelete={confirmDelete}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Button
            title={t('documents.upload')}
            onPress={pickAndUpload}
            loading={state.status === 'uploading'}
            testID={testIDs.documents.uploadButton}
          />
          {state.status === 'uploading' ? (
            <View style={styles.status}>
              <Text variant="caption" tone="muted">
                {t('documents.uploading', {
                  name: state.fileName,
                  percent: Math.round(state.progress * 100),
                })}
              </Text>
              <ProgressBar
                progress={state.progress}
                testID={testIDs.documents.progress}
              />
            </View>
          ) : null}
          {state.status === 'error' ? (
            <View style={styles.status} testID={testIDs.documents.uploadError}>
              <Text tone="danger">
                {state.fileName
                  ? t('documents.uploadFailed', { name: state.fileName })
                  : getErrorMessage(state.error, t)}
              </Text>
              <View style={styles.actions}>
                {state.fileName ? (
                  <Button
                    title={t('common.retry')}
                    variant="secondary"
                    onPress={retry}
                    testID={testIDs.documents.retryButton}
                  />
                ) : null}
                <Button
                  title={t('documents.dismiss')}
                  variant="ghost"
                  onPress={dismissError}
                />
              </View>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={emptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    />
  );
}

const useStyles = makeStyles(theme => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  status: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
}));
