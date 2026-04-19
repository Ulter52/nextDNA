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

  // Handle Search Debounce
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

  const { data: groups } = useCustomerGroups();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const customers = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data]);

  const groupOptions = useMemo(() => [
    { name: 'All Groups', value: 'All' },
    ...(groups || []).map((g: any) => ({ name: g.name, value: g.name }))
  ], [groups]);

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

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAdd = useCallback(() => {
    navigation.navigate('NewCustomer');
  }, [navigation]);

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
            <Text style={styles.avatarText}>
              {(item.customer_name || item.name || '?').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
          <Text style={styles.customerDetails} numberOfLines={1}>
            {item.customer_group} • {item.territory || 'No Territory'}
          </Text>
        </View>
      </View>
      <ChevronRight size={18} color={colors.text_tertiary} />
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return <View style={{ height: spacing.xxl }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <UserPlus size={32} color={colors.text_tertiary} />
        </View>
        <Text style={styles.emptyTitle}>No Customers Found</Text>
        <Text style={styles.emptySubtitle}>Try adjusting your search or add a new customer.</Text>
      </View>
    );
  };

  return (
    <ModuleLayout title="Customers" user={user} showBack={true}>
      <FilterHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        onAdd={handleAdd}
        placeholder="Search by name..."
        selectorFilters={selectorFilters}
      />
      
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading customers...</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.name}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </ModuleLayout>
  );
}
