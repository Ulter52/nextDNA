import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { 
  BarChart3, ChevronRight, Notebook, TrendingUp, SquareSigma, Book, LayersPlus,
  IndianRupee, TableColumnsSplit, ReceiptIndianRupee, BookOpenText,
  ShoppingCart, Package, Truck, Search, PieChart,
  X, Filter, RefreshCw, Activity
} from 'lucide-react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../../core/theme';
import { styles } from './styles';
import { getDateRanges } from '../../../../core/utils/dateHelpers';
import { companyService } from '../../../../core/services/companyService';

// --- Report Configuration ---
const REPORT_GROUPS = [
  {
    title: 'Sales',
    icon: ShoppingCart,
    color: colors.indigo_500,
    reports: [
      { id: 'Sales Analytics', name: 'Sales Analytics', desc: 'Trends by Item/Customer', icon: BarChart3, color: colors.indigo_500 },
      { id: 'Sales Register', name: 'Sales Register', desc: 'Detailed invoice log', icon: Notebook, color: colors.blue_500 },
      { id: 'Quotation Trends', name: 'Quotation Trends', desc: 'Conversion analysis', icon: TrendingUp, color: colors.orange_500 },
    ]
  },
  {
    title: 'Stock',
    icon: Package,
    color: colors.sky_500,
    reports: [
      { id: 'Total Stock Summary', name: 'Stock Summary', desc: 'Current balance & value', icon: SquareSigma, color: colors.teal_500 },
      { id: 'Stock Ledger', name: 'Stock Ledger', desc: 'Transaction history', icon: Book, color: colors.neutral_600 },
      { id: 'Stock Ageing', name: 'Stock Ageing', desc: 'Stock age analysis', icon: LayersPlus, color: colors.rose_500 },
    ]
  },
  {
    title: 'Financial',
    icon: BarChart3,
    color: colors.purple_500,
    reports: [
      { id: 'Profit and Loss Statement', name: 'Profit and Loss', desc: 'Revenue vs Expenses', icon: IndianRupee, color: colors.green_600 },
      { id: 'Balance Sheet', name: 'Balance Sheet', desc: 'Assets & Liabilities', icon: TableColumnsSplit, color: colors.blue_600 },
      { id: 'Cash Flow', name: 'Cash Flow', desc: 'Cash movement analysis', icon: ReceiptIndianRupee, color: colors.teal_600 },
    ]
  },
  {
    title: 'Procurement',
    icon: Truck,
    color: colors.red_500,
    reports: [
      { id: 'Purchase Analytics', name: 'Purchase Analytics', desc: 'Buying trends', icon: PieChart, color: colors.orange_600 },
      { id: 'Purchase Register', name: 'Purchase Register', desc: 'Detailed purchase log', icon: BookOpenText, color: colors.neutral_700 },
    ]
  }
];

const CATEGORIES = ['All', 'Sales', 'Stock', 'Financial', 'Procurement'];

