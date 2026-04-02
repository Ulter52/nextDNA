import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BuyingStackParamList } from '../types';
import { BuyingHubScreen } from '../../modules/buying/screens/dashboard';
import { PurchaseOrderList } from '../../modules/buying/screens/purchaseOrderList';
import { PurchaseOrderDetail } from '../../modules/buying/screens/purchaseOrderDetail';
import { PurchaseOrderEdit } from '../../modules/buying/screens/purchaseOrderEdit';
import { PurchaseInvoiceList } from '../../modules/buying/screens/purchaseInvoiceList';
import { PurchaseInvoiceDetail } from '../../modules/buying/screens/purchaseInvoiceDetail';
import { PurchaseInvoiceEdit } from '../../modules/buying/screens/purchaseInvoiceEdit';
import { SupplierList } from '../../modules/buying/screens/supplierList';
import { SupplierDetail } from '../../modules/buying/screens/supplierDetail';
import { SupplierEdit } from '../../modules/buying/screens/supplierEdit';

const Stack = createNativeStackNavigator<BuyingStackParamList>();

export function BuyingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Dashboard" component={BuyingHubScreen} />
      <Stack.Screen name="PurchaseOrderList" component={PurchaseOrderList} />
      <Stack.Screen name="PurchaseOrderDetail" component={PurchaseOrderDetail} />
      <Stack.Screen name="PurchaseOrderEdit" component={PurchaseOrderEdit} />
      <Stack.Screen name="PurchaseInvoiceList" component={PurchaseInvoiceList} />
      <Stack.Screen name="PurchaseInvoiceDetail" component={PurchaseInvoiceDetail} />
      <Stack.Screen name="PurchaseInvoiceEdit" component={PurchaseInvoiceEdit} />
      <Stack.Screen name="SupplierList" component={SupplierList} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetail} />
      <Stack.Screen name="SupplierEdit" component={SupplierEdit} />
    </Stack.Navigator>
  );
}
