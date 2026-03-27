import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { 
  Package, Box, Tag, Activity, Layers, Barcode, Calendar, Weight,
  Truck, ShieldCheck, ToggleRight, ToggleLeft, Percent, ClipboardList,
  Receipt, Settings, Scale, Edit, Ruler
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useItemDetail } from '../../hooks/itemQueries';
import { styles } from './styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../../../core/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// MEMOIZED SUB-COMPONENTS
const BooleanField = React.memo(({ label, value }: { label: string, value: number | boolean }) => (
  <View style={styles.booleanRow}>
    <Text style={styles.booleanLabel}>{label}</Text>
    {value ? (
      <ToggleRight size={24} color={colors.success} />
    ) : (
      <ToggleLeft size={24} color={colors.text_tertiary} />
    )}
  </View>
));

const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || '—'}</Text>
  </View>
));

const InfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={styles.infoRow}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
      {Icon && <Icon size={14} color={colors.text_tertiary} />}
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={styles.infoValue} numberOfLines={2}>{value || '—'}</Text>
  </View>
));

export function ItemDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { itemCode } = route.params;
  
  // Use React Query for fetching and caching
  const { 
    data: item, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useItemDetail(itemCode);

  const handleEdit = useCallback(() => {
    navigation.navigate('ItemEdit', { itemCode });
  }, [navigation, itemCode]);

  const sections = useMemo(() => [
    { id: 'details', title: 'Details', icon: ClipboardList, type: 'blue' },
    { id: 'settings', title: 'Settings', icon: Settings, type: 'cyan' },
    { id: 'inventory', title: 'Inventory', icon: Box, type: 'orange' },
    { id: 'units', title: 'Units & UOM', icon: Ruler, type: 'purple' },
    { id: 'taxes', title: 'Taxes', icon: Receipt, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!item) return null;
    
    const SectionIcon = section.icon;
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
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'details' && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'details' && (
            <View>
              <VerticalInfoRow label="Item Name" value={item.item_name} icon={Package} />
              <VerticalInfoRow label="Item Code" value={item.name} icon={Barcode} />
              <VerticalInfoRow label="Brand" value={item.brand} icon={Tag} />
              <VerticalInfoRow label="Item Group" value={item.item_group} icon={Layers} />
              <VerticalInfoRow label="HSN/SAC" value={item.gst_hsn_code} icon={Barcode} />
              <VerticalInfoRow label="Max Discount %" value={item.max_discount ? `${item.max_discount}%` : '0%'} icon={Percent} />
              
              {item.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={[styles.infoLabel, { marginBottom: 4, color: titleColor, fontSize: 10, textTransform: 'uppercase' }]}>Description</Text>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              )}
            </View>
          )}

          {section.id === 'settings' && (
            <View>
              <BooleanField label="Disabled" value={item.disabled} />
              <BooleanField label="Maintain Stock" value={item.is_stock_item} />
              <BooleanField label="Has Variants" value={item.has_variants} />
              <BooleanField label="Allow Purchase" value={item.is_purchase_item} />
              <BooleanField label="Allow Sales" value={item.is_sales_item} />
              <BooleanField label="Grant Commission" value={item.grant_commission} />
            </View>
          )}

          {section.id === 'inventory' && (
            <View>
              <VerticalInfoRow label="Valuation Method" value={item.valuation_method || 'FIFO'} icon={Activity} />
              <VerticalInfoRow label="Valuation Rate" value={formatCurrency(item.valuation_rate || 0, 'INR')} icon={Tag} />
              
              <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                <Text style={[styles.cardTitle, { fontSize: 10, color: titleColor, letterSpacing: 2 }]}>Inventory Settings</Text>
              </View>

              <VerticalInfoRow label="Shelf Life (Days)" value={item.shelf_life_in_days || 0} icon={Calendar} />
              <VerticalInfoRow label="End of Life" value={item.end_of_life} icon={Calendar} />
              <VerticalInfoRow label="Material Req Type" value={item.default_material_request_type} icon={Truck} />
              <VerticalInfoRow label="Warranty Period" value={item.warranty_period ? `${item.warranty_period} Days` : 'N/A'} icon={ShieldCheck} />
              <VerticalInfoRow label="Weight per Unit" value={item.weight_per_unit ? `${item.weight_per_unit} ${item.weight_uom || ''}` : 'N/A'} icon={Weight} />
              
              <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border_light }}>
                <BooleanField label="Allow Negative Stock" value={item.allow_negative_stock} />
                <BooleanField label="Has Batch No" value={item.has_batch_no} />
                <BooleanField label="Has Serial No" value={item.has_serial_no} />
              </View>
            </View>
          )}

          {section.id === 'units' && (
            <View>
              <VerticalInfoRow label="Default UOM" value={item.stock_uom} icon={Box} />
              
              {item.uoms && item.uoms.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={[styles.infoLabel, { marginBottom: spacing.sm, color: titleColor, fontSize: 10, textTransform: 'uppercase', fontWeight: '900' }]}>Units of Measure</Text>
                  {item.uoms.map((u: any, i: number) => (
                    <InfoRow key={i} label={u.uom} value={`Conversion: ${u.conversion_factor}`} icon={Scale} />
                  ))}
                </View>
              )}
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              {item.taxes?.map((tax: any, idx: number) => (
                <View key={idx} style={styles.taxItem}>
                  <Text style={styles.taxTemplate}>{tax.item_tax_template}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <Text style={styles.taxDate}>Valid From: {tax.valid_from || 'N/A'}</Text>
                    <Percent size={14} color={titleColor} />
                  </View>
                </View>
              ))}
              {(!item.taxes || item.taxes.length === 0) && (
                <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
                   <Receipt size={32} color={colors.text_tertiary} />
                   <Text style={[styles.descriptionText, { marginTop: spacing.sm }]}>No taxes configured</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [item, handleEdit]);

  if (isLoading && !item) {
    return (
      <ModuleLayout title={itemCode} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={item?.item_name || itemCode} showBack>
      <View style={styles.container}>
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
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch} 
              tintColor={colors.primary} 
            />
          }
        />
      </View>
    </ModuleLayout>
  );
}
