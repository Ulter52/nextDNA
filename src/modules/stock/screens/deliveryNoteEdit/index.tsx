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
import { styles as detailStyles } from '../itemDetail/styles';

import { 
  useDeliveryNoteDetail, 
  useSaveDeliveryNote 
} from '../../hooks/deliveryNoteQueries';
import { useWarehouses } from '../../hooks/itemQueries';
import { useSellingItems, useProjects, useCostCenters, useTaxCategories, useTaxTemplates } from '../../../selling/hooks/sellingQueries';
import { useCustomers } from '../../../selling/hooks/customerQueries';
import { stockApi } from '../../services/stockApi';
import { companyService } from '../../../../core/services/companyService';
import { sellingService } from '../../../selling/services/salesOrderService';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const deliveryNoteItemSchema = z.object({
  item_code: z.string().min(1, 'Required'),
  qty: z.coerce.number().positive('Qty > 0'),
  rate: z.coerce.number().min(0),
  warehouse: z.string().optional(),
  amount: z.number().optional(),
});

const deliveryNoteSchema = z.object({
  company: z.string().min(1, 'Required'),
  customer: z.string().min(1, 'Required'),
  posting_date: z.string(),
  set_warehouse: z.string().optional(),
  tax_category: z.string().optional(),
  taxes_and_charges: z.string().optional(),
  currency: z.string().default('INR'),
  project: z.string().optional(),
  cost_center: z.string().optional(),
  items: z.array(deliveryNoteItemSchema).min(1, 'At least one item'),
});

type DeliveryNoteFormValues = z.infer<typeof deliveryNoteSchema>;

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue }: { watch: any, setValue: any }) => {
  const [showPicker, setShowPicker] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      try {
        const dateString = selectedDate.toISOString().split('T')[0];
        setValue('posting_date', dateString);
      } catch (e) {
        console.error("Date conversion error", e);
      }
    }
  };

  const postingDate = watch('posting_date');

  const getPickerDate = () => {
    if (!postingDate) return new Date();
    const d = new Date(postingDate);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker(true)} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Date" value={postingDate} editable={false} icon={Calendar} />
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

