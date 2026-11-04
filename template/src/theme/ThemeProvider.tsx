import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import {
  type ImageStyle,
  StyleSheet,
  type TextStyle,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

import { type Theme, type ThemeName, themes } from './themes';

export type ThemePreference = 'system' | ThemeName;

const ThemeContext = createContext<Theme>(themes.light);

export function resolveThemeName(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ThemeName {
  if (preference !== 'system') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

interface ThemeProviderProps extends PropsWithChildren {
  preference?: ThemePreference;
}

export function ThemeProvider({
  preference = 'system',
  children,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const theme = themes[resolveThemeName(preference, systemScheme)];
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Creates a hook returning theme-aware, memoized styles:
 *
 *   const useStyles = makeStyles(theme => ({ container: { padding: theme.spacing.lg } }));
 *   const styles = useStyles();
 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export function makeStyles<T extends NamedStyles<T>>(
  factory: (theme: Theme) => T,
): () => Readonly<T> {
  return function useStyles() {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(factory(theme)), [theme]);
  };
}
