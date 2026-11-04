import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import HomeIcon from '@/assets/icons/home.svg';
import SettingsIcon from '@/assets/icons/settings.svg';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { testIDs } from '@/utils/testIDs';

import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface TabIconProps {
  color: string;
  size: number;
}

const renderHomeIcon = ({ color, size }: TabIconProps) => (
  <HomeIcon color={color} width={size} height={size} />
);

const renderSettingsIcon = ({ color, size }: TabIconProps) => (
  <SettingsIcon color={color} width={size} height={size} />
);

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('home.title'),
          tabBarLabel: t('tabs.home'),
          tabBarIcon: renderHomeIcon,
          tabBarButtonTestID: testIDs.tabs.home,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('settings.title'),
          tabBarLabel: t('tabs.settings'),
          tabBarIcon: renderSettingsIcon,
          tabBarButtonTestID: testIDs.tabs.settings,
        }}
      />
    </Tab.Navigator>
  );
}
