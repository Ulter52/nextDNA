import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { ShoppingBag, ChevronRight, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '@core/components/FilterHeader';
import { useDebounce } from '@core/utils/debounce';
import { formatCurrency } from '@core/utils/formatters';
import { colors } from '@core/theme';
import { styles } from '../itemList/styles';

import { usePurchaseReceipts } from '../../hooks/purchaseReceiptQueries';

const STATUS_OPTIONS = [
  { name: 'All Status', value: 'All' },
  { name: 'Draft', value: 'Draft' },
  { name: 'To Bill', value: 'To Bill' },
  { name: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { name: 'Closed', value: 'Closed' }
];

const PurchaseReceiptItem = React.memo(({ item, onPress, getStatusColor }: any) => {
  const statusColor = getStatusColor(item.status);
  
  return (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => onPress(item.name)}
    >
      <View style={styles.itemMain}>
        <View style={[styles.itemIcon, { backgroundColor: statusColor + '15' }]}>
          <ShoppingBag size={22} color={statusColor} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.supplier || 'No Supplier'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={styles.itemCode}>{item.name}</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.itemCode}>{item.posting_date}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.itemRight}>
        <Text style={styles.itemQty}>
          {formatCurrency(item.grand_total, item.currency || 'INR')}
        </Text>
        <View style={[
          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: statusColor + '15', marginTop: 4 }
        ]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor }}>{item.status}</Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.border} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
});

export function PurchaseReceiptList() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const debouncedSearch = useDebounce(searchQuery);

  const { 
    data: receipts, 
    isLoading, 
    isRefetching, 
    refetch 
  } = usePurchaseReceipts({
    search: debouncedSearch,
    status: selectedStatus === 'All' ? '' : selectedStatus
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Draft': return colors.neutral_500;
      case 'To Bill': return colors.warning;
      case 'Completed': return colors.success;
      case 'Cancelled': return colors.error;
      case 'Closed': return colors.text_secondary;
      default: return colors.primary;
    }
  }, []);

  const handleItemPress = useCallback((receiptId: string) => {
    navigation.navigate('PurchaseReceiptDetail', { receiptId });
  }, [navigation]);

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      icon: Clock,
      value: selectedStatus,
      options: STATUS_OPTIONS,
      onChange: setSelectedStatus
    }
  ], [selectedStatus]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <PurchaseReceiptItem 
      item={item} 
      onPress={handleItemPress} 
      getStatusColor={getStatusColor} 
    />
  ), [handleItemPress, getStatusColor]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={48} color={colors.border} />
      <Text style={styles.emptyText}>No receipts found</Text>
    </View>
  ), []);

  return (
    <ModuleLayout title="Purchase Receipts" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('PurchaseReceiptEdit')}
          placeholder="Search by ID or Supplier..."
          selectorFilters={selectorFilters}
        />

        {isLoading && !isRefetching ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching receipts...</Text>
          </View>
        ) : (
          <FlatList
            data={receipts || []}
            renderItem={renderItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
