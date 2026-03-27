import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { dashboardService } from '../../services/dashboardService';
import { SalesStats } from '../../types';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

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
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [agingModalVisible, setAgingModalVisible] = useState(false);
  
  const navigation = useNavigation<any>();

  const fetchStats = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else if (!stats) setLoading(true); // Only show full loader if no data exists

    setError(null);
    try {
      const data = await dashboardService.getDashboardStats(force);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [stats]);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);

  const agingData = stats?.collections?.aging_ranges || [
    { range: '0-30', amount: 0, color: '#10b981' },
    { range: '31-60', amount: 0, color: '#f59e0b' },
    { range: '61-90', amount: 0, color: '#f97316' },
    { range: '91-120', amount: 0, color: '#ef4444' },
    { range: '121+', amount: 0, color: '#b91c1c' }
  ];

  return (
    <ModuleLayout title="Overview" user={user}>
      {loading && !stats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
          }
        >
          <AlertSection alerts={stats?.alerts} />

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
              collections={stats?.collections || { cash_sales: 0, credit_sales: 0, total_outstanding: 0, efficiency: 0 }}
              totalSales={stats?.total_sales || 0}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.headerWithAction}>
              <Text style={styles.sectionLabel}>Receivables Aging</Text>
              <TouchableOpacity onPress={() => setAgingModalVisible(true)}>
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
              <TouchableOpacity onPress={() => navigation.navigate('SellingTab', { screen: 'SalesInvoiceList' })}>
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
