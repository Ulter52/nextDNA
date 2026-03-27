import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Wallet, Landmark,
  Plus, FileText, BarChart3, Receipt, FilePlus, ChevronRight
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatCurrency } from '../../../../core/utils/formatters';
import { useAccountingStats } from '../../hooks/accountingQueries';
import { styles } from './styles';
import { colors, spacing } from '../../../../core/theme';

export function AccountingDashboard() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<string | null>(null);

  const { 
    data: stats, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useAccountingStats();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const mainActions = useMemo(() => [
    { id: 'payment_list', label: 'Payment Entries', icon: Receipt, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'journal_list', label: 'Journal Entries', icon: FileText, color: colors.purple_500, bgColor: colors.purple_100 },
  ], []);

  const quickActions = useMemo(() => [
    { id: 'trial_balance', label: 'Financial Health (Trial Balance)', icon: BarChart3, color: colors.success, bgColor: colors.success + '15' },
    { id: 'add_payment', label: 'Add New Payment Entry', icon: Plus, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'add_journal', label: 'Add New Journal Entry', icon: FilePlus, color: colors.purple_500, bgColor: colors.purple_100 },
  ], []);

  const handleAction = useCallback((id: string) => {
    switch (id) {
      case 'payment_list': 
        navigation.navigate('PaymentEntryList'); 
        break;
      case 'journal_list': 
        navigation.navigate('JournalEntryList'); 
        break;
      case 'trial_balance': 
        navigation.navigate('TrialBalance'); 
        break;
      case 'add_payment': 
        navigation.navigate('PaymentEntryEdit'); 
        break;
      case 'add_journal': 
        navigation.navigate('JournalEntryEdit'); 
        break;
      default: 
        console.log('Action not implemented:', id);
    }
  }, [navigation]);

  const formatAmount = useCallback((amount: number) => {
    const formatted = formatCurrency(amount, 'INR');
    return formatted.split('.')[0];
  }, []);

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      <View style={styles.bankCardsContainer}>
        <View style={[styles.bankCard, { backgroundColor: colors.primary }]}>
          <View style={styles.cardHeader}>
            <Landmark size={18} color={colors.blue_100} />
            <Text style={styles.cardType}>Bank Balance</Text>
          </View>
          <Text style={styles.balance}>{formatAmount(stats?.bank_balance || 0)}</Text>
          <Text style={styles.cardMeta}>Total Funds</Text>
        </View>
        <View style={[styles.bankCard, { backgroundColor: colors.neutral_800 }]}>
          <View style={styles.cardHeader}>
            <Wallet size={18} color={colors.neutral_400} />
            <Text style={styles.cardType}>Cash In Hand</Text>
          </View>
          <Text style={styles.balance}>{formatAmount(stats?.cash_balance || 0)}</Text>
          <Text style={styles.cardMeta}>Liquid Assets</Text>
        </View>
      </View>

      <View style={styles.actionGrid}>
        {mainActions.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.actionItem}
              activeOpacity={0.7}
              onPress={() => handleAction(item.id)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: item.bgColor }]}>
                <Icon size={24} color={item.color} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
    </View>
  );

  const renderQuickAction = useCallback(({ item }: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={styles.quickActionListItem}
        activeOpacity={0.7}
        onPress={() => handleAction(item.id)}
      >
        <View style={styles.quickActionLeft}>
          <View style={[styles.quickActionIconBox, { backgroundColor: item.bgColor }]}>
            <Icon size={20} color={item.color} />
          </View>
          <Text style={styles.quickActionLabel}>{item.label}</Text>
        </View>
        <ChevronRight size={18} color={colors.text_tertiary} />
      </TouchableOpacity>
    );
  }, [handleAction]);

  if (isLoading && !stats) {
    return (
      <ModuleLayout title="Accounting" user={user}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Accounting" user={user}>
      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuickAction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={colors.primary} 
          />
        }
      />
    </ModuleLayout>
  );
}
