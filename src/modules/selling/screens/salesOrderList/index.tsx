import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Plus, FileText } from 'lucide-react-native';
import { formatCurrency, formatDate } from '../../../../core/utils/formatters';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '../../../../navigation/types';
import { useSalesOrders } from '../../hooks/sellingQueries';
import { FilterHeader } from '../../../../core/components/FilterHeader';
import { colors, spacing } from '../../../../core/theme';
import { useDebounce } from '../../../../core/utils/debounce';
import styles from './styles';

export function SalesOrderList() {
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState('All');
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useSalesOrders(debouncedSearch, statusFilter);

  const orders = useMemo(() => {
    return data?.pages?.flatMap(page => page) || [];
  }, [data]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAdd = useCallback(() => {
    navigation.navigate('NewSalesOrder');
  }, [navigation]);

  const getStatusStyles = useCallback((status: string) => {
    if (!status) return { text: colors.primary, bg: colors.blue_50 };
    switch (status.toLowerCase()) {
      case 'completed': return { text: colors.success, bg: colors.green_100 };
      case 'to deliver and bill': return { text: colors.primary, bg: colors.blue_100 };
      case 'to deliver': return { text: colors.teal_600, bg: colors.teal_50 };
      case 'to bill': return { text: colors.orange_600, bg: colors.orange_50 };
      case 'draft': return { text: colors.neutral_600, bg: colors.neutral_100 };
      case 'cancelled': return { text: colors.error, bg: colors.red_100 };
      case 'closed': return { text: colors.neutral_400, bg: colors.neutral_100 };
      default: return { text: colors.primary, bg: colors.blue_50 };
    }
  }, []);

  const renderItem = useCallback(({ item }: any) => {
    const statusStyle = getStatusStyles(item.status);
    return (
      <TouchableOpacity 
        onPress={() => navigation.navigate('SalesOrderDetail', { orderId: item.name })}
        style={styles.orderCard}
        activeOpacity={0.7}
      >
        <View style={styles.cardTop}>
          <View style={styles.orderMeta}>
            <Text style={styles.orderId}>{item.name}</Text>
            <Text style={styles.customerName} numberOfLines={1}>{item.customer_name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.valueText}>{formatDate(item.transaction_date)}</Text>
          </View>
          <View style={styles.rightAlign}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.amountText}>{formatCurrency(item.grand_total, item.currency)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation, getStatusStyles]);

  const filterOptions = useMemo(() => [
    { label: 'All', value: 'All' },
    { label: 'Draft', value: 'Draft' },
    { label: 'To Deliver', value: 'To Deliver' },
    { label: 'To Bill', value: 'To Bill' },
    { label: 'To Deliver and Bill', value: 'To Deliver and Bill' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ], []);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return <View style={{ height: spacing.xxl }} />;
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <ModuleLayout title="Sales Orders" user={user} showBack={true}>
      <FilterHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={handleRefresh}
        onAdd={handleAdd}
        placeholder="Search orders..."
        filters={filterOptions}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />
      
      {isLoading && !isRefetching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <FileText size={32} color={colors.neutral_300} />
              </View>
              <Text style={styles.emptyTitle}>No Sales Orders Found</Text>
              <Text style={styles.emptySubtitle}>Adjust your filters or create a new order.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </ModuleLayout>
  );
}
