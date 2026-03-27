import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, X, LucideIcon } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelectorProps {
  options: any[];
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  label?: string;
  icon: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  searchPlaceholder?: string;
  displayField?: string;
  valueField?: string;
}

export function Selector({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Select...",
  label,
  icon: Icon,
  loading = false,
  disabled = false,
  searchPlaceholder = "Search...",
  displayField = "name",
  valueField = "name"
}: SelectorProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const lastSearchRef = useRef<string | null>(null);

  // Local filtering if no remote search provided
  const filteredOptions = useMemo(() => {
    if (onSearch) return options;
    return options.filter(opt =>
      String(opt[displayField] || '').toLowerCase().includes(search.toLowerCase()) ||
      String(opt[valueField] || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search, onSearch, displayField, valueField]);

  const selectedOption = useMemo(() =>
    options.find(opt => String(opt[valueField]) === String(value)),
    [options, value, valueField]
  );

  // Handle remote search with debounce and loop protection
  useEffect(() => {
    if (onSearch && isOpen) {
      if (search === lastSearchRef.current) return;

      const delayDebounceFn = setTimeout(() => {
        lastSearchRef.current = search;
        onSearch(search);
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, onSearch, isOpen]);

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
      if (onSearch && options.length === 0) {
        onSearch('');
        lastSearchRef.current = '';
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
    lastSearchRef.current = null;
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = String(value) === String(item[valueField]);
    return (
      <TouchableOpacity
        onPress={() => {
          onChange(item[valueField]);
          handleClose();
        }}
        style={[
          styles.itemOption,
          isSelected && styles.selectedOption
        ]}
      >
        <View style={styles.optionInfo}>
          <Text style={[
            styles.optionName,
            isSelected && { color: colors.primary }
          ]}>
            {item[displayField]}
          </Text>
          {displayField !== valueField && (
            <Text style={styles.optionCode}>{item[valueField]}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        onPress={handleOpen}
        style={[styles.selector, disabled && styles.disabledSelector]}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Icon style={styles.icon} size={18} color={disabled ? colors.text_tertiary : colors.text_secondary} />
        <View style={styles.textContainer}>
          <Text
            style={[styles.valueText, !selectedOption && styles.placeholderText, disabled && { color: colors.text_tertiary }]}
            numberOfLines={1}
          >
            {selectedOption ? (selectedOption[displayField] || selectedOption[valueField]) : placeholder}
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.chevron} />
        ) : (
          <ChevronDown style={styles.chevron} size={16} color={colors.text_tertiary} />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'android' ? 'padding' : undefined}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <X size={20} color={colors.text_secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <Search size={18} color={colors.text_tertiary} style={styles.searchIcon} />
                <TextInput
                  placeholder={searchPlaceholder}
                  value={search}
                  onChangeText={setSearch}
                  style={styles.searchInput}
                  placeholderTextColor={colors.text_tertiary}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {loading && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />
                )}
                {search !== '' && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <X size={18} color={colors.text_tertiary} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={filteredOptions}
                keyExtractor={(item, index) => `${item[valueField]}-${index}`}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
                renderItem={renderItem}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    {loading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text style={styles.emptyText}>No results found</Text>
                    )}
                  </View>
                }
              />
              <SafeAreaView edges={['bottom']} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text_secondary,
    marginBottom: spacing.xs,
  },
  selector: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingLeft: moderateScale(44),
    paddingRight: moderateScale(40),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: moderateScale(48),
  },
  textContainer: {
    flex: 1,
  },
  disabledSelector: {
    backgroundColor: colors.disabled_bg,
    borderColor: colors.border_light,
  },
  icon: {
    position: 'absolute',
    left: spacing.md,
  },
  chevron: {
    position: 'absolute',
    right: spacing.md,
  },
  valueText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  placeholderText: {
    color: colors.text_tertiary,
    fontWeight: typography.weights.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: SCREEN_HEIGHT * 0.60,
    minHeight: SCREEN_HEIGHT * 0.4,
    ...shadow.medium,
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  closeBtn: {
    padding: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: borderRadius.round,
  },
  searchBox: {
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.text_primary,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  itemOption: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  selectedOption: {
    backgroundColor: colors.blue_50,
    borderRadius: borderRadius.lg,
    marginVertical: 2,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
  },
  optionInfo: {
    flex: 1,
  },
  optionName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  optionCode: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  emptyBox: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.text_tertiary,
    fontWeight: typography.weights.medium,
  },
});
