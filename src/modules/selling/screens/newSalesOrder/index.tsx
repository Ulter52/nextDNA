import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Calendar, FileText, CheckCircle2, Package, Tag, Building2, Plus, Trash2, ShoppingCart, Percent, Truck, Warehouse, Briefcase, LayoutGrid } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

import { 
  useSalesOrderDetail, 
  useSaveSalesOrder,
  useCompanies,
  useSellingItems,
  useWarehouses,
  useTaxCategories,
  useTaxTemplates,
  useProjects,
  useCostCenters
} from '../../hooks/sellingQueries';
import { useCustomers } from '../../hooks/customerQueries';
import { sellingService } from '../../services/salesOrderService';
import { companyService } from '../../../../core/services/companyService';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const salesOrderItemSchema = z.object({
  item_code: z.string().min(1, 'Required'),
  qty: z.coerce.number().positive('Qty > 0'),
  rate: z.coerce.number().min(0),
  warehouse: z.string().optional(),
  amount: z.number().optional(),
});

const salesOrderSchema = z.object({
  company: z.string().min(1, 'Required'),
  customer: z.string().min(1, 'Required'),
  transaction_date: z.string(),
  delivery_date: z.string(),
  set_warehouse: z.string().optional(),
  tax_category: z.string().optional(),
  taxes_and_charges: z.string().optional(),
  selling_price_list: z.string().default('Standard Selling'),
  currency: z.string().default('INR'),
  project: z.string().optional(),
  cost_center: z.string().optional(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item'),
});

type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue }: { watch: any, setValue: any }) => {
  const [showPicker, setShowPicker] = useState<'transaction_date' | 'delivery_date' | null>(null);

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

  const transactionDate = watch('transaction_date');
  const deliveryDate = watch('delivery_date');

  // Parse dates safely
  const getPickerDate = () => {
    const dateStr = showPicker ? watch(showPicker) : null;
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker('transaction_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Transaction Date" value={transactionDate} editable={false} icon={Calendar} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowPicker('delivery_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Delivery Date" value={deliveryDate} editable={false} icon={Truck} />
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

export function NewSalesOrder() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params || {};
  const isEdit = !!orderId;

  const [itemSearch, setItemSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [costCenterSearch, setCostCenterSearch] = useState('');
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      company: '', customer: '',
      transaction_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      items: [{ item_code: '', qty: 1, rate: 0 }],
      selling_price_list: 'Standard Selling', currency: 'INR'
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchCompany = watch('company');
  const watchItems = watch('items');
  const watchCurrency = watch('currency');

  // Queries - Called at top level
  const { data: orderDetail, isLoading: loadingDetail } = useSalesOrderDetail(orderId || '');
  const { data: companies, isLoading: loadingCompanies } = useCompanies();
  
  const { 
    data: customerRes, 
    fetchNextPage: fetchNextCustomers, 
    hasNextPage: hasNextCustomers, 
    isFetchingNextPage: isFetchingNextCustomers 
  } = useCustomers(customerSearch);
  
  const { 
    data: itemRes, 
    fetchNextPage: fetchNextItems, 
    hasNextPage: hasNextItems, 
    isFetchingNextPage: isFetchingNextItems 
  } = useSellingItems(itemSearch);

  const {
    data: projectRes,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects
  } = useProjects(projectSearch);

  const {
    data: costCenterRes,
    fetchNextPage: fetchNextCostCenters,
    hasNextPage: hasNextCostCenters,
    isFetchingNextPage: isFetchingNextCostCenters
  } = useCostCenters(costCenterSearch);
  
  const { data: warehouses, isLoading: loadingWarehouses } = useWarehouses();
  const { data: taxCategories } = useTaxCategories();
  const { data: taxTemplates, isLoading: loadingTaxes } = useTaxTemplates(watchCompany);
  
  const saveMutation = useSaveSalesOrder();

  // Safe flattening helper
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

  const customers = useMemo(() => flattenPages(customerRes), [customerRes]);
  const items = useMemo(() => flattenPages(itemRes), [itemRes]);
  const projects = useMemo(() => flattenPages(projectRes), [projectRes]);
  const costCenters = useMemo(() => flattenPages(costCenterRes), [costCenterRes]);

  useEffect(() => {
    if (!isEdit) {
      companyService.getSelectedCompany().then(selected => {
        if (selected) setValue('company', selected.name);
      });
    }
  }, [isEdit, setValue]);

  useEffect(() => {
    if (isEdit && orderDetail) reset(orderDetail);
  }, [isEdit, orderDetail, reset]);

  const updateItemDetails = async (index: number, itemCode: string) => {
    const selectedItem = items.find((i: any) => i.name === itemCode);
    if (selectedItem) {
      try {
        const price = await sellingService.getItemPrice(itemCode, watch('selling_price_list'));
        setValue(`items.${index}.rate`, price || selectedItem.standard_rate || 0);
      } catch (e) {
        console.error("Price fetch error", e);
      }
    }
  };

  const onSubmit = async (data: SalesOrderFormValues) => {
    try {
      const payload = { ...data, items: data.items.map(it => ({ ...it, delivery_date: data.delivery_date })) };
      const res = await saveMutation.mutateAsync({ data: payload, id: orderId });
      Alert.alert("Success", "Sales Order saved");
      navigation.replace('SalesOrderDetail', { orderId: orderId || res.name });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save sales order");
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
              <Controller control={control} name="company" render={({ field: { value } }) => (
                <Selector label="Company" options={companies || []} value={value} onChange={() => {}} disabled icon={Building2} />
              )} />
              <Controller control={control} name="customer" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Customer" options={customers} displayField="customer_name" value={value} 
                  onChange={onChange} onSearch={setCustomerSearch} 
                  onEndReached={() => hasNextCustomers && fetchNextCustomers()} 
                  loadingNextPage={isFetchingNextCustomers} icon={User} 
                />
              )} />
              <DateSection watch={watch} setValue={setValue} />
              <Controller control={control} name="project" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Project" options={projects} value={value} onChange={onChange} 
                  onSearch={setProjectSearch} 
                  onEndReached={() => hasNextProjects && fetchNextProjects()}
                  loadingNextPage={isFetchingNextProjects}
                  icon={Briefcase} placeholder="Select Project" 
                />
              )} />
              <Controller control={control} name="cost_center" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Cost Center" options={costCenters} value={value} onChange={onChange} 
                  onSearch={setCostCenterSearch}
                  onEndReached={() => hasNextCostCenters && fetchNextCostCenters()}
                  loadingNextPage={isFetchingNextCostCenters}
                  icon={LayoutGrid} placeholder="Select Cost Center" 
                />
              )} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              <Controller control={control} name="set_warehouse" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Common Warehouse" options={warehouses || []} value={value} 
                  onChange={(v) => { onChange(v); fields.forEach((_, i) => setValue(`items.${i}.warehouse`, v)); }} 
                  loading={loadingWarehouses} icon={Warehouse} 
                />
              )} />
              <TouchableOpacity onPress={() => append({ item_code: '', qty: 1, rate: 0 })} style={styles.addItemBtn}>
                <Plus size={18} color={colors.primary} /><Text style={styles.addItemText}>Add Item</Text>
              </TouchableOpacity>
              {fields.map((item, idx) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemLabel}>ITEM #{idx + 1}</Text>
                    {fields.length > 1 && (
                      <TouchableOpacity onPress={() => remove(idx)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
                    )}
                  </View>
                  <Controller control={control} name={`items.${idx}.item_code`} render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Select Item" options={items} displayField="item_name" value={value} 
                      onChange={(v) => { onChange(v); updateItemDetails(idx, v); }} 
                      onSearch={setItemSearch} 
                      onEndReached={() => hasNextItems && fetchNextItems()} 
                      loadingNextPage={isFetchingNextItems} icon={Package} 
                    />
                  )} />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Controller control={control} name={`items.${idx}.qty`} render={({ field: { onChange, value } }) => (
                        <FormInput label="Qty" value={String(value)} onChangeText={onChange} keyboardType="numeric" />
                      )} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller control={control} name={`items.${idx}.rate`} render={({ field: { onChange, value } }) => (
                        <FormInput label="Rate" value={String(value)} onChangeText={onChange} keyboardType="numeric" />
                      )} />
                    </View>
                  </View>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>AMOUNT</Text>
                    <Text style={styles.amountValue}>
                      {watchCurrency} {((watchItems?.[idx]?.qty || 0) * (watchItems?.[idx]?.rate || 0)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              <Controller control={control} name="tax_category" render={({ field: { onChange, value } }) => (
                <Selector label="Tax Category" options={taxCategories || []} value={value} onChange={onChange} icon={Percent} />
              )} />
              <Controller control={control} name="taxes_and_charges" render={({ field: { onChange, value } }) => (
                <Selector label="Taxes and Charges" options={taxTemplates || []} value={value} onChange={onChange} loading={loadingTaxes} icon={Percent} />
              )} />
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection 
              isEdit={isEdit} 
              isPending={saveMutation.isPending} 
              handleSubmit={handleSubmit(onSubmit)} 
              title={isEdit ? "Update Order?" : "Save Order?"} 
            />
          )}
        </ScrollView>
      </View>
    );
  }, [control, companies, customers, items, projects, costCenters, warehouses, taxCategories, taxTemplates, loadingCompanies, loadingWarehouses, loadingTaxes, fields, append, remove, watchCurrency, watchItems, watchCompany, isEdit, saveMutation.isPending, handleSubmit, onSubmit, setValue, watch, hasNextCustomers, fetchNextCustomers, isFetchingNextCustomers, hasNextItems, fetchNextItems, isFetchingNextItems, hasNextProjects, fetchNextProjects, isFetchingNextProjects, hasNextCostCenters, fetchNextCostCenters, isFetchingNextCostCenters]);

  if (isEdit && loadingDetail) {
    return (
      <ModuleLayout title="Loading..." showBack>
        <View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </ModuleLayout>
    );
  }

  const sectionsData = [
    { id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'taxes', title: 'Taxes & Terms', icon: Tag, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' }
  ];

  return (
    <ModuleLayout title={isEdit ? "Edit Order" : "New Order"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={detailStyles.container}>
          <FlatList 
            data={sectionsData} 
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
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.blue_50, padding: 12, borderRadius: 12, marginVertical: 16, justifyContent: 'center' },
  addItemText: { color: colors.primary, fontWeight: 'bold' },
  itemCard: { backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border_light },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text_tertiary },
  amountRow: { marginTop: 8, padding: 8, backgroundColor: colors.white, borderRadius: 8, alignItems: 'flex-end' },
  amountLabel: { fontSize: 10, color: colors.text_tertiary },
  amountValue: { fontSize: 14, fontWeight: 'bold', color: colors.text_primary },
});
