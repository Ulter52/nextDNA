import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Package, ChevronRight, Layers, Bookmark } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '../../../../core/components/FilterHeader';
import { useNavigation } from '@react-navigation/native';
import { useDebounce } from '../../../../core/utils/debounce';
import { useItems, useItemGroups, useBrands } from '../../hooks/itemQueries';
import { formatCurrency } from '../../../../core/utils/formatters';
import { companyService } from '../../../../core/services/companyService';
import { styles } from './styles';
import { colors } from '../../../../core/theme';

export function ItemList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [companyName, setCompanyName] = useState('');

  const debouncedSearch = useDebounce(searchQuery);
  const navigation = useNavigation<any>();

  useEffect(() => {
    companyService.getSelectedCompany().then(c => setCompanyName(c?.name || ''));
  }, []);

  // Fetch Metadata with React Query
  const { data: itemGroups } = useItemGroups();
  const { data: brands } = useBrands();

  // Memoized options for Selectors
  const groupOptions = useMemo(() => [
    { name: 'All Groups', value: 'All' },
    ...(itemGroups || []).map((g: any) => ({ name: g.name, value: g.name }))
  ], [itemGroups]);

  const brandOptions = useMemo(() => [
    { name: 'All Brands', value: 'All' },
    ...(brands || []).map((b: any) => ({ name: b.name, value: b.name }))
  ], [brands]);

  // Fetch Items via React Query
  const { 
    data: itemsRes, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useItems(debouncedSearch, { 
    item_group: selectedGroup === 'All' ? '' : selectedGroup, 
    brand: selectedBrand === 'All' ? '' : selectedBrand 
  });

  const items = itemsRes?.data || [];

  // Memoized Filter Configuration for Core Header
  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'group',
      label: 'Group',
      icon: Layers,
      value: selectedGroup,
      options: groupOptions,
      onChange: setSelectedGroup
    },
    {
      id: 'brand',
      label: 'Brand',
      icon: Bookmark,
      value: selectedBrand,
      options: brandOptions,
      onChange: setSelectedBrand
    }
  ], [selectedGroup, selectedBrand, groupOptions, brandOptions]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ItemDetail', { itemCode: item.name })}
    >
      <View style={styles.itemMain}>
        <View style={styles.itemIcon}>
          <Package size={22} color={colors.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
          <Text style={styles.itemCode}>{item.name}</Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemQty}>
          {item.valuation_rate ? formatCurrency(item.valuation_rate, 'INR') : '₹0.00'}
        </Text>
        <Text style={styles.itemUom}>{item.stock_uom}</Text>
      </View>
      <ChevronRight size={16} color={colors.border} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  ), [navigation]);

  return (
    <ModuleLayout title="Items" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('ItemEdit')}
          placeholder="Search items..."
          selectorFilters={selectorFilters}
        />

        {isLoading && !isRefetching ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
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
                <Package size={48} color={colors.border} />
                <Text style={styles.emptyText}>No items found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}
