import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Save, Calendar, User, CreditCard, Landmark, FileText, ArrowRightLeft, CheckCircle, Mail, Phone, Building2 } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { usePaymentEntryDetail, useSavePaymentEntry, usePaymentEntryQueries, useSubmitPaymentEntry } from '../../hooks/paymentEntryQueries';
import { Selector } from '../../../../core/components/Selector';
import { FormInput } from '../../../../core/components/FormInput';
import { SaveSection } from '../../../../core/components/SaveSection';
import { companyService } from '../../../../core/services/companyService';
import { accountingApi } from '../../services/accountingApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const paymentEntrySchema = z.object({
  payment_type: z.string().default('Receive'),
  posting_date: z.string(),
  company: z.string().min(1, 'Required'),
  mode_of_payment: z.string().min(1, 'Required'),
  party_type: z.string().optional(),
  party: z.string().optional(),
  contact_person: z.string().optional(),
  contact_email: z.string().optional(),
  custom_mobile: z.string().optional(),
  paid_amount: z.coerce.number().positive('Amount must be > 0'),
  paid_from: z.string().min(1, 'Required'),
  paid_to: z.string().min(1, 'Required'),
  remarks: z.string().optional(),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
});

type PaymentEntryFormValues = z.infer<typeof paymentEntrySchema>;

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue, disabled }: { watch: any, setValue: any, disabled?: boolean }) => {
  const [showPicker, setShowPicker] = useState<'posting_date' | 'reference_date' | null>(null);

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
  const referenceDate = watch('reference_date');

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
      <TouchableOpacity onPress={() => !disabled && setShowPicker('reference_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Reference Date" value={referenceDate} editable={false} icon={Calendar} />
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

export function PaymentEntryEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { entryId } = route.params || {};
  const isEdit = !!entryId;

  const [search, setSearch] = useState({ account: '', mode: '', party: '' });
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<PaymentEntryFormValues>({
    resolver: zodResolver(paymentEntrySchema),
    defaultValues: {
      payment_type: 'Receive',
      posting_date: new Date().toISOString().split('T')[0],
      reference_date: new Date().toISOString().split('T')[0],
      company: '',
      mode_of_payment: '',
      party_type: 'Customer',
      paid_amount: 0,
      paid_from: '',
      paid_to: '',
      remarks: ''
    }
  });

  const watchPaymentType = watch('payment_type');
  const watchPartyType = watch('party_type');
  const watchParty = watch('party');
  const watchMode = watch('mode_of_payment');
  const watchCompany = watch('company');
  const watchPaidAmount = watch('paid_amount');
  const watchContactPerson = watch('contact_person');

  // Queries
  const { data: entryDetail, isLoading: loadingDetail } = usePaymentEntryDetail(entryId || '');
  
  const {
    accountsRes, fetchNextAccounts, hasNextAccounts, isFetchingAccounts,
    modesRes, fetchNextModes, hasNextModes, isFetchingModes,
    partiesRes, fetchNextParties, hasNextParties, isFetchingParties,
    contacts, contactDetail, loadingOptions
  } = usePaymentEntryQueries({
    company: watchCompany,
    partyType: watchPartyType,
    party: watchParty,
    contactPerson: watchContactPerson,
    search
  });

  const saveMutation = useSavePaymentEntry();
  const submitMutation = useSubmitPaymentEntry();

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

  const accountOptions = useMemo(() => flattenPages(accountsRes), [accountsRes]);
  const modeOptions = useMemo(() => flattenPages(modesRes), [modesRes]);
  const partyOptions = useMemo(() => flattenPages(partiesRes), [partiesRes]);

  useEffect(() => {
    if (!isEdit) {
      companyService.getSelectedCompany().then(selected => {
        if (selected) setValue('company', selected.name);
      });
    }
  }, [isEdit, setValue]);

  useEffect(() => {
    if (isEdit && entryDetail) {
      reset(entryDetail);
    }
  }, [isEdit, entryDetail, reset]);

  // Auto-population logic
  useEffect(() => {
    if (watchParty && watchPartyType && !isEdit) {
      accountingApi.getDocDetail(watchPartyType, watchParty).then(res => {
        if (res) {
          let account = null;
          if (res.accounts && Array.isArray(res.accounts)) {
            const ca = res.accounts.find((a: any) => a.company === watchCompany);
            if (ca) account = ca.account || ca.default_account;
          }
          if (!account) {
            const fieldname = watchPartyType === 'Customer' ? 'default_receivable_account' : 
                             watchPartyType === 'Supplier' ? 'default_payable_account' : 'default_account';
            account = res[fieldname] || res.account_head;
          }
          if (account) {
            if (watchPartyType === 'Customer') setValue('paid_from', account);
            else if (watchPartyType === 'Supplier') setValue('paid_to', account);
          }
        }
      });
    }
  }, [watchParty, watchPartyType, isEdit, watchCompany, setValue]);

  useEffect(() => {
    if (watchMode && !isEdit) {
      accountingApi.getDocDetail('Mode of Payment', watchMode).then(res => {
        if (res?.accounts && Array.isArray(res.accounts)) {
          const ca = res.accounts.find((a: any) => a.company === watchCompany);
          if (ca?.default_account) {
            const account = ca.default_account;
            if (watchPartyType === 'Customer') setValue('paid_to', account);
            else if (watchPartyType === 'Supplier') setValue('paid_from', account);
            else {
              if (watchPaymentType === 'Receive') setValue('paid_to', account);
              else if (watchPaymentType === 'Pay') setValue('paid_from', account);
            }
          }
        }
      });
    }
  }, [watchMode, watchCompany, isEdit, watchPartyType, watchPaymentType, setValue]);

  useEffect(() => {
    if (contactDetail) {
      setValue('contact_email', contactDetail.contact_email || contactDetail.email_id || '');
      setValue('custom_mobile', contactDetail.contact_mobile || contactDetail.mobile_no || '');
    }
  }, [contactDetail, setValue]);

  const onSubmit = async (data: PaymentEntryFormValues) => {
    try {
      const payload = { ...data, received_amount: data.paid_amount };
      const res = await saveMutation.mutateAsync({ data: payload, id: entryId });
      Alert.alert("Success", "Payment Entry saved");
      if (!isEdit) {
        navigation.replace('PaymentEntryDetail', { entryId: res.data.name });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save payment entry");
    }
  };

  const handleFinalSubmit = async () => {
    if (!entryId) return;
    try {
      await submitMutation.mutateAsync(entryId);
      Alert.alert("Success", "Payment Entry submitted");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit payment entry");
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
              <Controller control={control} name="payment_type" render={({ field: { onChange, value } }) => (
                <Selector options={[{ name: 'Receive' }, { name: 'Pay' }, { name: 'Internal Transfer' }]} value={value} onChange={onChange} icon={ArrowRightLeft} disabled={isReadOnly} />
              )} />
              <DateSection watch={watch} setValue={setValue} disabled={isReadOnly} />
              <Controller control={control} name="mode_of_payment" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Mode of Payment" options={modeOptions} value={value} 
                  onChange={onChange} onSearch={(val) => setSearch(s => ({ ...s, mode: val }))}
                  onEndReached={() => hasNextModes && fetchNextModes()}
                  loadingNextPage={isFetchingModes} icon={CreditCard} disabled={isReadOnly}
                />
              )} />
              {watchMode !== 'Cash' && watchMode !== '' && (
                <Controller control={control} name="reference_no" render={({ field: { onChange, value } }) => (
                  <FormInput label="Reference No" value={value} onChangeText={onChange} icon={Hash} editable={!isReadOnly} />
                )} />
              )}
            </View>
          )}

          {section.id === 'party' && (
            <View>
              {watchPaymentType !== 'Internal Transfer' && (
                <>
                  <Controller control={control} name="party_type" render={({ field: { onChange, value } }) => (
                    <Selector options={[{ name: 'Customer' }, { name: 'Supplier' }, { name: 'Employee' }]} value={value} onChange={(val) => { onChange(val); setValue('party', ''); }} icon={User} disabled={isReadOnly} />
                  )} />
                  <Controller control={control} name="party" render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Party" options={partyOptions} value={value} 
                      onChange={(val) => { onChange(val); setValue('contact_person', ''); }} 
                      onSearch={(val) => setSearch(s => ({ ...s, party: val }))}
                      onEndReached={() => hasNextParties && fetchNextParties()}
                      loadingNextPage={isFetchingParties} icon={User} disabled={isReadOnly}
                    />
                  )} />
                  <Controller control={control} name="contact_person" render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Contact Person" options={contacts} displayField="full_name" valueField="name" value={value} 
                      onChange={onChange} icon={User} disabled={isReadOnly || !watchParty}
                    />
                  )} />
                  <Controller control={control} name="contact_email" render={({ field: { value } }) => (
                    <FormInput label="Email" value={value} editable={false} icon={Mail} placeholder="Auto-fetched" />
                  )} />
                  <Controller control={control} name="custom_mobile" render={({ field: { value } }) => (
                    <FormInput label="Mobile" value={value} editable={false} icon={Phone} placeholder="Auto-fetched" />
                  )} />
                </>
              )}
              {watchPaymentType === 'Internal Transfer' && (
                <View style={styles.infoBox}><Text style={styles.infoText}>Internal transfers do not require a party selection.</Text></View>
              )}
            </View>
          )}

          {section.id === 'accounts' && (
            <View>
              <View style={styles.heroCard}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <Controller control={control} name="paid_amount" render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.amountHeroInput} value={String(value)} onChangeText={onChange} keyboardType="numeric" placeholder="0.00" editable={!isReadOnly} />
                  )} />
                </View>
                <Text style={styles.heroLabel}>PAYMENT AMOUNT</Text>
              </View>

              <Controller control={control} name="paid_from" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Paid From" options={accountOptions} displayField="account_name" valueField="name" value={value} 
                  onChange={onChange} onSearch={(val) => setSearch(s => ({ ...s, account: val }))}
                  onEndReached={() => hasNextAccounts && fetchNextAccounts()}
                  loadingNextPage={isFetchingAccounts} icon={Landmark} disabled={isReadOnly}
                />
              )} />
              <Controller control={control} name="paid_to" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Paid To" options={accountOptions} displayField="account_name" valueField="name" value={value} 
                  onChange={onChange} onSearch={(val) => setSearch(s => ({ ...s, account: val }))}
                  onEndReached={() => hasNextAccounts && fetchNextAccounts()}
                  loadingNextPage={isFetchingAccounts} icon={Landmark} disabled={isReadOnly}
                />
              )} />
            </View>
          )}

          {section.id === 'finish' && (
            <View>
              <Controller control={control} name="remarks" render={({ field: { onChange, value } }) => (
                <FormInput label="Remarks" value={value} onChangeText={onChange} multiline numberOfLines={3} editable={!isReadOnly} icon={FileText} />
              )} />
              
              <SaveSection 
                isEdit={isEdit} 
                isPending={saveMutation.isPending || submitMutation.isPending} 
                handleSubmit={isReadOnly ? () => {} : (isEdit ? handleFinalSubmit : handleSubmit(onSubmit))} 
                title={isReadOnly ? "Document Submitted" : (isEdit ? "Submit Payment?" : "Save Payment?")}
                label={isReadOnly ? "Submitted" : (isEdit ? "Submit Payment" : "Save as Draft")}
                disabled={isReadOnly}
              />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [control, accountOptions, modeOptions, partyOptions, contacts, isReadOnly, watchPaymentType, watchParty, watchMode, watchPaidAmount, isEdit, saveMutation.isPending, submitMutation.isPending, handleSubmit, onSubmit, handleFinalSubmit, setValue, watch, hasNextAccounts, fetchNextAccounts, isFetchingAccounts, hasNextModes, fetchNextModes, isFetchingModes, hasNextParties, fetchNextParties, isFetchingParties]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  const sectionsData = [
    { id: 'basic', title: 'General', icon: FileText, type: 'blue' },
    { id: 'party', title: 'Party Details', icon: User, type: 'orange' },
    { id: 'accounts', title: 'Amount & Accounts', icon: Landmark, type: 'green' },
    { id: 'finish', title: 'Finish', icon: CheckCircle, type: 'blue' }
  ];

  return (
    <ModuleLayout title={isEdit ? `Payment: ${entryId}` : "New Payment Entry"} showBack>
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
  greenCard: { borderTopWidth: 4, borderTopColor: colors.green_500 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.xl },
  cardTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  heroCard: { backgroundColor: colors.neutral_50, borderRadius: 20, padding: 16, marginBottom: 20, alignItems: 'center' },
  amountInputContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  currencySymbol: { fontSize: 24, fontWeight: '700', color: colors.text_secondary, marginRight: 4 },
  amountHeroInput: { fontSize: 32, fontWeight: '900', color: colors.text_primary, textAlign: 'center', minWidth: 100 },
  heroLabel: { fontSize: 10, fontWeight: '700', color: colors.text_tertiary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  infoBox: { backgroundColor: colors.blue_50, padding: 16, borderRadius: 12, marginTop: 12 },
  infoText: { fontSize: 13, color: colors.primary, lineHeight: 20, textAlign: 'center' }
});
