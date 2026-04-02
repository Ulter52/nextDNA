import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Tag, ChevronRight, FileText } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '@core/components/FilterHeader';
import { useDebounce } from '@core/utils/debounce';
import { colors, spacing } from '@core/theme';
import { styles } from '../itemList/styles';

import { useItemPrices, usePriceLists } from '../../hooks/itemPriceQueries';

const ItemPriceItem = React.memo(({ item, onPress }: any) => (
  <TouchableOpacity 
    style={styles.itemCard}
    activeOpacity={0.7}
    onPress={() => onPress(item.name)}
  >
    <View style={styles.itemMain}>
      <View style={[styles.itemIcon, { backgroundColor: colors.blue_50 }]}>
        <Tag size={22} color={colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.item_name || item.item_code}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
          <Text style={styles.itemCode}>{item.item_code}</Text>
          <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.text_tertiary }} />
          <Text style={[styles.itemCode, { color: colors.primary, fontWeight: '700' }]}>{item.price_list}</Text>
        </View>
      </View>
    </View>
    
    <View style={styles.itemRight}>
      <Text style={styles.itemQty}>{item.currency} {item.price_list_rate?.toLocaleString()}</Text>
      <ChevronRight size={16} color={colors.border} />
    </View>
  </TouchableOpacity>
));

export function ItemPriceList() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceList, setSelectedPriceList] = useState('');
  const debouncedSearch = useDebounce(searchQuery);

  // Queries
  const { data: priceLists = [] } = usePriceLists();
  const { 
    data: itemPrices = [], 
    isLoading, 
    isRefetching, 
    refetch 
  } = useItemPrices({ 
    search: debouncedSearch, 
    priceList: selectedPriceList 
  });

  const handleItemPress = useCallback((priceId: string) => {
    navigation.navigate('ItemPriceDetail', { priceId });
  }, [navigation]);

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'priceList',
      label: 'Price List',
      icon: FileText,
      value: selectedPriceList,
      options: priceLists,
      onChange: setSelectedPriceList,
      displayField: 'name',
      valueField: 'name'
    }
  ], [selectedPriceList, priceLists]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <ItemPriceItem item={item} onPress={handleItemPress} />
  ), [handleItemPress]);

  const listEmptyComponent = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Tag size={48} color={colors.border} />
      <Text style={styles.emptyText}>No item prices found</Text>
    </View>
  ), []);

  return (
    <ModuleLayout title="Item Prices" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('ItemPriceEdit')}
          placeholder="Search items..."
          selectorFilters={selectorFilters}
        />

        {isLoading && !isRefetching ? (
          <View style={[styles.loadingContainer, { flex: 1, justifyContent: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={itemPrices}
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
