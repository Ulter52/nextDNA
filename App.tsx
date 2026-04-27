import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setLogoutHandler } from './src/core/api/client';

// 🔥 React Query
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// 🔥 Create Query Client with Production Hardening
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, 
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'OFFLINE_CACHE',
});

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('erp_user');
    queryClient.clear();
  };

  useEffect(() => {
    setLogoutHandler(handleLogout);
  }, []);

  const handleLoginSuccess = async (userName: string | null) => {
    setUser(userName);
    if (userName) {
      await AsyncStorage.setItem('erp_user', userName);
    }
  };

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ 
          persister,
          maxAge: 24 * 60 * 60 * 1000,
        }}
      >
        <NavigationContainer>
          <RootNavigator
            user={user}
            onLogout={handleLogout}
            onLoginSuccess={handleLoginSuccess}
          />
        </NavigationContainer>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
