import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { makeStyles } from '@/theme';

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  testIDs?: { value?: string; increase?: string; decrease?: string };
}

export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  testIDs,
}: QuantityStepperProps) {
  const { t } = useTranslation();
  const styles = useStyles();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('productDetails.decrease')}
        accessibilityState={{ disabled: !canDecrease }}
        disabled={!canDecrease}
        hitSlop={6}
        onPress={() => onChange(value - 1)}
        style={[styles.button, !canDecrease && styles.disabled]}
        testID={testIDs?.decrease}
      >
        <Text variant="subtitle" tone="primary">
          −
        </Text>
      </Pressable>
      <Text
        variant="label"
        style={styles.value}
        accessibilityLabel={`${t('productDetails.quantity')}: ${value}`}
        testID={testIDs?.value}
      >
        {value}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('productDetails.increase')}
        accessibilityState={{ disabled: !canIncrease }}
        disabled={!canIncrease}
        hitSlop={6}
        onPress={() => onChange(value + 1)}
        style={[styles.button, !canIncrease && styles.disabled]}
        testID={testIDs?.increase}
      >
        <Text variant="subtitle" tone="primary">
          +
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
  },
}));
