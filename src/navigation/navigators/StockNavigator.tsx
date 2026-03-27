import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StockDashboard } from '../../modules/stock/screens/stockDashboard';
import { ItemList } from '../../modules/stock/screens/itemList';
import { ItemDetail } from '../../modules/stock/screens/itemDetail';
import { ItemEdit } from '../../modules/stock/screens/itemEdit';
import { MaterialRequestList } from '../../modules/stock/screens/materialRequestList';
import { MaterialRequestEdit } from '../../modules/stock/screens/materialRequestEdit';
import { MaterialRequestDetail} from '../../modules/stock/screens/materialRequestDetail';
import { DeliveryNoteList } from '../../modules/stock/screens/deliveryNoteList';
import { DeliveryNoteEdit } from '../../modules/stock/screens/deliveryNoteEdit';
import { DeliveryNoteDetail } from '../../modules/stock/screens/deliveryNoteDetail';
import { SerialNoLedger } from '../../modules/stock/screens/serialNoLedger';
import { ItemPriceList } from '../../modules/stock/screens/itemPriceList';
import { ItemPriceEdit } from '../../modules/stock/screens/itemPriceEdit';
import { ItemPriceDetail} from '../../modules/stock/screens/itemPriceDetail';
import { PurchaseReceiptList } from '../../modules/stock/screens/purchaseReceiptList';
import { PurchaseReceiptEdit } from '../../modules/stock/screens/purchaseReceiptEdit';
import { PurchaseReceiptDetail } from '../../modules/stock/screens/purchaseReceiptDetail';


const Stack = createNativeStackNavigator();

export function StockNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StockDashboard" component={StockDashboard} />
      <Stack.Screen name="ItemList" component={ItemList} />
      <Stack.Screen name="ItemDetail" component={ItemDetail} />
      <Stack.Screen name="ItemEdit" component={ItemEdit} />
      <Stack.Screen name="MaterialRequestList" component={MaterialRequestList} />
      <Stack.Screen name="MaterialRequestEdit" component={MaterialRequestEdit} />
      <Stack.Screen name="MaterialRequestDetail" component={MaterialRequestDetail} />
      <Stack.Screen name="DeliveryNoteList" component={DeliveryNoteList} />
      <Stack.Screen name="DeliveryNoteEdit" component={DeliveryNoteEdit} />
      <Stack.Screen name="DeliveryNoteDetail" component={DeliveryNoteDetail} />
      <Stack.Screen name="SerialNoLedger" component={SerialNoLedger} />
      <Stack.Screen name="ItemPriceList" component={ItemPriceList} />
      <Stack.Screen name="ItemPriceEdit" component={ItemPriceEdit} />
      <Stack.Screen name="ItemPriceDetail" component={ItemPriceDetail} />
      <Stack.Screen name="PurchaseReceiptList" component={PurchaseReceiptList} />
      <Stack.Screen name="PurchaseReceiptEdit" component={PurchaseReceiptEdit} />
      <Stack.Screen name="PurchaseReceiptDetail" component={PurchaseReceiptDetail} />
    </Stack.Navigator>
  );
}
