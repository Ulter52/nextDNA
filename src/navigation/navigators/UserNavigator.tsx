import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UserStackParamList } from '../types';
import { ProfileScreen } from '@user/screens/profile';
import { UserList } from '@user/screens/userList';
import { UserDetail } from '@user/screens/userDetail';
import { UserEdit } from '@user/screens/userEdit';

const Stack = createNativeStackNavigator<UserStackParamList>();

interface UserNavigatorProps {
  onLogout: () => void;
}

export function UserNavigator({ onLogout }: UserNavigatorProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserList" component={UserList} />
      <Stack.Screen name="UserDetail" component={UserDetail} />
      <Stack.Screen name="UserEdit" component={UserEdit} />
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
