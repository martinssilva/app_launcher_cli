import React from 'react';
import { Pressable, View } from 'react-native';

import { makeStyles } from '@/theme';

import { Text } from './Text';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  testID?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const styles = useStyles();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.container}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && styles.selected]}
            testID={option.testID}
          >
            <Text
              variant="label"
              tone={selected ? 'primary' : 'muted'}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    flexDirection: 'row',
    padding: theme.spacing.xxs,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  selected: {
    backgroundColor: theme.colors.surface,
  },
}));
