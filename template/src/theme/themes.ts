import { palette, radii, spacing, typography } from './tokens';

export interface ThemeColors {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  onDanger: string;
  success: string;
  warning: string;
}

export interface Theme {
  name: 'light' | 'dark';
  dark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
}

export type ThemeName = Theme['name'];

export const lightTheme: Theme = {
  name: 'light',
  dark: false,
  colors: {
    primary: palette.indigo600,
    onPrimary: palette.white,
    primaryContainer: palette.indigo50,
    onPrimaryContainer: palette.indigo900,
    background: palette.gray50,
    surface: palette.white,
    surfaceVariant: palette.gray100,
    text: palette.gray900,
    textMuted: palette.gray500,
    border: palette.gray200,
    danger: palette.red600,
    onDanger: palette.white,
    success: palette.green600,
    warning: palette.amber600,
  },
  spacing,
  radii,
  typography,
};

export const darkTheme: Theme = {
  name: 'dark',
  dark: true,
  colors: {
    primary: palette.indigo400,
    onPrimary: palette.gray950,
    primaryContainer: palette.indigo900,
    onPrimaryContainer: palette.indigo100,
    background: palette.gray950,
    surface: palette.gray900,
    surfaceVariant: palette.gray800,
    text: palette.gray50,
    textMuted: palette.gray400,
    border: palette.gray800,
    danger: palette.red400,
    onDanger: palette.gray950,
    success: palette.green400,
    warning: palette.amber400,
  },
  spacing,
  radii,
  typography,
};

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
