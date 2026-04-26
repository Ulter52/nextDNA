import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, TouchableOpacity } from 'react-native';
import { User, Calendar, FileText, CheckCircle2, Package, Tag, Building2, Plus, Trash2, ShoppingCart, Percent, Warehouse } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

import { 
  useCompanies,
  useSellingItems,
  useWarehouses,
  useTaxTemplates
} from '../../hooks/sellingQueries';
import { useSalesInvoiceDetail, useSaveSalesInvoice } from '../../hooks/salesInvoiceQueries';
import { useCustomers } from '../../hooks/customerQueries';
import { sellingService } from '../../services/salesOrderService';
import { salesInvoiceService } from '../../services/salesInvoiceService';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function NewSalesInvoice() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { invoiceId } = route.params || {};
  const isEdit = !!invoiceId;

  const [user, setUser] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  
  const [formData, setFormData] = useState<any>({
    company: '',
    customer: '',
    posting_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    taxes_and_charges: '',
    set_warehouse: '',
    items: [{ item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0, warehouse: '' }],
    taxes: [] as any[],
    currency: 'INR',
    selling_price_list: 'Standard Selling',
    update_stock: 0
  });

  const { data: invoiceDetail, isLoading: loadingDetail } = useSalesInvoiceDetail(invoiceId || '');
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  const { data: customerRes } = useCustomers();
  const { data: items, isLoading: loadingItems } = useSellingItems(itemSearch);
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses();
  const { data: taxTemplates, isLoading: loadingTaxes } = useTaxTemplates(formData.company);
  
  const saveMutation = useSaveSalesInvoice();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  useEffect(() => {
    if (isEdit && invoiceDetail) {
      setFormData({
        ...invoiceDetail,
        posting_date: invoiceDetail.posting_date,
        due_date: invoiceDetail.due_date,
      });
    } else if (companies && companies.length > 0 && !formData.company) {
      const defaultCo = companies[0];
      setFormData(prev => ({ 
        ...prev, 
        company: defaultCo.name,
        currency: defaultCo.default_currency || 'INR'
      }));
    }
  }, [isEdit, invoiceDetail, companies]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleTaxTemplateChange = async (templateName: string) => {
    try {
      const detail = await sellingService.getSalesTaxesTemplateDetail(templateName);
      setFormData(prev => ({
        ...prev,
        taxes_and_charges: templateName,
        taxes: detail.taxes || []
      }));
    } catch (err) {
      console.error("Failed to fetch tax template details", err);
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0, warehouse: prev.set_warehouse || '' }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'item_code') {
      const selectedItem = items?.find((i: any) => i.name === value);
      if (selectedItem) {
        const price = await sellingService.getItemPrice(value, formData.selling_price_list);
        item.price_list_rate = price || selectedItem.standard_rate || 0;
        item.rate = item.price_list_rate;
        item.discount_amount = 0;
        item.warehouse = formData.set_warehouse || item.warehouse;
      }
    }
    
    const qty = parseFloat(item.qty) || 0;
    const price_list_rate = parseFloat(item.price_list_rate) || 0;
    
    if (field === 'discount_amount') {
      const disc = parseFloat(value) || 0;
      item.rate = qty > 0 ? (price_list_rate - (disc / qty)) : price_list_rate;
    } else if (field === 'rate') {
      const rateVal = parseFloat(value) || 0;
      item.discount_amount = qty > 0 ? (price_list_rate - rateVal) * qty : 0;
    }
    
    item.amount = qty * item.rate;
    newItems[index] = item;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async () => {
    if (!formData.company) return Alert.alert("Error", "Company is required");
    if (!formData.customer) return Alert.alert("Error", "Customer is required");
    if (formData.items.some((i: any) => !i.item_code)) return Alert.alert("Error", "All items must be selected");

    try {
      const res = await saveMutation.mutateAsync({ data: formData, id: invoiceId });
      Alert.alert("Success", `Sales Invoice ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.replace('SalesInvoiceDetail', { invoiceId: invoiceId || res.name });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save sales invoice");
    }
  };

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'taxes', title: 'Taxes & Terms', icon: Tag, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ], []);

  const customers = useMemo(() => {
    return customerRes?.pages?.flatMap((p: any) => p) || [];
  }, [customerRes]);

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
              <Selector 
                label="Company" 
                options={companies || []} 
                value={formData.company} 
                onChange={(v: any) => handleChange('company', v)} 
                loading={loadingCompanies}
                icon={Building2} 
              />
              <Selector 
                label="Customer" 
                options={customers} 
                displayField="customer_name"
                value={formData.customer} 
                onChange={(v: any) => handleChange('customer', v)} 
                icon={User} 
              />
              <FormInput 
                label="Posting Date" 
                value={formData.posting_date} 
                onChangeText={(v: string) => handleChange('posting_date', v)} 
                icon={Calendar} 
                placeholder="YYYY-MM-DD"
              />
              <FormInput 
                label="Due Date" 
                value={formData.due_date} 
                onChangeText={(v: string) => handleChange('due_date', v)} 
                icon={Calendar} 
                placeholder="YYYY-MM-DD"
              />
              
              <TouchableOpacity 
                onPress={() => handleChange('update_stock', formData.update_stock ? 0 : 1)}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: colors.background,
                  padding: 16,
                  borderRadius: 12,
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: colors.border_light
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Warehouse size={18} color={colors.text_secondary} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text_primary }}>Update Stock</Text>
                </View>
                <View style={{ 
                  width: 44, 
                  height: 24, 
                  borderRadius: 12, 
                  backgroundColor: formData.update_stock ? colors.primary : colors.neutral_200,
                  padding: 2,
                  justifyContent: 'center'
                }}>
                  <View style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: 10, 
                    backgroundColor: colors.white,
                    alignSelf: formData.update_stock ? 'flex-end' : 'flex-start'
                  }} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {section.id === 'items' && (
            <View>
              <Selector 
                label="Common Warehouse" 
                options={warehouses || []} 
                value={formData.set_warehouse} 
                onChange={(v: any) => {
                  handleChange('set_warehouse', v);
                  setFormData((prev: any) => ({
                    ...prev,
                    items: prev.items.map((it: any) => ({ ...it, warehouse: v }))
                  }));
                }} 
                loading={loadingWarehouses}
                icon={Warehouse} 
              />

              <TouchableOpacity 
                onPress={addItem}
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  gap: 8, 
                  backgroundColor: colors.blue_50, 
                  padding: 12, 
                  borderRadius: 12,
                  marginVertical: 16,
                  justifyContent: 'center'
                }}
              >
                <Plus size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Add Item</Text>
              </TouchableOpacity>

              {formData.items.map((item: any, idx: number) => (
                <View key={idx} style={{ 
                  backgroundColor: colors.background, 
                  padding: 16, 
                  borderRadius: 16, 
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border_light
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text_tertiary }}>ITEM #{idx + 1}</Text>
                    {formData.items.length > 1 && (
                      <TouchableOpacity onPress={() => removeItem(idx)}>
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Selector 
                    label="Select Item" 
                    options={items || []} 
                    displayField="item_name"
                    value={item.item_code} 
                    onChange={(v: any) => updateItem(idx, 'item_code', v)} 
                    onSearch={setItemSearch}
                    loading={loadingItems}
                    icon={Package} 
                  />

                  <Selector 
                    label="Warehouse" 
                    options={warehouses || []} 
                    value={item.warehouse} 
                    onChange={(v: any) => updateItem(idx, 'warehouse', v)} 
                    loading={loadingWarehouses}
                    icon={Warehouse} 
                  />

                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <FormInput 
                        label="Qty" 
                        value={String(item.qty)} 
                        onChangeText={(v: string) => updateItem(idx, 'qty', v)} 
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormInput 
                        label="Rate" 
                        value={String(item.rate)} 
                        onChangeText={(v: string) => updateItem(idx, 'rate', v)} 
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.white, borderRadius: 8, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 10, color: colors.text_tertiary }}>AMOUNT</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{formData.currency} {item.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              <Selector 
                label="Taxes and Charges" 
                options={taxTemplates || []} 
                value={formData.taxes_and_charges} 
                onChange={handleTaxTemplateChange} 
                loading={loadingTaxes}
                icon={Percent} 
              />
              <Selector 
                label="Price List" 
                options={[{ name: 'Standard Selling' }, { name: 'Standard Buying' }]} 
                value={formData.selling_price_list} 
                onChange={(v: any) => handleChange('selling_price_list', v)} 
                icon={ShoppingCart} 
              />
              
              <View style={{ marginTop: spacing.lg, padding: 16, backgroundColor: colors.neutral_50, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.text_secondary, marginBottom: 8 }}>SUMMARY</Text>
                {formData.items.map((it: any, i: number) => it.item_code ? (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 12, color: colors.text_tertiary }}>{it.item_code} x {it.qty}</Text>
                    <Text style={{ fontSize: 12, color: colors.text_primary }}>{formData.currency} {it.amount.toFixed(2)}</Text>
                  </View>
                ) : null)}
              </View>
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection 
              isEdit={isEdit} 
              isPending={saveMutation.isPending} 
              handleSubmit={handleSubmit} 
              title={isEdit ? "Update Invoice?" : "Save Invoice?"}
              subtitle="This will save the sales invoice to the system."
              label={isEdit ? "Update Invoice" : "Save Invoice"} 
            />
          )}
        </ScrollView>
      </View>
    );
  }, [formData, companies, customers, items, warehouses, taxTemplates, loadingCompanies, loadingItems, loadingWarehouses, loadingTaxes, handleChange, handleTaxTemplateChange, isEdit, saveMutation.isPending, handleSubmit]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit Invoice` : "New Invoice"} showBack>
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
