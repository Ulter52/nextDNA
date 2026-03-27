import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Save, Calendar, Landmark, FileText, Plus, Trash2, Hash, CheckCircle, Edit } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accountingApi } from '../../services/accountingApi';
import { Selector } from '../../../../core/components/Selector';
import { formatCurrency } from '../../../../core/utils/formatters';
import { useDebounce } from '../../../../core/utils/debounce';
import { useJournalAccountOptions } from '../../hooks/journalEntryQueries';
import { styles } from './styles';

export function JournalEntryEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [entryId, setEntryId] = useState(route.params?.entryId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [docStatus, setDocStatus] = useState(0);

  // Form States
  const [voucherType, setVoucherType] = useState('Journal Entry');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [company] = useState('DNA Retail Enterprises');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState(new Date().toISOString().split('T')[0]);
  const [userRemark, setUserRemark] = useState('');
  const [journalAccounts, setJournalAccounts] = useState<any[]>([
    { account: '', debit: '0', credit: '0', party_type: '', party: '' },
    { account: '', debit: '0', credit: '0', party_type: '', party: '' }
  ]);

  const [accountSearch, setAccountSearch] = useState('');
  const debouncedAccountSearch = useDebounce(accountSearch);

  const { data: rawAccounts, isLoading: loadingOptions } = useJournalAccountOptions(company, debouncedAccountSearch);

  // Memoized options that always include selected values from ALL rows to prevent "select" placeholder flash
  const accountOptions = useMemo(() => {
    const merged = [...(rawAccounts || [])];
    const selectedAccountNames = journalAccounts.map(a => a.account).filter(Boolean);
    
    selectedAccountNames.forEach(val => {
      if (val && !merged.find(m => m.name === val)) {
        merged.push({ name: val, account_name: val.split(' - ')[0] });
      }
    });
    return merged;
  }, [rawAccounts, journalAccounts]);

  const voucherTypes = useMemo(() => [
    { name: 'Journal Entry' }, { name: 'Cash Entry' }, { name: 'Bank Entry' }, 
    { name: 'Contra Entry' }, { name: 'Excise Entry' }, { name: 'Write Off Entry' }
  ], []);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await accountingApi.getJournalEntryDetail(id);
      if (res?.data) {
        const d = res.data;
        setVoucherType(d.voucher_type);
        setPostingDate(d.posting_date);
        setChequeNo(d.cheque_no || '');
        setChequeDate(d.cheque_date || d.posting_date);
        setUserRemark(d.user_remark || '');
        setDocStatus(d.docstatus);
        setJournalAccounts(d.accounts.map((acc: any) => ({
          account: acc.account,
          debit: String(acc.debit || 0),
          credit: String(acc.credit || 0),
          party_type: acc.party_type || '',
          party: acc.party || ''
        })));
      }
    } catch (err) {
      console.error("Failed to fetch journal entry details", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (entryId) fetchDetail(entryId);
  }, [entryId, fetchDetail]);

  const addAccountRow = useCallback(() => {
    setJournalAccounts(prev => [...prev, { account: '', debit: '0', credit: '0', party_type: '', party: '' }]);
  }, []);

  const removeAccountRow = useCallback((index: number) => {
    if (journalAccounts.length <= 2) {
      Alert.alert("Warning", "A journal entry must have at least two accounts.");
      return;
    }
    setJournalAccounts(prev => prev.filter((_, i) => i !== index));
  }, [journalAccounts.length]);

  const updateAccountRow = useCallback((index: number, field: string, value: any) => {
    setJournalAccounts(prev => prev.map((acc, i) => {
      if (i !== index) return acc;
      const updated = { ...acc, [field]: value };
      if (field === 'debit' && parseFloat(value) > 0) updated.credit = '0';
      if (field === 'credit' && parseFloat(value) > 0) updated.debit = '0';
      return updated;
    }));
  }, []);

  const { totalDebit, totalCredit, difference } = useMemo(() => {
    const dr = journalAccounts.reduce((sum, acc) => sum + (parseFloat(acc.debit) || 0), 0);
    const cr = journalAccounts.reduce((sum, acc) => sum + (parseFloat(acc.credit) || 0), 0);
    return {
      totalDebit: dr,
      totalCredit: cr,
      difference: Math.abs(dr - cr)
    };
  }, [journalAccounts]);

  const handleSave = useCallback(async () => {
    const drTotal = Math.round(totalDebit * 100) / 100;
    const crTotal = Math.round(totalCredit * 100) / 100;

    if (Math.abs(drTotal - crTotal) > 0.01 || drTotal === 0) {
      Alert.alert("Unbalanced", "Total Debit must equal Total Credit and be greater than 0.");
      return;
    }

    const cleanedAccounts = journalAccounts
      .filter(acc => acc.account && (parseFloat(acc.debit) > 0 || parseFloat(acc.credit) > 0))
      .map(acc => {
        const d = parseFloat(acc.debit) || 0;
        const c = parseFloat(acc.credit) || 0;
        const row: any = { account: acc.account, debit: d, credit: c, debit_in_account_currency: d, credit_in_account_currency: c };
        if (acc.party && acc.party_type) { row.party_type = acc.party_type; row.party = acc.party; }
        return row;
      });

    setSaving(true);
    try {
      const payload: any = {
        doctype: 'Journal Entry', voucher_type: voucherType, posting_date: postingDate, company: company,
        user_remark: userRemark, accounts: cleanedAccounts, total_debit: drTotal, total_credit: crTotal
      };
      if (chequeNo) { payload.cheque_no = chequeNo; payload.cheque_date = chequeDate; }

      const res = await accountingApi.saveJournalEntry(payload, entryId);
      if (res?.data) {
        if (!entryId) setEntryId(res.data.name);
        setDocStatus(res.data.docstatus);
        Alert.alert("Success", entryId ? "Journal Entry updated" : "Journal Entry saved as Draft");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [totalDebit, totalCredit, journalAccounts, voucherType, postingDate, company, userRemark, chequeNo, chequeDate, entryId]);

  const handleSubmit = useCallback(async () => {
    if (!entryId) return;
    setSubmitting(true);
    try {
      await accountingApi.submitJournalEntry(entryId);
      Alert.alert("Success", "Journal Entry submitted successfully");
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", "Submission failed. Ensure the document is saved first.");
    } finally {
      setSubmitting(false);
    }
  }, [entryId, navigation]);

  if (loading) {
    return (
      <ModuleLayout title={entryId ? "Edit Journal" : "New Journal"} showBack>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout 
      title={entryId ? `Journal: ${entryId}` : "New Journal"} 
      showBack
      extraAction={docStatus === 0 ? { icon: Edit, onPress: handleSave } : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Status Badge Row */}
        <View style={styles.statusRow}>
           <View style={[styles.badge, { backgroundColor: docStatus === 0 ? colors.neutral_100 : colors.success + '15' }]}>
              <Text style={[styles.badgeText, { color: docStatus === 0 ? colors.neutral_600 : colors.success }]}>
                {docStatus === 0 ? "DRAFT" : "SUBMITTED"}
              </Text>
           </View>
        </View>

        <View style={styles.heroCard}>
           <View style={styles.balanceSummary}>
              <View style={styles.balanceItem}>
                 <Text style={styles.balanceLabel}>TOTAL DEBIT</Text>
                 <Text style={[styles.balanceValue, { color: colors.success }]}>{formatCurrency(totalDebit, 'INR')}</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceItem}>
                 <Text style={styles.balanceLabel}>TOTAL CREDIT</Text>
                 <Text style={[styles.balanceValue, { color: colors.error }]}>{formatCurrency(totalCredit, 'INR')}</Text>
              </View>
           </View>
           {difference > 0.01 && <Text style={styles.diffText}>Diff: {formatCurrency(difference, 'INR')}</Text>}
        </View>

        <View style={[styles.detailsContainer, docStatus !== 0 && styles.disabledSection]}>
          <VerticalInput label="Posting Date" icon={Calendar}>
             <TextInput style={styles.inputField} value={postingDate} onChangeText={setPostingDate} editable={docStatus === 0} />
          </VerticalInput>
          <VerticalInput label="Voucher Type" icon={FileText}>
             <Selector options={voucherTypes} value={voucherType} onChange={setVoucherType} displayField="name" icon={FileText} disabled={docStatus !== 0} />
          </VerticalInput>
          <View style={styles.divider} />
          <VerticalInput label="Ref No" icon={Hash}>
             <TextInput style={styles.inputField} value={chequeNo} onChangeText={setChequeNo} editable={docStatus === 0} />
          </VerticalInput>
          <VerticalInput label="Ref Date" icon={Calendar}>
             <TextInput style={styles.inputField} value={chequeDate} onChangeText={setChequeDate} editable={docStatus === 0} />
          </VerticalInput>
        </View>

        <View style={[styles.section, docStatus !== 0 && styles.disabledSection]}>
           <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Ledger</Text>
              {docStatus === 0 && (
                <TouchableOpacity style={styles.smallAddButton} onPress={addAccountRow}>
                   <Plus size={14} color={colors.primary} /><Text style={styles.smallAddText}>Add Row</Text>
                </TouchableOpacity>
              )}
           </View>
           {journalAccounts.map((row, index) => (
             <View key={index} style={styles.ledgerRowCard}>
                <View style={styles.ledgerRowHeader}>
                   <Text style={styles.rowNumber}>Row #{index + 1}</Text>
                   {docStatus === 0 && <TouchableOpacity onPress={() => removeAccountRow(index)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>}
                </View>
                <View style={styles.rowFields}>
                   <Selector 
                      options={accountOptions} 
                      value={row.account} 
                      onChange={(val) => updateAccountRow(index, 'account', val)} 
                      onSearch={setAccountSearch} 
                      displayField="account_name" 
                      valueField="name" 
                      icon={Landmark} 
                      loading={loadingOptions} 
                      disabled={docStatus !== 0} 
                   />
                   <View style={styles.amountRow}>
                      <View style={[styles.amountInput, { borderColor: colors.success + '40' }]}>
                         <Text style={styles.amountPrefix}>Dr</Text>
                         <TextInput style={styles.ledgerInput} value={row.debit === '0' ? '' : row.debit} onChangeText={(val) => updateAccountRow(index, 'debit', val || '0')} keyboardType="numeric" editable={docStatus === 0} />
                      </View>
                      <View style={[styles.amountInput, { borderColor: colors.error + '40' }]}>
                         <Text style={styles.amountPrefix}>Cr</Text>
                         <TextInput style={styles.ledgerInput} value={row.credit === '0' ? '' : row.credit} onChangeText={(val) => updateAccountRow(index, 'credit', val || '0')} keyboardType="numeric" editable={docStatus === 0} />
                      </View>
                   </View>
                </View>
             </View>
           ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Remarks</Text>
          <View style={styles.remarksBox}>
            <TextInput style={styles.remarksInput} value={userRemark} onChangeText={setUserRemark} multiline numberOfLines={2} editable={docStatus === 0} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {docStatus === 0 ? (
          <TouchableOpacity 
            style={[styles.primaryButton, (saving || submitting || difference > 0.01) && { opacity: 0.7 }]} 
            onPress={entryId ? handleSubmit : handleSave} 
            disabled={saving || submitting}
          >
            {saving || submitting ? <ActivityIndicator color={colors.white} /> : (
              <>{entryId ? <CheckCircle size={18} color={colors.white} /> : <Save size={18} color={colors.white} />}
              <Text style={styles.buttonText}>{entryId ? "Submit Journal" : "Save as Draft"}</Text></>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.submittedBox}>
            <CheckCircle size={20} color={colors.success} />
            <Text style={styles.submittedText}>Document is Submitted</Text>
          </View>
        )}
      </View>
    </ModuleLayout>
  );
}

const VerticalInput = React.memo(({ label, icon: Icon, children }: any) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInputRow}>{Icon && <Icon size={16} color={colors.text_tertiary} style={{ marginRight: spacing.xs }} />}<View style={{ flex: 1 }}>{children}</View></View>
  </View>
));
