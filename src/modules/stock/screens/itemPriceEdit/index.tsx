import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { 
  Calendar, 
  Save,
  FileText,
  Tag,
  Layers,
  Info
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles as detailStyles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Selector } from '../../../../core/components/Selector';
import { metadataService } from '../../../../core/services/metadataService';
import { createResource, updateResource, fetchResource } from '../../../../core/api/frappeApiHelpers';

export function ItemPriceEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { priceId } = route.params || {};
  const isEdit = !!priceId;
  
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<any>({
    items: [],
    priceLists: []
  });

  const [formData, setFormData] = useState<any>({
    item_code: '',
    price_list: 'Standard Selling',
    price_list_rate: 0,
    currency: 'INR',
    valid_from: new Date().toISOString().split('T')[0]
  });

  const fetchData = useCallback(async () => {
    try {
      const [pLists, itemsRes] = await Promise.all([
        fetchResource('Price List', { fields: '["name"]' }),
        metadataService.getItems()
      ]);
      
      setMetadata({
        priceLists: pLists?.data || [],
        items: itemsRes?.data || []
      });

      if (isEdit) {
        const res = await fetchResource(`Item Price/${priceId}`);
        if (res.data) setFormData(res.data);
      }
    } catch (err) {
      console.error("Fetch data failed", err);
    } finally {
      setLoading(false);
    }
  }, [priceId, isEdit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!formData.item_code || !formData.price_list) {
       Alert.alert("Error", "Item and Price List are required");
       return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateResource('Item Price', priceId, formData);
        Alert.alert("Success", "Item Price updated successfully");
      } else {
        await createResource('Item Price', formData);
        Alert.alert("Success", "Item Price created successfully");
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const InputField = ({ label, name, placeholder, icon: Icon, keyboardType = 'default' }: any) => {
    return (
      <View style={detailStyles.infoRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          {Icon && <Icon size={14} color={colors.text_tertiary} />}
          <Text style={detailStyles.infoLabel}>{label}</Text>
        </View>
        <TextInput
          style={[detailStyles.infoValue, { textAlign: 'right', paddingVertical: 4 }]}
          value={String(formData[name] ?? '')}
          onChangeText={(val) => setFormData({...formData, [name]: val})}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor={colors.text_tertiary}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <ModuleLayout title={isEdit ? "Edit Price" : "New Price"} showBack>
        <View style={detailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={isEdit ? "Edit Item Price" : "New Item Price"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={[detailStyles.sectionCard, detailStyles.blueCard, { width: '100%' }]}>
            <View style={detailStyles.cardTitleRow}>
              <FileText size={22} color={colors.blue_500} strokeWidth={2.5} />
              <Text style={[detailStyles.cardTitle, { color: colors.blue_500 }]}>Pricing Info</Text>
            </View>

            <View style={{ marginBottom: spacing.lg, alignItems: 'center', padding: spacing.md, backgroundColor: colors.blue_50, borderRadius: borderRadius.lg }}>
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>Price List Rate</Text>
              <TextInput
                style={{ fontSize: 32, fontWeight: 'bold', color: colors.text_primary, padding: 0 }}
                value={String(formData.price_list_rate || '')}
                onChangeText={(val) => setFormData({...formData, price_list_rate: val})}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>

            <Selector 
              label="Price List" 
              options={metadata.priceLists} 
              value={formData.price_list} 
              onChange={(val) => setFormData({...formData, price_list: val})} 
              icon={FileText}
              placeholder="Select Price List"
              displayField="name"
              valueField="name"
            />

            <Selector 
              label="Item" 
              options={metadata.items} 
              value={formData.item_code} 
              onChange={(val) => setFormData({...formData, item_code: val})} 
              onSearch={(q) => metadataService.getItems(q).then(res => setMetadata({...metadata, items: res.data}))}
              icon={Tag}
              placeholder="Select Item"
              displayField="item_name"
              valueField="name"
            />

            <InputField label="Currency" name="currency" icon={Info} placeholder="INR" />
            <InputField label="Packing Unit" name="packing_unit" icon={Layers} placeholder="1.0" keyboardType="numeric" />
            <InputField label="Valid From" name="valid_from" icon={Calendar} placeholder="YYYY-MM-DD" />
            <InputField label="Valid Upto" name="valid_upto" icon={Calendar} placeholder="YYYY-MM-DD" />

            <TouchableOpacity 
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Save size={20} color={colors.white} />
                  <Text style={styles.saveBtnText}>{isEdit ? 'Update Price' : 'Create Price'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: colors.primary, 
    marginTop: spacing.xl, 
    paddingVertical: 16, 
    borderRadius: borderRadius.lg, 
    ...shadow.medium 
  },
  saveBtnText: { 
    color: colors.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
