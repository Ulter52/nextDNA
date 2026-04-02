import React, { useState, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { Home, ShoppingBag, Package, Landmark, MoreHorizontal } from 'lucide-react-native';
import { View } from 'react-native';

// Navigators & Screens
import { DashboardScreen } from '../../modules/dashboard/screens/dashboardScreen';
import { SellingNavigator } from './SellingNavigator';
import { StockNavigator } from './StockNavigator';
import { AccountingNavigator } from './AccountingNavigator';
import { MoreNavigator } from './MoreNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabNavigatorProps {
  user: string | null;
  onLogout: () => void;
}

export function MainTabNavigator({ user, onLogout }: MainTabNavigatorProps) {
  const [userName, setUserName] = useState<string | null>(user);

  useEffect(() => {
    if (!userName) {
      AsyncStorage.getItem('erp_user').then(setUserName);
    }
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: 70,
          paddingBottom: 15,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = 22;
          const strokeWidth = focused ? 2.5 : 2;

          switch (route.name) {
            case 'DashboardTab':
              return <Home size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'SellingTab':
              return <ShoppingBag size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'StockTab':
              return <Package size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'AccountingTab':
              return <Landmark size={iconSize} color={color} strokeWidth={strokeWidth} />;
            case 'More':
              return <MoreHorizontal size={iconSize} color={color} strokeWidth={strokeWidth} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="SellingTab"
        component={SellingNavigator}
        options={{ title: 'Selling' }}
      />
      <Tab.Screen
        name="StockTab"
        component={StockNavigator}
        options={{ title: 'Stock' }}
      />
      <Tab.Screen
        name="AccountingTab"
        component={AccountingNavigator}
        options={{ title: 'Accounting' }}
      />
      <Tab.Screen
        name="More"
      >
        {(props) => <MoreNavigator {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
