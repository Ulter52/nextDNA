import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Search, Plus, RefreshCw, AlertCircle, FileText, X, Filter, ChevronRight } from 'lucide-react-native';
import { quotationService } from '@sellingServices/quotationService';
import { Quotation } from '../types';
import { formatCurrency, formatDate } from '@utils/formatters';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from '../salesOrderList/styles';

export function QuotationList() {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchQuotes();
  }, []);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotationService.getQuotations();
      setQuotes(data || []);
    } catch (err: any) {
      console.error("Fetch Quotations Error:", err);
      setError(err.message || "Failed to fetch quotations");
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = 
        quote.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quote.customer_name || quote.party_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || quote.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [quotes, searchQuery, statusFilter]);

  const getStatusStyles = (status: string) => {
    if (!status) return { text: '#2563eb', bg: '#eff6ff' };
    switch (status.toLowerCase()) {
      case 'ordered': return { text: '#16a34a', bg: '#f0fdf4' };
      case 'open': return { text: '#2563eb', bg: '#eff6ff' };
      case 'draft': return { text: '#4b5563', bg: '#f3f4f6' };
      case 'lost': return { text: '#dc2626', bg: '#fef2f2' };
      case 'expired': return { text: '#ea580c', bg: '#fff7ed' };
      default: return { text: '#2563eb', bg: '#eff6ff' };
    }
  };

  const statusOptions = ['Draft', 'Open', 'Ordered', 'Lost', 'Expired'];

  return (
    <ModuleLayout title="Quotations" user={user} showBack={true}>
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
              onPress={fetchQuotes}
              disabled={loading}
              style={styles.iconButton}
            >
              <RefreshCw size={18} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('NewQuotation')}
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
            <AlertCircle size={24} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchQuotes}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredQuotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={32} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Quotations Found</Text>
            <TouchableOpacity onPress={() => {setSearchQuery(''); setStatusFilter(null); fetchQuotes();}}>
              <Text style={styles.refreshText}>Reset List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredQuotes.map((quote) => {
              const statusStyle = getStatusStyles(quote.status);
              return (
                <TouchableOpacity 
                  key={quote.name}
                  onPress={() => navigation.navigate('QuotationDetail', { quotationId: quote.name })}
                  style={styles.orderCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.orderMeta}>
                      <Text style={styles.orderId}>{quote.name}</Text>
                      <Text style={styles.customerName} numberOfLines={1}>{quote.customer_name || quote.party_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {quote.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardBottom}>
                    <View>
                      <Text style={styles.label}>Date</Text>
                      <Text style={styles.valueText}>{formatDate(quote.transaction_date)}</Text>
                    </View>
                    <View style={styles.rightAlign}>
                      <Text style={styles.label}>Amount</Text>
                      <Text style={styles.amountText}>{formatCurrency(quote.grand_total, quote.currency)}</Text>
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
