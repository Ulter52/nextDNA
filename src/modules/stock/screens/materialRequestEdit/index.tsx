import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, ScrollView, Dimensions, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { 
  Package, Box, Activity, Calendar, Save, Plus, Trash2, 
  CheckCircle2, ShoppingCart, MapPin, FileText, Ruler
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles as detailStyles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Selector } from '../../../../core/components/Selector';
import { useDebounce } from '../../../../core/utils/debounce';
import {
  useMaterialRequestDetail,
  useSaveMaterialRequest
} from '../../hooks/materialRequestQueries';
import { useItems, useWarehouses } from '../../hooks/itemQueries';
import { companyService } from '../../../../core/services/companyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MATERIAL_REQUEST_TYPES = [
  { name: 'Purchase', value: 'Purchase' },
  { name: 'Material Transfer', value: 'Material Transfer' },
  { name: 'Material Issue', value: 'Material Issue' },
  { name: 'Manufacture', value: 'Manufacture' },
  { name: 'Customer Provided', value: 'Customer Provided' },
];

// MEMOIZED SUB-COMPONENTS
const FormInput = memo(({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default', editable = true }: any) => (
  <View style={[detailStyles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[detailStyles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
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
    />
  </View>
));

export function MaterialRequestEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { requestId } = route.params || {};
  const isEdit = !!requestId;

  // Search States for Selectors
  const [itemSearch, setItemSearch] = useState('');
  const [whSearch, setWarehouseSearch] = useState('');
  const [company, setCompany] = useState('');

  const debouncedItemSearch = useDebounce(itemSearch || '');
  const debouncedWhSearch = useDebounce(whSearch || '');

  const [formData, setFormData] = useState<any>({
    material_request_type: 'Purchase',
    transaction_date: new Date().toISOString().split('T')[0],
    schedule_date: new Date().toISOString().split('T')[0],
    set_warehouse: '',
    items: []
  });

  // React Queries
  const { data: requestDetail, isLoading: loadingDetail } = useMaterialRequestDetail(requestId);
  const { data: items, isLoading: loadingItems } = useItems(debouncedItemSearch);
  const { data: warehouses, isLoading: loadingWh } = useWarehouses(company, debouncedWhSearch);
  const saveMutation = useSaveMaterialRequest();

  useEffect(() => {
    companyService.getSelectedCompany().then(c => setCompany(c?.name || ''));
  }, []);

  useEffect(() => {
    if (isEdit && requestDetail) setFormData(requestDetail);
  }, [isEdit, requestDetail]);

  const typeOptions = useMemo(() => MATERIAL_REQUEST_TYPES, []);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleItemChange = useCallback((index: number, field: string, value: any) => {
    setFormData((prev: any) => {
      const updatedItems = [...prev.items];
      const currentItem = updatedItems[index];

      if (field === 'item_code') {
        const selected = items?.data?.find((i: any) => i.name === value);
        updatedItems[index] = {
          ...currentItem,
          [field]: value,
          uom: selected?.stock_uom || currentItem.uom,
          qty: currentItem.qty || 1
        };
      } else {
        updatedItems[index] = { ...currentItem, [field]: value };
      }
      return { ...prev, items: updatedItems };
    });
  }, [items]);

  const addItem = useCallback(() => {
    setFormData((prev: any) => ({
      ...prev,
      items: [...prev.items, { item_code: '', qty: 1, uom: '', schedule_date: prev.schedule_date }]
    }));
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (formData.items.length === 0) {
      Alert.alert("Error", "At least one item is required");
      return;
    }

    try {
      const payload = { ...formData, company, docstatus: 0 };
      const result = await saveMutation.mutateAsync({ data: payload, id: requestId });

      const docName = result?.data?.name || requestId;

      Alert.alert("Success", isEdit ? "Request updated" : "Request created as Draft");

      if (isEdit) {
        navigation.goBack();
      } else {
        navigation.replace('MaterialRequestDetail', { requestId: docName });
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Action failed");
    }
  }, [formData, company, requestId, isEdit, saveMutation, navigation]);

  const sections = useMemo(() => [
    { id: 'details', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items', icon: Package, type: 'orange' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : 'green_500'];

    return (
      <View style={[detailStyles.sectionCard, detailStyles[`${section.type}Card` as keyof typeof detailStyles]]}>
        <View style={detailStyles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'details' && (
            <View>
              <Selector label="Type" options={typeOptions} value={formData.material_request_type} onChange={(val) => handleChange('material_request_type', val)} icon={Activity} />
              <FormInput label="Date" value={formData.transaction_date} onChangeText={(v: string) => handleChange('transaction_date', v)} icon={Calendar} placeholder="YYYY-MM-DD" />
              <FormInput label="Required By" value={formData.schedule_date} onChangeText={(v: string) => handleChange('schedule_date', v)} icon={Calendar} placeholder="YYYY-MM-DD" />
              <Selector label="Target Warehouse" options={warehouses || []} value={formData.set_warehouse} onChange={(v) => handleChange('set_warehouse', v)} onSearch={setWarehouseSearch} loading={loadingWh} displayField="warehouse_name" icon={MapPin} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={[detailStyles.infoLabel, { color: colors.orange_600, fontSize: 10 }]}>ITEMS ({formData.items.length})</Text>
                <TouchableOpacity onPress={addItem}><Plus size={20} color={colors.orange_600} /></TouchableOpacity>
              </View>

              {formData.items.map((item: any, idx: number) => (
                <View key={idx} style={formStyles.itemRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity onPress={() => removeItem(idx)}><Trash2 size={16} color={colors.error} /></TouchableOpacity>
                  </View>
                  <Selector label="Item" options={items?.data || []} value={item.item_code} onChange={(v) => handleItemChange(idx, 'item_code', v)} onSearch={setItemSearch} loading={loadingItems} displayField="item_name" icon={Package} />
                  <View style={{ flexDirection: 'row', gap: spacing.md }}>
                    <View style={{ flex: 1 }}><FormInput label="Qty" value={item.qty} onChangeText={(v: string) => handleItemChange(idx, 'qty', v)} icon={ShoppingCart} keyboardType="numeric" /></View>
                    <View style={{ flex: 1 }}><FormInput label="UOM" value={item.uom} onChangeText={(v: string) => handleItemChange(idx, 'uom', v)} icon={Ruler} /></View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'save' && (
            <View style={formStyles.saveWrapper}>
              <CheckCircle2 size={48} color={colors.success} style={{ marginBottom: spacing.md }} />
              <Text style={formStyles.saveTitle}>Ready to {isEdit ? 'Update' : 'Save'}?</Text>
              <Text style={formStyles.saveText}>Document will be saved as a Draft. You can submit it after review.</Text>
              <TouchableOpacity style={formStyles.saveBtn} onPress={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <ActivityIndicator color={colors.white} /> : <><Save size={20} color={colors.white} /><Text style={formStyles.saveBtnText}>{isEdit ? 'Update Draft' : 'Save as Draft'}</Text></>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [formData, typeOptions, warehouses, loadingWh, items, loadingItems, addItem, removeItem, handleItemChange, handleChange, isEdit, saveMutation.isPending, handleSubmit]);

  if (loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit Request` : "New Material Request"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={detailStyles.container}>
          <FlatList data={sections} renderItem={renderSection} keyExtractor={(s) => s.id} horizontal showsHorizontalScrollIndicator={false} snapToAlignment="start" decelerationRate="fast" snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} contentContainerStyle={detailStyles.horizontalList} keyboardShouldPersistTaps="handled" />
        </View>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}

const formStyles = StyleSheet.create({
  itemRow: { marginBottom: spacing.lg, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light },
  saveWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.xl },
  saveTitle: { fontSize: 18, fontWeight: '900', color: colors.text_primary, marginBottom: spacing.xs },
  saveText: { fontSize: 13, color: colors.text_secondary, textAlign: 'center', marginBottom: spacing.xxl, lineHeight: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, width: '100%', ...shadow.medium },
  saveBtnText: { color: colors.white, fontSize: 16, fontWeight: 'bold' }
});
