import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, ShoppingBag, Package, MoreHorizontal } from 'lucide-react-native';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'selling', label: 'Selling', icon: ShoppingBag },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Icon 
              size={22} 
              color={isActive ? '#2563eb' : '#9ca3af'} 
              strokeWidth={isActive ? 2.5 : 2} 
            />
            <Text style={[
              styles.label, 
              isActive ? styles.labelActive : styles.labelInactive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#2563eb',
  },
  labelInactive: {
    color: '#9ca3af',
  },
});
