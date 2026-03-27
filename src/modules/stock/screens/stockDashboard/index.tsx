import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { 
  Package, Box, ArrowRightLeft, AlertCircle, 
  ShoppingBag, Plus, BarChart3, Tag, Barcode, ChevronRight,
  TrendingUp, History, ArrowDownLeft, ArrowUpRight
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useStockStats } from '../../hooks/stockQueries';
import { styles } from './styles';
import { colors, spacing, shadow } from '../../../../core/theme';
import { formatCurrency } from '../../../../core/utils/formatters';

// Custom Vertical Bar Chart Component for Stock Valuation
const StockValueChart = React.memo(({ data }: { data: any[] }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: 150 }}>
       <Text style={{ fontSize: 12, color: colors.text_tertiary }}>No Stock Data Available</Text>
    </View>
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', margin: spacing.xs, paddingBottom: spacing.sm, paddingRight: spacing.lg }}>
        {data.map((item, index) => {
          const heightPercentage = (item.value / maxVal) * 120;
          const share = ((item.value / total) * 100).toFixed(0);
          return (
            <View key={index} style={{ alignItems: 'center', margin: spacing.xs, width: 55 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: colors.text_secondary }}>{share}%</Text>
              <View
                style={{
                  width: 28,
                  height: Math.max(heightPercentage, 4),
                  backgroundColor: item.color || colors.primary,
                  borderRadius: 6,
                  ...shadow.small
                }}
              />
              <View style={{ height: 45, justifyContent: 'flex-start', marginTop: 4 }}>
                <Text style={{ fontSize: 8, fontWeight: '700', color: colors.text_primary, textAlign: 'center', width: 55 }} numberOfLines={2}>
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
});

export function StockDashboard() {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<string | null>(null);

  const { data: stats, isLoading, isRefetching, refetch } = useStockStats();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const mainActions = useMemo(() => [
    { id: 'items', label: 'Items', icon: Package, color: colors.primary, bgColor: colors.blue_50 },
    { id: 'material-request', label: 'Material Request', icon: Box, color: colors.orange_600, bgColor: colors.orange_100 },
    { id: 'purchase-receipt', label: 'Purchase Receipt', icon: ShoppingBag, color: colors.purple_500, bgColor: colors.purple_100 },
    { id: 'delivery-note', label: 'Delivery Note', icon: ArrowRightLeft, color: colors.success, bgColor: colors.green_100 },
  ], []);

  const quickActions = useMemo(() => [
    { id: 'item-price', label: 'Item Price List', icon: Tag, color: colors.teal_500, bgColor: colors.teal_100 },
    { id: 'serial-no-ledger', label: 'Serial No Ledger', icon: Barcode, color: colors.purple_500, bgColor: colors.purple_100 },
    { id: 'new-item', label: 'Create New Item', icon: Plus, color: colors.indigo_500, bgColor: colors.indigo_100 },
  ], []);

  const handleAction = useCallback((id: string) => {
    switch (id) {
      case 'items': navigation.navigate('ItemList'); break;
      case 'material-request': navigation.navigate('MaterialRequestList'); break;
      case 'purchase-receipt': navigation.navigate('PurchaseReceiptList'); break;
      case 'delivery-note': navigation.navigate('DeliveryNoteList'); break;
      case 'new-item': navigation.navigate('ItemEdit'); break;
      case 'item-price': navigation.navigate('ItemPriceList'); break;
      case 'serial-no-ledger': navigation.navigate('SerialNoLedger'); break;
      default: console.log('Action not implemented:', id);
    }
  }, [navigation]);

  const renderHeader = () => (
    <View style={styles.headerComponent}>
      {/* Metrics Summary Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Items</Text>
          <Text style={[styles.metricValue, { color: colors.primary }]}>{stats?.total_items || 0}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Low Stock</Text>
          <Text style={[styles.metricValue, { color: colors.warning }]}>{stats?.low_stock_count || 0}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Out of Stock</Text>
          <Text style={[styles.metricValue, { color: colors.error }]}>{stats?.out_of_stock_count || 0}</Text>
        </View>
      </View>

      {/* Stock Valuation by Item Group Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <BarChart3 size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Stock Valuation</Text>
            <Text style={styles.cardSubtitle}>
              {stats?.company ? `${stats.company} • Item Groups` : 'Group-wise • Inventory Value'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
             <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.text_tertiary }}>TOTAL VALUE</Text>
             <Text style={{ fontSize: 14, fontWeight: '900', color: colors.primary }}>
                {formatCurrency(stats?.total_value || 0, 'INR').split('.')[0]}
             </Text>
          </View>
        </View>
        <StockValueChart data={stats?.sales_data || []} />
      </View>

      {/* Main Grid Actions */}
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

      <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
        <Text style={styles.sectionTitle}>Quick Reports & Actions</Text>
      </View>
    </View>
  );

  const renderQuickAction = useCallback(({ item }: any) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        style={styles.quickActionItem}
        activeOpacity={0.7}
        onPress={() => handleAction(item.id)}
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
  }, [handleAction]);

  const renderFooter = () => (
    <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
      {(stats?.low_stock_count || 0) > 0 && (
        <View style={styles.alertCard}>
          <AlertCircle size={20} color={colors.warning} style={styles.alertIcon} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Inventory Alert</Text>
            <Text style={styles.alertText}>
              {stats?.low_stock_count} items have reached their reorder level.
            </Text>
          </View>
        </View>
      )}
      {stats?.last_updated && (
        <Text style={{ fontSize: 9, color: colors.text_tertiary, textAlign: 'center', marginBottom: spacing.md }}>
          Last updated: {new Date(stats.last_updated).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );

  if (isLoading && !stats) {
    return (
      <ModuleLayout title="Stock" user={user}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Stock" user={user}>
      <FlatList
        data={quickActions}
        keyExtractor={(item) => item.id}
        renderItem={renderQuickAction}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.container}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
