import { NavigationContainer } from '@react-navigation/native';
import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { toNavigationTheme, useTheme } from '@/theme';

import { RootNavigator } from './RootNavigator';

function hideSplash() {
  BootSplash.hide({ fade: true }).catch(() => undefined);
}

export function NavigationRoot() {
  const theme = useTheme();
  const navigationTheme = useMemo(() => toNavigationTheme(theme), [theme]);

  return (
    <NavigationContainer theme={navigationTheme} onReady={hideSplash}>
      <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}
