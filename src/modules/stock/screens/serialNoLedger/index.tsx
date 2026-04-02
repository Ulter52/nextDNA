import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Barcode, Calendar, Clock, Tag, Package, ArrowRightLeft, MapPin } from 'lucide-react-native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { Selector } from '@core/components/Selector';
import { useDebounce } from '@core/utils/debounce';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '@core/theme';

import { 
  useItemsForLedger, 
  useSerialNosForLedger, 
  useSerialNoLedger 
} from '../../hooks/serialNoQueries';

const LedgerItem = React.memo(({ item, getStatusColor, getVoucherTypeStyles }: any) => {
  const vStyles = getVoucherTypeStyles(item.voucher_type);
  const statusColor = getStatusColor(item.status);
  
  return (
    <View style={styles.ledgerCard}>
      <View style={styles.ledgerHeader}>
        <View style={[styles.typeBadge, { backgroundColor: vStyles.bg }]}>
          <ArrowRightLeft size={12} color={vStyles.text} style={{ marginRight: 4 }} />
          <Text style={[styles.typeBadgeText, { color: vStyles.text }]}>{item.voucher_type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>{item.status || 'No Status'}</Text>
        </View>
      </View>
      
      <View style={styles.ledgerBody}>
        <View style={styles.mainInfo}>
          <Tag size={16} color={colors.text_tertiary} />
          <Text style={styles.voucherNo}>{item.voucher_no}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <MapPin size={14} color={colors.text_tertiary} />
          <Text style={styles.detailText}>{item.warehouse || 'No Warehouse'}</Text>
        </View>
      </View>
      
      <View style={styles.ledgerFooter}>
        <View style={styles.footerItem}>
          <Calendar size={14} color={colors.text_tertiary} />
          <Text style={styles.footerText}>{item.posting_date}</Text>
        </View>
        {item.posting_time && (
          <View style={styles.footerItem}>
            <Clock size={14} color={colors.text_tertiary} />
            <Text style={styles.footerText}>{item.posting_time}</Text>
          </View>
        )}
      </View>
    </View>
  );
});

export function SerialNoLedger() {
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSerialNo, setSelectedSerialNo] = useState('');
  
  const [itemSearch, setItemSearch] = useState('');
  const [serialSearch, setSerialSearch] = useState('');
  
  const debouncedItemSearch = useDebounce(itemSearch);
  const debouncedSerialSearch = useDebounce(serialSearch);

  // Queries
  const { data: items = [], isLoading: loadingItems } = useItemsForLedger(debouncedItemSearch);
  const { data: serialNos = [], isLoading: loadingSerialNos } = useSerialNosForLedger(selectedItem, debouncedSerialSearch);
  const { data: ledgerData = [], isLoading: loadingLedger, isRefetching, refetch } = useSerialNoLedger(selectedItem, selectedSerialNo);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Active': return colors.success;
      case 'Inactive': return colors.text_tertiary;
      case 'Delivered': return colors.primary;
      case 'Expired': return colors.error;
      default: return colors.text_secondary;
    }
  }, []);

  const getVoucherTypeStyles = useCallback((type: string) => {
    switch (type) {
      case 'Purchase Receipt':
        return { bg: colors.green_100, text: colors.success };
      case 'Delivery Note':
        return { bg: colors.orange_100, text: colors.warning };
      case 'Stock Entry':
        return { bg: colors.blue_50, text: colors.primary };
      case 'Sales Invoice':
        return { bg: colors.sky_100, text: colors.sky_500 };
      case 'Purchase Invoice':
        return { bg: colors.purple_100, text: colors.purple_500 };
      case 'Material Request':
        return { bg: colors.rose_100, text: colors.rose_500 };
      default:
        return { bg: colors.neutral_100, text: colors.text_secondary };
    }
  }, []);

  const handleItemChange = useCallback((val: string) => {
    setSelectedItem(val);
    setSelectedSerialNo('');
    setSerialSearch('');
  }, []);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <LedgerItem 
      item={item} 
      getStatusColor={getStatusColor} 
      getVoucherTypeStyles={getVoucherTypeStyles} 
    />
  ), [getStatusColor, getVoucherTypeStyles]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Barcode size={48} color={colors.border} />
      <Text style={styles.emptyText}>
        {!selectedItem || !selectedSerialNo 
          ? "Select an Item and Serial No to view history" 
          : "No transactions found for this serial number"}
      </Text>
    </View>
  ), [selectedItem, selectedSerialNo]);

  return (
    <ModuleLayout title="Serial No Ledger" showBack>
      <View style={styles.container}>
        <View style={styles.filterSection}>
          <Selector
            label="Item Code"
            options={items}
            value={selectedItem}
            onChange={handleItemChange}
            onSearch={setItemSearch}
            loading={loadingItems}
            icon={Package}
            placeholder="Select Item"
            displayField="Item Code"
          />
          
          <Selector
            label="Serial No"
            options={serialNos}
            value={selectedSerialNo}
            onChange={setSelectedSerialNo}
            onSearch={setSerialSearch}
            loading={loadingSerialNos}
            icon={Barcode}
            placeholder="Select Serial No"
            disabled={!selectedItem}
          />
        </View>

        {loadingLedger && !isRefetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching ledger data...</Text>
          </View>
        ) : (
          <FlatList
            data={ledgerData}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.voucher_no}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={isRefetching} 
                onRefresh={refetch} 
                tintColor={colors.primary} 
              />
            }
            ListEmptyComponent={listEmptyComponent}
          />
        )}
      </View>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
    ...shadow.small,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  ledgerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border_light,
    ...shadow.small,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: typography.weights.bold,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.black,
    textTransform: 'uppercase',
  },
  ledgerBody: {
    marginBottom: spacing.md,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  voucherNo: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: moderateScale(2),
  },
  detailText: {
    fontSize: typography.sizes.xs,
    color: colors.text_secondary,
    fontWeight: typography.weights.medium,
  },
  ledgerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 11,
    color: colors.text_tertiary,
    fontWeight: typography.weights.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text_secondary,
    fontWeight: typography.weights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: moderateScale(80),
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text_tertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xxl,
    lineHeight: 20,
  },
});
