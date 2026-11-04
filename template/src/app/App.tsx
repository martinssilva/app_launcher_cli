import React from 'react';

import { NavigationRoot } from './navigation/NavigationRoot';
import { AppProviders } from './providers/AppProviders';
import { persistor, store } from './store';

export function App() {
  return (
    <AppProviders store={store} persistor={persistor}>
      <NavigationRoot />
    </AppProviders>
  );
}
