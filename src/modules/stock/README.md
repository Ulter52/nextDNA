# React Native Stock Module

This folder contains the Stock module.

## Requirements
- `react-native` or `expo`
- `lucide-react-native` (for icons)
- `axios` (for API calls)

## Installation
1. Copy this folder into your React Native project (e.g., into `src/modules/stock`).
2. Install dependencies:
   ```bash
   npm install lucide-react-native axios
   ```
3. Update `erpService.ts` with your actual ERPNext API URL and authentication method (e.g., AsyncStorage for tokens).

## Usage
Import the `StockModule` component to display the main menu, and use your app's navigation (like React Navigation) to route to the individual list components exported from `StockTransactions.tsx`, `StockReports.tsx`, and `SerialBatch.tsx`.

### Example Navigation Setup
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StockModule } from './react-native-stock-module/StockModule';
import { MaterialRequestList } from './react-native-stock-module/StockTransactions';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="StockMenu">
          {(props) => <StockModule onNavigate={(route) => props.navigation.navigate(route)} />}
        </Stack.Screen>
        <Stack.Screen name="material-request" component={MaterialRequestList} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```
