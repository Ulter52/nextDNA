import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Plus, Search, X, Filter, RefreshCw } from 'lucide-react-native';
import { colors, spacing, moderateScale, borderRadius, shadow } from '../theme';
import { Selector } from './Selector';

export interface SelectorFilterConfig {
  id: string;
  label: string;
  icon: any;
  value: any;
  options: any[];
  onChange: (value: any) => void;
  displayField?: string;
  valueField?: string;
}

export interface FilterOption {
  label: string;
  value: any;
}

interface ListHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onRefresh: () => void;
  onAdd: () => void;
  onFilter?: () => void;
  placeholder?: string;
  filters?: FilterOption[];
  activeFilter?: any;
  onFilterChange?: (value: any) => void;
  selectorFilters?: SelectorFilterConfig[];
}

export const FilterHeader: React.FC<ListHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onRefresh,
  onAdd,
  onFilter,
  placeholder = "Search...",
  filters,
  activeFilter,
  onFilterChange,
  selectorFilters
}) => {
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterPress = () => {
    setShowFilters(!showFilters);
    if (onFilter) onFilter();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Search size={18} color={colors.text_tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholderTextColor={colors.text_tertiary}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => onSearchChange('')}>
              <X size={18} color={colors.text_tertiary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          {(onFilter || (filters && filters.length > 0) || (selectorFilters && selectorFilters.length > 0)) && (
            <TouchableOpacity 
              onPress={handleFilterPress} 
              style={[styles.iconButton, showFilters && styles.activeIconButton]}
            >
              <Filter size={18} color={showFilters ? colors.primary : colors.text_secondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRefresh} style={styles.iconButton}>
            <RefreshCw size={18} color={colors.text_secondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={styles.addButton}>
            <Plus size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <View>
          {filters && filters.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {filters.map((item) => {
                const isActive = activeFilter === item.value;
                return (
                  <TouchableOpacity
                    key={item.label}
                    onPress={() => onFilterChange?.(item.value)}
                    style={[
                      styles.filterChip,
                      isActive && styles.activeChip
                    ]}
                  >
                    <Text style={[
                      styles.filterLabel,
                      isActive && styles.activeLabel
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {selectorFilters && selectorFilters.length > 0 && (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={selectorFilters}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.selectorFilterList}
              renderItem={({ item }) => (
                <View style={styles.selectorWrapper}>
                  <Selector
                    label={item.label}
                    options={item.options}
                    value={item.value}
                    onChange={item.onChange}
                    icon={item.icon}
                    displayField={item.displayField || "name"}
                    valueField={item.valueField || "value"}
                    placeholder={`Select ${item.label}`}
                  />
                </View>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: moderateScale(40),
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text_primary,
    marginLeft: spacing.sm,
    padding: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  activeIconButton: {
    borderColor: colors.primary,
    backgroundColor: colors.blue_50,
  },
  addButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.small,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text_secondary,
  },
  activeLabel: {
    color: colors.white,
  },
  selectorFilterList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  selectorWrapper: {
    width: moderateScale(160),
  },
});
