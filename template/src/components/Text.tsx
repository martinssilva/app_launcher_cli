import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { type ThemeColors, type TypographyVariant, useTheme } from '@/theme';

type Tone = 'default' | 'muted' | 'primary' | 'danger' | 'success';

const TONE_TO_COLOR: Record<Tone, keyof ThemeColors> = {
  default: 'text',
  muted: 'textMuted',
  primary: 'primary',
  danger: 'danger',
  success: 'success',
};

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: Tone;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export function Text({
  variant = 'body',
  tone = 'default',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: theme.colors[TONE_TO_COLOR[tone]] },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
