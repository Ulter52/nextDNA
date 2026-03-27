import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Wallet, UserCircle, Tag, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '../../../../core/components/FilterHeader';
import { colors } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { accountingApi } from '../../services/accountingApi';
import { formatCurrency } from '../../../../core/utils/formatters';
import { companyService } from '../../../../core/services/companyService';
import { styles } from './styles';

const STATUS_OPTIONS = [
  { name: 'All Status', value: 'All' },
  { name: 'Draft', value: 'Draft' },
  { name: 'Submitted', value: 'Submitted' },
  { name: 'Cancelled', value: 'Cancelled' },
];

const STATUS_CONFIG: any = {
  Submitted: {
    color: colors.success,
    Icon: CheckCircle2,
  },
  Cancelled: {
    color: colors.error,
    Icon: XCircle,
  },
  Draft: {
    color: colors.neutral_500,
    Icon: Clock,
  },
  default: {
    color: colors.text_secondary,
    Icon: Tag,
  },
};

export function PaymentEntryList() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentType, setPaymentType] = useState('All');
  const [partyType, setPartyType] = useState('All');
  
  const [paymentTypeOptions, setPaymentTypeOptions] = useState<any[]>([]);
  const [partyTypeOptions, setPartyTypeOptions] = useState<any[]>([]);

  const navigation = useNavigation<any>();
  const searchTimer = useRef<any>(null);

  const fetchFilters = useCallback(async () => {
    try {
      const filters = await accountingApi.getPaymentEntryFilters();
      setPaymentTypeOptions(filters.paymentTypes);
      setPartyTypeOptions(filters.partyTypes);
    } catch (err) {
      console.error("Failed to fetch filters", err);
    }
  }, []);

  const fetchEntries = useCallback(async (isRefreshing = false, search = '', status = 'All', pType = 'All', prtyType = 'All') => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const company = await companyService.getSelectedCompany();
      const res = await accountingApi.getPaymentEntries(
        company?.name || '', 
        search, 
        status,
        pType,
        prtyType
      );
      setEntries(res?.data || []);
    } catch (err) {
      console.error("Failed to fetch payment entries", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
    fetchEntries();
  }, [fetchFilters, fetchEntries]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fetchEntries(false, val, statusFilter, paymentType, partyType);
    }, 500);
  };

  const applyFilters = (newStatus: string, newPType: string, newPartyType: string) => {
    fetchEntries(false, searchQuery, newStatus, newPType, newPartyType);
  };

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      icon: Tag,
      value: statusFilter,
      options: STATUS_OPTIONS,
      onChange: (val: string) => {
        setStatusFilter(val);
        applyFilters(val, paymentType, partyType);
      }
    },
    {
      id: 'paymentType',
      label: 'Payment Type',
      icon: Wallet,
      value: paymentType,
      options: paymentTypeOptions,
      onChange: (val: string) => {
        setPaymentType(val);
        applyFilters(statusFilter, val, partyType);
      }
    },
    {
      id: 'partyType',
      label: 'Party Type',
      icon: UserCircle,
      value: partyType,
      options: partyTypeOptions,
      onChange: (val: string) => {
        setPartyType(val);
        applyFilters(statusFilter, paymentType, val);
      }
    }
  ], [statusFilter, paymentType, partyType, paymentTypeOptions, partyTypeOptions]);

  const renderItem = ({ item }: { item: any }) => {
    const isReceive = item.payment_type === 'Receive';
    const DirectionIcon = isReceive ? ArrowDownLeft : ArrowUpRight;
    const directionColor = isReceive ? colors.success : colors.error;
    
    const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.default;

    return (
      <TouchableOpacity 
        style={styles.itemCard} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('PaymentEntryDetail', { entryId: item.name })}
      >
        <View style={styles.cardMain}>
          <View style={[styles.iconBox, { backgroundColor: directionColor + '15' }]}>
            <DirectionIcon size={20} color={directionColor} />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.row}>
              <Text style={styles.partyName} numberOfLines={1}>{item.party || 'Internal Transfer'}</Text>
              <Text style={styles.amount}>{formatCurrency(item.paid_amount, 'INR')}</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.name}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaText}>{item.posting_date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>{item.status}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Payment Entries" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onRefresh={() => fetchEntries(true, searchQuery, statusFilter, paymentType, partyType)}
          onAdd={() => navigation.navigate('PaymentEntryEdit')}
          placeholder="Search by party..."
          selectorFilters={selectorFilters}
        />

        {loading && !refreshing ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={() => fetchEntries(true, searchQuery, statusFilter, paymentType, partyType)} 
                tintColor={colors.primary} 
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrapper}>
                <CreditCard size={48} color={colors.border} />
                <Text style={styles.emptyText}>No payment entries found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}
