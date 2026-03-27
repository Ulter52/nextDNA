import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreHubScreen } from '../../modules/user/screens/more/MoreHubScreen';
import { FinancialReportsScreen } from '../../modules/report/screens/financialReports';

const Stack = createNativeStackNavigator();

export function MoreNavigator({ onLogout }: { onLogout: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHub">
        {(props) => <MoreHubScreen {...props} onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="FinancialReports" component={FinancialReportsScreen} />
    </Stack.Navigator>
  );
}
