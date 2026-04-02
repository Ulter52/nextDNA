import React, { memo } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Trash2, Package, ShoppingCart, CreditCard, MapPin, Tag, Scan, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '@core/theme';
import { Selector } from '@core/components/Selector';
import { FormInput } from './FormInput';

export const ItemRow = memo(({ 
  item, 
  index, 
  onRemove, 
  onChange, 
  onOpenSerialModal, 
  itemsMetadata, 
  warehousesMetadata, 
  loadingItems,
  onItemSearch,
  hideSerialNo = false
}: any) => (
  <View style={formStyles.itemRow}>
    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.xs }}>
      <TouchableOpacity onPress={() => onRemove(index)}>
        <Trash2 size={16} color={colors.error} />
      </TouchableOpacity>
    </View>
    
    <Selector 
      label="Item" 
      options={itemsMetadata || []} 
      value={item.item_code} 
      onChange={(v: any) => onChange(index, 'item_code', v)} 
      onSearch={onItemSearch}
      loading={loadingItems} 
      displayField="item_name" 
      icon={Package} 
      placeholder="Select Item" 
    />

    <View style={{ flexDirection: 'row', gap: spacing.md }}>
      <View style={{ flex: 1 }}>
        <FormInput 
          label="Qty" 
          value={item.qty} 
          onChangeText={(v: string) => onChange(index, 'qty', v)} 
          icon={ShoppingCart} 
          keyboardType="numeric" 
        />
      </View>
      <View style={{ flex: 1 }}>
        <FormInput 
          label="Rate" 
          value={item.rate} 
          onChangeText={(v: string) => onChange(index, 'rate', v)} 
          icon={CreditCard} 
          keyboardType="numeric" 
        />
      </View>
    </View>

    <Selector 
      label="Warehouse"
      options={warehousesMetadata || []}
      value={item.warehouse}
      onChange={(v: any) => onChange(index, 'warehouse', v)}
      icon={MapPin}
      placeholder="Warehouse"
      displayField="warehouse_name"
    />

    {!hideSerialNo && (
      <TouchableOpacity 
        onPress={() => onOpenSerialModal(index)}
        style={formStyles.serialFieldTrigger}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Tag size={12} color={colors.text_tertiary} />
          <Text style={formStyles.serialFieldLabel}>SERIAL NUMBERS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={formStyles.serialCountText}>
            {item.serial_no ? item.serial_no.split('\n').filter(Boolean).length : 0} Added
          </Text>
          <Scan size={14} color={colors.primary} />
        </View>
      </TouchableOpacity>
    )}

    {item.use_serial_batch_fields === 1 && (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
        <CheckCircle2 size={12} color={colors.success} />
        <Text style={{ fontSize: 10, color: colors.success, fontWeight: 'bold' }}>{hideSerialNo ? 'Serialized Item (FIFO)' : 'Serialized Item'}</Text>
      </View>
    )}
  </View>
));

const formStyles = StyleSheet.create({
  itemRow: { 
    marginBottom: spacing.lg, 
    padding: spacing.md, 
    backgroundColor: colors.background, 
    borderRadius: borderRadius.lg, 
    borderWidth: 1, 
    borderColor: colors.border_light 
  },
  serialFieldTrigger: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border_light 
  },
  serialFieldLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: colors.text_tertiary, 
    letterSpacing: 0.5 
  },
  serialCountText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: colors.primary 
  },
});
