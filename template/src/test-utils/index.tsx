import { NavigationContainer } from '@react-navigation/native';
import { render, type RenderOptions } from '@testing-library/react-native';
import React, { type PropsWithChildren, type ReactElement } from 'react';

import { AppProviders } from '@/app/providers/AppProviders';
import { type AppStore, makeStore } from '@/app/store/store';
import type { RootState } from '@/app/store/types';
import { baseApi } from '@/services/api';

const activeStores = new Set<AppStore>();

/**
 * Clears RTK Query state (and its pending cache-removal timers) of every store
 * created by `renderWithProviders`. Called after each test (jest/setupAfterEnv.ts).
 */
export function resetTestStores() {
  activeStores.forEach(store => store.dispatch(baseApi.util.resetApiState()));
  activeStores.clear();
}

interface RenderWithProvidersOptions extends RenderOptions {
  preloadedState?: Partial<RootState>;
  store?: AppStore;
  /** Wrap the UI in a NavigationContainer (for screens using navigation hooks). */
  withNavigation?: boolean;
}

/**
 * Renders UI with the same providers as the app (Redux, theme, i18n,
 * safe area, gesture handler) but with an isolated, non-persisted store.
 */
export async function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = makeStore(preloadedState),
    withNavigation = false,
    ...options
  }: RenderWithProvidersOptions = {},
) {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <AppProviders store={store}>
        {withNavigation ? (
          <NavigationContainer>{children}</NavigationContainer>
        ) : (
          children
        )}
      </AppProviders>
    );
  }

  activeStores.add(store);
  const result = await render(ui, { wrapper: Wrapper, ...options });
  return { store, ...result };
}

export * from '@testing-library/react-native';
