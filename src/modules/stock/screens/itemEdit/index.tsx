import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { 
  Package, Box, Tag, Activity, Layers, Barcode, Calendar, Weight,
  Truck, ShieldCheck, Percent, ClipboardList, Receipt, Settings, FileText,
  Scale, Save, Plus, Trash2, CheckCircle2, Bookmark, Ruler 
} from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { styles as detailStyles } from '../itemDetail/styles';

import { 
  useBrands, useItemGroups, useUOMs, 
  useHSNCodes, useTaxTemplates, useItemDetail 
} from '../../hooks/itemQueries';
import { stockApi } from '../../services/stockApi';

import { FormInput } from '../../../../core/components/FormInput';
import { Selector } from '../../../../core/components/Selector';
import { SaveSection } from '../../../../core/components/SaveSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const itemUomSchema = z.object({
  uom: z.string().min(1, 'Required'),
  conversion_factor: z.coerce.number().positive(),
});

const itemTaxSchema = z.object({
  item_tax_template: z.string().min(1, 'Required'),
  valid_from: z.string().optional(),
});

const itemSchema = z.object({
  item_code: z.string().min(1, 'Required'),
  item_name: z.string().min(1, 'Required'),
  item_group: z.string().default('All Item Groups'),
  stock_uom: z.string().default('Nos'),
  brand: z.string().optional(),
  gst_hsn_code: z.string().optional(),
  description: z.string().optional(),
  is_stock_item: z.number().default(1),
  has_variants: z.number().default(0),
  disabled: z.number().default(0),
  is_purchase_item: z.number().default(1),
  is_sales_item: z.number().default(1),
  grant_commission: z.number().default(1),
  max_discount: z.coerce.number().min(0).max(100).default(0),
  valuation_method: z.string().default('FIFO'),
  valuation_rate: z.coerce.number().min(0).default(0),
  shelf_life_in_days: z.coerce.number().min(0).default(0),
  end_of_life: z.string().optional(),
  default_material_request_type: z.string().default('Purchase'),
  warranty_period: z.coerce.number().min(0).default(0),
  weight_per_unit: z.coerce.number().min(0).default(0),
  weight_uom: z.string().optional(),
  allow_negative_stock: z.number().default(0),
  has_batch_no: z.number().default(0),
  has_serial_no: z.number().default(0),
  uoms: z.array(itemUomSchema).optional(),
  taxes: z.array(itemTaxSchema).optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

/**
 * Helper Boolean Component
 */
const BooleanField = ({ label, value, onChange }: any) => (
  <View style={styles.booleanRow}>
    <Text style={styles.booleanLabel}>{label}</Text>
    <Switch
      value={!!value}
      onValueChange={(val) => onChange(val ? 1 : 0)}
      trackColor={{ false: colors.neutral_200, true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
);

export function ItemEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { itemCode } = route.params || {};
  const isEdit = !!itemCode;

  const [brandSearch, setBrandSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [uomSearch, setUomSearch] = useState('');
  const [hsnSearch, setHsnSearch] = useState('');
  const [taxSearch, setTaxSearch] = useState('');

  const { control, handleSubmit, watch, setValue, reset } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      item_group: 'All Item Groups',
      stock_uom: 'Nos',
      is_stock_item: 1,
      is_purchase_item: 1,
      is_sales_item: 1,
      valuation_method: 'FIFO',
      default_material_request_type: 'Purchase',
      uoms: [],
      taxes: []
    }
  });

  const { fields: uomFields, append: appendUom, remove: removeUom } = useFieldArray({ control, name: "uoms" });
  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({ control, name: "taxes" });

  // Queries
  const { data: itemDetail, isLoading: loadingDetail } = useItemDetail(itemCode || '');
  
  const { 
    data: brandRes, fetchNextPage: fetchNextBrands, hasNextPage: hasNextBrands, isFetchingNextPage: isFetchingBrands 
  } = useBrands(brandSearch);
  
  const { 
    data: groupRes, fetchNextPage: fetchNextGroups, hasNextPage: hasNextGroups, isFetchingNextPage: isFetchingGroups 
  } = useItemGroups(groupSearch);
  
  const { 
    data: uomRes, fetchNextPage: fetchNextUOMs, hasNextPage: hasNextUOMs, isFetchingNextPage: isFetchingUOMs 
  } = useUOMs(uomSearch);

  const { 
    data: hsnRes, fetchNextPage: fetchNextHSN, hasNextPage: hasNextHSN, isFetchingNextPage: isFetchingHSN 
  } = useHSNCodes(hsnSearch);

  const { 
    data: taxRes, fetchNextPage: fetchNextTaxes, hasNextPage: hasNextTaxes, isFetchingNextPage: isFetchingTaxOptions 
  } = useTaxTemplates(taxSearch);

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

  const brands = useMemo(() => flattenPages(brandRes), [brandRes]);
  const itemGroups = useMemo(() => flattenPages(groupRes), [groupRes]);
  const uoms = useMemo(() => flattenPages(uomRes), [uomRes]);
  const hsnCodes = useMemo(() => flattenPages(hsnRes), [hsnRes]);
  const taxTemplates = useMemo(() => flattenPages(taxRes), [taxRes]);

  useEffect(() => {
    if (isEdit && itemDetail) reset(itemDetail);
  }, [isEdit, itemDetail, reset]);

  const onSubmit = async (data: ItemFormValues) => {
    try {
      if (isEdit) {
        await stockApi.updateItem(itemCode, data);
        Alert.alert("Success", "Item updated successfully");
      } else {
        await stockApi.createItem(data);
        Alert.alert("Success", "Item created successfully");
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save item");
    }
  };

  const renderSection = useCallback(({ item: section }: any) => {
    const titleColor = colors[
      section.type === 'blue' ? 'blue_500' : 
      section.type === 'cyan' ? 'teal_500' : 
      section.type === 'green' ? 'green_500' : 
      section.type === 'orange' ? 'orange_500' : 'purple_500'
    ];
    
    return (
      <View style={[detailStyles.sectionCard, detailStyles[`${section.type}Card` as keyof typeof detailStyles]]}>
        <View style={detailStyles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'details' && (
            <View>
              <Controller control={control} name="item_name" render={({ field: { onChange, value } }) => (
                <FormInput label="Item Name" value={value} onChangeText={onChange} icon={Package} placeholder="Required" />
              )} />
              <Controller control={control} name="item_code" render={({ field: { onChange, value } }) => (
                <FormInput label="Item Code" value={value} onChangeText={onChange} icon={Barcode} placeholder="Required" editable={!isEdit} />
              )} />
              <Controller control={control} name="brand" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Brand" options={brands} value={value} onChange={onChange} onSearch={setBrandSearch}
                  onEndReached={() => hasNextBrands && fetchNextBrands()} loadingNextPage={isFetchingBrands} icon={Bookmark}
                />
              )} />
              <Controller control={control} name="item_group" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Item Group" options={itemGroups} value={value} onChange={onChange} onSearch={setGroupSearch}
                  onEndReached={() => hasNextGroups && fetchNextGroups()} loadingNextPage={isFetchingGroups} icon={Layers}
                />
              )} />
              <Controller control={control} name="gst_hsn_code" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="HSN/SAC" options={hsnCodes} value={value} onChange={onChange} onSearch={setHsnSearch}
                  onEndReached={() => hasNextHSN && fetchNextHSN()} loadingNextPage={isFetchingHSN} icon={Barcode}
                />
              )} />
              <Controller control={control} name="description" render={({ field: { onChange, value } }) => (
                <FormInput label="Description" value={value} onChangeText={onChange} multiline numberOfLines={3} icon={FileText} />
              )} />
            </View>
          )}

          {section.id === 'settings' && (
            <View>
              <Controller control={control} name="disabled" render={({ field: { onChange, value } }) => (
                <BooleanField label="Disabled" value={value} onChange={onChange} />
              )} />
              <Controller control={control} name="is_stock_item" render={({ field: { onChange, value } }) => (
                <BooleanField label="Maintain Stock" value={value} onChange={onChange} />
              )} />
              <Controller control={control} name="is_purchase_item" render={({ field: { onChange, value } }) => (
                <BooleanField label="Allow Purchase" value={value} onChange={onChange} />
              )} />
              <Controller control={control} name="is_sales_item" render={({ field: { onChange, value } }) => (
                <BooleanField label="Allow Sales" value={value} onChange={onChange} />
              )} />
            </View>
          )}

          {section.id === 'inventory' && (
            <View>
              <Controller control={control} name="valuation_method" render={({ field: { onChange, value } }) => (
                <FormInput label="Valuation Method" value={value} onChangeText={onChange} icon={Activity} />
              )} />
              <Controller control={control} name="valuation_rate" render={({ field: { onChange, value } }) => (
                <FormInput label="Valuation Rate" value={String(value)} onChangeText={onChange} icon={Tag} keyboardType="numeric" />
              )} />
              <Controller control={control} name="has_serial_no" render={({ field: { onChange, value } }) => (
                <BooleanField label="Has Serial No" value={value} onChange={onChange} />
              )} />
              <Controller control={control} name="has_batch_no" render={({ field: { onChange, value } }) => (
                <BooleanField label="Has Batch No" value={value} onChange={onChange} />
              )} />
            </View>
          )}

          {section.id === 'units' && (
            <View>
              <Controller control={control} name="stock_uom" render={({ field: { onChange, value } }) => (
                <Selector 
                  label="Default UOM" options={uoms} value={value} onChange={onChange} onSearch={setUomSearch}
                  onEndReached={() => hasNextUOMs && fetchNextUOMs()} loadingNextPage={isFetchingUOMs} icon={Ruler}
                />
              )} />
              <TouchableOpacity onPress={() => appendUom({ uom: '', conversion_factor: 1 })} style={styles.addItemBtn}>
                <Plus size={18} color={colors.primary} /><Text style={styles.addItemText}>Add Alternative UOM</Text>
              </TouchableOpacity>
              {uomFields.map((field, idx) => (
                <View key={field.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemLabel}>UOM #{idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeUom(idx)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
                  </View>
                  <Controller control={control} name={`uoms.${idx}.uom`} render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Alternative UOM" options={uoms} value={value} onChange={onChange} onSearch={setUomSearch}
                      onEndReached={() => hasNextUOMs && fetchNextUOMs()} loadingNextPage={isFetchingUOMs} icon={Scale}
                    />
                  )} />
                  <Controller control={control} name={`uoms.${idx}.conversion_factor`} render={({ field: { onChange, value } }) => (
                    <FormInput label="Conversion Factor" value={String(value)} onChangeText={onChange} keyboardType="numeric" icon={Activity} />
                  )} />
                </View>
              ))}
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              <TouchableOpacity onPress={() => appendTax({ item_tax_template: '' })} style={styles.addItemBtn}>
                <Plus size={18} color={colors.primary} /><Text style={styles.addItemText}>Add Tax Template</Text>
              </TouchableOpacity>
              {taxFields.map((field, idx) => (
                <View key={field.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemLabel}>TAX #{idx + 1}</Text>
                    <TouchableOpacity onPress={() => removeTax(idx)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
                  </View>
                  <Controller control={control} name={`taxes.${idx}.item_tax_template`} render={({ field: { onChange, value } }) => (
                    <Selector 
                      label="Tax Template" options={taxTemplates} displayField="title" value={value} onChange={onChange} onSearch={setTaxSearch}
                      onEndReached={() => hasNextTaxes && fetchNextTaxes()} loadingNextPage={isFetchingTaxOptions} icon={Percent}
                    />
                  )} />
                </View>
              ))}
            </View>
          )}

          {section.id === 'save' && (
            <SaveSection isEdit={isEdit} isPending={false} handleSubmit={handleSubmit(onSubmit)} title={isEdit ? "Update Item?" : "Create Item?"} />
          )}
        </ScrollView>
      </View>
    );
  }, [control, brands, itemGroups, uoms, hsnCodes, taxTemplates, isEdit, handleSubmit, onSubmit, appendUom, removeUom, appendTax, removeTax, uomFields, taxFields, hasNextBrands, fetchNextBrands, isFetchingBrands, hasNextGroups, fetchNextGroups, isFetchingGroups, hasNextUOMs, fetchNextUOMs, isFetchingUOMs, hasNextHSN, fetchNextHSN, isFetchingHSN, hasNextTaxes, fetchNextTaxes, isFetchingTaxOptions]);

  if (isEdit && loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  const sectionsData = [
    { id: 'details', title: 'Details', icon: ClipboardList, type: 'blue' },
    { id: 'settings', title: 'Settings', icon: Settings, type: 'cyan' },
    { id: 'inventory', title: 'Inventory', icon: Box, type: 'orange' },
    { id: 'units', title: 'Units & UOM', icon: Ruler, type: 'purple' },
    { id: 'taxes', title: 'Taxes', icon: Receipt, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ];

  return (
    <ModuleLayout title={isEdit ? `Edit: ${itemCode}` : "New Item"} showBack>
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
  booleanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light },
  booleanLabel: { fontSize: 12, fontWeight: '600', color: colors.text_secondary, textTransform: 'uppercase' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.blue_50, padding: 12, borderRadius: 12, marginVertical: 16, justifyContent: 'center' },
  addItemText: { color: colors.primary, fontWeight: 'bold' },
  itemCard: { backgroundColor: colors.background, padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border_light },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemLabel: { fontSize: 12, fontWeight: 'bold', color: colors.text_tertiary },
});
