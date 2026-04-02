import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import {
  Calendar,
  Save,
  FileText,
  Tag,
  Layers,
  Info,
  IndianRupee,
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles as detailStyles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Selector } from '../../../../core/components/Selector';
import { useDebounce } from '../../../../core/utils/debounce';
import {
  useItemPriceDetail,
  usePriceLists,
  useSaveItemPrice
} from '../../hooks/itemPriceQueries';
import { useItems } from '../../hooks/itemQueries';

// Optimized Input Component
const FormInput = memo(({ label, value, onChangeText, placeholder, icon: Icon, keyboardType = 'default', editable = true }: any) => (
  <View style={[detailStyles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[detailStyles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }]}>{label}</Text>
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

export function ItemPriceEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { priceId } = route.params || {};
  const isEdit = !!priceId;

  const [itemSearch, setItemSearch] = useState('');
  const debouncedItemSearch = useDebounce(itemSearch);

  const [formData, setFormData] = useState<any>({
    item_code: '',
    price_list: 'Standard Selling',
    price_list_rate: 0,
    currency: 'INR',
    valid_from: new Date().toISOString().split('T')[0],
    packing_unit: 1
  });

  // Data fetching with React Query hooks
  const { data: itemPrice, isLoading: loadingDetail } = useItemPriceDetail(priceId || '');
  const { data: priceLists, isLoading: loadingPriceLists } = usePriceLists();
  const { data: itemsRes, isLoading: loadingItems } = useItems(debouncedItemSearch);
  const saveMutation = useSaveItemPrice();

  const items = itemsRes?.data || [];

  useEffect(() => {
    if (isEdit && itemPrice) {
      setFormData(itemPrice);
    }
  }, [isEdit, itemPrice]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.item_code || !formData.price_list) {
      Alert.alert("Error", "Item and Price List are required");
      return;
    }

    try {
      await saveMutation.mutateAsync({ 
        data: formData, 
        id: priceId 
      });
      Alert.alert("Success", `Item Price ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Action failed";
      Alert.alert("Error", typeof msg === 'string' ? msg : "Action failed");
    }
  };

  if (isEdit && loadingDetail) {
    return (
      <ModuleLayout title="Edit Price" showBack>
        <View style={detailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={isEdit ? "Edit Item Price" : "New Item Price"} showBack>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={[detailStyles.sectionCard, detailStyles.blueCard, { width: '100%', marginBottom: spacing.xl }]}>
            <View style={detailStyles.cardTitleRow}>
              <FileText size={22} color={colors.blue_500} strokeWidth={2.5} />
              <Text style={[detailStyles.cardTitle, { color: colors.blue_500 }]}>Pricing Info</Text>
            </View>

            {/* Price Hero Input */}
            <View style={styles.priceHeroContainer}>
              <Text style={styles.priceHeroLabel}>Price List Rate</Text>
              <View style={styles.priceHeroInputRow}>
                <IndianRupee size={24} color={colors.primary} style={{ marginRight: 4 }} />
                <TextInput
                  style={styles.priceHeroInput}
                  value={String(formData.price_list_rate || '')}
                  onChangeText={(val) => handleChange('price_list_rate', val)}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.text_tertiary}
                />
              </View>
            </View>

            <Selector
              label="Item"
              options={items}
              value={formData.item_code}
              onChange={(val) => handleChange('item_code', val)}
              onSearch={setItemSearch}
              loading={loadingItems}
              icon={Tag}
              placeholder="Select Item"
              displayField="item_name"
              valueField="name"
            />

            <Selector
              label="Price List"
              options={priceLists || []}
              value={formData.price_list}
              onChange={(val) => handleChange('price_list', val)}
              loading={loadingPriceLists}
              icon={FileText}
              placeholder="Select Price List"
              displayField="name"
              valueField="name"
            />

            <FormInput 
              label="Currency" 
              value={formData.currency} 
              onChangeText={(val: string) => handleChange('currency', val)} 
              icon={Info} 
              placeholder="INR" 
            />
            
            <FormInput 
              label="Packing Unit" 
              value={formData.packing_unit} 
              onChangeText={(val: string) => handleChange('packing_unit', val)} 
              icon={Layers} 
              placeholder="1.0" 
              keyboardType="numeric" 
            />
            
            <FormInput 
              label="Valid From" 
              value={formData.valid_from} 
              onChangeText={(val: string) => handleChange('valid_from', val)} 
              icon={Calendar} 
              placeholder="YYYY-MM-DD" 
            />
            
            <FormInput 
              label="Valid Upto" 
              value={formData.valid_upto} 
              onChangeText={(val: string) => handleChange('valid_upto', val)} 
              icon={Calendar} 
              placeholder="YYYY-MM-DD" 
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={saveMutation.isPending}
              activeOpacity={0.8}
            >
              {saveMutation.isPending ? (
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
  priceHeroContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.blue_50,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.blue_100,
  },
  priceHeroLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  priceHeroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceHeroInput: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text_primary,
    padding: 0,
    textAlign: 'center',
  },
  saveBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: colors.primary, 
    marginTop: spacing.xl, 
    paddingVertical: 18, 
    borderRadius: borderRadius.xl, 
    ...shadow.medium 
  },
  saveBtnText: { 
    color: colors.white, 
    fontSize: 16, 
    fontWeight: 'bold' 
  }
});
