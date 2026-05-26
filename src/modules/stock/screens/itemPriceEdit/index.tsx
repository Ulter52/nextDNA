import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet, Dimensions } from 'react-native';
import { Calendar, Save, FileText, Tag, Layers, Info, IndianRupee, CheckCircle2 } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { styles as detailStyles } from '../itemDetail/styles';
import { Selector } from '../../../../core/components/Selector';
import { FormInput } from '../../../../core/components/FormInput';
import { SaveSection } from '../../../../core/components/SaveSection';

import { useItemPriceDetail, usePriceLists, useSaveItemPrice } from '../../hooks/itemPriceQueries';
import { useSellingItems } from '../../../selling/hooks/sellingQueries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. Zod Schema
const itemPriceSchema = z.object({
  item_code: z.string().min(1, 'Required'),
  price_list: z.string().min(1, 'Required'),
  price_list_rate: z.coerce.number().min(0),
  currency: z.string().default('INR'),
  valid_from: z.string(),
  valid_upto: z.string().optional(),
  packing_unit: z.coerce.number().default(1),
});

type ItemPriceFormValues = z.infer<typeof itemPriceSchema>;

/**
 * Sub-components to keep Main Screen clean
 */
const DateSection = ({ watch, setValue }: { watch: any, setValue: any }) => {
  const [showPicker, setShowPicker] = useState<'valid_from' | 'valid_upto' | null>(null);

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

  const validFrom = watch('valid_from');
  const validUpto = watch('valid_upto');

  const getPickerDate = () => {
    const dateStr = showPicker ? watch(showPicker) : null;
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowPicker('valid_from')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Valid From" value={validFrom} editable={false} icon={Calendar} />
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setShowPicker('valid_upto')} activeOpacity={0.7}>
        <View pointerEvents="none">
          <FormInput label="Valid Upto" value={validUpto} editable={false} icon={Calendar} />
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

export function ItemPriceEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { priceId } = route.params || {};
  const isEdit = !!priceId;

  const [itemSearch, setItemSearch] = useState('');
  const [priceListSearch, setPriceListSearch] = useState('');

  const { control, handleSubmit, watch, setValue, reset } = useForm<ItemPriceFormValues>({
    resolver: zodResolver(itemPriceSchema),
    defaultValues: {
      item_code: '',
      price_list: 'Standard Selling',
      price_list_rate: 0,
      currency: 'INR',
      valid_from: new Date().toISOString().split('T')[0],
      packing_unit: 1
    }
  });

  // Queries
  const { data: itemPrice, isLoading: loadingDetail } = useItemPriceDetail(priceId || '');
  
  const { 
    data: itemsRes, 
    fetchNextPage: fetchNextItems, 
    hasNextPage: hasNextItems, 
    isFetchingNextPage: isFetchingItems 
  } = useSellingItems(itemSearch);

  const { 
    data: priceListsRes, 
    fetchNextPage: fetchNextPriceLists, 
    hasNextPage: hasNextPriceLists, 
    isFetchingNextPage: isFetchingPriceLists 
  } = usePriceLists(priceListSearch);

  const saveMutation = useSaveItemPrice();

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

  const items = useMemo(() => flattenPages(itemsRes), [itemsRes]);
  const priceLists = useMemo(() => flattenPages(priceListsRes), [priceListsRes]);

  useEffect(() => {
    if (isEdit && itemPrice) {
      reset(itemPrice);
    }
  }, [isEdit, itemPrice, reset]);

  const onSubmit = async (data: ItemPriceFormValues) => {
    try {
      await saveMutation.mutateAsync({ data, id: priceId });
      Alert.alert("Success", `Item Price ${isEdit ? 'updated' : 'created'} successfully`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save item price");
    }
  };

  if (isEdit && loadingDetail) {
    return (
      <ModuleLayout title="Loading..." showBack>
        <View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={isEdit ? "Edit Item Price" : "New Item Price"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
          <View style={[detailStyles.sectionCard, detailStyles.blueCard, { width: '100%', marginBottom: spacing.xl }]}>
            <View style={detailStyles.cardTitleRow}>
              <FileText size={22} color={colors.blue_500} strokeWidth={2.5} />
              <Text style={[detailStyles.cardTitle, { color: colors.blue_500 }]}>Pricing Info</Text>
            </View>

            <View style={styles.priceHeroContainer}>
              <Text style={styles.priceHeroLabel}>Price List Rate</Text>
              <View style={styles.priceHeroInputRow}>
                <IndianRupee size={24} color={colors.primary} style={{ marginRight: 4 }} />
                <Controller 
                  control={control} 
                  name="price_list_rate" 
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.priceHeroInput}
                      value={String(value || '')}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={colors.text_tertiary}
                    />
                  )} 
                />
              </View>
            </View>

            <Controller 
              control={control} 
              name="item_code" 
              render={({ field: { onChange, value } }) => (
                <Selector
                  label="Item"
                  options={items}
                  value={value}
                  onChange={onChange}
                  onSearch={setItemSearch}
                  onEndReached={() => hasNextItems && fetchNextItems()}
                  loadingNextPage={isFetchingItems}
                  icon={Tag}
                  placeholder="Select Item"
                  displayField="item_name"
                />
              )} 
            />

            <Controller 
              control={control} 
              name="price_list" 
              render={({ field: { onChange, value } }) => (
                <Selector
                  label="Price List"
                  options={priceLists}
                  value={value}
                  onChange={onChange}
                  onSearch={setPriceListSearch}
                  onEndReached={() => hasNextPriceLists && fetchNextPriceLists()}
                  loadingNextPage={isFetchingPriceLists}
                  icon={FileText}
                  placeholder="Select Price List"
                />
              )} 
            />

            <Controller 
              control={control} 
              name="currency" 
              render={({ field: { onChange, value } }) => (
                <FormInput label="Currency" value={value} onChangeText={onChange} icon={Info} placeholder="INR" />
              )} 
            />
            
            <Controller 
              control={control} 
              name="packing_unit" 
              render={({ field: { onChange, value } }) => (
                <FormInput label="Packing Unit" value={String(value)} onChangeText={onChange} icon={Layers} placeholder="1.0" keyboardType="numeric" />
              )} 
            />
            
            <DateSection watch={watch} setValue={setValue} />

            <SaveSection 
              isEdit={isEdit} 
              isPending={saveMutation.isPending} 
              handleSubmit={handleSubmit(onSubmit)} 
              title={isEdit ? "Update Price?" : "Save Price?"} 
            />
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
    minWidth: 100
  }
});
