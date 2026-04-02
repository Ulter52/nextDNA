import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreHubScreen } from '../../modules/user/screens/more/MoreHubScreen';
import { UserNavigator } from './UserNavigator';
import { ReportNavigator } from './ReportNavigator';
import { ProjectsNavigator } from './ProjectsNavigator';
import { BuyingNavigator } from './BuyingNavigator';
import { MoreStackParamList } from '../types';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHub">
        {(props) => <MoreHubScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="User" component={UserNavigator} />
      <Stack.Screen name="FinancialReports" component={ReportNavigator} />
      <Stack.Screen name="Projects" component={ProjectsNavigator} />
      <Stack.Screen name="Buying" component={BuyingNavigator} />
    </Stack.Navigator>
  );
}
