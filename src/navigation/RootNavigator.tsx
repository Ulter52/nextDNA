import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Screens & Navigators
import { SplashScreen } from '../screens/splashScreen';
import { AuthNavigator } from './navigators/AuthNavigator';
import { MainTabNavigator } from './navigators/MainTabNavigator';
import { UserNavigator } from './navigators/UserNavigator';
import { ReportNavigator } from './navigators/ReportNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  user: string | null;
  onLogout: () => void;
  onLoginSuccess: (user: string | null) => void;
}

export function RootNavigator({ user, onLogout, onLoginSuccess }: RootNavigatorProps) {
  const [isInitializing, setIsInitializing] = useState(true);

  const handleSplashReady = (savedUser: string | null) => {
    onLoginSuccess(savedUser);
    setIsInitializing(false);
  };

  if (isInitializing) {
    return <SplashScreen onReady={handleSplashReady} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth">
          {(props) => <AuthNavigator {...props} onLoginSuccess={onLoginSuccess} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen name="Main">
            {(props) => <MainTabNavigator {...props} user={user} onLogout={onLogout} />}
          </Stack.Screen>
          <Stack.Screen name="User" component={UserNavigator} />
          <Stack.Screen name="Reports" component={ReportNavigator} />
        </>
      )}
    </Stack.Navigator>
  );
}
