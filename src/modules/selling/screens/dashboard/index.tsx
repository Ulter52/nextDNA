import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { Users, FileText, FileCheck, Receipt, Plus, TrendingUp, BarChart3 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '../../../navigation/types';
import { ModuleLayout } from '@components/ModuleLayout';
import { sellingService } from '@sellingServices/salesOrderService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { formatCurrency } from '@utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fiscal Year Months starting from April
const FISCAL_MONTHS = [
  { label: 'Apr', index: 3 },
  { label: 'May', index: 4 },
  { label: 'Jun', index: 5 },
  { label: 'Jul', index: 6 },
  { label: 'Aug', index: 7 },
  { label: 'Sep', index: 8 },
  { label: 'Oct', index: 9 },
  { label: 'Nov', index: 10 },
  { label: 'Dec', index: 11 },
  { label: 'Jan', index: 12 },
  { label: 'Feb', index: 13 },
  { label: 'Mar', index: 14 },
];

export function SellingHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();
  const [user, setUser] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<any[]>(FISCAL_MONTHS.map(m => ({ label: m.label, value: 0 })));
  const [loadingChart, setLoadingChart] = useState(true);

  // Dynamic FY Calculation
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const startYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const endYearLabel = (startYear + 1).toString().slice(-2);
  const fiscalYearLabel = `FY${startYear}-${endYearLabel}`;

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      setLoadingChart(true);
      
      let companyName;
      try {
        const companies = await sellingService.getCompanies();
        if (companies && companies.length > 0) companyName = companies[0].name;
      } catch (e) {
        console.log("Could not fetch companies for analytics filter");
      }
      
      const data = await sellingService.getMonthlySalesTrends(companyName);
      
      if (data && data.length > 0) {
        // Find the 'Total' array row (usually at the end)
        const totalRow = data.find(row => Array.isArray(row) && row[0] === 'Total');
        
        if (totalRow) {
          const processed = FISCAL_MONTHS.map(month => ({
            label: month.label,
            value: parseFloat(totalRow[month.index]) || 0
          }));
          setTrendData(processed);
        } else {
          // Fallback: If no Total row, use the previous logic or reset
          setTrendData(FISCAL_MONTHS.map(m => ({ label: m.label, value: 0 })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch sales trends:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  const handleNavigate = (id: any) => {
    if (['CustomerList', 'QuotationList', 'SalesOrderList', 'NewSalesOrder', 'SalesInvoiceList'].includes(id)) {
      navigation.navigate(id as any);
    }
  };

  const menuItems = [
    { id: 'CustomerList', label: 'Customer', icon: Users, color: '#3b82f6', bgColor: '#eff6ff' },
    { id: 'QuotationList', label: 'Quotation', icon: FileText, color: '#f97316', bgColor: '#fff7ed' },
    { id: 'SalesOrderList', label: 'Sales Order', icon: FileCheck, color: '#22c55e', bgColor: '#f0fdf4' },
    { id: 'SalesInvoiceList', label: 'Sales Invoice', icon: Receipt, color: '#ef4444', bgColor: '#fef2f2' },
  ];

  const BarChart = ({ data }: { data: any[] }) => {
    const chartHeight = 150;
    const chartWidth = SCREEN_WIDTH - 80;
    const barWidth = 14;
    const gap = (chartWidth - (data.length * barWidth)) / (data.length - 1);
    
    const values = data.map(d => d.value);
    const maxDataValue = Math.max(...values);
    const maxValue = maxDataValue > 0 ? maxDataValue * 1.2 : 1000;
    
    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight + 35}>
          <G y={chartHeight}>
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <Line
                key={i}
                x1="0"
                y1={-chartHeight * p}
                x2={chartWidth}
                y2={-chartHeight * p}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * chartHeight;
              const x = index * (barWidth + gap);
              
              return (
                <G key={index}>
                  <Rect
                    x={x}
                    y={-Math.max(barHeight, 4)} 
                    width={barWidth}
                    height={Math.max(barHeight, 4)}
                    fill={item.value > 0 ? "#2563eb" : "#f1f5f9"}
                    rx="3"
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y="22"
                    fontSize="8"
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {item.label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
        <View style={styles.chartFooter}>
            <View style={styles.trendInfo}>
                <TrendingUp size={14} color="#16a34a" />
                <Text style={styles.trendPercent}>{fiscalYearLabel}</Text>
            </View>
            <Text style={styles.totalSalesText}>
                Peak: {formatCurrency(maxDataValue, 'INR')}
            </Text>
        </View>
      </View>
    );
  };

  return (
    <ModuleLayout title="Selling" user={user}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Monthly Revenue Trends</Text>
              <Text style={styles.cardSubtitle}>Sales Invoices (Apr - Mar)</Text>
            </View>
            <View style={styles.headerIcon}>
              <BarChart3 size={18} color="#2563eb" />
            </View>
          </View>

          {loadingChart ? (
            <View style={styles.chartPlaceholder}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.loadingText}>Fetching FY data...</Text>
            </View>
          ) : (
            <BarChart data={trendData} />
          )}
        </View>

        <View style={styles.grid}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNavigate(item.id)}
                style={styles.gridItem}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: item.bgColor }]}>
                  <Icon size={28} color={item.color} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('NewSalesOrder')}
              style={styles.primaryAction} 
              activeOpacity={0.8}
            >
              <Plus size={18} color="#ffffff" strokeWidth={3} />
              <Text style={styles.primaryActionText}>New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('CustomerList')}
              style={styles.secondaryAction}
              activeOpacity={0.7}
            >
              <Users size={18} color="#374151" />
              <Text style={styles.secondaryActionText}>Add Customer</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    gap: 24,
  },
  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  headerIcon: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartPlaceholder: {
    height: 185,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalSalesText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    elevation: 2,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  actionsSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRow: {
    gap: 12,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  secondaryActionText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
