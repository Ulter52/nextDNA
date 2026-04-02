import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { X, Calendar, Check, RotateCcw, Building2, ChevronDown, Filter, Clock, Book, Target, Coins, Briefcase } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadow, typography } from '../../../core/theme';
import { companyService, Company, FiscalYear } from '../../../core/services/companyService';
import { Selector } from '../../../core/components/Selector';

interface ReportFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
  reportId: string;
  currentFilters: any;
}

export function ReportFilterModal({ visible, onClose, onApply, reportId, currentFilters }: ReportFilterModalProps) {
  const [filters, setFilters] = useState<any>(currentFilters);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      // Ensure default values for P&L and Balance Sheet if not present
      const isFinancial = ['Profit and Loss Statement', 'Balance Sheet'].includes(reportId);
      let initialFilters = { ...currentFilters };
      
      if (isFinancial) {
        if (!initialFilters.filter_based_on) initialFilters.filter_based_on = 'Fiscal Year';
        if (!initialFilters.periodicity) initialFilters.periodicity = 'Monthly';
      }
      
      setFilters(initialFilters);
      loadMetadata();
    }
  }, [visible, currentFilters, reportId]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const [cos, years] = await Promise.all([
        companyService.getAvailableCompanies(),
        companyService.getAvailableFiscalYears()
      ]);
      setCompanies(cos);
      setFiscalYears(years);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (key: string, value: any) => {
    setFilters((prev: any) => {
      const newFilters = { ...prev, [key]: value };
      
      // Auto-update dates when fiscal year changes (for standard reports)
      if (key === 'fiscal_year' && !['Profit and Loss Statement', 'Balance Sheet'].includes(reportId)) {
        const selectedYear = fiscalYears.find(y => y.name === value);
        if (selectedYear) {
          newFilters.from_date = selectedYear.year_start_date;
          newFilters.to_date = selectedYear.year_end_date;
        }
      }
      
      return newFilters;
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const renderField = (label: string, key: string, icon?: any) => {
    const Icon = icon;
    return (
      <View style={styles.fieldContainer} key={key}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
          <View style={styles.input}>
             {Icon && <Icon size={16} color={colors.text_tertiary} style={{ marginRight: 8 }} />}
             <TextInput
               style={{ flex: 1, color: colors.text_primary, fontWeight: '600' }}
               value={String(filters[key] || '')}
               onChangeText={(val) => handleUpdate(key, val)}
               placeholder={`Enter ${label.toLowerCase()}...`}
               placeholderTextColor={colors.text_tertiary}
             />
          </View>
        </View>
      </View>
    );
  };

  const isFinancial = ['Profit and Loss Statement', 'Balance Sheet'].includes(reportId);
  const isAnalytics = reportId.includes('Analytics');
  
  const filterBasedOnOptions = [
    { name: 'Fiscal Year', value: 'Fiscal Year' },
    { name: 'Date Range', value: 'Date Range' }
  ];

  const periodicityOptions = [
    { name: 'Monthly', value: 'Monthly' },
    { name: 'Quarterly', value: 'Quarterly' },
    { name: 'Half-Yearly', value: 'Half-Yearly' },
    { name: 'Yearly', value: 'Yearly' }
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContent}
        >
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.iconBox}>
                <Filter size={20} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Report Filters</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text_secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Selector
              label="Company"
              icon={Building2}
              options={companies}
              value={filters.company}
              onChange={(val) => handleUpdate('company', val)}
              displayField="company_name"
              valueField="name"
              placeholder="Select Company"
              loading={loading}
            />

            {isFinancial ? (
              <>
                <Selector
                  label="Filter Based On"
                  icon={Filter}
                  options={filterBasedOnOptions}
                  value={filters.filter_based_on}
                  onChange={(val) => handleUpdate('filter_based_on', val)}
                  displayField="name"
                  valueField="value"
                  placeholder="Select Type"
                />

                {filters.filter_based_on === 'Fiscal Year' ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Selector
                        label="From Fiscal Year"
                        icon={Clock}
                        options={fiscalYears}
                        value={filters.from_fiscal_year}
                        onChange={(val) => handleUpdate('from_fiscal_year', val)}
                        displayField="name"
                        valueField="name"
                        placeholder="Select"
                        loading={loading}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Selector
                        label="To Fiscal Year"
                        icon={Clock}
                        options={fiscalYears}
                        value={filters.to_fiscal_year}
                        onChange={(val) => handleUpdate('to_fiscal_year', val)}
                        displayField="name"
                        valueField="name"
                        placeholder="Select"
                        loading={loading}
                      />
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      {renderField('Start Date', 'period_start_date', Calendar)}
                    </View>
                    <View style={{ flex: 1 }}>
                      {renderField('End Date', 'period_end_date', Calendar)}
                    </View>
                  </View>
                )}

                <Selector
                  label="Periodicity"
                  icon={Clock}
                  options={periodicityOptions}
                  value={filters.periodicity}
                  onChange={(val) => handleUpdate('periodicity', val)}
                  displayField="name"
                  valueField="value"
                  placeholder="Select Periodicity"
                />

                {renderField('Finance Book', 'finance_book', Book)}
                {renderField('Presentation Currency', 'presentation_currency', Coins)}
                {renderField('Cost Center', 'cost_center', Target)}
                {renderField('Project', 'project', Briefcase)}
              </>
            ) : (
              <>
                <Selector
                  label="Fiscal Year"
                  icon={Clock}
                  options={fiscalYears}
                  value={filters.fiscal_year}
                  onChange={(val) => handleUpdate('fiscal_year', val)}
                  displayField="name"
                  valueField="name"
                  placeholder="Select Fiscal Year"
                  loading={loading}
                />
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    {renderField('From Date', 'from_date', Calendar)}
                  </View>
                  <View style={{ flex: 1 }}>
                    {renderField('To Date', 'to_date', Calendar)}
                  </View>
                </View>
              </>
            )}
            
            {isAnalytics && (
                <>
                    {renderField('Tree Type', 'tree_type')}
                    {renderField('Doc Type', 'doc_type')}
                    {renderField('Value/Qty', 'value_quantity')}
                    {renderField('Range', 'range')}
                </>
            )}

            {reportId === 'Stock Ageing' && (
                <>
                    {renderField('Range', 'range')}
                </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.resetBtn} 
              onPress={() => setFilters(currentFilters)}
            >
              <RotateCcw size={18} color={colors.text_secondary} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Check size={18} color={colors.white} />
              <Text style={styles.applyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '85%',
    ...shadow.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.blue_50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text_primary,
  },
  closeBtn: {
    padding: 8,
  },
  body: {
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text_primary,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border_light,
    backgroundColor: colors.white,
  },
  resetBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text_secondary,
  },
  applyBtn: {
    flex: 2,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.medium,
  },
  applyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
});
