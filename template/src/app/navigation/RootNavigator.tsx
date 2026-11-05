import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import { ChangePasswordScreen } from '@/features/account/screens/ChangePasswordScreen';
import { EditProfileScreen } from '@/features/account/screens/EditProfileScreen';
import { EventFormScreen } from '@/features/agenda/screens/EventFormScreen';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen';
import { ItemDetailsScreen } from '@/features/home/screens/ItemDetailsScreen';
import { TaskDetailsScreen } from '@/features/tasks/screens/TaskDetailsScreen';
import { useTheme } from '@/theme';

import { MainTabs } from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Auth flow: the available screens depend on the session. When the user signs
 * in or out, React Navigation swaps the stacks automatically.
 */
export function RootNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();
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
          <Stack.Screen
            name="EventForm"
            component={EventFormScreen}
            options={({ route }) => ({
              title: route.params?.eventId
                ? t('agenda.editEvent')
                : t('agenda.newEvent'),
            })}
          />
          <Stack.Screen
            name="TaskDetails"
            component={TaskDetailsScreen}
            options={({ route }) => ({ title: route.params.title })}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: t('account.editProfile') }}
          />
          <Stack.Screen
            name="ChangePassword"
            component={ChangePasswordScreen}
            options={{ title: t('account.changePassword') }}
          />
        </Stack.Group>
      ) : (
        <Stack.Group
          screenOptions={{
            title: '',
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            headerTintColor: theme.colors.primary,
            headerStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false, animationTypeForReplace: 'pop' }}
          />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
