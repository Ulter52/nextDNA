import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { ClipboardList, ChevronRight, Clock, Box } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '../../../../core/components/FilterHeader';
import { useNavigation } from '@react-navigation/native';
import { useDebounce } from '../../../../core/utils/debounce';
import { useMaterialRequests, useMaterialRequestMeta } from '../../hooks/materialRequestQueries';
import { styles } from '../itemList/styles';
import { colors, spacing } from '../../../../core/theme';

const STATUS_OPTIONS = [
  { name: 'All Status', value: 'All' },
  { name: 'Draft', value: 'Draft' },
  { name: 'Pending', value: 'Pending' },
  { name: 'Issued', value: 'Issued' },
  { name: 'Transferred', value: 'Transferred' },
  { name: 'Cancelled', value: 'Cancelled' },
  { name: 'Partially Ordered', value: 'Partially Ordered' }
];

const TYPE_OPTIONS = [
  { name: 'All Types', value: 'All' },
  { name: 'Purchase', value: 'Purchase' },
  { name: 'Material Transfer', value: 'Material Transfer' },
  { name: 'Material Issue', value: 'Material Issue' },
  { name: 'Manufacture', value: 'Manufacture' },
  { name: 'Customer Provided', value: 'Customer Provided' }
];

export function MaterialRequestList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  const debouncedSearch = useDebounce(searchQuery);
  const navigation = useNavigation<any>();

  // Fetch Requests via React Query
  const { 
    data: requests, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useMaterialRequests({
    search: debouncedSearch,
    status: selectedStatus === 'All' ? '' : selectedStatus,
    type: selectedType === 'All' ? '' : selectedType
  });

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'Draft': return colors.neutral_500;
      case 'Pending': return colors.warning;
      case 'Issued': return colors.primary;
      case 'Transferred': return colors.success;
      case 'Cancelled': return colors.error;
      case 'Partially Ordered': return colors.purple_500;
      default: return colors.text_secondary;
    }
  }, []);

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      icon: Clock,
      value: selectedStatus,
      options: STATUS_OPTIONS,
      onChange: setSelectedStatus
    },
    {
      id: 'type',
      label: 'Type',
      icon: Box,
      value: selectedType,
      options: TYPE_OPTIONS,
      onChange: setSelectedType
    }
  ], [selectedStatus, selectedType]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.itemCard} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MaterialRequestDetail', { requestId: item.name })}
      >
        <View style={styles.itemMain}>
          <View style={[styles.itemIcon, { backgroundColor: statusColor + '15' }]}>
            <ClipboardList size={22} color={statusColor} />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text style={styles.itemCode}>{item.material_request_type}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.itemCode}>{item.transaction_date}</Text>
            </View>
          </View>
        </View>
        
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={{ 
            paddingHorizontal: 8, 
            paddingVertical: 2, 
            borderRadius: 12, 
            backgroundColor: statusColor + '15' 
          }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor }}>{item.status}</Text>
          </View>
          {item.per_ordered > 0 && (
             <Text style={{ fontSize: 9, color: colors.text_tertiary, fontWeight: '600' }}>
               {item.per_ordered.toFixed(0)}% Ordered
             </Text>
          )}
        </View>
        <ChevronRight size={16} color={colors.border} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  }, [navigation, getStatusColor]);

  return (
    <ModuleLayout title="Material Requests" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('MaterialRequestEdit')}
          placeholder="Search by ID..."
          selectorFilters={selectorFilters}
        />

        {isLoading && !isRefetching ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching requests...</Text>
          </View>
        ) : (
          <FlatList
            data={requests || []}
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
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ClipboardList size={48} color={colors.border} />
                <Text style={styles.emptyText}>No requests found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}
