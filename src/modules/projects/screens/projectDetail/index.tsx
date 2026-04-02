import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  ClipboardList, Calendar, CheckCircle2, Clock, 
  Users, BarChart as BarChartIcon, Layers, Edit, Briefcase
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useProjectDetail, useProjectTasks } from '../../hooks/projectQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';

export function ProjectDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { projectId } = route.params;
  
  const { data: project, isLoading: loadingProject, refetch: refetchProject, isRefetching: refetchingProject } = useProjectDetail(projectId);
  const { data: tasks, isLoading: loadingTasks } = useProjectTasks(projectId);

  const handleEdit = useCallback(() => {
    navigation.navigate('ProjectEdit', { projectId });
  }, [navigation, projectId]);

  const onRefresh = useCallback(() => {
    refetchProject();
  }, [refetchProject]);

  if (loadingProject && !project) {
    return (
      <ModuleLayout title={projectId} showBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  const progress = project?.percent_complete || 0;

  return (
    <ModuleLayout title={project?.project_name || projectId} showBack>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refetchingProject} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.iconContainer}>
              <Briefcase size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.projectName}>{project?.project_name}</Text>
              <Text style={styles.projectId}>{project?.name}</Text>
            </View>
            <TouchableOpacity onPress={handleEdit} style={styles.editBtn}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.progressSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={styles.progressLabel}>Completion Progress</Text>
              <Text style={styles.progressValue}>{Math.round(progress)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, getStatusStyle(project?.status)]}>
              <Text style={[styles.statusText, { color: getStatusColor(project?.status) }]}>{project?.status}</Text>
            </View>
            <Text style={styles.typeText}>{project?.project_type || 'Internal'}</Text>
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <DetailItem icon={Calendar} label="Expected End Date" value={project?.expected_end_date || 'N/A'} />
            <DetailItem icon={Users} label="Customer" value={project?.customer || 'Internal Project'} />
            <DetailItem icon={Layers} label="Project Type" value={project?.project_type || 'N/A'} />
            <DetailItem icon={BarChartIcon} label="Department" value={project?.department || 'N/A'} />
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <Text style={styles.sectionTitle}>Tasks ({tasks?.length || 0})</Text>
          </View>
          
          {loadingTasks ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : tasks?.length > 0 ? (
            tasks.map((task: any) => (
              <View key={task.name} style={styles.taskItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskSubject}>{task.subject}</Text>
                  <Text style={styles.taskMeta}>Due: {task.exp_end_date || 'N/A'}</Text>
                </View>
                <View style={[styles.taskStatus, getTaskStatusStyle(task.status)]}>
                  <Text style={[styles.taskStatusText, { color: getTaskStatusColor(task.status) }]}>{task.status}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No tasks assigned to this project.</Text>
          )}
        </View>
      </ScrollView>
    </ModuleLayout>
  );
}

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <View style={styles.detailItem}>
    <Icon size={16} color={colors.text_tertiary} />
    <View style={{ marginLeft: spacing.sm }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Completed': return { backgroundColor: colors.green_50 };
    case 'Open': return { backgroundColor: colors.blue_50 };
    default: return { backgroundColor: colors.gray_50 };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return colors.green_600;
    case 'Open': return colors.blue_600;
    default: return colors.text_secondary;
  }
};

const getTaskStatusStyle = (status: string) => {
  if (status === 'Completed') return { backgroundColor: colors.green_50 };
  if (status === 'Open') return { backgroundColor: colors.orange_50 };
  return { backgroundColor: colors.gray_50 };
};

const getTaskStatusColor = (status: string) => {
  if (status === 'Completed') return colors.green_600;
  if (status === 'Open') return colors.orange_600;
  return colors.text_tertiary;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    ...shadow.medium,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { 
    width: 50, 
    height: 50, 
    borderRadius: borderRadius.lg, 
    backgroundColor: colors.blue_50, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  projectName: { fontSize: 20, fontWeight: 'bold', color: colors.text_primary },
  projectId: { fontSize: 12, color: colors.text_tertiary, marginTop: 2 },
  editBtn: { padding: 8, backgroundColor: colors.blue_50, borderRadius: borderRadius.md },
  progressSection: { marginTop: spacing.xl, marginBottom: spacing.lg },
  progressLabel: { fontSize: 12, color: colors.text_secondary, fontWeight: '600' },
  progressValue: { fontSize: 12, fontWeight: 'bold', color: colors.primary },
  progressBarBg: { height: 8, backgroundColor: colors.border_light, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.md },
  statusText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  typeText: { fontSize: 12, color: colors.text_tertiary, fontWeight: '500' },
  section: { marginTop: spacing.lg, paddingHorizontal: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.md },
  detailsGrid: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.xl, 
    padding: spacing.lg, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing.lg,
    ...shadow.small 
  },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { fontSize: 10, color: colors.text_tertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text_primary, marginTop: 2 },
  taskItem: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.small,
  },
  taskSubject: { fontSize: 14, fontWeight: '600', color: colors.text_primary },
  taskMeta: { fontSize: 12, color: colors.text_tertiary, marginTop: 2 },
  taskStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.sm },
  taskStatusText: { fontSize: 10, fontWeight: '700' },
  emptyText: { textAlign: 'center', color: colors.text_tertiary, marginTop: spacing.xl }
});
