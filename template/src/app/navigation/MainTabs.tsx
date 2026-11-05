import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import CalendarIcon from '@/assets/icons/calendar.svg';
import DocumentIcon from '@/assets/icons/document.svg';
import HomeIcon from '@/assets/icons/home.svg';
import SettingsIcon from '@/assets/icons/settings.svg';
import TasksIcon from '@/assets/icons/tasks.svg';
import { AgendaScreen } from '@/features/agenda/screens/AgendaScreen';
import { DocumentsScreen } from '@/features/documents/screens/DocumentsScreen';
import { HomeScreen } from '@/features/home/screens/HomeScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { TasksScreen } from '@/features/tasks/screens/TasksScreen';
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

const renderCalendarIcon = ({ color, size }: TabIconProps) => (
  <CalendarIcon color={color} width={size} height={size} />
);

const renderTasksIcon = ({ color, size }: TabIconProps) => (
  <TasksIcon color={color} width={size} height={size} />
);

const renderDocumentIcon = ({ color, size }: TabIconProps) => (
  <DocumentIcon color={color} width={size} height={size} />
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
        name="Agenda"
        component={AgendaScreen}
        options={{
          title: t('agenda.title'),
          tabBarIcon: renderCalendarIcon,
          tabBarButtonTestID: testIDs.officeTabs.agenda,
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          title: t('tasks.title'),
          tabBarIcon: renderTasksIcon,
          tabBarButtonTestID: testIDs.officeTabs.tasks,
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          title: t('documents.title'),
          tabBarIcon: renderDocumentIcon,
          tabBarButtonTestID: testIDs.officeTabs.documents,
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
