import React, { type PropsWithChildren, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as ReduxProvider } from 'react-redux';
import type { Store } from 'redux';
import type { Persistor } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';

import { useAppSelector } from '@/app/store/hooks';
import {
  selectLanguagePreference,
  selectThemePreference,
} from '@/features/settings/settingsSlice';
import { i18n, resolveLanguage } from '@/i18n';
import { ThemeProvider } from '@/theme';

interface AppProvidersProps extends PropsWithChildren {
  store: Store;
  /** When provided, rendering waits until the persisted state is restored. */
  persistor?: Persistor;
}

/** Applies user preferences (theme + language) stored in Redux. */
function PreferencesProvider({ children }: PropsWithChildren) {
  const themePreference = useAppSelector(selectThemePreference);
  const languagePreference = useAppSelector(selectLanguagePreference);

  useEffect(() => {
    const language = resolveLanguage(languagePreference);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [languagePreference]);

  return <ThemeProvider preference={themePreference}>{children}</ThemeProvider>;
}

export function AppProviders({
  store,
  persistor,
  children,
}: AppProvidersProps) {
  const content = <PreferencesProvider>{children}</PreferencesProvider>;
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          {persistor ? (
            <PersistGate loading={null} persistor={persistor}>
              {content}
            </PersistGate>
          ) : (
            content
          )}
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
