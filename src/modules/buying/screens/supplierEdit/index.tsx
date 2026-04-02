import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, StyleSheet, Switch } from 'react-native';
import { User, Phone, Landmark, CheckCircle2, Globe, Tag, Mail, CreditCard, FileText, MapPin, Hash, ShoppingCart } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius } from '../../../../core/theme';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

import { 
  useSupplierDetail, 
  useSaveSupplier,
  useSupplierGroups,
  useCountries,
  useCurrencies,
  useTaxCategories,
  usePaymentTerms,
  useGSTCategories,
  usePriceLists
} from '../../hooks/buyingQueries';
import { buyingApi } from '../../services/buyingApi';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';
import { INDIAN_STATES } from '../../../../core/constants/states';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ToggleRow = ({ label, value, onValueChange }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light }}>
    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text_secondary }}>{label}</Text>
    <Switch 
      value={!!value} 
      onValueChange={onValueChange}
      trackColor={{ false: colors.gray_200, true: colors.primary_light }}
      thumbColor={value ? colors.primary : colors.gray_400}
    />
  </View>
);

export function SupplierEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { supplierId } = route.params || {};
  const isEdit = !!supplierId;

  // --- Search State for Selectors ---
  const [groupSearch, setGroupSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [currencySearch, setCurrencySearch] = useState('');
  const [taxCatSearch, setTaxCatSearch] = useState('');
  const [payTermsSearch, setPayTermsSearch] = useState('');

  const [formData, setFormData] = useState<any>({
    supplier_name: '',
    supplier_group: 'All Supplier Groups',
    supplier_type: 'Company',
    gst_category: 'Registered Regular',
    gstin: '',
    // Contact
    map_to_first_name: '',
    map_to_last_name: '',
    email_id: '',
    mobile_no: '',
    // Address
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    is_primary_address: 0,
    is_shipping_address: 0,
    // Accounting
    default_currency: 'INR',
    default_price_list: '',
    tax_category: '',
    payment_terms: '',
    default_bank_account: ''
  });

  const { data: supplierDetail, isLoading: loadingDetail } = useSupplierDetail(supplierId);
  const { data: supplierGroups, isLoading: loadingGroups } = useSupplierGroups(groupSearch);
  const { data: countries, isLoading: loadingCountries } = useCountries(countrySearch);
  const { data: currencies, isLoading: loadingCurrencies } = useCurrencies(currencySearch);
  const { data: taxCategories, isLoading: loadingTaxCats } = useTaxCategories(taxCatSearch);
  const { data: paymentTerms, isLoading: loadingPayTerms } = usePaymentTerms(payTermsSearch);
  const { data: priceLists, isLoading: loadingPriceLists } = usePriceLists();
  const { data: gstCategories } = useGSTCategories();
  
  const saveMutation = useSaveSupplier();

  useEffect(() => {
    if (isEdit && supplierDetail) {
      const contact = supplierDetail.contact_data || {};
      const address = supplierDetail.address_data || {};

      setFormData({
        ...supplierDetail,
        gstin: supplierDetail.gstin || '',
        map_to_first_name: contact.first_name || supplierDetail.map_to_first_name || '',
        map_to_last_name: contact.last_name || supplierDetail.map_to_last_name || '',
        email_id: contact.email_id || supplierDetail.email_id || '',
        mobile_no: contact.mobile_no || supplierDetail.mobile_no || '',
        address_line1: address.address_line1 || supplierDetail.address_line1 || '',
        address_line2: address.address_line2 || supplierDetail.address_line2 || '',
        city: address.city || supplierDetail.city || '',
        state: address.state || supplierDetail.state || '',
        country: address.country || supplierDetail.country || 'India',
        pincode: address.pincode || supplierDetail.pincode || '',
        is_primary_address: address.is_primary_address ?? supplierDetail.is_primary_address ?? 0,
        is_shipping_address: address.is_shipping_address ?? supplierDetail.is_shipping_address ?? 0,
      });
    }
  }, [isEdit, supplierDetail]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.supplier_name) return Alert.alert("Error", "Supplier Name is required");
    if (!formData.supplier_group) return Alert.alert("Error", "Supplier Group is required");

    try {
      // 1. Save/Update Supplier (Standard logic)
      const res = await saveMutation.mutateAsync({ data: formData, id: supplierId });
      const newId = res?.data?.name || supplierId;

      // 2. If editing, manually update linked docs to ensure data persists in Address/Contact Doctype
      if (isEdit && supplierDetail) {
        const updatePromises: Promise<any>[] = [];

        if (supplierDetail.supplier_primary_contact) {
          updatePromises.push(buyingApi.updateContact(supplierDetail.supplier_primary_contact, {
            first_name: formData.map_to_first_name,
            last_name: formData.map_to_last_name,
            email_id: formData.email_id,
            mobile_no: formData.mobile_no
          }));
        }

        if (supplierDetail.supplier_primary_address) {
          updatePromises.push(buyingApi.updateAddress(supplierDetail.supplier_primary_address, {
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            pincode: formData.pincode,
            is_primary_address: formData.is_primary_address,
            is_shipping_address: formData.is_shipping_address
          }));
        }

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
        }
      }

      Alert.alert("Success", `Supplier ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.replace('SupplierDetail', { supplierId: newId });
    } catch (e: any) {
      let msg = 'Save failed';
      if (e.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(e.response.data._server_messages);
          msg = messages.map((m: any) => {
            try { return JSON.parse(m).message; } catch { return m; }
          }).join('\n');
        } catch (err) {
          msg = e.response.data.message || msg;
        }
      } else {
        msg = e.response?.data?.message || e.message || msg;
      }
      Alert.alert("Error", msg);
    }
  };

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: User, type: 'blue' },
    { id: 'contact', title: 'Primary Contact', icon: Phone, type: 'orange' },
    { id: 'address', title: 'Primary Address', icon: MapPin, type: 'green' },
    { id: 'accounting', title: 'Accounting', icon: Landmark, type: 'blue' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ], []);

  const renderSection = useCallback(({ item: section }: any) => {
    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : 'green_500'];
    return (
      <View style={[detailStyles.sectionCard, detailStyles[`${section.type}Card` as keyof typeof detailStyles]]}>
        <View style={detailStyles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'basic' && (
            <View>
              <FormInput 
                label="Supplier Name" 
                value={formData.supplier_name} 
                onChangeText={(v: string) => handleChange('supplier_name', v)} 
                icon={User} 
                placeholder="Enter Supplier Name"
              />
              <Selector 
                label="Supplier Group" 
                options={supplierGroups || []} 
                value={formData.supplier_group} 
                onChange={(v: any) => handleChange('supplier_group', v)} 
                onSearch={setGroupSearch}
                loading={loadingGroups}
                icon={Tag} 
              />
              <Selector 
                label="Supplier Type" 
                options={[{ name: 'Company' }, { name: 'Individual' }]} 
                value={formData.supplier_type} 
                onChange={(v: any) => handleChange('supplier_type', v)} 
                icon={User} 
              />
              <Selector 
                label="GST Category" 
                options={gstCategories || []} 
                value={formData.gst_category} 
                onChange={(v: any) => handleChange('gst_category', v)} 
                icon={FileText} 
              />
              <FormInput 
                label="GSTIN / UIN" 
                value={formData.gstin} 
                onChangeText={(v: string) => handleChange('gstin', v)} 
                icon={Hash} 
                placeholder="22AAAAA0000A1Z5"
              />
            </View>
          )}

          {section.id === 'contact' && (
            <View>
              <FormInput 
                label="First Name" 
                value={formData.map_to_first_name} 
                onChangeText={(v: string) => handleChange('map_to_first_name', v)} 
                icon={User} 
                placeholder="John"
              />
              <FormInput 
                label="Last Name" 
                value={formData.map_to_last_name} 
                onChangeText={(v: string) => handleChange('map_to_last_name', v)} 
                icon={User} 
                placeholder="Doe"
              />
              <FormInput 
                label="Email ID" 
                value={formData.email_id} 
                onChangeText={(v: string) => handleChange('email_id', v)} 
                icon={Mail} 
                keyboardType="email-address"
                placeholder="john@example.com"
              />
              <FormInput 
                label="Mobile Number" 
                value={formData.mobile_no} 
                onChangeText={(v: string) => handleChange('mobile_no', v)} 
                icon={Phone} 
                keyboardType="phone-pad"
                placeholder="+91 9876543210"
              />
            </View>
          )}

          {section.id === 'address' && (
            <View>
              <ToggleRow 
                label="Preferred Billing Address" 
                value={formData.is_primary_address} 
                onValueChange={(v: boolean) => handleChange('is_primary_address', v ? 1 : 0)} 
              />
              <ToggleRow 
                label="Preferred Shipping Address" 
                value={formData.is_shipping_address} 
                onValueChange={(v: boolean) => handleChange('is_shipping_address', v ? 1 : 0)} 
              />
              <FormInput 
                label="Address Line 1" 
                value={formData.address_line1} 
                onChangeText={(v: string) => handleChange('address_line1', v)} 
                icon={MapPin} 
                placeholder="Street name, Building"
              />
              <FormInput 
                label="Address Line 2" 
                value={formData.address_line2} 
                onChangeText={(v: string) => handleChange('address_line2', v)} 
                icon={MapPin} 
                placeholder="Area, Landmark"
              />
              <FormInput 
                label="City/Town" 
                value={formData.city} 
                onChangeText={(v: string) => handleChange('city', v)} 
                icon={Globe} 
                placeholder="Enter City"
              />
              <Selector 
                label="State/Province" 
                options={INDIAN_STATES} 
                value={formData.state} 
                onChange={(v: any) => handleChange('state', v)} 
                icon={MapPin} 
              />
              <Selector 
                label="Country" 
                options={countries || []} 
                value={formData.country} 
                onChange={(v: any) => {
                  handleChange('country', v);
                  if (v !== 'India') handleChange('state', ''); 
                }} 
                onSearch={setCountrySearch}
                loading={loadingCountries}
                icon={Globe} 
              />
              <FormInput 
                label="Postal Code" 
                value={formData.pincode} 
                onChangeText={(v: string) => handleChange('pincode', v)} 
                icon={Hash} 
                keyboardType="numeric"
                placeholder="400001"
              />
            </View>
          )}

          {section.id === 'accounting' && (
            <View>
              <Selector 
                label="Default Currency" 
                options={currencies || []} 
                value={formData.default_currency} 
                onChange={(v: any) => handleChange('default_currency', v)} 
                onSearch={setCurrencySearch}
                loading={loadingCurrencies}
                icon={CreditCard} 
              />
              <Selector 
                label="Default Price List" 
                options={priceLists || []} 
                value={formData.default_price_list} 
                onChange={(v: any) => handleChange('default_price_list', v)} 
                loading={loadingPriceLists}
                icon={ShoppingCart} 
              />
              <Selector 
                label="Tax Category" 
                options={taxCategories || []} 
                value={formData.tax_category} 
                onChange={(v: any) => handleChange('tax_category', v)} 
                onSearch={setTaxCatSearch}
                loading={loadingTaxCats}
                icon={Tag} 
              />
              <Selector 
                label="Payment Terms" 
                options={paymentTerms || []} 
                value={formData.payment_terms} 
                onChange={(v: any) => handleChange('payment_terms', v)} 
                onSearch={setPayTermsSearch}
                loading={loadingPayTerms}
                icon={FileText} 
              />
              <FormInput 
                label="Default Bank Account" 
                value={formData.default_bank_account} 
                onChangeText={(v: string) => handleChange('default_bank_account', v)} 
                icon={Landmark} 
                placeholder="Enter Bank Account"
              />
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection 
              isEdit={isEdit} 
              isPending={saveMutation.isPending} 
              handleSubmit={handleSubmit} 
              title={isEdit ? "Update Supplier?" : "Save Supplier?"}
              subtitle="This will save the supplier record to the system."
              label={isEdit ? "Update Supplier" : "Save Supplier"} 
            />
          )}
        </ScrollView>
      </View>
    );
  }, [formData, supplierGroups, loadingGroups, countries, loadingCountries, currencies, loadingCurrencies, taxCategories, loadingTaxCats, paymentTerms, loadingPayTerms, priceLists, loadingPriceLists, gstCategories, handleChange, isEdit, saveMutation.isPending, handleSubmit]);

  if (loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit Supplier` : "New Supplier"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={detailStyles.container}>
          <FlatList 
            data={sections} 
            renderItem={renderSection} 
            keyExtractor={(s) => s.id} 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToAlignment="start" 
            decelerationRate="fast" 
            snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} 
            contentContainerStyle={detailStyles.horizontalList} 
          />
        </View>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}
