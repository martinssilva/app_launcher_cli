import React from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

export function FilterChip({
  label,
  selected,
  onPress,
  testID,
}: FilterChipProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      testID={testID}
    >
      <Text variant="label" tone={selected ? 'primary' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
}));
