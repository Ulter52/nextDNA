import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Building2, Save, Calendar, Landmark, FileText, Plus, Trash2, Hash, CheckCircle, Edit, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { formatCurrency } from '../../../../core/utils/formatters';
import { useJournalAccountOptions, useJournalEntryDetail, useSaveJournalEntry, useSubmitJournalEntry, useJournalPartyOptions } from '../../hooks/journalEntryQueries';
import { Selector } from '../../../../core/components/Selector';
import { FormInput } from '../../../../core/components/FormInput';
import { SaveSection } from '../../../../core/components/SaveSection';
import { companyService } from '../../../../core/services/companyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const journalAccountSchema = z.object({
  account: z.string().min(1, 'Required'),
  debit: z.coerce.number().min(0),
  credit: z.coerce.number().min(0),
  party_type: z.string().optional(),
  party: z.string().optional(),
});

const journalEntrySchema = z.object({
  voucher_type: z.string().default('Journal Entry'),
  posting_date: z.string(),
  company: z.string().min(1, 'Required'),
  cheque_no: z.string().optional(),
  cheque_date: z.string().optional(),
  user_remark: z.string().optional(),
  accounts: z.array(journalAccountSchema).min(2, 'At least two rows'),
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

const VOUCHER_TYPES = [
  { name: 'Journal Entry' }, { name: 'Cash Entry' }, { name: 'Bank Entry' }, 
  { name: 'Contra Entry' }, { name: 'Excise Entry' }, { name: 'Write Off Entry' }
];

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue, disabled }: { watch: any, setValue: any, disabled?: boolean }) => {
  const [showPicker, setShowPicker] = useState<'posting_date' | 'cheque_date' | null>(null);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const field = showPicker;
    setShowPicker(null);
    if (selectedDate && field) {
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        setValue(field, dateString);
      } catch (e) {
        console.error("Date conversion error", e);
      }
    }
  };

  const postingDate = watch('posting_date');
  const chequeDate = watch('cheque_date');

  const getPickerDate = () => {
    const dateStr = showPicker ? watch(showPicker) : null;
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <>
      <TouchableOpacity onPress={() => !disabled && setShowPicker('posting_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Posting Date" value={postingDate} editable={false} icon={Calendar} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => !disabled && setShowPicker('cheque_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Reference Date" value={chequeDate} editable={false} icon={Calendar} />
        </View>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker 
          value={getPickerDate()} 
          mode="date" 
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
          onChange={onDateChange} 
        />
      )}
    </>
  );
};

