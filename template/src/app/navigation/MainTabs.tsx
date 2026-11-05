import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import HomeIcon from '@/assets/icons/home.svg';
import MembersIcon from '@/assets/icons/members.svg';
import SettingsIcon from '@/assets/icons/settings.svg';
import { MembersScreen } from '@/features/fitness/screens/MembersScreen';
import { SyncManager } from '@/features/fitness/sync/SyncManager';
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

const renderMembersIcon = ({ color, size }: TabIconProps) => (
  <MembersIcon color={color} width={size} height={size} />
);

// Fitness: keeps the offline data in sync while the signed-in app is open.
const renderLayout = ({ children }: { children: ReactNode }) => (
  <>
    <SyncManager />
    {children}
  </>
);

const renderSettingsIcon = ({ color, size }: TabIconProps) => (
  <SettingsIcon color={color} width={size} height={size} />
);

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator layout={renderLayout}>
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
        name="Members"
        component={MembersScreen}
        options={{
          title: t('members.title'),
          tabBarIcon: renderMembersIcon,
          tabBarButtonTestID: testIDs.fitnessTabs.members,
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
