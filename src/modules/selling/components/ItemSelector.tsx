import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  FlatList,
  Modal,
  Dimensions
} from 'react-native';
import { Package, ChevronDown, Search, X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ItemSelectorProps {
  items: any[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ItemSelector({ items, value, onChange, disabled }: ItemSelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedItem = items.find(i => i.name === value);
  const filteredItems = items.filter(i => 
    (i.item_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (i.item_code || '').toLowerCase().includes(search.toLowerCase())
  );

  if (disabled) {
    return (
      <View style={[styles.selector, styles.disabledSelector]}>
        <Package style={styles.icon} size={18} color="#9ca3af" />
        <Text style={[styles.valueText, { color: '#6b7280' }]}>
          {selectedItem ? (selectedItem.item_name || selectedItem.item_code) : "No Item Selected"}
        </Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={styles.selector}
        activeOpacity={0.7}
      >
        <Package style={styles.icon} size={18} color="#9ca3af" />
        <Text style={[styles.valueText, !selectedItem && styles.placeholderText]}>
          {selectedItem ? (selectedItem.item_name || selectedItem.item_code) : "Select Item"}
        </Text>
        <ChevronDown style={styles.chevron} size={16} color="#9ca3af" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Item</Text>
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <X size={24} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Search size={18} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                placeholder="Search items..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
                autoFocus
              />
              {search !== '' && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={18} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.name}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onChange(item.name);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  style={styles.itemOption}
                >
                  <Text style={styles.optionName}>{item.item_name || item.item_code}</Text>
                  <Text style={styles.optionCode}>{item.item_code}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No items found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  disabledSelector: {
    backgroundColor: '#f9fafb',
    opacity: 0.8,
  },
  icon: {
    position: 'absolute',
    left: 16,
  },
  chevron: {
    position: 'absolute',
    right: 16,
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: SCREEN_HEIGHT * 0.8,
    paddingBottom: 40,
  },
  modalHeader: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  searchBox: {
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  itemOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  optionName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  optionCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
});
