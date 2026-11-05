import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
  testID?: string;
}

interface ChoiceChipsProps<T extends string> {
  options: readonly ChoiceOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Single choice as a wrapping row of pills (goals, workouts, exercises). */
export function ChoiceChips<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: ChoiceChipsProps<T>) {
  const styles = useStyles();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.selected]}
            testID={option.testID}
          >
            <Text variant="label" tone={selected ? 'primary' : 'muted'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
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
