import React from 'react';
import { View } from 'react-native';
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

import { ChoiceChips, type ChoiceOption } from './ChoiceChips';

interface ChoiceFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: readonly ChoiceOption<string>[];
  /** Called after the user picks an option (e.g. to fill other fields). */
  onSelect?: (value: string) => void;
}

/** `ChoiceChips` bound to react-hook-form. */
export function ChoiceField<T extends FieldValues>({
  control,
  name,
  label,
  options,
  onSelect,
}: ChoiceFieldProps<T>) {
  const styles = useStyles();
  const { field, fieldState } = useController({ control, name });
  return (
    <View style={styles.container}>
      <Text variant="label">{label}</Text>
      <ChoiceChips
        options={options}
        value={typeof field.value === 'string' ? field.value : undefined}
        accessibilityLabel={label}
        onChange={value => {
          field.onChange(value);
          onSelect?.(value);
        }}
      />
      {fieldState.error?.message ? (
        <Text variant="caption" tone="danger">
          {fieldState.error.message}
        </Text>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing.xs,
  },
}));
