import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { ItemDetailsScreen } from '@/features/home/screens/ItemDetailsScreen';

import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth flow: the available screens depend on the session. When the user signs
 * in or out, React Navigation swaps the stacks automatically.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Group>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ItemDetails"
            component={ItemDetailsScreen}
            options={({ route }) => ({
              title: route.params.title || t('itemDetails.title'),
              headerBackTitle: t('home.title'),
            })}
          />
        </Stack.Group>
      ) : (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false, animationTypeForReplace: 'pop' }}
        />
      )}
    </Stack.Navigator>
  );
}
