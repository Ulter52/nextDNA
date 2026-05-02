import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { User, Calendar, FileText, CheckCircle2, Package, Tag, Building2, Plus, Trash2, ShoppingCart, Percent, Truck, Warehouse, Briefcase, LayoutGrid, Ruler, Activity } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing } from '../../../../core/theme';
import { styles as detailStyles } from '../itemDetail/styles';

import { 
  useMaterialRequestDetail, 
  useSaveMaterialRequest 
} from '../../hooks/materialRequestQueries';
import { useSellingItems, useWarehouses } from '../../../selling/hooks/sellingQueries';
import { stockApi } from '../../services/stockApi';
import { companyService } from '../../../../core/services/companyService';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MATERIAL_REQUEST_TYPES = [
  { name: 'Purchase', value: 'Purchase' },
  { name: 'Material Transfer', value: 'Material Transfer' },
  { name: 'Material Issue', value: 'Material Issue' },
  { name: 'Manufacture', value: 'Manufacture' },
  { name: 'Customer Provided', value: 'Customer Provided' },
];

// 1. Zod Schema
const mrItemSchema = z.object({
  item_code: z.string().min(1, 'Required'),
  qty: z.coerce.number().positive('Qty > 0'),
  uom: z.string().optional(),
  warehouse: z.string().optional(),
});

const mrSchema = z.object({
  company: z.string().min(1, 'Required'),
  material_request_type: z.string().default('Purchase'),
  transaction_date: z.string(),
  schedule_date: z.string(),
  set_warehouse: z.string().optional(),
  items: z.array(mrItemSchema).min(1, 'At least one item'),
});

type MRFormValues = z.infer<typeof mrSchema>;

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue }: { watch: any, setValue: any }) => {
  const [showPicker, setShowPicker] = useState<'transaction_date' | 'schedule_date' | null>(null);

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
  const scheduleDate = watch('schedule_date');

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
          <FormInput label="Date" value={transactionDate} editable={false} icon={Calendar} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowPicker('schedule_date')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Required By" value={scheduleDate} editable={false} icon={Truck} />
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

export function MaterialRequestEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId } = route.params || {};
  const isEdit = !!requestId;

  const [itemSearch, setItemSearch] = useState('');
  const [whSearch, setWarehouseSearch] = useState('');
  
  const { control, handleSubmit, watch, setValue, reset } = useForm<MRFormValues>({
    resolver: zodResolver(mrSchema),
    defaultValues: {
      company: '', 
      material_request_type: 'Purchase',
      transaction_date: new Date().toISOString().split('T')[0],
      schedule_date: new Date().toISOString().split('T')[0],
      items: [{ item_code: '', qty: 1, uom: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchCompany = watch('company');

  // Queries
  const { data: requestDetail, isLoading: loadingDetail } = useMaterialRequestDetail(requestId || '');
  
  const { 
    data: itemRes, 
    fetchNextPage: fetchNextItems, 
    hasNextPage: hasNextItems, 
    isFetchingNextPage: isFetchingItems 
  } = useSellingItems(itemSearch);

  const { data: warehouses, isLoading: loadingWh } = useWarehouses(watchCompany);
  const saveMutation = useSaveMaterialRequest();

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

  const items = useMemo(() => flattenPages(itemRes), [itemRes]);

  useEffect(() => {
    if (!isEdit) {
      companyService.getSelectedCompany().then(selected => {
        if (selected) setValue('company', selected.name);
      });
    }
  }, [isEdit, setValue]);

  useEffect(() => {
    if (isEdit && requestDetail) reset(requestDetail);
  }, [isEdit, requestDetail, reset]);

  const updateItemDetails = async (index: number, itemCode: string) => {
    try {
      const res = await stockApi.getItemDetails(itemCode);
      const details = res?.data;
      if (details) {
        setValue(`items.${index}.uom`, details.stock_uom || '');
      }
    } catch (e) {
      console.error("Item detail fetch error", e);
    }
  };

  const onSubmit = async (data: MRFormValues) => {
    try {
      const res = await saveMutation.mutateAsync({ data, id: requestId });
      Alert.alert("Success", "Material Request saved");
      navigation.replace('MaterialRequestDetail', { requestId: requestId || res.name });
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save material request");
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
              <Controller control={control} name="material_request_type" render={({ field: { onChange, value } }) => (
                <Selector label="Type" options={MATERIAL_REQUEST_TYPES} value={value} onChange={onChange} icon={Activity} />
              )} />
              <DateSection watch={watch} setValue={setValue} />
              <Controller control={control} name="set_warehouse" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Default Warehouse" options={warehouses || []} displayField="warehouse_name" value={value} 
                  onChange={onChange} icon={Warehouse} loading={loadingWh}
                />
              )} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              <TouchableOpacity onPress={() => append({ item_code: '', qty: 1, uom: '' })} style={styles.addItemBtn}>
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
                        <FormInput label="Qty" value={String(value)} onChangeText={onChange} keyboardType="numeric" icon={ShoppingCart} />
                      )} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Controller control={control} name={`items.${idx}.uom`} render={({ field: { onChange, value } }) => (
                        <FormInput label="UOM" value={value} onChangeText={onChange} icon={Ruler} />
                      )} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection isEdit={isEdit} isPending={saveMutation.isPending} handleSubmit={handleSubmit(onSubmit)} label={isEdit ? "Update Request" : "Create Request"} />
          )}
        </ScrollView>
      </View>
    );
  }, [control, items, warehouses, loadingWh, fields, append, remove, isEdit, saveMutation.isPending, handleSubmit, onSubmit, setValue, watch, hasNextItems, fetchNextItems, isFetchingItems]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? "Edit Request" : "New Request"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={detailStyles.container}>
          <FlatList 
            data={[{ id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' }, { id: 'items', title: 'Items List', icon: Package, type: 'orange' }, { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' }]} 
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
});
