import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { Calendar, LayoutGrid, CheckCircle2, Clock } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useProjects } from '../../hooks/projectQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useNavigation } from '@react-navigation/native';
import { FilterHeader } from '../../../../core/components/FilterHeader';
import { useDebounce } from '../../../../core/utils/debounce';

export function ProjectList() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const debouncedSearch = useDebounce(search);

  const { data: projects, isLoading, refetch, isRefetching } = useProjects({ 
    search: debouncedSearch, 
    status 
  });

  const statusFilters = [
    { label: 'All', value: 'All' },
    { label: 'Open', value: 'Open' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const renderProjectItem = ({ item }: { item: any }) => {
    const progress = item.percent_complete || 0;
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProjectDetail', { projectId: item.name })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.projectName}>{item.project_name}</Text>
            <Text style={styles.projectId}>{item.name}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={14} color={colors.text_tertiary} />
            <Text style={styles.infoText}>Due: {item.expected_end_date || 'N/A'}</Text>
          </View>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: getProgressColor(progress) }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ModuleLayout title="Projects" showBack>
      <View style={styles.container}>
        <FilterHeader
          searchQuery={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          onAdd={() => navigation.navigate('ProjectEdit')}
          filters={statusFilters}
          activeFilter={status}
          onFilterChange={setStatus}
          placeholder="Search projects..."
        />

        {isLoading && !projects ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={projects}
            renderItem={renderProjectItem}
            keyExtractor={(item) => item.name}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No projects found</Text>
              </View>
            }
          />
        )}
      </View>
    </ModuleLayout>
  );
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Completed': return { backgroundColor: colors.green_50 };
    case 'Open': return { backgroundColor: colors.blue_50 };
    case 'Cancelled': return { backgroundColor: colors.red_50 };
    default: return { backgroundColor: colors.gray_50 };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return colors.green_600;
    case 'Open': return colors.blue_600;
    case 'Cancelled': return colors.error;
    default: return colors.text_secondary;
  }
};

const getProgressColor = (progress: number) => {
  if (progress >= 100) return colors.green_500;
  if (progress > 50) return colors.blue_500;
  if (progress > 20) return colors.warning;
  return colors.error;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.md, paddingBottom: 100 },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.small,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  projectName: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, color: colors.text_primary },
  projectId: { fontSize: typography.sizes.xs, color: colors.text_tertiary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: { marginTop: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  infoText: { fontSize: typography.sizes.xs, color: colors.text_secondary },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  progressBarBg: { flex: 1, height: 6, backgroundColor: colors.border_light, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  progressText: { fontSize: 12, fontWeight: 'bold', color: colors.text_primary, minWidth: 35 },
  emptyContainer: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: { color: colors.text_tertiary }
});