export function DeliveryNoteEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { noteId } = route.params || {};
  const isEdit = !!noteId;

  const [itemSearch, setItemSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [costCenterSearch, setCostCenterSearch] = useState('');
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<DeliveryNoteFormValues>({
    resolver: zodResolver(deliveryNoteSchema),
    defaultValues: {
      company: '', customer: '',
      posting_date: new Date().toISOString().split('T')[0],
      items: [{ item_code: '', qty: 1, rate: 0 }],
      currency: 'INR'
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchCompany = watch('company');
  const watchItems = watch('items');
  const watchCurrency = watch('currency');

  // Queries
  const { data: noteDetail, isLoading: loadingDetail } = useDeliveryNoteDetail(noteId || '');
  
  const { 
    data: customerRes, 
    fetchNextPage: fetchNextCustomers, 
    hasNextPage: hasNextCustomers, 
    isFetchingNextPage: isFetchingCustomers 
  } = useCustomers(customerSearch);
  
  const { 
    data: itemRes, 
    fetchNextPage: fetchNextItems, 
    hasNextPage: hasNextItems, 
    isFetchingNextPage: isFetchingItems 
  } = useSellingItems(itemSearch);

  const {
    data: projectRes,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingProjects
  } = useProjects(projectSearch);

  const {
    data: costCenterRes,
    fetchNextPage: fetchNextCostCenters,
    hasNextPage: hasNextCostCenters,
    isFetchingNextPage: isFetchingCostCenters
  } = useCostCenters(costCenterSearch);
  
  const { data: warehouses } = useWarehouses(watchCompany);
  const { data: taxCategories } = useTaxCategories();
  const { data: taxTemplates } = useTaxTemplates(watchCompany);
  
  const saveMutation = useSaveDeliveryNote();

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
    if (isEdit && noteDetail) reset(noteDetail);
  }, [isEdit, noteDetail, reset]);

  const updateItemDetails = async (index: number, itemCode: string) => {
    try {
      const res = await stockApi.getItemDetails(itemCode);
      const details = res?.data;
      if (details) {
        const price = await sellingService.getItemPrice(itemCode, 'Standard Selling');
        setValue(`items.${index}.rate`, price || details.standard_rate || 0);
      }
    } catch (e) {
      console.error("Item detail fetch error", e);
    }
  };

  const onSubmit = async (data: DeliveryNoteFormValues) => {
    try {
      const res = await saveMutation.mutateAsync({ data, id: noteId });
      Alert.alert("Success", "Delivery Note saved");
      navigation.replace('DeliveryNoteDetail', { noteId: noteId || res.name });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save delivery note");
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
                <Selector label="Company" options={[{name: value, value}]} value={value} onChange={() => {}} disabled icon={Building2} />
              )} />
              <Controller control={control} name="customer" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Customer" options={customers} displayField="customer_name" value={value} 
                  onChange={onChange} onSearch={setCustomerSearch} 
                  onEndReached={() => hasNextCustomers && fetchNextCustomers()} 
                  loadingNextPage={isFetchingCustomers} icon={User} 
                />
              )} />
              <DateSection watch={watch} setValue={setValue} />
              <Controller control={control} name="project" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Project" options={projects} value={value} onChange={onChange} 
                  onSearch={setProjectSearch} onEndReached={() => hasNextProjects && fetchNextProjects()}
                  loadingNextPage={isFetchingProjects} icon={Briefcase} placeholder="Select Project" 
                />
              )} />
              <Controller control={control} name="cost_center" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Cost Center" options={costCenters} value={value} onChange={onChange} 
                  onSearch={setCostCenterSearch} onEndReached={() => hasNextCostCenters && fetchNextCostCenters()}
                  loadingNextPage={isFetchingCostCenters} icon={LayoutGrid} placeholder="Select Cost Center" 
                />
              )} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              <Controller control={control} name="set_warehouse" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Common Warehouse" options={warehouses || []} displayField="warehouse_name" value={value} 
                  onChange={(v) => { onChange(v); fields.forEach((_, i) => setValue(`items.${i}.warehouse`, v)); }} 
                  icon={Warehouse} 
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
                      onSearch={setItemSearch} onEndReached={() => hasNextItems && fetchNextItems()} 
                      loadingNextPage={isFetchingItems} icon={Package} 
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
                <Selector label="Taxes and Charges" options={taxTemplates || []} value={value} onChange={onChange} icon={Percent} />
              )} />
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection isEdit={isEdit} isPending={saveMutation.isPending} handleSubmit={handleSubmit(onSubmit)} label={isEdit ? "Update Note" : "Create Note"} />
          )}
        </ScrollView>
      </View>
    );
  }, [control, customers, items, projects, costCenters, warehouses, taxCategories, taxTemplates, fields, append, remove, watchCurrency, watchItems, isEdit, saveMutation.isPending, handleSubmit, onSubmit, setValue, watch, hasNextCustomers, fetchNextCustomers, isFetchingCustomers, hasNextItems, fetchNextItems, isFetchingItems, hasNextProjects, fetchNextProjects, isFetchingProjects, hasNextCostCenters, fetchNextCostCenters, isFetchingCostCenters]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? "Edit DN" : "New DN"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={detailStyles.container}>
          <FlatList 
            data={[{ id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' }, { id: 'items', title: 'Items', icon: Package, type: 'orange' }, { id: 'taxes', title: 'Totals & Taxes', icon: Tag, type: 'green' }, { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' }]} 
            renderItem={renderSection} keyExtractor={(s) => s.id} horizontal showsHorizontalScrollIndicator={false} snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} contentContainerStyle={detailStyles.horizontalList} 
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
