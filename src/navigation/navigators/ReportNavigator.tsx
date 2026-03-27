import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ReportsStackParamList } from '../types';

// Screens
import { FinancialReportsScreen } from '../../modules/report/screens/financialReports';

const Stack = createNativeStackNavigator<ReportsStackParamList>();

export function ReportNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // We use ModuleLayout's custom header instead
      }}
    >
      <Stack.Screen 
        name="ReportsHub" 
        component={FinancialReportsScreen} 
      />
    </Stack.Navigator>
  );
}
