import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Scan, Plus } from 'lucide-react-native';
import { colors, spacing } from '@core/theme';
import { ItemRow } from './ItemRow';

export const ItemsSection = memo(({ 
  items, 
  addItem, 
  removeItem, 
  handleItemChange, 
  onOpenSerialModal, 
  itemsMetadata, 
  warehousesMetadata, 
  loadingItems,
  onItemSearch,
  onOpenItemScanner,
  hideSerialNo = false
}: any) => {
  return (
    <View>
      <View style={formStyles.itemsHeader}>
        <Text style={formStyles.itemsCountLabel}>Items ({items.length})</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={formStyles.headerAction} 
            onPress={onOpenItemScanner}
          >
            <Scan size={18} color={colors.orange_600} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={formStyles.headerAction} 
            onPress={addItem}
          >
            <Plus size={18} color={colors.orange_600} />
          </TouchableOpacity>
        </View>
      </View>
      {items.map((item: any, idx: number) => (
        <ItemRow 
          key={idx} 
          index={idx} 
          item={item}
          onRemove={removeItem} 
          onChange={handleItemChange}
          onOpenSerialModal={onOpenSerialModal}
          itemsMetadata={itemsMetadata} 
          warehousesMetadata={warehousesMetadata} 
          loadingItems={loadingItems}
          onItemSearch={onItemSearch}
          hideSerialNo={hideSerialNo}
        />
      ))}
    </View>
  );
});

const formStyles = StyleSheet.create({
  itemsHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  itemsCountLabel: { 
    color: colors.orange_600, 
    fontSize: 10, 
    textTransform: 'uppercase', 
    fontWeight: '700' 
  },
  headerAction: { 
    backgroundColor: colors.orange_50, 
    padding: 8, 
    borderRadius: 8 
  },
});
