import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Tag, ChevronRight, Search, X, Filter, Plus, RefreshCw, FileText } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../itemList/styles';
import { colors, spacing, moderateScale } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { fetchResource } from '../../../../core/api/frappeApiHelpers';
import { Selector } from '../../../../core/components/Selector';

export function ItemPriceList() {
  const [itemPrices, setItemPrices] = useState<any[]>([]);
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [selectedPriceList, setSelectedPriceList] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const navigation = useNavigation<any>();
  const searchTimer = useRef<any>(null);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await fetchResource('Price List', { fields: '["name"]' });
      setPriceLists(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch price lists", err);
    }
  }, []);

  const fetchItemPrices = useCallback(async (isRefreshing = false, search = '', priceList = '') => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const finalFilters: any[] = [];
      if (search) {
        finalFilters.push(["item_code", "like", `%${search}%`]);
      }
      if (priceList) {
        finalFilters.push(["price_list", "=", priceList]);
      }

      const res = await fetchResource('Item Price', {
        fields: '["name", "item_code", "item_name", "price_list", "price_list_rate", "currency"]',
        filters: finalFilters.length > 0 ? JSON.stringify(finalFilters) : undefined,
        order_by: 'modified desc',
        limit_page_length: 50
      });
      setItemPrices(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch item prices", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetadata();
    fetchItemPrices();
  }, []);

  useEffect(() => {
    fetchItemPrices(false, searchQuery, selectedPriceList);
  }, [selectedPriceList]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchItemPrices(false, val, selectedPriceList);
    }, 500);
  };

  const resetFilters = () => {
    setSelectedPriceList('');
    setSearchQuery('');
    fetchItemPrices(false, '', '');
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.itemCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ItemPriceDetail', { priceId: item.name })}
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
    );
  }, [navigation]);

  return (
    <ModuleLayout title="Item Prices" showBack>
      <View style={styles.container}>
        <View style={[styles.actionBar, { flexDirection: 'column', height: 'auto', gap: spacing.sm, paddingVertical: spacing.sm }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%' }}>
            <View style={[styles.searchContainer, { flex: 1 }]}>
              <Search size={18} color={colors.text_tertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholderTextColor={colors.text_tertiary}
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => handleSearchChange('')}>
                  <X size={18} color={colors.text_tertiary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => setShowFilters(!showFilters)}
                style={[styles.iconButton, showFilters && { backgroundColor: colors.blue_50, borderColor: colors.primary }]}
              >
                <Filter size={18} color={showFilters ? colors.primary : colors.text_secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => fetchItemPrices(true, searchQuery, selectedPriceList)} style={styles.iconButton}>
                <RefreshCw size={18} color={colors.text_secondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ItemPriceEdit')} style={styles.addButton}>
                <Plus size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {showFilters && (
            <View style={{ width: '100%', backgroundColor: colors.blue_50 + '50', padding: spacing.md, borderRadius: moderateScale(12), gap: spacing.sm, borderWidth: 1, borderColor: colors.blue_100 }}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Selector 
                    placeholder="Price List" 
                    options={priceLists} 
                    value={selectedPriceList} 
                    onChange={setSelectedPriceList} 
                    icon={FileText} 
                    displayField="name" 
                    valueField="name"
                  />
                </View>
              </View>
              {selectedPriceList && (
                <TouchableOpacity onPress={resetFilters} style={{ alignSelf: 'flex-end' }}>
                  <Text style={{ fontSize: 11, color: colors.error, fontWeight: 'bold' }}>Clear All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {loading && !refreshing ? (
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
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchItemPrices(true, searchQuery, selectedPriceList)} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Tag size={48} color={colors.border} />
                <Text style={styles.emptyText}>No item prices found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}
