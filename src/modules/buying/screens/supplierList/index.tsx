import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Image } from 'react-native';
import { User, MapPin, Tag, Phone, Mail } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useSuppliers } from '../../hooks/buyingQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { FilterHeader } from '../../../../core/components/FilterHeader';
import { useDebounce } from '../../../../core/utils/debounce';
import { BASE_URL } from '../../../../core/api/client';

export function SupplierList() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: suppliers, isLoading, refetch, isRefetching } = useSuppliers(debouncedSearch);

  const renderSupplierItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('SupplierDetail', { supplierId: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.imageContainer}>
            {item.image ? (
              <Image source={{ uri: `${BASE_URL}${item.image}` }} style={styles.image} />
            ) : (
              <View style={styles.placeholderImage}>
                <User size={24} color={colors.primary} />
              </View>
            )}
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.supplierName} numberOfLines={1}>{item.supplier_name}</Text>
            <Text style={styles.supplierId}>{item.name}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.supplier_type}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <Tag size={12} color={colors.text_tertiary} />
            <Text style={styles.infoText}>{item.supplier_group}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Suppliers" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('SupplierEdit')}
          placeholder="Search suppliers..."
        />

        {isLoading && !suppliers ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={suppliers}
            renderItem={renderSupplierItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No suppliers found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.small,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  imageContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: colors.blue_50, justifyContent: 'center', alignItems: 'center' },
  supplierName: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.text_primary },
  supplierId: { fontSize: 10, color: colors.text_tertiary, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.gray_50, borderRadius: borderRadius.sm },
  typeText: { fontSize: 10, color: colors.text_secondary, fontWeight: '700' },
  cardFooter: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border_light },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, color: colors.text_tertiary },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.text_tertiary }
});
