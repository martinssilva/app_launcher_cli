import type { TextStyle } from 'react-native';

/**
 * Design tokens: raw values. Components should not use them directly;
 * they read semantic values from the active theme (see ./themes.ts).
 */
export const palette = {
  white: '#FFFFFF',
  black: '#000000',

  indigo50: '#EEF2FF',
  indigo100: '#E0E7FF',
  indigo300: '#A5B4FC',
  indigo400: '#818CF8',
  indigo500: '#6366F1',
  indigo600: '#4F46E5',
  indigo700: '#4338CA',
  indigo900: '#312E81',

  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',
  gray950: '#030712',

  red400: '#F87171',
  red600: '#DC2626',
  green400: '#4ADE80',
  green600: '#16A34A',
  amber400: '#FBBF24',
  amber600: '#D97706',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} as const satisfies Record<string, TextStyle>;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
export type TypographyVariant = keyof typeof typography;
