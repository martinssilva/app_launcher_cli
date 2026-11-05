import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen';
import { MemberDetailsScreen } from '@/features/fitness/screens/MemberDetailsScreen';
import { MemberFormScreen } from '@/features/fitness/screens/MemberFormScreen';
import { ProgressScreen } from '@/features/fitness/screens/ProgressScreen';
import { SessionFormScreen } from '@/features/fitness/screens/SessionFormScreen';
import { SyncScreen } from '@/features/fitness/screens/SyncScreen';
import { WorkoutFormScreen } from '@/features/fitness/screens/WorkoutFormScreen';
import { ItemDetailsScreen } from '@/features/home/screens/ItemDetailsScreen';
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
            name="MemberDetails"
            component={MemberDetailsScreen}
            options={{ title: t('members.details') }}
          />
          <Stack.Screen
            name="MemberForm"
            component={MemberFormScreen}
            options={({ route }) => ({
              title: route.params?.memberId
                ? t('memberForm.editTitle')
                : t('memberForm.newTitle'),
            })}
          />
          <Stack.Screen
            name="WorkoutForm"
            component={WorkoutFormScreen}
            options={({ route }) => ({
              title: route.params.workoutId
                ? t('workouts.editTitle')
                : t('workouts.newTitle'),
            })}
          />
          <Stack.Screen
            name="SessionForm"
            component={SessionFormScreen}
            options={{ title: t('sessions.title') }}
          />
          <Stack.Screen
            name="MemberProgress"
            component={ProgressScreen}
            options={{ title: t('progress.title') }}
          />
          <Stack.Screen
            name="Sync"
            component={SyncScreen}
            options={{ title: t('sync.title') }}
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
