import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserStackParamList } from '../types';
import { ProfileScreen } from '@user/screens/profile';

const Stack = createNativeStackNavigator<UserStackParamList>();

interface UserNavigatorProps {
  onLogout: () => void;
}

export function UserNavigator({ onLogout }: UserNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
