import React from 'react';
import { View } from 'react-native';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

interface StatTileProps {
  label: string;
  value: string;
  testID?: string;
}

export function StatTile({ label, value, testID }: StatTileProps) {
  const styles = useStyles();
  return (
    <View style={styles.tile} testID={testID} accessible>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  tile: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
}));
