import React, { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import {
  type Control,
  type FieldValues,
  type Path,
  useController,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { makeStyles } from '@/theme';
import { formatDate, todayString } from '@/utils/dates';

import { AppCalendar } from './AppCalendar';

interface DatePickerFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  testID: string;
}

/** Form field that stores a `YYYY-MM-DD` date picked from a calendar in a modal. */
export function DatePickerField<T extends FieldValues>({
  control,
  name,
  label,
  testID,
}: DatePickerFieldProps<T>) {
  const styles = useStyles();
  const { i18n } = useTranslation();
  const { field, fieldState } = useController({ control, name });
  const [open, setOpen] = useState(false);
  const value = typeof field.value === 'string' ? field.value : '';
  const error = fieldState.error?.message;

  const close = () => {
    setOpen(false);
    field.onBlur();
  };

  return (
    <View style={styles.container}>
      <Text variant="label">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        style={[styles.input, error ? styles.inputError : null]}
        testID={testID}
      >
        <Text>
          {value
            ? formatDate(value, i18n.language, {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : ''}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          {/* Captures touches so taps inside the sheet do not close it. */}
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <AppCalendar
              current={value || todayString()}
              markedDates={value ? { [value]: { selected: true } } : {}}
              onDayPress={day => {
                field.onChange(day.dateString);
                close();
              }}
              testID={`${testID}.calendar`}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing.xs,
  },
  input: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    overflow: 'hidden',
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
  },
}));
