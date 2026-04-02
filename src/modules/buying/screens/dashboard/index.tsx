import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, FlatList, RefreshControl, ScrollView } from 'react-native';
import { 
  Users, ShoppingCart, Plus, TrendingUp, BarChart3, 
  Receipt, ChevronRight, ArrowUpRight, ArrowDownRight 
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BuyingStackParamList } from '../../../navigation/types';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, shadow, moderateScale } from '../../../../core/theme';
import { usePurchaseStats } from '../../hooks/buyingQueries';
import { formatCurrency } from '../../../../core/utils/formatters';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { LineGraphModal } from '../../../dashboard/components/revenueHero/lineGraphModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FISCAL_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

export function BuyingHubScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BuyingStackParamList>>();
  const [user, setUser] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { data: stats, isLoading, refetch, isRefetching } = usePurchaseStats();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  // --- Data Processing Logic ---
  const processedData = useMemo(() => {
    if (!stats || !stats.result || !Array.isArray(stats.result)) {
      return { totalYTD: 0, monthlySales: [], prevMonthlySales: [], supplierSales: [] };
    }

    const result = stats.result;
    
    // 1. Identify the "Total" row (Confirmed as result[5] or similar array row)
    const totalRow = result.find((row: any) => 
      (Array.isArray(row) && row[0] === 'Total')
    );

    let totalYTD = 0;
    let monthlySales: { label: string; value: number }[] = [];
    let prevMonthlySales: { label: string; value: number }[] = [];
    
    if (totalRow && Array.isArray(totalRow)) {
      /**
       * Based on report range: 2024-04-01 to 2026-03-31
       * Index 0: "Total"
       * Index 2-13: Prev FY (2024-25)
       * Index 14-25: Current FY (2025-26)
       */

      // Current FY (April 2025 to March 2026) -> Indices 14 to 25
      monthlySales = FISCAL_MONTHS.map((month, i) => ({
        label: month,
        value: parseFloat(totalRow[i + 14]) || 0
      }));

      // Previous FY (April 2024 to March 2025) -> Indices 2 to 13
      prevMonthlySales = FISCAL_MONTHS.map((month, i) => ({
        label: month,
        value: parseFloat(totalRow[i + 2]) || 0
      }));

      // Current YTD Total
      totalYTD = monthlySales.reduce((acc, curr) => acc + curr.value, 0);
    }

    // 2. Extract Top Suppliers (excluding the Total row)
    const supplierSales = result
      .filter((row: any) => !Array.isArray(row) && row.entity_name && row.entity_name !== 'Total')
      .map((row: any) => {
        // Sum values from current FY columns for supplier ranking
        const rowTotal = Object.keys(row)
          .filter(k => FISCAL_MONTHS.some(m => k.toLowerCase().startsWith(m.toLowerCase())) && (k.includes('2025') || k.includes('2026')))
          .reduce((acc, k) => acc + (parseFloat(row[k]) || 0), 0);
        
        return {
          name: row.entity_name,
          value: rowTotal
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return { totalYTD, monthlySales, prevMonthlySales, supplierSales };
  }, [stats]);

  const trendPercent = useMemo(() => {
    const currentTotal = processedData.monthlySales.reduce((a, b) => a + b.value, 0);
    const prevTotal = processedData.prevMonthlySales.reduce((a, b) => a + b.value, 0);
    if (prevTotal === 0) return currentTotal > 0 ? "100" : "0";
    return (((currentTotal - prevTotal) / prevTotal) * 100).toFixed(1);
  }, [processedData]);

  const handleNavigate = useCallback((id: string) => {
    switch (id) {
      case 'SupplierList': navigation.navigate('SupplierList'); break;
      case 'PurchaseInvoiceList': navigation.navigate('PurchaseInvoiceList'); break;
      case 'PurchaseOrderList': navigation.navigate('PurchaseOrderList'); break;
      case 'PurchaseInvoiceEdit': navigation.navigate('PurchaseInvoiceEdit'); break;
      case 'SupplierEdit': navigation.navigate('SupplierEdit'); break;
      default: console.log('Action not implemented:', id);
    }
  }, [navigation]);

  const menuItems = [
    { id: 'SupplierList', label: 'Suppliers', icon: Users, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'PurchaseInvoiceList', label: 'Purchase Invoice', icon: Receipt, color: colors.error, bgColor: '#fef2f2' },
  ];

  const quickActions = [
    { id: 'PurchaseOrderList', label: 'Purchase Order', icon: ShoppingCart, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'PurchaseInvoiceEdit', label: 'Add Purchase Invoice', icon: Plus, color: colors.success, bgColor: colors.green_100 },
    { id: 'SupplierEdit', label: 'Add Supplier', icon: Plus, color: colors.orange_600, bgColor: colors.orange_100 },
  ];

  const PurchaseHero = () => (
    <View style={styles.heroCard}>
      <View style={styles.heroMain}>
        <View>
          <Text style={styles.heroTitle}>Total Purchases (YTD)</Text>
          <Text style={styles.heroAmount}>{formatCurrency(processedData.totalYTD, 'INR').split('.')[0]}</Text>
        </View>
        <TouchableOpacity 
          style={styles.heroIconBg} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
           <TrendingUp size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <View style={styles.heroDivider} />
      <View style={styles.heroFooter}>
        <View style={[styles.trendBadge, { backgroundColor: parseFloat(trendPercent) >= 0 ? colors.success : colors.error }]}>
          {parseFloat(trendPercent) >= 0 ? <ArrowUpRight size={14} color="#ffffff" /> : <ArrowDownRight size={14} color="#ffffff" />}
          <Text style={styles.trendPercentText}>{Math.abs(parseFloat(trendPercent))}%</Text>
        </View>
        <Text style={styles.heroSubText}>vs. previous fiscal year</Text>
      </View>
    </View>
  );

  const SupplierChart = ({ data }: { data: any[] }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (data.length === 0) return (
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 150 }}>
         <Text style={{ fontSize: 12, color: colors.text_tertiary }}>No Purchase Data Available</Text>
      </View>
    );

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', margin: spacing.xs, paddingBottom: spacing.sm, paddingRight: spacing.lg }}>
          {data.map((item, index) => {
            const heightPercentage = (item.value / maxVal) * 120;
            const share = ((item.value / total) * 100).toFixed(0);
            return (
              <View key={index} style={{ alignItems: 'center', margin: spacing.xs, width: 75 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: colors.text_secondary }}>{share}%</Text>
                <View
                  style={{
                    width: 36,
                    height: Math.max(heightPercentage, 4),
                    backgroundColor: colors.primary,
                    borderRadius: 6,
                    ...shadow.small
                  }}
                />
                <View style={{ height: 45, justifyContent: 'flex-start', marginTop: 4 }}>
                  <Text style={{ fontSize: 8, fontWeight: '700', color: colors.text_primary, textAlign: 'center', width: 75 }} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 7, color: colors.text_tertiary, textAlign: 'center' }}>
                    {formatCurrency(item.value, 'INR').split('.')[0]}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      <PurchaseHero />

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <BarChart3 size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Supplier Volume</Text>
            <Text style={styles.cardSubtitle}>Share of Total Procurement</Text>
          </View>
        </View>
        {isLoading ? (
          <View style={styles.chartPlaceholder}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Analyzing procurement...</Text>
          </View>
        ) : (
          <SupplierChart data={processedData.supplierSales} />
        )}
      </View>

      <View style={styles.actionGrid}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <TouchableOpacity key={item.id} style={styles.actionItem} activeOpacity={0.7} onPress={() => handleNavigate(item.id)}>
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

  const renderQuickAction = ({ item }: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity style={styles.quickActionItem} activeOpacity={0.7} onPress={() => handleNavigate(item.id)}>
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
    <ModuleLayout title="Buying" user={user}>
      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuickAction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
      />

      <LineGraphModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={processedData.monthlySales}
        prevData={processedData.prevMonthlySales}
        title="Purchase Performance Trend"
      />
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerComponent: {
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadow.medium,
  },
  heroMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  heroIconBg: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: spacing.lg,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  trendPercentText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroSubText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadow.small,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.blue_50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  cardSubtitle: {
    fontSize: 10,
    color: colors.text_tertiary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: colors.text_tertiary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(24),
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.medium,
  },
  actionIconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  sectionHeader: {
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small,
  },
  quickActionLeft: {
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1,
  },
  quickActionIconBox: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text_primary,
  },
});
