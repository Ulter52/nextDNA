import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Phone, Landmark, CheckCircle2, Globe, Tag, Mail, CreditCard, FileText, MapPin, Hash, ShoppingCart, Briefcase, Building2 } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
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
  usePriceLists,
  useStates
} from '../../hooks/buyingQueries';
import { buyingApi } from '../../services/buyingApi';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';
import { INDIAN_STATES } from '../../../../core/constants/states';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const supplierSchema = z.object({
  supplier_name: z.string().min(1, 'Required'),
  supplier_group: z.string().default('All Supplier Groups'),
  supplier_type: z.string().default('Company'),
  gst_category: z.string().default('Registered Regular'),
  gstin: z.string().optional(),
  // Contact
  map_to_first_name: z.string().optional(),
  map_to_last_name: z.string().optional(),
  email_id: z.string().email('Invalid email').or(z.literal('')).optional(),
  mobile_no: z.string().optional(),
  // Address
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  pincode: z.string().optional(),
  is_primary_address: z.number().default(0),
  is_shipping_address: z.number().default(0),
  // Accounting
  default_currency: z.string().default('INR'),
  default_price_list: z.string().optional(),
  tax_category: z.string().optional(),
  payment_terms: z.string().optional(),
  default_bank_account: z.string().optional()
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export function SupplierEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { supplierId } = route.params || {};
  const isEdit = !!supplierId;

  const [groupSearch, setGroupSearch] = useState('');
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      supplier_name: '',
      supplier_group: 'All Supplier Groups',
      supplier_type: 'Company',
      gst_category: 'Registered Regular',
      country: 'India',
      default_currency: 'INR',
      is_primary_address: 0,
      is_shipping_address: 0,
    }
  });

  const watchCountry = watch('country');
  const watchPrimaryAddr = watch('is_primary_address');
  const watchShippingAddr = watch('is_shipping_address');

  // Queries
  const { data: supplierDetail, isLoading: loadingDetail } = useSupplierDetail(supplierId || '');
  
  const { 
    data: groupRes, 
    fetchNextPage: fetchNextGroups, 
    hasNextPage: hasNextGroups, 
    isFetchingNextPage: isFetchingGroups 
  } = useSupplierGroups(groupSearch);

  const { data: countries } = useCountries();
  const { data: currencies } = useCurrencies();
  const { data: taxCategories } = useTaxCategories();
  const { data: paymentTerms } = usePaymentTerms();
  const { data: priceLists } = usePriceLists();
  const { data: gstCategories } = useGSTCategories();
  
  const saveMutation = useSaveSupplier();

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

  const supplierGroups = useMemo(() => flattenPages(groupRes), [groupRes]);

  useEffect(() => {
    if (isEdit && supplierDetail) {
      const contact = supplierDetail.contact_data || {};
      const address = supplierDetail.address_data || {};

      reset({
        ...supplierDetail,
        gstin: supplierDetail.gstin || '',
        map_to_first_name: contact.first_name || '',
        map_to_last_name: contact.last_name || '',
        email_id: contact.email_id || supplierDetail.email_id || '',
        mobile_no: contact.mobile_no || supplierDetail.mobile_no || '',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        country: address.country || 'India',
        pincode: address.pincode || '',
        is_primary_address: address.is_primary_address ?? 0,
        is_shipping_address: address.is_shipping_address ?? 0,
      });
    }
  }, [isEdit, supplierDetail, reset]);

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      const res = await saveMutation.mutateAsync({ data, id: supplierId });
      const newId = supplierId || res.name;

      if (isEdit && supplierDetail) {
        const updatePromises: Promise<any>[] = [];
        if (supplierDetail.supplier_primary_contact) {
          updatePromises.push(buyingApi.updateContact(supplierDetail.supplier_primary_contact, {
            first_name: data.map_to_first_name,
            last_name: data.map_to_last_name,
            email_id: data.email_id,
            mobile_no: data.mobile_no
          }));
        }
        if (supplierDetail.supplier_primary_address) {
          updatePromises.push(buyingApi.updateAddress(supplierDetail.supplier_primary_address, {
            address_line1: data.address_line1,
            address_line2: data.address_line2,
            city: data.city,
            state: data.state,
            country: data.country,
            pincode: data.pincode,
            is_primary_address: data.is_primary_address,
            is_shipping_address: data.is_shipping_address
          }));
        }
        if (updatePromises.length > 0) await Promise.all(updatePromises);
      }

      Alert.alert("Success", `Supplier ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.replace('SupplierDetail', { supplierId: newId });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save supplier");
    }
  };

  const renderSection = useCallback(({ item: section }: any) => {
    const titleColor = colors[section.type === 'blue' ? 'blue_500' : (section.type === 'orange' ? 'orange_500' : 'green_500')];
    
    return (
      <View style={[detailStyles.sectionCard, detailStyles[`${section.type}Card` as keyof typeof detailStyles]]}>
        <View style={detailStyles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'basic' && (
            <View>
              <Controller control={control} name="supplier_name" render={({ field: { onChange, value } }) => (
                <FormInput label="Supplier Name" value={value} onChangeText={onChange} icon={User} placeholder="Enter Supplier Name" />
              )} />
              <Controller control={control} name="supplier_group" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Supplier Group" options={supplierGroups} value={value} 
                  onChange={onChange} onSearch={setGroupSearch}
                  onEndReached={() => hasNextGroups && fetchNextGroups()}
                  loadingNextPage={isFetchingGroups} icon={Tag} 
                />
              )} />
              <Controller control={control} name="supplier_type" render={({ field: { onChange, value } }) => (
                <Selector label="Supplier Type" options={[{ name: 'Company' }, { name: 'Individual' }]} value={value} onChange={onChange} icon={Briefcase} />
              )} />
              <Controller control={control} name="gst_category" render={({ field: { onChange, value } }) => (
                <Selector label="GST Category" options={gstCategories || []} value={value} onChange={onChange} icon={FileText} />
              )} />
              <Controller control={control} name="gstin" render={({ field: { onChange, value } }) => (
                <FormInput label="GSTIN / UIN" value={value} onChangeText={onChange} icon={Hash} placeholder="22AAAAA0000A1Z5" />
              )} />
            </View>
          )}

          {section.id === 'contact' && (
            <View>
              <Controller control={control} name="map_to_first_name" render={({ field: { onChange, value } }) => (
                <FormInput label="First Name" value={value} onChangeText={onChange} icon={User} placeholder="John" />
              )} />
              <Controller control={control} name="map_to_last_name" render={({ field: { onChange, value } }) => (
                <FormInput label="Last Name" value={value} onChangeText={onChange} icon={User} placeholder="Doe" />
              )} />
              <Controller control={control} name="email_id" render={({ field: { onChange, value } }) => (
                <FormInput label="Email ID" value={value} onChangeText={onChange} icon={Mail} keyboardType="email-address" placeholder="john@example.com" />
              )} />
              <Controller control={control} name="mobile_no" render={({ field: { onChange, value } }) => (
                <FormInput label="Mobile Number" value={value} onChangeText={onChange} icon={Phone} keyboardType="phone-pad" placeholder="+91 9876543210" />
              )} />
            </View>
          )}

          {section.id === 'address' && (
            <View>
              <TouchableOpacity onPress={() => setValue('is_primary_address', watchPrimaryAddr ? 0 : 1)} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Preferred Billing Address</Text>
                <View style={[styles.switch, { backgroundColor: watchPrimaryAddr ? colors.primary : colors.neutral_200 }]}>
                  <View style={[styles.switchThumb, { alignSelf: watchPrimaryAddr ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setValue('is_shipping_address', watchShippingAddr ? 0 : 1)} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Preferred Shipping Address</Text>
                <View style={[styles.switch, { backgroundColor: watchShippingAddr ? colors.primary : colors.neutral_200 }]}>
                  <View style={[styles.switchThumb, { alignSelf: watchShippingAddr ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>
              <Controller control={control} name="address_line1" render={({ field: { onChange, value } }) => (
                <FormInput label="Address Line 1" value={value} onChangeText={onChange} icon={MapPin} placeholder="Street name, Building" />
              )} />
              <Controller control={control} name="address_line2" render={({ field: { onChange, value } }) => (
                <FormInput label="Address Line 2" value={value} onChangeText={onChange} icon={MapPin} placeholder="Area, Landmark" />
              )} />
              <Controller control={control} name="city" render={({ field: { onChange, value } }) => (
                <FormInput label="City/Town" value={value} onChangeText={onChange} icon={Globe} placeholder="Enter City" />
              )} />
              <Controller control={control} name="state" render={({ field: { onChange, value } }) => (
                <Selector label="State/Province" options={INDIAN_STATES} value={value} onChange={onChange} icon={MapPin} />
              )} />
              <Controller control={control} name="country" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Country" options={countries || []} value={value} 
                  onChange={(v) => { onChange(v); if (v !== 'India') setValue('state', ''); }} 
                  icon={Globe} 
                />
              )} />
              <Controller control={control} name="pincode" render={({ field: { onChange, value } }) => (
                <FormInput label="Postal Code" value={value} onChangeText={onChange} icon={Hash} keyboardType="numeric" placeholder="400001" />
              )} />
            </View>
          )}

          {section.id === 'accounting' && (
            <View>
              <Controller control={control} name="default_currency" render={({ field: { onChange, value } }) => (
                <Selector label="Default Currency" options={currencies || []} value={value} onChange={onChange} icon={CreditCard} />
              )} />
              <Controller control={control} name="default_price_list" render={({ field: { onChange, value } }) => (
                <Selector label="Default Price List" options={priceLists || []} value={value} onChange={onChange} icon={ShoppingCart} />
              )} />
              <Controller control={control} name="tax_category" render={({ field: { onChange, value } }) => (
                <Selector label="Tax Category" options={taxCategories || []} value={value} onChange={onChange} icon={Tag} />
              )} />
              <Controller control={control} name="payment_terms" render={({ field: { onChange, value } }) => (
                <Selector label="Payment Terms" options={paymentTerms || []} value={value} onChange={onChange} icon={FileText} />
              )} />
              <Controller control={control} name="default_bank_account" render={({ field: { onChange, value } }) => (
                <FormInput label="Default Bank Account" value={value} onChangeText={onChange} icon={Landmark} placeholder="Enter Bank Account" />
              )} />
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection isEdit={isEdit} isPending={saveMutation.isPending} handleSubmit={handleSubmit(onSubmit)} title={isEdit ? "Update Supplier?" : "Save Supplier?"} />
          )}
        </ScrollView>
      </View>
    );
  }, [control, supplierGroups, watchCountry, watchPrimaryAddr, watchShippingAddr, countries, currencies, taxCategories, paymentTerms, priceLists, gstCategories, isEdit, saveMutation.isPending, handleSubmit, onSubmit, setValue, hasNextGroups, fetchNextGroups, isFetchingGroups]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  const sections = [
    { id: 'basic', title: 'Basic Info', icon: User, type: 'blue' },
    { id: 'contact', title: 'Primary Contact', icon: Phone, type: 'orange' },
    { id: 'address', title: 'Primary Address', icon: MapPin, type: 'green' },
    { id: 'accounting', title: 'Accounting', icon: Landmark, type: 'blue' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ];

  return (
    <ModuleLayout title={isEdit ? "Edit Supplier" : "New Supplier"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={detailStyles.container}>
          <FlatList 
            data={sections} 
            renderItem={renderSection} 
            keyExtractor={(s) => s.id} 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} 
            contentContainerStyle={detailStyles.horizontalList} 
          />
        </View>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light },
  toggleLabel: { fontSize: 12, fontWeight: '600', color: colors.text_secondary },
  switch: { width: 44, height: 24, borderRadius: 12, padding: 2, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
});
