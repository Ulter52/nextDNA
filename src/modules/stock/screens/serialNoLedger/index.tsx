import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Barcode, Calendar, Clock, Tag, Package, RefreshCw, Activity, ArrowRightLeft, MapPin } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '../../../../core/theme';
import { Selector } from '../../../../core/components/Selector';
import { metadataService } from '../../../../core/services/metadataService';
import { runReport } from '../../../../core/api/frappeApiHelpers';
import { getDateRanges } from '../../../../core/utils/dateHelpers';

export function SerialNoLedger() {
  const [items, setItems] = useState<any[]>([]);
  const [serialNos, setSerialNos] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedSerialNo, setSelectedSerialNo] = useState('');
  
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchingItems, setSearchingItems] = useState(false);
  const [searchingSerialNos, setSearchingSerialNos] = useState(false);

  const fetchItems = useCallback(async (search?: string) => {
    setSearchingItems(true);
    try {
      const res = await metadataService.getItems(search);
      setItems(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setSearchingItems(false);
    }
  }, []);

  const fetchSerialNos = useCallback(async (itemCode: string, search?: string) => {
    if (!itemCode) return;
    setSearchingSerialNos(true);
    try {
      const res = await metadataService.getSerialNos(itemCode, search);
      setSerialNos(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch serial nos", err);
    } finally {
      setSearchingSerialNos(false);
    }
  }, []);

  // Memoized search handlers to prevent Selector re-fetch loops
  const handleItemSearch = useCallback((query: string) => {
    fetchItems(query);
  }, [fetchItems]);

  const handleSerialSearch = useCallback((query: string) => {
    if (selectedItem) {
      fetchSerialNos(selectedItem, query);
    }
  }, [selectedItem, fetchSerialNos]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (selectedItem) {
      fetchSerialNos(selectedItem);
      setSelectedSerialNo('');
      setLedgerData([]);
    }
  }, [selectedItem, fetchSerialNos]);

  const fetchLedger = useCallback(async () => {
    if (!selectedItem || !selectedSerialNo) return;
    
    setLoading(true);
    try {
      const { today } = getDateRanges();
      const currentTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

      const res = await runReport('Serial No Ledger', {
        item_code: selectedItem,
        serial_no: selectedSerialNo,
        posting_date: today,
        posting_time: currentTime
      });
      setLedgerData(res?.result || []);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedItem, selectedSerialNo]);

  useEffect(() => {
    if (selectedItem && selectedSerialNo) {
      fetchLedger();
    }
  }, [selectedItem, selectedSerialNo, fetchLedger]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLedger();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return colors.success;
      case 'Inactive': return colors.text_tertiary;
      case 'Delivered': return colors.primary;
      case 'Expired': return colors.error;
      default: return colors.text_secondary;
    }
  };

  const getVoucherTypeStyles = (type: string) => {
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
  };

  const renderLedgerItem = ({ item }: { item: any }) => {
    const vStyles = getVoucherTypeStyles(item.voucher_type);
    
    return (
      <View style={styles.ledgerCard}>
        <View style={styles.ledgerHeader}>
          <View style={[styles.typeBadge, { backgroundColor: vStyles.bg }]}>
            <ArrowRightLeft size={12} color={vStyles.text} style={{ marginRight: 4 }} />
            <Text style={[styles.typeBadgeText, { color: vStyles.text }]}>{item.voucher_type}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status || 'No Status'}</Text>
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
  };

  return (
    <ModuleLayout title="Serial No Ledger" showBack>
      <View style={styles.container}>
        <View style={styles.filterSection}>
          <Selector
            label="Item Code"
            options={items}
            value={selectedItem}
            onChange={setSelectedItem}
            onSearch={handleItemSearch}
            loading={searchingItems}
            icon={Package}
            placeholder="Select Item"
            displayField="name"
          />
          
          <Selector
            label="Serial No"
            options={serialNos}
            value={selectedSerialNo}
            onChange={setSelectedSerialNo}
            onSearch={handleSerialSearch}
            loading={searchingSerialNos}
            icon={Barcode}
            placeholder="Select Serial No"
            disabled={!selectedItem}
          />
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching ledger data...</Text>
          </View>
        ) : (
          <FlatList
            data={ledgerData}
            renderItem={renderLedgerItem}
            keyExtractor={(item, index) => `${item.voucher_no}-${index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Barcode size={48} color={colors.border} />
                <Text style={styles.emptyText}>
                  {!selectedItem || !selectedSerialNo 
                    ? "Select an Item and Serial No to view history" 
                    : "No transactions found for this serial number"}
                </Text>
              </View>
            }
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
