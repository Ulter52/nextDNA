import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, StyleSheet, Switch } from 'react-native';
import { User, Phone, MapPin, Globe, Tag, Mail, CheckCircle2, FileText, Hash, Briefcase } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

import { 
  useCustomerDetail, 
  useSaveCustomer,
  useCustomerGroups,
  useTerritories
} from '../../hooks/customerQueries';
import { 
  useCountries,
  useCurrencies,
  useTaxCategories,
  usePaymentTerms,
  usePriceLists
} from '../../../buying/hooks/buyingQueries';
import { customerService } from '../../services/customerService';

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
      trackColor={{ false: colors.neutral_200, true: colors.blue_100 }}
      thumbColor={value ? colors.primary : colors.neutral_400}
    />
  </View>
);

export function NewCustomer() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { customerId } = route.params || {};
  const isEdit = !!customerId;

  const [formData, setFormData] = useState<any>({
    customer_name: '',
    customer_group: 'All Customer Groups',
    customer_type: 'Company',
    territory: 'All Territories',
    map_to_first_name: '',
    map_to_last_name: '',
    email_id: '',
    mobile_no: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    is_primary_address: 0,
    is_shipping_address: 0,
  });

  const { data: customerDetail, isLoading: loadingDetail } = useCustomerDetail(customerId || '');
  const { data: customerGroups, isLoading: loadingGroups } = useCustomerGroups();
  const { data: territories, isLoading: loadingTerritories } = useTerritories();
  const { data: countries, isLoading: loadingCountries } = useCountries();
  
  const saveMutation = useSaveCustomer();

  useEffect(() => {
    if (isEdit && customerDetail) {
      const contact = customerDetail.contact_data || {};
      const address = customerDetail.address_data || {};

      setFormData({
        ...customerDetail,
        map_to_first_name: contact.first_name || '',
        map_to_last_name: contact.last_name || '',
        email_id: contact.email_id || customerDetail.email_id || '',
        mobile_no: contact.mobile_no || customerDetail.mobile_no || '',
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
  }, [isEdit, customerDetail]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.customer_name) return Alert.alert("Error", "Customer Name is required");

    try {
      const res = await saveMutation.mutateAsync({ data: formData, id: customerId });
      const currentCustomerId = customerId || res.name;

      if (isEdit && customerDetail) {
        const updatePromises: Promise<any>[] = [];

        if (customerDetail.customer_primary_contact) {
          updatePromises.push(customerService.updateContact(customerDetail.customer_primary_contact, {
            first_name: formData.map_to_first_name,
            last_name: formData.map_to_last_name,
            email_id: formData.email_id,
            mobile_no: formData.mobile_no
          }));
        }

        if (customerDetail.customer_primary_address) {
          updatePromises.push(customerService.updateAddress(customerDetail.customer_primary_address, {
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

      Alert.alert("Success", `Customer ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.replace('CustomerDetail', { customerId: currentCustomerId });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save customer");
    }
  };

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: User, type: 'blue' },
    { id: 'contact', title: 'Primary Contact', icon: Phone, type: 'orange' },
    { id: 'address', title: 'Primary Address', icon: MapPin, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ], []);

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
              <FormInput 
                label="Customer Name" 
                value={formData.customer_name} 
                onChangeText={(v: string) => handleChange('customer_name', v)} 
                icon={User} 
                placeholder="Enter Customer Name"
              />
              <Selector 
                label="Customer Group" 
                options={customerGroups || []} 
                value={formData.customer_group} 
                onChange={(v: any) => handleChange('customer_group', v)} 
                loading={loadingGroups}
                icon={Tag} 
              />
              <Selector 
                label="Customer Type" 
                options={[{ name: 'Company' }, { name: 'Individual' }]} 
                value={formData.customer_type} 
                onChange={(v: any) => handleChange('customer_type', v)} 
                icon={Briefcase} 
              />
              <Selector 
                label="Territory" 
                options={territories || []} 
                value={formData.territory} 
                onChange={(v: any) => handleChange('territory', v)} 
                loading={loadingTerritories}
                icon={Globe} 
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

          {section.id === 'save' && (
            <SaveSection 
              isEdit={isEdit} 
              isPending={saveMutation.isPending} 
              handleSubmit={handleSubmit} 
              title={isEdit ? "Update Customer?" : "Save Customer?"}
              subtitle="This will save the customer record and linked details."
              label={isEdit ? "Update Customer" : "Save Customer"} 
            />
          )}
        </ScrollView>
      </View>
    );
  }, [formData, customerGroups, loadingGroups, territories, loadingTerritories, countries, loadingCountries, handleChange, isEdit, saveMutation.isPending, handleSubmit]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit Customer` : "New Customer"} showBack>
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
