import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/app/store/hooks';
import BagIcon from '@/assets/icons/bag.svg';
import CartIcon from '@/assets/icons/cart.svg';
import HeartIcon from '@/assets/icons/heart.svg';
import HomeIcon from '@/assets/icons/home.svg';
import SettingsIcon from '@/assets/icons/settings.svg';
import { selectCartCount } from '@/features/cart/cartSlice';
import { CartScreen } from '@/features/cart/screens/CartScreen';
import { CatalogScreen } from '@/features/catalog/screens/CatalogScreen';
import { FavoritesScreen } from '@/features/favorites/screens/FavoritesScreen';
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

const renderBagIcon = ({ color, size }: TabIconProps) => (
  <BagIcon color={color} width={size} height={size} />
);

const renderHeartIcon = ({ color, size }: TabIconProps) => (
  <HeartIcon color={color} width={size} height={size} />
);

const renderCartIcon = ({ color, size }: TabIconProps) => (
  <CartIcon color={color} width={size} height={size} />
);

const renderSettingsIcon = ({ color, size }: TabIconProps) => (
  <SettingsIcon color={color} width={size} height={size} />
);

export function MainTabs() {
  const { t } = useTranslation();
  const cartCount = useAppSelector(selectCartCount);
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
        name="Shop"
        component={CatalogScreen}
        options={{
          title: t('catalog.title'),
          tabBarLabel: t('shoppingTabs.shop'),
          tabBarIcon: renderBagIcon,
          tabBarButtonTestID: testIDs.shoppingTabs.shop,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          title: t('favorites.title'),
          tabBarLabel: t('shoppingTabs.favorites'),
          tabBarIcon: renderHeartIcon,
          tabBarButtonTestID: testIDs.shoppingTabs.favorites,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: t('cart.title'),
          tabBarLabel: t('shoppingTabs.cart'),
          tabBarIcon: renderCartIcon,
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarButtonTestID: testIDs.shoppingTabs.cart,
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
