import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../navigation/components/Header';
import { useNavigation } from '@react-navigation/native';

interface ModuleLayoutProps {
  title: string;
  user: string | null;
  children: React.ReactNode;
  onProfileClick?: () => void;
  showBack?: boolean;
  hideHeaderRight?: boolean;
}

export function ModuleLayout({ 
  title, 
  user, 
  children, 
  onProfileClick,
  showBack,
  hideHeaderRight = false
}: ModuleLayoutProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Header
        title={title}
        user={user}
        onProfileClick={onProfileClick || (() => {})}
        onBack={showBack ? () => navigation.goBack() : undefined}
        hideRightIcons={hideHeaderRight}
      />
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
});
