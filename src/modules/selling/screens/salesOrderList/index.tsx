import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Plus, RefreshCw, AlertCircle, ShoppingBag, Search, X, Filter } from 'lucide-react-native';
import { sellingService } from '@sellingServices/salesOrderService';
import { SalesOrder } from '../types';
import { formatCurrency, formatDate } from '@core/utils/formatters';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from './styles';

export function SalesOrderList() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchOrders();
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sellingService.getSalesOrders();
      setOrders(data || []);
    } catch (err: any) {
      console.error("Fetch Orders Error:", err);
      const msg = err.response?.status === 403 
        ? "Session expired or insufficient permissions. Try logging out and in again."
        : (err.response?.data?.message || err.message || "Failed to fetch sales orders");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customer_name || order.customer || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const getStatusStyles = (status: string) => {
    if (!status) return { text: '#2563eb', bg: '#eff6ff' };
    switch (status.toLowerCase()) {
      case 'completed': return { text: '#16a34a', bg: '#f0fdf4' };
      case 'to deliver and bill': return { text: '#2563eb', bg: '#eff6ff' };
      case 'draft': return { text: '#4b5563', bg: '#f3f4f6' };
      case 'on hold': return { text: '#ea580c', bg: '#fff7ed' };
      case 'cancelled': return { text: '#dc2626', bg: '#fef2f2' };
      default: return { text: '#2563eb', bg: '#eff6ff' };
    }
  };

  const statusOptions = ['Draft', 'To Deliver and Bill', 'Completed', 'Cancelled', 'On Hold'];

  return (
    <ModuleLayout 
      title="Sales Orders" 
      user={user}
      showBack={true}
    >
      <View style={styles.container}>
        {/* Search & Action Bar */}
        <View style={styles.actionBar}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ID or Customer"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.iconButton, statusFilter && styles.activeFilterBtn]}
            >
              <Filter size={18} color={statusFilter ? '#2563eb' : '#6b7280'} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={fetchOrders}
              disabled={loading}
              style={styles.iconButton}
            >
              <RefreshCw size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('NewSalesOrder')}
              style={styles.addButton}
            >
              <Plus size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Filters */}
        {showFilters && (
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <TouchableOpacity 
                onPress={() => setStatusFilter(null)}
                style={[styles.filterChip, !statusFilter && styles.activeFilterChip]}
              >
                <Text style={[styles.filterChipText, !statusFilter && styles.activeFilterChipText]}>All</Text>
              </TouchableOpacity>
              {statusOptions.map(status => (
                <TouchableOpacity 
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  style={[styles.filterChip, statusFilter === status && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterChipText, statusFilter === status && styles.activeFilterChipText]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={24} color="#dc2626" />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchOrders}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <ShoppingBag size={32} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'There are no sales orders to display.'}
            </Text>
            <TouchableOpacity onPress={() => {setSearchQuery(''); setStatusFilter(null); fetchOrders();}}>
              <Text style={styles.refreshText}>Reset List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredOrders.map((order) => {
              const statusStyle = getStatusStyles(order.status);
              return (
                <TouchableOpacity 
                  key={order.name}
                  onPress={() => navigation.navigate('SalesOrderDetail', { orderId: order.name })}
                  style={styles.orderCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.orderMeta}>
                      <Text style={styles.orderId}>{order.name}</Text>
                      <Text style={styles.customerName} numberOfLines={1}>{order.customer_name || order.customer}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.valueText}>{formatDate(order.transaction_date)}</Text>
                    </View>
                    <View style={styles.rightAlign}>
                      <Text style={styles.label}>Amount</Text>
                      <Text style={styles.amountText}>{formatCurrency(order.grand_total, order.currency)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </ModuleLayout>
  );
}

