import React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

interface OptionCardProps {
  label: string;
  description?: string;
  /** Right-aligned text, e.g. a price. */
  trailing?: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

/** A radio option rendered as a card (shipping and payment methods). */
export function OptionCard({
  label,
  description,
  trailing,
  selected,
  onPress,
  testID,
}: OptionCardProps) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
      testID={testID}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.text}>
        <Text variant="label">{label}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ? <Text variant="label">{trailing}</Text> : null}
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  selected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  radioSelected: {
    borderColor: theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
  },
  text: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
}));
