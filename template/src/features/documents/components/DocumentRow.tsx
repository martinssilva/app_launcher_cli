import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import DocumentIcon from '@/assets/icons/document.svg';
import { Text } from '@/components';
import { makeStyles, useTheme } from '@/theme';
import { formatDate, toDateString } from '@/utils/dates';
import { formatFileSize } from '@/utils/format';
import { testIDs } from '@/utils/testIDs';

import type { DocumentFile } from '../types';

interface DocumentRowProps {
  document: DocumentFile;
  onOpen: (document: DocumentFile) => void;
  onDelete: (document: DocumentFile) => void;
}

function DocumentRowComponent({
  document,
  onOpen,
  onDelete,
}: DocumentRowProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const uploadedOn = formatDate(
    toDateString(new Date(document.uploadedAt)),
    i18n.language,
  );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={document.name}
        onPress={() => onOpen(document)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
        testID={testIDs.documents.item(document.id)}
      >
        <DocumentIcon width={28} height={28} color={theme.colors.primary} />
        <View style={styles.info}>
          <Text numberOfLines={1}>{document.name}</Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {t('documents.details', {
              size: formatFileSize(document.size),
              date: uploadedOn,
              name: document.uploadedBy,
            })}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('documents.deleteLabel', { name: document.name })}
        onPress={() => onDelete(document)}
        hitSlop={8}
        testID={testIDs.documents.deleteButton(document.id)}
      >
        <Text variant="label" tone="danger">
          {t('actions.delete')}
        </Text>
      </Pressable>
    </View>
  );
}

export const DocumentRow = memo(DocumentRowComponent);

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  info: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
