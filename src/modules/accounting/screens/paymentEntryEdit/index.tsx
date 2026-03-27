import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Save, Calendar, User, CreditCard, Landmark, FileText, ArrowRightLeft, CheckCircle, Mail, Phone } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { accountingApi } from '../../services/accountingApi';
import { Selector } from '../../../../core/components/Selector';
import { useDebounce } from '../../../../core/utils/debounce';
import { usePaymentEntryQueries } from '../../hooks/paymentEntryQueries';
import { styles } from './styles';

export function PaymentEntryEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [entryId, setEntryId] = useState(route.params?.entryId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docStatus, setDocStatus] = useState(0);

  // Form States
  const [paymentType, setPaymentType] = useState('Receive');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split('T')[0]);
  const [company] = useState('DNA Retail Enterprises');
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [partyType, setPartyType] = useState('Customer');
  const [party, setParty] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [customMobile, setCustomMobile] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [remarks, setRemarks] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [referenceDate, setReferenceDate] = useState(new Date().toISOString().split('T')[0]);

  const [search, setSearch] = useState({
    account: '',
    mode: '',
    party: ''
  });

  const debouncedSearch = {
    account: useDebounce(search.account),
    mode: useDebounce(search.mode),
    party: useDebounce(search.party),
  };

  const {
    accounts: rawAccounts,
    modes: rawModes,
    parties: rawParties,
    contacts: rawContacts,
    contactDetail,
    loadingOptions
  } = usePaymentEntryQueries({
    company,
    partyType,
    party,
    contactPerson,
    search: debouncedSearch
  });

  // Memoized options that always include selected values to prevent "select" placeholder flash
  const accountOptions = useMemo(() => {
    const merged = [...rawAccounts];
    [paidFrom, paidTo].forEach(val => {
      if (val && !merged.find(m => m.name === val)) {
        const parts = val.split(' - ');
        const displayName = parts.length > 1 ? parts.slice(0, -1).join(' - ') : val;
        merged.push({ name: val, account_name: displayName });
      }
    });
    return merged;
  }, [rawAccounts, paidFrom, paidTo]);

  const modeOptions = useMemo(() => {
    const merged = [...rawModes];
    if (modeOfPayment && !merged.find(m => m.name === modeOfPayment)) {
      merged.push({ name: modeOfPayment });
    }
    return merged;
  }, [rawModes, modeOfPayment]);

  const partyOptions = useMemo(() => {
    const merged = [...rawParties];
    if (party && !merged.find(m => m.name === party)) {
      merged.push({ name: party });
    }
    return merged;
  }, [rawParties, party]);

  const contactOptions = useMemo(() => {
    const merged = [...rawContacts];
    if (contactPerson && !merged.find(m => m.name === contactPerson)) {
      merged.push({ name: contactPerson, full_name: contactPerson });
    }
    return merged;
  }, [rawContacts, contactPerson]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await accountingApi.getPaymentEntryDetail(id);
      if (res?.data) {
        const d = res.data;
        setPaymentType(d.payment_type);
        setPostingDate(d.posting_date);
        setModeOfPayment(d.mode_of_payment);
        setPartyType(d.party_type);
        setParty(d.party);
        setContactPerson(d.contact_person || '');
        setContactEmail(d.contact_email || '');
        setCustomMobile(d.custom_mobile || '');
        setPaidAmount(String(d.paid_amount));
        setPaidFrom(d.paid_from);
        setPaidTo(d.paid_to);
        setRemarks(d.remarks);
        setReferenceNo(d.reference_no || '');
        setReferenceDate(d.reference_date || d.posting_date);
        setDocStatus(d.docstatus);
      }
    } catch (err) {
      console.error("Failed to fetch payment entry details", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (entryId) fetchDetail(entryId);
  }, [entryId, fetchDetail]);

  // Sync contact details from hook
  useEffect(() => {
    if (contactDetail) {
      setContactEmail(contactDetail.contact_email || contactDetail.email_id || '');
      setCustomMobile(contactDetail.contact_mobile || contactDetail.mobile_no || '');
    } else if (!contactPerson) {
      setContactEmail('');
      setCustomMobile('');
    }
  }, [contactDetail, contactPerson]);

  // Reset dependent fields when party type or payment type changes
  useEffect(() => {
    if (!entryId) {
      setParty('');
      setContactPerson('');
      setContactEmail('');
      setCustomMobile('');
      setPaidFrom('');
      setPaidTo('');
    }
  }, [partyType, paymentType, entryId]);

  // Auto-population logic for Party Account (Receivable/Payable)
  useEffect(() => {
    if (party && partyType && !entryId) {
      const getPartyAccount = async () => {
        try {
          const res = await accountingApi.getDocDetail(partyType, party);
          if (res) {
            let account = null;
            
            // 1. Check for company-specific account first in the accounts child table
            if (res.accounts && Array.isArray(res.accounts)) {
              const ca = res.accounts.find((a: any) => a.company === company);
              if (ca) account = ca.account || ca.default_account;
            }

            // 2. Fallback to top-level default fields
            if (!account) {
              const fieldname = partyType === 'Customer' ? 'default_receivable_account' : 
                               partyType === 'Supplier' ? 'default_payable_account' : 'default_account';
              account = res[fieldname] || res.account_head;
            }

            if (account) {
              // Standard logic: Customer -> Paid From (Debtors), Supplier -> Paid To (Creditors)
              if (partyType === 'Customer') setPaidFrom(account);
              else if (partyType === 'Supplier') setPaidTo(account);
            }
          }
        } catch (err) {
          console.error("Failed to auto-populate party account:", err);
        }
      };
      getPartyAccount();
    }
  }, [party, partyType, entryId, company]);

  // Auto-population logic for Bank/Cash Account based on Mode of Payment
  useEffect(() => {
    if (modeOfPayment && !entryId) {
      const getMopAccount = async () => {
        try {
          const res = await accountingApi.getDocDetail('Mode of Payment', modeOfPayment);
          if (res?.accounts && Array.isArray(res.accounts)) {
             const ca = res.accounts.find((a: any) => a.company === company);
             if (ca?.default_account) {
                const account = ca.default_account;
                // If Customer (Receive), Bank is Paid To. If Supplier (Pay), Bank is Paid From.
                if (partyType === 'Customer') setPaidTo(account);
                else if (partyType === 'Supplier') setPaidFrom(account);
                else {
                  if (paymentType === 'Receive') setPaidTo(account);
                  else if (paymentType === 'Pay') setPaidFrom(account);
                }
             }
          }
        } catch (err) {
          console.error("Failed to auto-populate MOP account:", err);
        }
      };
      getMopAccount();
    }
  }, [modeOfPayment, company, entryId, partyType, paymentType]);

  const handleSave = useCallback(async () => {
    if (!party && paymentType !== 'Internal Transfer') {
      Alert.alert("Error", "Please select a party");
      return;
    }
    if (parseFloat(paidAmount) <= 0) {
      Alert.alert("Error", "Amount must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        payment_type: paymentType,
        posting_date: postingDate,
        company: company,
        mode_of_payment: modeOfPayment,
        party_type: partyType,
        party: party,
        contact_person: contactPerson,
        contact_email: contactEmail,
        custom_mobile: customMobile,
        paid_amount: parseFloat(paidAmount),
        received_amount: parseFloat(paidAmount),
        paid_from: paidFrom,
        paid_to: paidTo,
        remarks: remarks,
        doctype: 'Payment Entry'
      };

      if (modeOfPayment && modeOfPayment.toLowerCase() !== 'cash') {
        payload.reference_no = referenceNo;
        payload.reference_date = referenceDate;
      }

      const res = await accountingApi.savePaymentEntry(payload, entryId);
      if (res?.data) {
        const name = res.data.name || entryId;
        Alert.alert("Success", entryId ? "Updated successfully" : "Saved as Draft");
        navigation.replace('PaymentEntryDetail', { entryId: name });
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [entryId, paymentType, postingDate, company, modeOfPayment, partyType, party, contactPerson, contactEmail, customMobile, paidAmount, paidFrom, paidTo, remarks, referenceNo, referenceDate, navigation]);

  const isCash = useMemo(() => (modeOfPayment || '').toLowerCase() === 'cash', [modeOfPayment]);

  if (loading) {
    return (
      <ModuleLayout title="Payment Entry" showBack>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={entryId ? `Edit: ${entryId}` : "New Payment"} showBack>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <View style={styles.heroCard}>
           <View style={styles.headerRow}>
              <View style={[styles.badge, { backgroundColor: colors.blue_50 }]}>
                 <ArrowRightLeft size={14} color={colors.primary} />
                 <Text style={[styles.badgeText, { color: colors.primary }]}>{paymentType}</Text>
              </View>
              {docStatus === 1 && (
                <View style={[styles.badge, { backgroundColor: colors.success + '15' }]}>
                    <CheckCircle size={14} color={colors.success} />
                    <Text style={[styles.badgeText, { color: colors.success }]}>SUBMITTED</Text>
                </View>
              )}
           </View>

           <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.amountHeroInput}
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
                placeholder="0.00"
                editable={docStatus === 0}
              />
           </View>
           <Text style={styles.heroLabel}>PAYMENT AMOUNT</Text>
        </View>

        <View style={[styles.detailsContainer, docStatus !== 0 && { opacity: 0.7 }]}>
          <VerticalInput label="Posting Date" icon={Calendar}>
             <TextInput style={styles.inputField} value={postingDate} onChangeText={setPostingDate} editable={docStatus === 0} />
          </VerticalInput>

          <VerticalInput label="Payment Type" icon={ArrowRightLeft}>
             <Selector
                options={[{ name: 'Receive' }, { name: 'Pay' }, { name: 'Internal Transfer' }]}
                value={paymentType}
                onChange={setPaymentType}
                displayField="name"
                icon={ArrowRightLeft}
                disabled={docStatus !== 0}
             />
          </VerticalInput>

          <VerticalInput label="Mode of Payment" icon={CreditCard}>
             <Selector
                options={modeOptions}
                onSearch={(val) => setSearch(s => ({ ...s, mode: val }))}
                value={modeOfPayment}
                onChange={setModeOfPayment}
                displayField="name"
                icon={CreditCard}
                loading={loadingOptions}
                disabled={docStatus !== 0}
             />
          </VerticalInput>

          {!isCash && modeOfPayment !== '' && (
            <>
              <VerticalInput label="Ref No" icon={FileText}>
                <TextInput style={styles.inputField} value={referenceNo} onChangeText={setReferenceNo} editable={docStatus === 0} />
              </VerticalInput>
              <VerticalInput label="Ref Date" icon={Calendar}>
                <TextInput style={styles.inputField} value={referenceDate} onChangeText={setReferenceDate} editable={docStatus === 0} />
              </VerticalInput>
            </>
          )}

          {paymentType !== 'Internal Transfer' && (
            <>
              <VerticalInput label="Party Type" icon={User}>
                 <Selector
                    options={[{ name: 'Customer' }, { name: 'Supplier' }, { name: 'Employee' }]}
                    value={partyType}
                    onChange={(val) => { setPartyType(val); setParty(''); }}
                    displayField="name"
                    icon={User}
                    disabled={docStatus !== 0}
                 />
              </VerticalInput>

              <VerticalInput label="Party" icon={User}>
                 <Selector
                    options={partyOptions}
                    value={party}
                    onChange={(val) => { setParty(val); setContactPerson(''); }}
                    onSearch={(val) => setSearch(s => ({ ...s, party: val }))}
                    displayField="name"
                    icon={User}
                    loading={loadingOptions}
                    disabled={docStatus !== 0}
                 />
              </VerticalInput>

              <VerticalInput label="Contact Person" icon={User}>
                 <Selector
                    options={contactOptions}
                    value={contactPerson}
                    onChange={setContactPerson}
                    displayField="full_name"
                    valueField="name"
                    icon={User}
                    loading={loadingOptions}
                    disabled={docStatus !== 0 || !party}
                 />
              </VerticalInput>

              <VerticalInput label="Email" icon={Mail}>
                <TextInput style={[styles.inputField, { color: colors.text_tertiary }]} value={contactEmail} editable={false} placeholder="Auto-fetched email" />
              </VerticalInput>

              <VerticalInput label="Mobile" icon={Phone}>
                <TextInput style={[styles.inputField, { color: colors.text_tertiary }]} value={customMobile} editable={false} placeholder="Auto-fetched mobile" />
              </VerticalInput>
            </>
          )}

          <View style={styles.divider} />

          <VerticalInput label="Paid From" icon={Landmark}>
             <Selector
                options={accountOptions}
                value={paidFrom}
                onChange={setPaidFrom}
                onSearch={(val) => setSearch(s => ({ ...s, account: val }))}
                displayField="account_name"
                valueField="name"
                icon={Landmark}
                loading={loadingOptions}
                disabled={docStatus !== 0}
             />
          </VerticalInput>

          <VerticalInput label="Paid To" icon={Landmark}>
             <Selector
                options={accountOptions}
                value={paidTo}
                onChange={setPaidTo}
                onSearch={(val) => setSearch(s => ({ ...s, account: val }))}
                displayField="account_name"
                valueField="name"
                icon={Landmark}
                loading={loadingOptions}
                disabled={docStatus !== 0}
             />
          </VerticalInput>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Remarks</Text>
          <View style={styles.remarksBox}>
            <TextInput style={styles.remarksInput} value={remarks} onChangeText={setRemarks} multiline numberOfLines={3} editable={docStatus === 0} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {docStatus === 0 ? (
          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color={colors.white} /> : <><Save size={18} color={colors.white} /><Text style={styles.saveButtonText}>{entryId ? "Update Payment" : "Save as Draft"}</Text></>}
          </TouchableOpacity>
        ) : (
          <View style={styles.submittedBox}><CheckCircle size={20} color={colors.success} /> <Text style={styles.submittedText}>Document is Submitted</Text></View>
        )}
      </View>
    </ModuleLayout>
  );
}

const VerticalInput = React.memo(({ label, icon: Icon, children }: any) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.fieldInputRow}>
      {Icon && <Icon size={16} color={colors.text_tertiary} style={{ marginRight: spacing.xs }} />}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  </View>
));
