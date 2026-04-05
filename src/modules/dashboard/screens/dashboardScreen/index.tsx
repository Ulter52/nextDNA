import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDashboardStats } from '../../hooks/dashboardQueries';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';

// Modular Components
import { AlertSection } from '../../components/alertSection';
import { RevenueHero } from '../../components/revenueHero';
import { CollectionMetrics } from '../../components/collectionMetrics';
import { AgingChart } from '../../components/agingChart';
import { HealthGrid } from '../../components/healthGrid';
import { ConversionFunnel } from '../../components/conversionFunnel';
import { RecentInvoices } from '../../components/recentInvoices';
import { AgingReportModal } from '../../components/agingChart/agingReportModal';
import { styles } from './styles';

export function DashboardScreen() {
  const [user, setUser] = useState<string | null>(null);
  const [agingModalVisible, setAgingModalVisible] = useState(false);
  
  const navigation = useNavigation<any>();

  const { 
    data: stats, 
    isLoading, 
    isRefetching, 
    error, 
    refetch 
  } = useDashboardStats();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const agingData = useMemo(() => stats?.collections?.aging_ranges || [
    { range: '0-30', amount: 0, color: '#10b981' },
    { range: '31-60', amount: 0, color: '#f59e0b' },
    { range: '61-90', amount: 0, color: '#f97316' },
    { range: '91-120', amount: 0, color: '#ef4444' },
    { range: '121+', amount: 0, color: '#b91c1c' }
  ], [stats?.collections?.aging_ranges]);

  const onRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <ModuleLayout title="Overview" user={user}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#ef4444', fontWeight: '600', marginBottom: 8 }}>Unable to load dashboard</Text>
          <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
            {(error as any).message || 'An unexpected error occurred while fetching your stats.'}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ModuleLayout>
    );
  }

  const collectionsData = useMemo(() => stats?.collections || { 
    cash_sales: 0, 
    credit_sales: 0, 
    total_outstanding: 0, 
    efficiency: 0 
  }, [stats?.collections]);

  return (
    <ModuleLayout title="Overview" user={user}>
      {isLoading && !stats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={{ marginTop: 12, color: '#64748b' }}>Preparing your dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#2563eb" />
          }
        >
          {stats?.alerts && stats.alerts.length > 0 && (
            <AlertSection alerts={stats.alerts} />
          )}

          <RevenueHero
            monthlySales={stats?.monthly_sales || 0}
            trend={stats?.trend || 0}
            fyMonthlySales={stats?.fy_monthly_sales}
            prevFyMonthlySales={stats?.prev_fy_monthly_sales}
          />

          <View style={styles.section}>
            <View style={styles.headerWithAction}>
              <Text style={styles.sectionLabel}>Collections & Cash Flow</Text>
            </View>
            <CollectionMetrics
              collections={collectionsData}
              totalSales={stats?.total_sales || 0}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.headerWithAction}>
              <Text style={styles.sectionLabel}>Receivables Aging</Text>
              <TouchableOpacity onPress={() => setAgingModalVisible(true)} activeOpacity={0.6}>
                <Text style={styles.actionText}>Aging Report</Text>
              </TouchableOpacity>
            </View>
            <AgingChart agingData={agingData} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Business Health</Text>
            <HealthGrid profitability={stats?.profitability} inventory={stats?.inventory} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Conversion Funnel</Text>
            <ConversionFunnel conversion={stats?.conversion} />
          </View>

          <View style={styles.section}>
            <View style={styles.headerWithAction}>
              <Text style={styles.sectionLabel}>Recent Invoices</Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('SellingTab', { screen: 'SalesInvoiceList' })}
                activeOpacity={0.6}
              >
                <Text style={styles.actionText}>View All</Text>
              </TouchableOpacity>
            </View>
            <RecentInvoices invoices={stats?.recent_orders || []} />
          </View>
        </ScrollView>
      )}

      <AgingReportModal 
        visible={agingModalVisible} 
        onClose={() => setAgingModalVisible(false)} 
        agingData={agingData} 
      />
    </ModuleLayout>
  );
}
