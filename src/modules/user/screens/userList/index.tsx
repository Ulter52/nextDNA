import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, Image } from 'react-native';
import { User as UserIcon, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FilterHeader, FilterOption } from '../../../../core/components/FilterHeader';
import { useUsers } from '../../hooks/userQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useDebounce } from '../../../../core/utils/debounce';

const STATUS_FILTERS: FilterOption[] = [
  { label: 'All', value: 'All' },
  { label: 'Enabled', value: 'Enabled' },
  { label: 'Disabled', value: 'Disabled' },
];

export function UserList() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Enabled');
  const debouncedSearch = useDebounce(search);

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useUsers(debouncedSearch, status);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const users = useMemo(() => {
    return data?.pages?.flat() || [];
  }, [data]);

  const renderUserItem = useCallback(({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('UserDetail', { email: item.name })}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          {item.user_image ? (
            <Image source={{ uri: item.user_image }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <UserIcon size={24} color={colors.text_tertiary} />
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.userName}>{item.full_name || item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.rightContent}>
          {!item.enabled && (
             <View style={styles.disabledBadge}>
               <Text style={styles.disabledText}>Disabled</Text>
             </View>
          )}
          <ChevronRight size={20} color={colors.border} />
        </View>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: spacing.md }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  };

  return (
    <ModuleLayout title="Users" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          onAdd={() => {}} // User creation might be complex, leaving empty or could link to UserEdit with no email
          placeholder="Search users..."
          filters={STATUS_FILTERS}
          activeFilter={status}
          onFilterChange={setStatus}
        />

        {isLoading && !data ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={users}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <UserIcon size={48} color={colors.border} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.small,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  placeholderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.neutral_100, alignItems: 'center', justifyContent: 'center' },
  infoContainer: { flex: 1 },
  userName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text_primary },
  userEmail: { fontSize: typography.sizes.sm, color: colors.text_tertiary, marginTop: 2 },
  rightContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disabledBadge: { backgroundColor: colors.red_50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  disabledText: { color: colors.error, fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center', gap: spacing.md },
  emptyText: { color: colors.text_tertiary, fontSize: 16, fontWeight: '600' }
});
