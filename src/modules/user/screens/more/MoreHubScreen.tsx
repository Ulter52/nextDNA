import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, CommonActions } from '@react-navigation/native';

import { LogOut } from 'lucide-react-native';
import { STATIC_WORKSPACES, QUICK_ACTIONS } from '../../services/moreConfig';
import { styles } from './styles';
import { WorkspaceCard } from './WorkspaceCard';
import { ActionItem } from './ActionItem';
import { ProfileCard } from './ProfileCard';
import { colors, spacing } from '../../../../core/theme';
import { companyService } from '../../../../core/services/companyService';
import { getDateRanges } from '../../../../core/utils/dateHelpers';

export function MoreHubScreen({ onLogout }: { onLogout: () => void }) {
  const [user, setUser] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const ROUTE_MAP: Record<string, () => void | Promise<void>> = useMemo(() => ({
    // Tab Navigation
    dashboard: () => navigation.dispatch(CommonActions.navigate({ name: 'DashboardTab' })),
    selling: () => navigation.dispatch(CommonActions.navigate({ name: 'SellingTab' })),
    inventory: () => navigation.dispatch(CommonActions.navigate({ name: 'StockTab' })),
    stock: () => navigation.dispatch(CommonActions.navigate({ name: 'StockTab' })),

    // Module Navigation
    buying: () => navigation.navigate('Buying', { screen: 'Dashboard' }),
    financialreports: () => navigation.navigate('FinancialReports'),
    projects: () => navigation.navigate('Projects', { screen: 'ProjectList' }),
    users: () => navigation.navigate('User', { screen: 'UserList' }),
    settings: () => navigation.navigate('User', { screen: 'Profile' }),

    // Quick Actions Navigation (from moreConfig.ts)
    customers: () => navigation.navigate('Customers', { screen: 'CustomerList' }),
    quotations: () => navigation.navigate('SellingTab', { screen: 'QuotationList' }),
    payments: () => navigation.navigate('AccountingTab', { screen: 'PaymentEntryList' }),
    shipping: () => navigation.navigate('StockTab', { screen: 'DeliveryNoteList' }),
    hr: () => navigation.navigate('HR', { screen: 'EmployeeList' }),

    // Transaction/Form Navigation
    addpurchaseinvoice: () => navigation.navigate('Buying', { screen: 'PurchaseInvoiceEdit' }),
    addproject: () => navigation.navigate('Projects', { screen: 'ProjectEdit' }),
    addsupplier: () => navigation.navigate('Buying', { screen: 'SupplierEdit' }),
    
    // Report Viewer Navigation
    stocksummary: async () => {
      const companyData = await companyService.ensureCompanySelected();
      const ranges = getDateRanges();
      
      navigation.navigate('FinancialReports', {
        screen: 'ReportViewer',
        params: {
          reportId: 'Total Stock Summary',
          reportName: 'Total Stock Summary',
          filters: {
            company: companyData?.name,
            from_date: ranges.financialYear.from_date,
            to_date: ranges.financialYear.to_date,
            valuation_field: 'valuation_rate'
          }
        }
      });
    },
  }), [navigation]);

  const handleNavigate = useCallback(async (route: string) => {
    const normalizedRoute = route.toLowerCase();
    const action = ROUTE_MAP[normalizedRoute];
    if (action) {
      await action();
    } else {
      console.warn(`Routing failed: No definition found for "${route}"`);
    }
  }, [ROUTE_MAP]);

  const renderItem = ({ item }: any) => {
    switch (item.type) {
      case 'profile':
        return (
          <View>
            <Text style={styles.sectionTitle}>Profile</Text>
            <ProfileCard
              user={user}
              onPress={() => handleNavigate('settings')}
            />
          </View>
        );

      case 'workspaces':
        return (
          <View>
            <Text style={styles.sectionTitle}>Workspaces</Text>
            <View style={styles.workspaceGrid}>
              <FlatList
                data={STATIC_WORKSPACES.filter(ws => ws.visible)}
                keyExtractor={(item) => item.name}
                numColumns={2}
                columnWrapperStyle={{ gap: spacing.md }}
                contentContainerStyle={{ gap: spacing.md }}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <WorkspaceCard
                    item={item}
                    onPress={() => handleNavigate(item.route)}
                  />
                )}
              />
            </View>
          </View>
        );

      case 'actions':
        return (
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionContainer}>
              {QUICK_ACTIONS.map((item) => (
                <ActionItem
                  key={item.id}
                  item={item}
                  onPress={() => handleNavigate(item.id)}
                />
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
      </View>

      <FlatList
        data={[{ type: 'profile' }, { type: 'workspaces' }, { type: 'actions' }]}
        keyExtractor={(item) => item.type}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onLogout}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <LogOut size={18} color={colors.red_600} />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
