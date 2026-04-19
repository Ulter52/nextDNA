import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, DeviceEventEmitter, FlatList } from 'react-native';
import { Users, FileText, FileCheck, Receipt, Plus, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '../../../navigation/types';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSalesStats } from '../../hooks/sellingQueries';
import { colors, spacing, shadow, moderateScale } from '../../../../core/theme';
import { MonthlyRevenueTrends } from '../../components/MonthlyRevenueTrends';
import { companyService } from '../../../../core/services/companyService';
import { styles } from './styles';

export function SellingHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();
  const [user, setUser] = useState<string | null>(null);
  const [fiscalYearLabel, setFiscalYearLabel] = useState('...');
  
  const { data, isLoading, refetch, isRefetching } = useSalesStats();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    
    // Load FY label from companyService
    companyService.getFiscalYear().then(fy => {
      if (fy) setFiscalYearLabel(fy.name);
    });

    // Listen for company changes to refresh data
    const subscription = DeviceEventEmitter.addListener('company_changed', () => {
      refetch();
    });
    return () => subscription.remove();
  }, [refetch]);

  const handleNavigate = useCallback((id: string) => {
    switch (id) {
      case 'CustomerList': navigation.navigate('CustomerList'); break;
      case 'QuotationList': navigation.navigate('QuotationList'); break;
      case 'SalesOrderList': navigation.navigate('SalesOrderList'); break;
      case 'SalesInvoiceList': navigation.navigate('SalesInvoiceList'); break;
      case 'NewSalesOrder': navigation.navigate('NewSalesOrder'); break;
      case 'NewCustomer': navigation.navigate('NewCustomer'); break;
      default: console.log('Action not implemented:', id);
    }
  }, [navigation]);

  const mainActions = useMemo(() => [
    { id: 'CustomerList', label: 'Customer', icon: Users, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'QuotationList', label: 'Quotation', icon: FileText, color: colors.orange_600, bgColor: colors.orange_100 },
    { id: 'SalesOrderList', label: 'Sales Order', icon: FileCheck, color: colors.success, bgColor: colors.green_100 },
    { id: 'SalesInvoiceList', label: 'Sales Invoice', icon: Receipt, color: colors.error, bgColor: colors.red_100 },
  ], []);

  // Design matching Stock/Accounting module
  const quickActions = useMemo(() => [
    { id: 'NewSalesOrder', label: 'Create New Sales Order', icon: Plus, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'NewCustomer', label: 'Add New Customer', icon: Plus, color: colors.success, bgColor: colors.green_100 },
  ], []);

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      <MonthlyRevenueTrends 
        data={data} 
        isLoading={isLoading} 
        fiscalYearLabel={fiscalYearLabel} 
      />

      <View style={styles.actionGrid}>
        {mainActions.map((item) => {
          const Icon = item.lucideIcon || item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.actionItem}
              activeOpacity={0.7}
              onPress={() => handleNavigate(item.id)}
            >
              <View style={[styles.actionIconBox, { backgroundColor: item.bgColor }]}>
                {/* @ts-ignore */}
                <Icon size={24} color={item.color === colors.error ? '#ef4444' : item.color} />
              </View>
              <Text style={styles.actionLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>
    </View>
  );

  const renderQuickAction = ({ item }: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={styles.quickActionItem}
        activeOpacity={0.7}
        onPress={() => handleNavigate(item.id)}
      >
        <View style={styles.quickActionLeft}>
          <View style={[styles.quickActionIconBox, { backgroundColor: item.bgColor }]}>
            <Icon size={18} color={item.color} />
          </View>
          <Text style={styles.quickActionLabel}>{item.label}</Text>
        </View>
        <ChevronRight size={16} color={colors.text_tertiary} />
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Selling" user={user}>
      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuickAction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      />
    </ModuleLayout>
  );
}


