import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import ChartIcon from '@/assets/icons/chart.svg';
import HomeIcon from '@/assets/icons/home.svg';
import SettingsIcon from '@/assets/icons/settings.svg';
import StarIcon from '@/assets/icons/star.svg';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { MarketsScreen } from '@/features/markets/screens/MarketsScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { WatchlistScreen } from '@/features/watchlist/screens/WatchlistScreen';
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

const renderStarIcon = ({ color, size }: TabIconProps) => (
  <StarIcon color={color} width={size} height={size} />
);

const renderChartIcon = ({ color, size }: TabIconProps) => (
  <ChartIcon color={color} width={size} height={size} />
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
        name="Watchlist"
        component={WatchlistScreen}
        options={{
          title: t('watchlist.title'),
          tabBarIcon: renderStarIcon,
          tabBarButtonTestID: testIDs.financeTabs.watchlist,
        }}
      />
      <Tab.Screen
        name="Markets"
        component={MarketsScreen}
        options={{
          title: t('markets.title'),
          tabBarIcon: renderChartIcon,
          tabBarButtonTestID: testIDs.financeTabs.markets,
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
