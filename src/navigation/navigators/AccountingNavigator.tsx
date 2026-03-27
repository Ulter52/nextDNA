import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AccountingDashboard } from '@accounting/screens/accountingDashboard';
import { PaymentEntryList } from '@accounting/screens/paymentEntryList';
import { PaymentEntryDetail } from '@accounting/screens/paymentEntryDetail';
import { PaymentEntryEdit } from '@accounting/screens/paymentEntryEdit';
import { JournalEntryList } from '@accounting/screens/journalEntryList';
import { JournalEntryDetail } from '@accounting/screens/journalEntryDetail';
import { JournalEntryEdit } from '@accounting/screens/journalEntryEdit';
import { TrialBalance } from '@accounting/screens/trialBalance';

const Stack = createNativeStackNavigator();

export function AccountingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccountingHub" component={AccountingDashboard} />
      <Stack.Screen name="PaymentEntryList" component={PaymentEntryList} />
      <Stack.Screen name="PaymentEntryDetail" component={PaymentEntryDetail} />
      <Stack.Screen name="PaymentEntryEdit" component={PaymentEntryEdit} />
      <Stack.Screen name="JournalEntryList" component={JournalEntryList} />
      <Stack.Screen name="JournalEntryDetail" component={JournalEntryDetail} />
      <Stack.Screen name="JournalEntryEdit" component={JournalEntryEdit} />
      <Stack.Screen name="TrialBalance" component={TrialBalance} />
    </Stack.Navigator>
  );
}