export function FinancialReportsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  // --- State ---
  const [user, setUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [company, setCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // --- Data Loading ---
  const loadContext = useCallback(async () => {
    try {
      setLoading(true);
      const [selectedCo, userData] = await Promise.all([
        companyService.ensureCompanySelected(),
        AsyncStorage.getItem('erp_user')
      ]);
      
      if (selectedCo) setCompany(selectedCo.name);
      if (userData) setUser(userData);
    } catch (error) {
      console.error('Failed to load context:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) loadContext();
  }, [isFocused, loadContext]);

  // --- Search & Filtering Logic ---
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return REPORT_GROUPS
      .filter(group => selectedCategory === 'All' || group.title === selectedCategory)
      .map(group => ({
        ...group,
        reports: group.reports.filter(r => 
          r.name.toLowerCase().includes(query) || r.desc.toLowerCase().includes(query)
        )
      }))
      .filter(group => group.reports.length > 0);
  }, [searchQuery, selectedCategory]);

  // --- Report Navigation ---
  const buildFilters = async (reportId: string) => {
    const ranges = getDateRanges();
    const fy = await companyService.getFiscalYear();
    
    const baseFilters: any = {
      company: company,
      from_date: ranges.financialYear.from_date,
      to_date: ranges.financialYear.to_date,
      fiscal_year: fy.name
    };

    switch (reportId) {
      case 'Sales Analytics':
        return { ...baseFilters, tree_type: 'Customer', doc_type: 'Sales Invoice', value_quantity: 'Value', range: 'Monthly' };
      case 'Purchase Analytics':
        return { ...baseFilters, tree_type: 'Supplier', doc_type: 'Purchase Invoice', value_quantity: 'Value', range: 'Monthly' };
      case 'Total Stock Summary':
        return { ...baseFilters, valuation_field: 'valuation_rate' };
      case 'Stock Ledger':
        return { ...baseFilters, include_uom: 1 };
      case 'Quotation Trends':
        return { ...baseFilters, based_on: 'Customer', periodicity: 'Monthly', period: 'Monthly' };
      case 'Stock Ageing':
        return { company, to_date: ranges.today, range: '30, 60, 90' };
      case 'Profit and Loss Statement':
      case 'Balance Sheet':
      case 'Cash Flow':
        return { 
          ...baseFilters, 
          filter_based_on: 'Date Range', 
          periodicity: 'Monthly',
          period_start_date: ranges.financialYear.from_date,
          period_end_date: ranges.financialYear.to_date 
        };
      default:
        return baseFilters;
    }
  };

  const handleReportPress = async (report: any) => {
    if (!company) {
      Alert.alert("Notice", "Synchronising company data...");
      return;
    }

    const filters = await buildFilters(report.id);
    navigation.navigate('ReportViewer', {
      reportId: report.id,
      reportName: report.id,
      filters
    });
  };

  // --- Sub-components ---
  const renderSearchBar = () => (
    <View style={styles.actionBar}>
      <View style={styles.searchBar}>
        <Search size={18} color={colors.text_tertiary} />
        <TextInput
          placeholder="Search reports..."
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.text_tertiary}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color={colors.text_tertiary} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.iconButton, showFilters && styles.activeIconButton]} 
        onPress={() => setShowFilters(!showFilters)}
      >
        <Filter size={20} color={showFilters ? colors.white : colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={() => { setRefreshing(true); loadContext(); }}>
        <RefreshCw size={20} color={colors.text_secondary} />
      </TouchableOpacity>
    </View>
  );

  const renderCategoryFilter = () => showFilters && (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.categoryChip, selectedCategory === cat && styles.activeChip]}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ModuleLayout title="Reports Hub" user={user}>
      <View style={styles.container}>
        {renderSearchBar()}
        {renderCategoryFilter()}

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadContext} tintColor={colors.primary} />}
        >
          {loading && !refreshing ? (
             <View style={{ padding: 60, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ marginTop: 12, color: colors.text_tertiary, fontSize: 13, fontWeight: '600' }}>Initialising analytics...</Text>
             </View>
          ) : (
            <>
              {filteredData.map((group) => (
                <View key={group.title} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{group.title}</Text>
                    <View style={[styles.sectionLine, { backgroundColor: group.color + '20' }]} />
                  </View>
                  
                  <View style={styles.cardGrid}>
                    {group.reports.map((report) => (
                      <TouchableOpacity
                        key={report.id}
                        style={styles.reportCard}
                        onPress={() => handleReportPress(report)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.iconBox, { backgroundColor: report.color + '10' }]}>
                          <report.icon size={22} color={report.color} />
                        </View>
                        <View style={styles.cardContent}>
                          <Text style={styles.reportName} numberOfLines={1}>{report.name}</Text>
                          <Text style={styles.reportDesc} numberOfLines={2}>{report.desc}</Text>
                        </View>
                        {!company ? (
                           <ActivityIndicator size="small" color={colors.text_tertiary} />
                        ) : (
                           <ChevronRight size={16} color={colors.border_medium} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {filteredData.length === 0 && (
                <View style={styles.emptyState}>
                  <Activity size={48} color={colors.border_medium} />
                  <Text style={styles.emptyText}>No reports match your criteria</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </ModuleLayout>
  );
}
