import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Plus, RefreshCw, AlertCircle, Receipt, Search, X, Filter } from 'lucide-react-native';
import { salesInvoiceService } from '../../services/salesInvoiceService';
import { formatCurrency, formatDate } from '@core/utils/formatters';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from '../salesOrderList/styles';

export function SalesInvoiceList() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchInvoices();
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesInvoiceService.getSalesInvoices();
      setInvoices(data || []);
    } catch (err: any) {
      console.error("Fetch Invoices Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to fetch sales invoices";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const matchesSearch = 
        invoice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.customer_name || invoice.customer || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || invoice.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const getStatusStyles = (status: string) => {
    if (!status) return { text: '#2563eb', bg: '#eff6ff' };
    switch (status.toLowerCase()) {
      case 'paid': return { text: '#16a34a', bg: '#f0fdf4' };
      case 'unpaid': return { text: '#dc2626', bg: '#fef2f2' };
      case 'overdue': return { text: '#ea580c', bg: '#fff7ed' };
      case 'draft': return { text: '#4b5563', bg: '#f3f4f6' };
      case 'cancelled': return { text: '#dc2626', bg: '#fef2f2' };
      default: return { text: '#2563eb', bg: '#eff6ff' };
    }
  };

  const statusOptions = ['Draft', 'Unpaid', 'Paid', 'Overdue', 'Cancelled'];

  return (
    <ModuleLayout 
      title="Sales Invoices" 
      user={user}
      showBack={true}
    >
      <View style={styles.container}>
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
              onPress={fetchInvoices}
              disabled={loading}
              style={styles.iconButton}
            >
              <RefreshCw size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => (navigation as any).navigate('NewSalesInvoice')}
              style={styles.addButton}
            >
              <Plus size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

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
            <TouchableOpacity onPress={fetchInvoices}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Receipt size={32} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'There are no sales invoices to display.'}
            </Text>
            <TouchableOpacity onPress={() => {setSearchQuery(''); setStatusFilter(null); fetchInvoices();}}>
              <Text style={styles.refreshText}>Reset List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredInvoices.map((invoice) => {
              const statusStyle = getStatusStyles(invoice.status);
              return (
                <TouchableOpacity 
                  key={invoice.name}
                  onPress={() => (navigation as any).navigate('SalesInvoiceDetail', { invoiceId: invoice.name })}
                  style={styles.orderCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.orderMeta}>
                      <Text style={styles.orderId}>{invoice.name}</Text>
                      <Text style={styles.customerName} numberOfLines={1}>{invoice.customer_name || invoice.customer}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {invoice.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.valueText}>{formatDate(invoice.posting_date)}</Text>
                    </View>
                    <View style={styles.rightAlign}>
                      <Text style={styles.label}>Amount</Text>
                      <Text style={styles.amountText}>{formatCurrency(invoice.grand_total, invoice.currency)}</Text>
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
