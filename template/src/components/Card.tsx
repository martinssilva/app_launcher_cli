import React, { type PropsWithChildren } from 'react';
import { Pressable, type StyleProp, View, type ViewStyle } from 'react-native';

import { makeStyles } from '@/theme';

export interface CardProps extends PropsWithChildren {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export function Card({
  children,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const styles = useStyles();
  if (!onPress) {
    return (
      <View style={[styles.card, style]} testID={testID}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const useStyles = makeStyles(theme => ({
  card: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
}));
