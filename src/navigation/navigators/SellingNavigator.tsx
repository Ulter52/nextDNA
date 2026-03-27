import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SellingStackParamList } from '../types';

// Screens
import { SellingHubScreen } from '@sellingScreens/dashboard';
import { SalesOrderList } from '@sellingScreens/salesOrderList';
import { SalesOrderDetail } from '@sellingScreens/salesOrderDetail';
import { NewSalesOrder } from '@sellingScreens/newSalesOrder';
import { CustomerList } from '@sellingScreens/customerList';
import { NewCustomer } from '@sellingScreens/newCustomer';
import { CustomerDetail } from '@sellingScreens/customerDetail';
import { QuotationList } from '@sellingScreens/quotationList';
import { QuotationDetail } from '@sellingScreens/quotationDetail';
import { NewQuotation } from '@sellingScreens/newQuotation';
import { SalesInvoiceList } from '@sellingScreens/salesInvoiceList';
import { SalesInvoiceDetail } from '@sellingScreens/salesInvoiceDetail';
import { NewSalesInvoice } from '@sellingScreens/newSalesInvoice';

const Stack = createNativeStackNavigator<SellingStackParamList>();

export function SellingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellingHub" component={SellingHubScreen} />
      <Stack.Screen name="SalesOrderList" component={SalesOrderList} />
      <Stack.Screen name="SalesOrderDetail" component={SalesOrderDetail} />
      <Stack.Screen name="NewSalesOrder" component={NewSalesOrder} />
      <Stack.Screen name="CustomerList" component={CustomerList} />
      <Stack.Screen name="NewCustomer" component={NewCustomer} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetail} />
      <Stack.Screen name="QuotationList" component={QuotationList} />
      <Stack.Screen name="QuotationDetail" component={QuotationDetail} />
      <Stack.Screen name="NewQuotation" component={NewQuotation} />
      <Stack.Screen name="SalesInvoiceList" component={SalesInvoiceList} />
      <Stack.Screen name="SalesInvoiceDetail" component={SalesInvoiceDetail} />
      <Stack.Screen name="NewSalesInvoice" component={NewSalesInvoice} />
    </Stack.Navigator>
  );
}
