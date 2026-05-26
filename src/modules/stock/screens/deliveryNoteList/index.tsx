import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Truck, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { FilterHeader, FilterOption } from '@core/components/FilterHeader';
import { useDebounce } from '@core/utils/debounce';
import { colors } from '@core/theme';
import { styles } from '../itemList/styles';

import { useDeliveryNotes } from '../../hooks/deliveryNoteQueries';
import { companyService } from '@core/services/companyService';

const STATUS_FILTERS: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Draft', value: 'Draft' },
  { label: 'To Bill', value: 'To Bill' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Cancelled', value: 'Cancelled' },
  { label: 'Closed', value: 'Closed' },
];

const DeliveryNoteItem = React.memo(({ item, onPress, getStatusColor }: any) => {
  const statusColor = getStatusColor(item.status);
  return (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => onPress(item.name)}
    >
      <View style={styles.itemMain}>
        <View style={[styles.itemIcon, { backgroundColor: statusColor + '15' }]}>
          <Truck size={22} color={statusColor} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.customer}</Text>
          <Text style={styles.itemCode}>{item.name} • {item.posting_date}</Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemQty}>{item.currency} {item.grand_total?.toLocaleString()}</Text>
        <View style={[
          { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, backgroundColor: statusColor + '20', marginTop: 4 }
        ]}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor }}>{item.status}</Text>
        </View>
      </View>
      <ChevronRight size={16} color={colors.border} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
});

export function DeliveryNoteList() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState('All');
  const [company, setCompany] = useState<string>('');

  // Load company on focus to handle company changes
  useFocusEffect(
    useCallback(() => {
      companyService.getSelectedCompany().then(c => {
        if (c?.name) setCompany(c.name);
      });
    }, [])
  );

  const { 
    data, 
    isLoading, 
    isRefetching, 
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useDeliveryNotes({ 
    company,
    search: debouncedSearch, 
    status: statusFilter 
  });

  const deliveryNotes = useMemo(() => {
    return data?.pages?.flat() || [];
  }, [data]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Draft': return colors.text_tertiary;
      case 'To Bill': return colors.warning;
      case 'Completed': return colors.success;
      case 'Cancelled': return colors.error;
      case 'Closed': return colors.text_secondary;
      default: return colors.primary;
    }
  }, []);

  const handleItemPress = useCallback((noteId: string) => {
    navigation.navigate('DeliveryNoteDetail', { noteId });
  }, [navigation]);

  const handleAdd = useCallback(() => {
    navigation.navigate('DeliveryNoteEdit');
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <DeliveryNoteItem 
      item={item} 
      onPress={handleItemPress} 
      getStatusColor={getStatusColor} 
    />
  ), [handleItemPress, getStatusColor]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Truck size={48} color={colors.border} />
      <Text style={styles.emptyText}>No delivery notes found</Text>
    </View>
  ), []);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <ModuleLayout title="Delivery Notes" showBack>
      <View style={styles.container}>
        <FilterHeader 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={handleAdd}
          placeholder="Search customer or ID..."
          filters={STATUS_FILTERS}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {isLoading && !isRefetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={deliveryNotes}
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
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </ModuleLayout>
  );
}
