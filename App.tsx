import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setLogoutHandler } from './src/core/api/client';

// 🔥 React Query
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// 🔥 Create Query Client (move later to core/query if you want)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 24 * 60 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// 🔥 AsyncStorage persister
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('erp_user');

    // 🔥 IMPORTANT: clear query cache on logout
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
    >
      <NavigationContainer>
        <RootNavigator
          user={user}
          onLogout={handleLogout}
          onLoginSuccess={handleLoginSuccess}
        />
      </NavigationContainer>
    </PersistQueryClientProvider>
  );
}