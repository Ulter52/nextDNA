import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, Dimensions, TextInput, Switch, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Package, Box, Tag, Activity, Layers, Barcode, Calendar, Weight,
  Truck, ShieldCheck, Percent, ClipboardList, Receipt, Settings,
  Scale, Save, Plus, Trash2, CheckCircle2, Bookmark, Ruler
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { stockApi } from '../../services/stockApi';
import { styles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Selector } from '../../../../core/components/Selector';
import { useDebounce } from '../../../../core/utils/debounce';
import { 
  useBrands, useItemGroups, useUOMs, 
  useHSNCodes, useTaxTemplates, useItemDetail 
} from '../../hooks/itemQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Optimized Input Component to prevent re-renders
const FormInput = memo(({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default', editable = true }: any) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }]}>{label}</Text>
    </View>
    <TextInput
      style={{ fontSize: 14, color: colors.text_primary, fontWeight: '600', padding: 0, width: '100%' }}
      value={String(value ?? '')}
      onChangeText={onChangeText}
      placeholder={placeholder}
      keyboardType={keyboardType}
      placeholderTextColor={colors.text_tertiary}
      editable={editable}
      autoCorrect={false}
      spellCheck={false}
    />
  </View>
));

export function ItemEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { itemCode } = route.params || {};
  const isEdit = !!itemCode;
  
  const [submitting, setSubmitting] = useState(false);
  
  // Search States for Selectors
  const [brandSearch, setBrandSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [uomSearch, setUomSearch] = useState('');
  const [hsnSearch, setHsnSearch] = useState('');
  const [taxSearch, setTaxSearch] = useState('');

  // Debounced Search Values
  const debouncedBrandSearch = useDebounce(brandSearch);
  const debouncedGroupSearch = useDebounce(groupSearch);
  const debouncedUomSearch = useDebounce(uomSearch);
  const debouncedHsnSearch = useDebounce(hsnSearch);
  const debouncedTaxSearch = useDebounce(taxSearch);

  const [formData, setFormData] = useState<any>({
    item_code: '',
    item_name: '',
    item_group: 'All Item Groups',
    stock_uom: 'Nos',
    brand: '',
    gst_hsn_code: '',
    description: '',
    is_stock_item: 1,
    has_variants: 0,
    disabled: 0,
    is_purchase_item: 1,
    is_sales_item: 1,
    grant_commission: 1,
    max_discount: 0,
    valuation_method: 'FIFO',
    valuation_rate: 0,
    shelf_life_in_days: 0,
    end_of_life: '',
    default_material_request_type: 'Purchase',
    warranty_period: 0,
    weight_per_unit: 0,
    weight_uom: '',
    allow_negative_stock: 0,
    has_batch_no: 0,
    has_serial_no: 0,
    uoms: [],
    taxes: []
  });

  // Fetch Metadata with React Query (Using debounced search)
  const { data: brands, isLoading: loadingBrands } = useBrands(debouncedBrandSearch);
  const { data: itemGroups, isLoading: loadingGroups } = useItemGroups(debouncedGroupSearch);
  const { data: uoms, isLoading: loadingUoms } = useUOMs(debouncedUomSearch);
  const { data: hsnCodes, isLoading: loadingHsn } = useHSNCodes(debouncedHsnSearch);
  const { data: taxTemplates, isLoading: loadingTaxes } = useTaxTemplates(debouncedTaxSearch);

  // Fetch Item Data if editing
  const { data: itemDetail, isLoading: loading } = useItemDetail(itemCode);

  useEffect(() => {
    if (isEdit && itemDetail) {
      setFormData(itemDetail);
    }
  }, [isEdit, itemDetail]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleArrayChange = useCallback((tableName: string, index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updatedArray = [...(prev[tableName] || [])];
      updatedArray[index] = { ...updatedArray[index], [field]: value };
      return { ...prev, [tableName]: updatedArray };
    });
  }, []);

  const addRow = useCallback((tableName: string, defaultValue: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [tableName]: [...(prev[tableName] || []), defaultValue]
    }));
  }, []);

  const removeRow = useCallback((tableName: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [tableName]: (prev[tableName] || []).filter((_: any, i: number) => i !== index)
    }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.item_code && !formData.name && !isEdit) {
       Alert.alert("Error", "Item Code is required");
       return;
    }
    if (!formData.item_name) {
      Alert.alert("Error", "Item Name is required");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await stockApi.updateItem(itemCode, formData);
        Alert.alert("Success", "Item updated successfully");
      } else {
        await stockApi.createItem(formData);
        Alert.alert("Success", "Item created successfully");
      }
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save item";
      Alert.alert("Error", typeof msg === 'string' ? msg : "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const sections = useMemo(() => [
    { id: 'details', title: 'Details', icon: ClipboardList, type: 'blue' },
    { id: 'settings', title: 'Settings', icon: Settings, type: 'cyan' },
    { id: 'inventory', title: 'Inventory', icon: Box, type: 'orange' },
    { id: 'units', title: 'Units & UOM', icon: Ruler, type: 'purple' },
    { id: 'taxes', title: 'Taxes', icon: Receipt, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ], []);

  const renderSection = ({ item: section }: { item: any }) => {
    const Icon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'cyan' && styles.cyanCard,
      section.type === 'green' && styles.greenCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'purple' && styles.purpleCard,
    ];

    const titleColor = colors[
      section.type === 'blue' ? 'blue_500' : 
      section.type === 'cyan' ? 'teal_500' : 
      section.type === 'green' ? 'green_500' : 
      section.type === 'orange' ? 'orange_500' : 'purple_500'
    ];

    return (
      <View style={cardStyle}>
        <View style={styles.cardTitleRow}>
          <Icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'details' && (
            <View>
              <FormInput 
                label="Item Name" 
                value={formData.item_name} 
                onChangeText={(val: string) => handleChange('item_name', val)} 
                icon={Package} 
                placeholder="Required" 
              />
              <FormInput 
                label="Item Code" 
                value={isEdit ? formData.name : formData.item_code} 
                onChangeText={(val: string) => handleChange(isEdit ? 'name' : 'item_code', val)} 
                icon={Barcode} 
                placeholder="Required" 
                editable={!isEdit}
              />
              
              <Selector 
                label="Brand" 
                options={brands || []} 
                value={formData.brand} 
                onChange={(val) => handleChange('brand', val)} 
                onSearch={setBrandSearch}
                loading={loadingBrands}
                icon={Bookmark}
                placeholder="Select Brand"
              />

              <Selector 
                label="Item Group" 
                options={itemGroups || []} 
                value={formData.item_group} 
                onChange={(val) => handleChange('item_group', val)} 
                onSearch={setGroupSearch}
                loading={loadingGroups}
                icon={Layers}
                placeholder="Select Item Group"
              />

              <Selector 
                label="HSN/SAC" 
                options={hsnCodes || []} 
                value={formData.gst_hsn_code} 
                onChange={(val) => handleChange('gst_hsn_code', val)} 
                onSearch={setHsnSearch}
                loading={loadingHsn}
                icon={Barcode}
                placeholder="Select HSN/SAC"
              />

              <FormInput label="Max Discount %" value={formData.max_discount} onChangeText={(val: string) => handleChange('max_discount', val)} icon={Percent} keyboardType="numeric" />
              
              <View style={[styles.descriptionContainer, { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border_light, marginTop: spacing.md }]}>
                <Text style={[styles.infoLabel, { marginBottom: 4, color: titleColor, fontSize: 10, textTransform: 'uppercase' }]}>Description</Text>
                <TextInput
                  style={[styles.descriptionText, { textAlignVertical: 'top', minHeight: 80, fontSize: 14, color: colors.text_primary, padding: 0 }]}
                  value={formData.description}
                  onChangeText={(val) => handleChange('description', val)}
                  placeholder="Enter description..."
                  multiline
                  placeholderTextColor={colors.text_tertiary}
                  autoCorrect={false}
                />
              </View>
            </View>
          )}

          {section.id === 'settings' && (
            <View>
              <BooleanField label="Disabled" value={formData.disabled} onChange={(val) => handleChange('disabled', val)} />
              <BooleanField label="Maintain Stock" value={formData.is_stock_item} onChange={(val) => handleChange('is_stock_item', val)} />
              <BooleanField label="Has Variants" value={formData.has_variants} onChange={(val) => handleChange('has_variants', val)} />
              <BooleanField label="Allow Purchase" value={formData.is_purchase_item} onChange={(val) => handleChange('is_purchase_item', val)} />
              <BooleanField label="Allow Sales" value={formData.is_sales_item} onChange={(val) => handleChange('is_sales_item', val)} />
              <BooleanField label="Grant Commission" value={formData.grant_commission} onChange={(val) => handleChange('grant_commission', val)} />
            </View>
          )}

          {section.id === 'inventory' && (
            <View>
              <FormInput label="Valuation Method" value={formData.valuation_method} onChangeText={(val: string) => handleChange('valuation_method', val)} icon={Activity} />
              <FormInput label="Valuation Rate" value={formData.valuation_rate} onChangeText={(val: string) => handleChange('valuation_rate', val)} icon={Tag} keyboardType="numeric" />
              
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                <Text style={[styles.cardTitle, { fontSize: 10, color: titleColor, letterSpacing: 2 }]}>Inventory Settings</Text>
              </View>

              <FormInput label="Shelf Life (Days)" value={formData.shelf_life_in_days} onChangeText={(val: string) => handleChange('shelf_life_in_days', val)} icon={Calendar} keyboardType="numeric" />
              <FormInput label="End of Life" value={formData.end_of_life} onChangeText={(val: string) => handleChange('end_of_life', val)} icon={Calendar} placeholder="YYYY-MM-DD" />
              <FormInput label="Material Req Type" value={formData.default_material_request_type} onChangeText={(val: string) => handleChange('default_material_request_type', val)} icon={Truck} />
              <FormInput label="Warranty Period" value={formData.warranty_period} onChangeText={(val: string) => handleChange('warranty_period', val)} icon={ShieldCheck} keyboardType="numeric" />
              <FormInput label="Weight per Unit" value={formData.weight_per_unit} onChangeText={(val: string) => handleChange('weight_per_unit', val)} icon={Weight} keyboardType="numeric" />
              
              <Selector 
                label="Weight UOM"
                options={uoms || []}
                value={formData.weight_uom}
                onChange={(val) => handleChange('weight_uom', val)}
                onSearch={setUomSearch}
                loading={loadingUoms}
                icon={Scale}
                placeholder="Select UOM"
              />
              
              <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border_light }}>
                <BooleanField label="Allow Negative Stock" value={formData.allow_negative_stock} onChange={(val) => handleChange('allow_negative_stock', val)} />
                <BooleanField label="Has Batch No" value={formData.has_batch_no} onChange={(val) => handleChange('has_batch_no', val)} />
                <BooleanField label="Has Serial No" value={formData.has_serial_no} onChange={(val) => handleChange('has_serial_no', val)} />
              </View>
            </View>
          )}

          {section.id === 'units' && (
            <View>
              <Selector 
                label="Default UOM" 
                options={uoms || []} 
                value={formData.stock_uom} 
                onChange={(val) => handleChange('stock_uom', val)} 
                onSearch={setUomSearch}
                loading={loadingUoms}
                icon={Box}
                placeholder="Select UOM"
              />

              <View style={{ marginTop: spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                  <Text style={[styles.infoLabel, { color: titleColor, fontSize: 10, textTransform: 'uppercase', fontWeight: '900' }]}>Units of Measure</Text>
                  <TouchableOpacity onPress={() => addRow('uoms', { uom: '', conversion_factor: 1 })}>
                    <Plus size={16} color={titleColor} />
                  </TouchableOpacity>
                </View>
                {formData.uoms?.map((u: any, i: number) => (
                  <View key={i} style={{ marginBottom: spacing.sm, padding: spacing.md, backgroundColor: colors.blue_50, borderRadius: borderRadius.lg }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
                      <TouchableOpacity onPress={() => removeRow('uoms', i)}>
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    <Selector 
                      placeholder="Select UOM"
                      options={uoms || []}
                      value={u.uom}
                      onChange={(val) => handleArrayChange('uoms', i, 'uom', val)}
                      onSearch={setUomSearch}
                      loading={loadingUoms}
                      icon={Scale}
                    />
                    <FormInput label="Conv Factor" value={u.conversion_factor} onChangeText={(val: string) => handleArrayChange('uoms', i, 'conversion_factor', val)} keyboardType="numeric" />
                  </View>
                ))}
              </View>
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={[styles.infoLabel, { color: colors.green_600, fontSize: 10, textTransform: 'uppercase', fontWeight: '900' }]}>Item Taxes</Text>
                <TouchableOpacity onPress={() => addRow('taxes', { item_tax_template: '', valid_from: '' })}>
                  <Plus size={16} color={colors.green_600} />
                </TouchableOpacity>
              </View>
              {formData.taxes?.map((tax: any, idx: number) => (
                <View key={idx} style={[styles.taxItem, { backgroundColor: colors.green_100, borderColor: colors.green_200 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
                    <TouchableOpacity onPress={() => removeRow('taxes', idx)}>
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                  
                  <Selector 
                    label="Tax Template"
                    options={taxTemplates || []}
                    value={tax.item_tax_template}
                    onChange={(val) => handleArrayChange('taxes', idx, 'item_tax_template', val)}
                    onSearch={setTaxSearch}
                    loading={loadingTaxes}
                    icon={Percent}
                    placeholder="Select Template"
                    displayField="title"
                  />

                  <FormInput label="Valid From" value={tax.valid_from} onChangeText={(val: string) => handleArrayChange('taxes', idx, 'valid_from', val)} placeholder="YYYY-MM-DD" icon={Calendar} />
                </View>
              ))}
            </View>
          )}

          {section.id === 'save' && (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxl }}>
              <View style={{ backgroundColor: colors.blue_50, padding: spacing.xl, borderRadius: borderRadius.xxl, alignItems: 'center', width: '100%' }}>
                <CheckCircle2 size={48} color={colors.primary} style={{ marginBottom: spacing.md }} />
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text_primary, textAlign: 'center', marginBottom: spacing.sm }}>Ready to Save?</Text>
                <Text style={{ fontSize: 12, color: colors.text_secondary, textAlign: 'center', marginBottom: spacing.xl }}>Review your changes across the cards before submitting to ERPNext.</Text>
                
                <TouchableOpacity 
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 8, 
                    backgroundColor: colors.primary, 
                    paddingHorizontal: 32, 
                    paddingVertical: 16, 
                    borderRadius: 30,
                    width: '100%',
                    ...shadow.medium
                  }}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Save size={20} color={colors.white} />
                      <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>{isEdit ? 'Update Item' : 'Create Item'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <ModuleLayout title={isEdit ? `Edit: ${itemCode}` : "New Item"} showBack>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={sections}
              renderItem={renderSection}
              keyExtractor={(s) => s.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              decelerationRate="fast"
              snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2}
              contentContainerStyle={styles.horizontalList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}

const BooleanField = memo(({ label, value, onChange }: any) => (
  <View style={styles.booleanRow}>
    <Text style={styles.booleanLabel}>{label}</Text>
    <Switch
      value={!!value}
      onValueChange={(val) => onChange(val ? 1 : 0)}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
));
