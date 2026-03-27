import React, { useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { FileText, Tag, Wallet, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FilterHeader, SelectorFilterConfig } from '../../../../core/components/FilterHeader';
import { colors } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { useDebounce } from '../../../../core/utils/debounce';
import { useJournalEntries, useJournalEntryFilters } from '../../hooks/journalEntryQueries';
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
    label: 'Submitted',
    color: colors.success,
    Icon: CheckCircle2,
  },
  Cancelled: {
    label: 'Cancelled',
    color: colors.error,
    Icon: XCircle,
  },
  Draft: {
    label: 'Draft',
    color: colors.neutral_500,
    Icon: Clock,
  },
  default: {
    label: 'Unknown',
    color: colors.text_secondary,
    Icon: Tag,
  },
};

export function JournalEntryList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [voucherType, setVoucherType] = useState('All');
  
  const debouncedSearch = useDebounce(searchQuery);
  const navigation = useNavigation<any>();

  // Fetch company (Ideally this would also be a hook in a real app)
  const [companyName, setCompanyName] = useState('DNA Retail Enterprises');
  React.useEffect(() => {
    companyService.getSelectedCompany().then(c => {
      if (c?.name) setCompanyName(c.name);
    });
  }, []);

  const { data: filtersData } = useJournalEntryFilters();
  const voucherTypeOptions = useMemo(() => filtersData?.voucherTypes || [], [filtersData]);

  const { 
    data: entries, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useJournalEntries({
    company: companyName,
    search: debouncedSearch,
    status: statusFilter,
    voucherType: voucherType
  });

  const selectorFilters: SelectorFilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      icon: Tag,
      value: statusFilter,
      options: STATUS_OPTIONS,
      onChange: setStatusFilter
    },
    {
      id: 'voucherType',
      label: 'Voucher Type',
      icon: Wallet,
      value: voucherType,
      options: voucherTypeOptions,
      onChange: setVoucherType
    }
  ], [statusFilter, voucherType, voucherTypeOptions]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    // Map docstatus to string for STATUS_CONFIG
    const statusKey = item.docstatus === 1 ? 'Submitted' : item.docstatus === 2 ? 'Cancelled' : 'Draft';
    const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.default;

    return (
      <TouchableOpacity 
        style={styles.itemCard} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('JournalEntryDetail', { entryId: item.name })}
      >
        <View style={styles.cardMain}>
          <View style={[styles.iconBox, { backgroundColor: colors.purple_100 }]}>
            <FileText size={20} color={colors.purple_500} />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.row}>
              <Text style={styles.voucherType} numberOfLines={1}>{item.voucher_type || 'Journal Entry'}</Text>
              <Text style={styles.amount}>{formatCurrency(item.total_debit, 'INR')}</Text>
            </View>
            
            <View style={styles.row}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.name}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.metaText}>{item.posting_date}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '15' }]}>
                <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <ModuleLayout title="Journal Entries" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('JournalEntryEdit')}
          placeholder="Search by ID..."
          selectorFilters={selectorFilters}
        />

        {isLoading && !isRefetching ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={entries?.data || []}
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
              <View style={styles.emptyWrapper}>
                <FileText size={48} color={colors.border} />
                <Text style={styles.emptyText}>No journal entries found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}

// Ensure the renderItem is memoized
const useCallback = React.useCallback;
