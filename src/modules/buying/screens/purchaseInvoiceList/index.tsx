import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Calendar, User, FileText } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { usePurchaseInvoices } from '../../hooks/purchaseInvoiceQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { FilterHeader } from '../../../../core/components/FilterHeader';
import { useDebounce } from '../../../../core/utils/debounce';
import { formatCurrency } from '../../../../core/utils/formatters';

export function PurchaseInvoiceList() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const debouncedSearch = useDebounce(search);

  const { data: invoices, isLoading, refetch, isRefetching } = usePurchaseInvoices({ 
    search: debouncedSearch, 
    status 
  });

  const statusFilters = [
    { label: 'All', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const renderInvoiceItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('PurchaseInvoiceDetail', { invoiceId: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceId}>{item.name}</Text>
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
            <Text style={styles.infoText}>{item.posting_date}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountText}>{formatCurrency(item.grand_total, item.currency)}</Text>
            {item.outstanding_amount > 0 && (
              <Text style={styles.outstandingText}>Unpaid: {formatCurrency(item.outstanding_amount, item.currency)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Purchase Invoices" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('PurchaseInvoiceEdit')}
          filters={statusFilters}
          activeFilter={status}
          onFilterChange={setStatus}
          placeholder="Search invoices..."
        />

        {isLoading && !invoices ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={invoices}
            renderItem={renderInvoiceItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No purchase invoices found</Text>
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
    case 'Paid': return { backgroundColor: colors.green_50 };
    case 'Draft': return { backgroundColor: colors.gray_50 };
    case 'Unpaid': return { backgroundColor: colors.blue_50 };
    case 'Overdue': return { backgroundColor: colors.red_50 };
    case 'Cancelled': return { backgroundColor: colors.red_50 };
    default: return { backgroundColor: colors.gray_50 };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid': return colors.green_600;
    case 'Draft': return colors.text_secondary;
    case 'Unpaid': return colors.blue_600;
    case 'Overdue': return colors.error;
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
  invoiceId: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text_primary },
  supplierRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  supplierName: { fontSize: 12, color: colors.text_secondary, maxWidth: '90%' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border_light },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: colors.text_tertiary },
  amountText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text_primary },
  outstandingText: { fontSize: 10, color: colors.error, fontWeight: '600', marginTop: 2 },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.text_tertiary }
});
