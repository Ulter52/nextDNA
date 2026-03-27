import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { 
  BarChart3, PieChart, FileText, ChevronRight, 
  TrendingUp, TrendingDown, Wallet, Clock, 
  ShoppingCart, Package, Truck, Receipt,
  BarChart, ArrowUpRight, Search
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { reportService } from '../../services/reportService';
import { AgingReport } from '../../components/AgingReport';
import { SummaryStat } from '../../components/SummaryStat';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReportGroup {
  title: string;
  icon: any;
  color: string;
  reports: {
    id: string;
    name: string;
    desc: string;
    route: string;
  }[];
}

export function FinancialReportsScreen() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Replace with actual company from context/settings
      const data = await reportService.getReportOverview('Your Company Name');
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reportGroups: ReportGroup[] = [
    {
      title: 'Sales Reports',
      icon: ShoppingCart,
      color: '#2563eb',
      reports: [
        { id: 'sales_analytics', name: 'Sales Analytics', desc: 'Trends by Item/Customer', route: 'SalesAnalytics' },
        { id: 'sales_register', name: 'Sales Register', desc: 'Detailed invoice log', route: 'SalesRegister' },
        { id: 'quotation_trends', name: 'Quotation Trends', desc: 'Conversion analysis', route: 'QuotationTrends' },
      ]
    },
    {
      title: 'Stock Reports',
      icon: Package,
      color: '#10b981',
      reports: [
        { id: 'stock_summary', name: 'Stock Summary', desc: 'Current balance & value', route: 'StockSummary' },
        { id: 'stock_ledger', name: 'Stock Ledger', desc: 'Transaction history', route: 'StockLedger' },
        { id: 'low_stock', name: 'Low Stock', desc: 'Items below reorder level', route: 'LowStock' },
      ]
    },
    {
      title: 'Financial Statements',
      icon: BarChart3,
      color: '#8b5cf6',
      reports: [
        { id: 'pl', name: 'Profit and Loss', desc: 'Revenue vs Expenses', route: 'ProfitAndLoss' },
        { id: 'bs', name: 'Balance Sheet', desc: 'Assets & Liabilities', route: 'BalanceSheet' },
        { id: 'cf', name: 'Cash Flow', desc: 'Cash movement analysis', route: 'CashFlow' },
      ]
    },
    {
      title: 'Accounts Receivable/Payable',
      icon: Clock,
      color: '#f59e0b',
      reports: [
        { id: 'ar_summary', name: 'AR Summary', desc: 'Customer aging report', route: 'ARSummary' },
        { id: 'ap_summary', name: 'AP Summary', desc: 'Supplier aging report', route: 'APSummary' },
      ]
    },
    {
      title: 'Purchase Reports',
      icon: Truck,
      color: '#ef4444',
      reports: [
        { id: 'purchase_analytics', name: 'Purchase Analytics', desc: 'Buying trends', route: 'PurchaseAnalytics' },
        { id: 'purchase_register', name: 'Purchase Register', desc: 'Detailed purchase log', route: 'PurchaseRegister' },
      ]
    }
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ModuleLayout title="Reports Hub" user={user}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 1. Quick Global Stats */}
        <View style={styles.summaryGrid}>
          <SummaryStat 
            label="Net Profit" 
            value={stats?.net_profit || 0} 
            icon={TrendingUp} 
            color="#10b981" 
            trend={4.2}
          />
          <SummaryStat 
            label="Expenses" 
            value={stats?.total_expenses || 0} 
            icon={TrendingDown} 
            color="#ef4444" 
            trend={-2.1}
          />
        </View>

        {/* 2. Mini Aging Component */}
        <AgingReport data={stats?.receivables || []} title="Collection Aging (Lakhs)" />

        {/* 3. Report Groups */}
        <View style={styles.groupsContainer}>
          {reportGroups.map((group, idx) => {
            const GroupIcon = group.icon;
            return (
              <View key={idx} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIconBox, { backgroundColor: `${group.color}15` }]}>
                    <GroupIcon size={20} color={group.color} />
                  </View>
                  <Text style={styles.groupTitle}>{group.title}</Text>
                </View>
                
                <View style={styles.reportList}>
                  {group.reports.map((report) => (
                    <TouchableOpacity 
                      key={report.id} 
                      style={styles.reportRow}
                      onPress={() => navigation.navigate(report.route)}
                    >
                      <View style={styles.reportInfo}>
                        <Text style={styles.reportName}>{report.name}</Text>
                        <Text style={styles.reportDesc}>{report.desc}</Text>
                      </View>
                      <ChevronRight size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* 4. Search Tip */}
        <View style={styles.searchTip}>
          <Search size={18} color="#64748b" />
          <Text style={styles.searchTipText}>
            Looking for a specific ledger? Try searching in the main menu.
          </Text>
        </View>

      </ScrollView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  groupsContainer: {
    gap: 20,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    gap: 12,
  },
  groupIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reportList: {
    paddingVertical: 8,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  reportDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  searchTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
  },
  searchTipText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
});
