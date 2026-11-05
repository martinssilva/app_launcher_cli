import React, { useEffect, useRef } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Text, type TextProps } from '@/components';
import { useTheme } from '@/theme';

interface LivePriceProps {
  price: number | undefined;
  /** Formatted price (or a placeholder while there is no quote). */
  children: string;
  variant?: TextProps['variant'];
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Price that briefly flashes green or red when it goes up or down. */
export function LivePrice({
  price,
  children,
  variant = 'label',
  style,
  testID,
}: LivePriceProps) {
  const theme = useTheme();
  const previous = useRef(price);
  // -1 = went down, 0 = idle, 1 = went up
  const flash = useSharedValue(0);

  useEffect(() => {
    const before = previous.current;
    previous.current = price;
    if (before === undefined || price === undefined || before === price) {
      return;
    }
    flash.set(
      withSequence(
        withTiming(price > before ? 1 : -1, { duration: 120 }),
        withTiming(0, { duration: 480 }),
      ),
    );
  }, [flash, price]);

  const { success, danger } = theme.colors;
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      flash.get(),
      [-1, 0, 1],
      [`${danger}33`, `${danger}00`, `${success}33`],
    ),
  }));

  return (
    <Animated.View
      style={[{ borderRadius: theme.radii.sm }, animatedStyle, style]}
    >
      <Text variant={variant} testID={testID}>
        {children}
      </Text>
    </Animated.View>
  );
}
