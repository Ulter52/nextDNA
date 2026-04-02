import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Calendar, User, ShoppingCart } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { usePurchaseOrders } from '../../hooks/buyingQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { FilterHeader } from '../../../../core/components/FilterHeader';
import { useDebounce } from '../../../../core/utils/debounce';
import { formatCurrency } from '../../../../core/utils/formatters';

export function PurchaseOrderList() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const debouncedSearch = useDebounce(search);

  const { data: orders, isLoading, refetch, isRefetching } = usePurchaseOrders({ 
    search: debouncedSearch, 
    status 
  });

  const statusFilters = [
    { label: 'All', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'To Receive and Bill', value: 'To Receive and Bill' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const renderOrderItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('PurchaseOrderDetail', { orderId: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>{item.name}</Text>
            <View style={styles.supplierRow}>
              <User size={12} color={colors.text_tertiary} />
              <Text style={styles.supplierName} numberOfLines={1}>{item.supplier}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Calendar size={12} color={colors.text_tertiary} />
            <Text style={styles.infoText}>{item.transaction_date}</Text>
          </View>
          <Text style={styles.amountText}>{formatCurrency(item.grand_total, item.currency)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Purchase Orders" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('PurchaseOrderEdit')}
          filters={statusFilters}
          activeFilter={status}
          onFilterChange={setStatus}
          placeholder="Search orders..."
        />

        {isLoading && !orders ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No purchase orders found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Completed': return { backgroundColor: colors.green_50 };
    case 'Draft': return { backgroundColor: colors.gray_50 };
    case 'To Receive and Bill': return { backgroundColor: colors.blue_50 };
    case 'Cancelled': return { backgroundColor: colors.red_50 };
    default: return { backgroundColor: colors.gray_50 };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return colors.green_600;
    case 'Draft': return colors.text_secondary;
    case 'To Receive and Bill': return colors.blue_600;
    case 'Cancelled': return colors.error;
    default: return colors.text_secondary;
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  orderId: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text_primary },
  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  supplierName: { fontSize: 12, color: colors.text_secondary, maxWidth: '90%' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border_light },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: colors.text_tertiary },
  amountText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text_primary },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.text_tertiary }
});
