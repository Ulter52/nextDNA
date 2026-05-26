import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl, Image } from 'react-native';
import { UserPlus, ChevronRight, Layers } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '../../../../navigation/types';
import { useCustomers, useCustomerGroups } from '../../hooks/customerQueries';
import { FilterHeader, SelectorFilterConfig } from '../../../../core/components/FilterHeader';
import { colors, spacing } from '../../../../core/theme';
import styles from './styles';

export function CustomerList() {
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useCustomers(debouncedSearch, { customer_group: selectedGroup === 'All' ? undefined : selectedGroup });

  const { data: groupsRes } = useCustomerGroups();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const flattenPages = (res: any) => {
    if (!res || !res.pages || !Array.isArray(res.pages)) return [];
    let all: any[] = [];
    for (let i = 0; i < res.pages.length; i++) {
      const page = res.pages[i];
      if (Array.isArray(page)) {
        for (let j = 0; j < page.length; j++) {
          all.push(page[j]);
        }
      }
    }
    return all;
  };

  const customers = useMemo(() => flattenPages(data), [data]);

  const groupOptions = useMemo(() => {
    const list = flattenPages(groupsRes);
    const options = [{ name: 'All Groups', value: 'All' }];
    for (let i = 0; i < list.length; i++) {
      options.push({ name: list[i].name, value: list[i].name });
    }
    return options;
  }, [groupsRes]);

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'group',
      label: 'Group',
      icon: Layers,
      value: selectedGroup,
      options: groupOptions,
      onChange: setSelectedGroup
    }
  ], [selectedGroup, groupOptions]);

  const handleRefresh = useCallback(() => refetch(), [refetch]);
  const handleAdd = useCallback(() => navigation.navigate('NewCustomer'), [navigation]);

  const renderItem = useCallback(({ item }: any) => (
    <TouchableOpacity 
      style={styles.customerCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('CustomerDetail', { customerId: item.name })}
    >
      <View style={styles.customerLeft}>
        <View style={styles.avatar}>
          {item.image ? (
            <Image 
              source={{ uri: item.image.startsWith('http') ? item.image : `https://erp.nextdna.in${item.image}` }} 
              style={styles.avatarImage} 
            />
          ) : (
            <Text style={styles.avatarText}>{(item.customer_name || item.name || '?').charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
          <Text style={styles.customerDetails} numberOfLines={1}>{item.customer_group} • {item.territory || 'No Territory'}</Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.text_tertiary} />
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = () => isFetchingNextPage ? (
    <View style={styles.loaderFooter}><ActivityIndicator color={colors.primary} /></View>
  ) : <View style={{ height: spacing.xxl }} />;

  return (
    <ModuleLayout title="Customers" user={user} showBack={true}>
      <FilterHeader 
        searchQuery={searchQuery} onSearchChange={setSearchQuery}
        onRefresh={handleRefresh} onAdd={handleAdd}
        placeholder="Search by name..." selectorFilters={selectorFilters}
      />
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={styles.loadingText}>Loading customers...</Text></View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />}
        />
      )}
    </ModuleLayout>
  );
}