export function JournalEntryEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { entryId } = route.params || {};
  const isEdit = !!entryId;

  const [accountSearch, setAccountSearch] = useState('');
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      voucher_type: 'Journal Entry',
      posting_date: new Date().toISOString().split('T')[0],
      cheque_date: new Date().toISOString().split('T')[0],
      company: '',
      accounts: [
        { account: '', debit: 0, credit: 0 },
        { account: '', debit: 0, credit: 0 }
      ],
      user_remark: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "accounts" });
  const watchAccounts = watch('accounts');
  const watchCompany = watch('company');

  // Queries
  const { data: entryDetail, isLoading: loadingDetail } = useJournalEntryDetail(entryId || '');
  
  const { 
    data: accountRes, 
    fetchNextPage: fetchNextAccounts, 
    hasNextPage: hasNextAccounts, 
    isFetchingNextPage: isFetchingAccounts 
  } = useJournalAccountOptions(watchCompany, accountSearch);

  const saveMutation = useSaveJournalEntry();
  const submitMutation = useSubmitJournalEntry();

  const flattenPages = (res: any) => {
    if (!res?.pages || !Array.isArray(res.pages)) return [];
    let all: any[] = [];
    for (let i = 0; i < res.pages.length; i++) {
      if (Array.isArray(res.pages[i])) {
        all = all.concat(res.pages[i]);
      }
    }
    return all;
  };

  const accountOptions = useMemo(() => flattenPages(accountRes), [accountRes]);

  const { totalDebit, totalCredit, difference } = useMemo(() => {
    const dr = watchAccounts?.reduce((sum, acc) => sum + (parseFloat(String(acc.debit)) || 0), 0) || 0;
    const cr = watchAccounts?.reduce((sum, acc) => sum + (parseFloat(String(acc.credit)) || 0), 0) || 0;
    return {
      totalDebit: dr,
      totalCredit: cr,
      difference: Math.abs(dr - cr)
    };
  }, [watchAccounts]);

  useEffect(() => {
    if (!isEdit) {
      companyService.getSelectedCompany().then(selected => {
        if (selected) setValue('company', selected.name);
      });
    }
  }, [isEdit, setValue]);

  useEffect(() => {
    if (isEdit && entryDetail) {
      reset({
        ...entryDetail,
        accounts: entryDetail.accounts.map((acc: any) => ({
          account: acc.account,
          debit: acc.debit || 0,
          credit: acc.credit || 0,
          party_type: acc.party_type,
          party: acc.party
        }))
      });
    }
  }, [isEdit, entryDetail, reset]);

  const onSubmit = async (data: JournalEntryFormValues) => {
    if (difference > 0.01) {
      return Alert.alert("Unbalanced", "Total Debit must equal Total Credit.");
    }
    try {
      const res = await saveMutation.mutateAsync({ data, id: entryId });
      Alert.alert("Success", "Journal Entry saved");
      if (!isEdit) {
        navigation.replace('JournalEntryDetail', { entryId: res.data.name });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save journal entry");
    }
  };

  const handleFinalSubmit = async () => {
    if (!entryId) return;
    try {
      await submitMutation.mutateAsync(entryId);
      Alert.alert("Success", "Journal Entry submitted");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit journal entry");
    }
  };

  const docStatus = entryDetail?.docstatus || 0;
  const isReadOnly = docStatus !== 0;

  const renderSection = useCallback(({ item: section }: any) => {
    const titleColor = colors[section.type === 'blue' ? 'blue_500' : (section.type === 'orange' ? 'orange_500' : 'green_500')];
    
    return (
      <View style={[styles.sectionCard, styles[`${section.type}Card` as keyof typeof styles]]}>
        <View style={styles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'basic' && (
            <View>
              <Controller control={control} name="company" render={({ field: { value } }) => (
                <Selector label="Company" options={[{name: value, value}]} value={value} onChange={() => {}} disabled icon={Building2} />
              )} />
              <Controller control={control} name="voucher_type" render={({ field: { onChange, value } }) => (
                <Selector label="Voucher Type" options={VOUCHER_TYPES} value={value} onChange={onChange} icon={FileText} disabled={isReadOnly} />
              )} />
              <DateSection watch={watch} setValue={setValue} disabled={isReadOnly} />
              <Controller control={control} name="cheque_no" render={({ field: { onChange, value } }) => (
                <FormInput label="Reference No" value={value} onChangeText={onChange} icon={Hash} editable={!isReadOnly} />
              )} />
            </View>
          )}

          {section.id === 'accounts' && (
            <View>
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

              {!isReadOnly && (
                <TouchableOpacity onPress={() => append({ account: '', debit: 0, credit: 0 })} style={styles.addItemBtn}>
                  <Plus size={18} color={colors.primary} /><Text style={styles.addItemText}>Add Row</Text>
                </TouchableOpacity>
              )}

              {fields.map((item, idx) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemLabel}>ROW #{idx + 1}</Text>
                    {!isReadOnly && fields.length > 2 && (
                      <TouchableOpacity onPress={() => remove(idx)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
                    )}
                  </View>
                  <Controller control={control} name={`accounts.${idx}.account`} render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Account" options={accountOptions} displayField="account_name" value={value} 
                      onChange={onChange} onSearch={setAccountSearch} 
                      onEndReached={() => hasNextAccounts && fetchNextAccounts()} 
                      loadingNextPage={isFetchingAccounts} icon={Landmark} disabled={isReadOnly}
                    />
                  )} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Controller control={control} name={`accounts.${idx}.debit`} render={({ field: { onChange, value } }) => (
                        <FormInput 
                          label="Debit" value={String(value)} 
                          onChangeText={(v: string) => {
                            const num = parseFloat(v) || 0;
                            onChange(num);
                            if (num > 0) setValue(`accounts.${idx}.credit`, 0);
                          }} 
                          keyboardType="numeric" editable={!isReadOnly} 
                        />
                      )} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller control={control} name={`accounts.${idx}.credit`} render={({ field: { onChange, value } }) => (
                        <FormInput 
                          label="Credit" value={String(value)} 
                          onChangeText={(v: string) => {
                            const num = parseFloat(v) || 0;
                            onChange(num);
                            if (num > 0) setValue(`accounts.${idx}.debit`, 0);
                          }} 
                          keyboardType="numeric" editable={!isReadOnly} 
                        />
                      )} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'finish' && (
            <View>
              <Controller control={control} name="user_remark" render={({ field: { onChange, value } }) => (
                <FormInput label="Remarks" value={value} onChangeText={onChange} multiline numberOfLines={3} editable={!isReadOnly} icon={FileText} />
              )} />
              
              <SaveSection 
                isEdit={isEdit} 
                isPending={saveMutation.isPending || submitMutation.isPending} 
                handleSubmit={isReadOnly ? () => {} : (isEdit ? handleFinalSubmit : handleSubmit(onSubmit))} 
                title={isReadOnly ? "Document Submitted" : (isEdit ? "Submit Journal?" : "Save Journal?")}
                label={isReadOnly ? "Submitted" : (isEdit ? "Submit Journal" : "Save as Draft")}
                disabled={isReadOnly}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [control, accountOptions, isReadOnly, totalDebit, totalCredit, difference, fields, append, remove, isEdit, saveMutation.isPending, submitMutation.isPending, handleSubmit, onSubmit, handleFinalSubmit, setValue, watch, hasNextAccounts, fetchNextAccounts, isFetchingAccounts]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  const sectionsData = [
    { id: 'basic', title: 'General', icon: FileText, type: 'blue' },
    { id: 'accounts', title: 'Ledger Entries', icon: Landmark, type: 'orange' },
    { id: 'finish', title: 'Finish', icon: CheckCircle, type: 'blue' }
  ];

  return (
    <ModuleLayout title={isEdit ? `Journal: ${entryId}` : "New Journal Entry"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>
          <FlatList 
            data={sectionsData} 
            renderItem={renderSection} 
            keyExtractor={(s) => s.id} 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} 
            contentContainerStyle={styles.horizontalList} 
          />
        </View>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  horizontalList: { paddingHorizontal: spacing.xs, paddingVertical: spacing.md },
  sectionCard: { width: SCREEN_WIDTH * 0.9, backgroundColor: colors.white, borderRadius: 24, padding: spacing.lg, marginHorizontal: spacing.xs, ...shadow.medium, height: '100%' },
  blueCard: { borderTopWidth: 4, borderTopColor: colors.blue_500 },
  orangeCard: { borderTopWidth: 4, borderTopColor: colors.orange_500 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.xl },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  heroCard: { backgroundColor: colors.neutral_50, borderRadius: 20, padding: 16, marginBottom: 20 },
  balanceSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceItem: { flex: 1, alignItems: 'center' },
  balanceLabel: { fontSize: 10, fontWeight: '700', color: colors.text_tertiary, marginBottom: 4 },
  balanceValue: { fontSize: 16, fontWeight: '900' },
  balanceDivider: { width: 1, height: 30, backgroundColor: colors.border_light },
  diffText: { fontSize: 12, fontWeight: '700', color: colors.error, textAlign: 'center', marginTop: 12 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.blue_50, padding: 12, borderRadius: 12, marginBottom: 16, justifyContent: 'center' },
  addItemText: { color: colors.primary, fontWeight: 'bold' },
  itemCard: { backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border_light },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text_tertiary },
});
