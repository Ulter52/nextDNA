import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Mail, User as UserIcon, Calendar, MapPin, UserCircle2, Edit3, Shield } from 'lucide-react-native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { useUserDetail } from '../../hooks/userQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { getInitials } from '../../../../core/utils/formatters';

export function UserDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { email } = route.params;

  const { data: user, isLoading, refetch } = useUserDetail(email);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <ModuleLayout title="User Detail" showBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  if (!user) {
    return (
      <ModuleLayout title="User Detail" showBack>
        <View style={styles.center}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="User Detail" showBack>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {user.user_image ? (
              <Image source={{ uri: user.user_image }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarText}>{getInitials(user.full_name || user.name)}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.fullName}>{user.full_name || user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton} 
            onPress={() => navigation.navigate('UserEdit', { email: user.name })}
          >
            <Edit3 size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <DetailRow icon={UserIcon} label="Full Name" value={user.full_name} />
          <DetailRow icon={UserCircle2} label="Gender" value={user.gender || 'Not specified'} />
          <DetailRow icon={Calendar} label="Birth Date" value={user.birth_date || 'Not specified'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <DetailRow icon={Mail} label="Email ID" value={user.email} />
          <DetailRow icon={MapPin} label="Location" value={user.location || 'Not specified'} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Status</Text>
          <View style={styles.statusRow}>
            <Shield size={20} color={user.enabled ? colors.success : colors.error} />
            <Text style={[styles.statusText, { color: user.enabled ? colors.success : colors.error }]}>
              {user.enabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ModuleLayout>
  );
}

const DetailRow = ({ icon: Icon, label, value }: any) => (
  <View style={styles.detailRow}>
    <View style={styles.iconContainer}>
      <Icon size={18} color={colors.text_tertiary} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 16 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.white, 
    padding: spacing.lg, 
    borderRadius: borderRadius.xl, 
    marginBottom: spacing.md,
    ...shadow.medium 
  },
  avatarContainer: { marginRight: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  placeholderAvatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  fullName: { fontSize: typography.sizes.lg, fontWeight: 'bold', color: colors.text_primary },
  email: { fontSize: typography.sizes.sm, color: colors.text_tertiary, marginTop: 2 },
  editButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    ...shadow.small
  },
  card: { 
    backgroundColor: colors.white, 
    borderRadius: borderRadius.xl, 
    padding: spacing.lg, 
    marginBottom: spacing.md,
    ...shadow.small 
  },
  sectionTitle: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: colors.text_secondary, 
    textTransform: 'uppercase', 
    marginBottom: spacing.md,
    letterSpacing: 0.5
  },
  detailRow: { flexDirection: 'row', marginBottom: spacing.md },
  iconContainer: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.neutral_50, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: 10, color: colors.text_tertiary, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, color: colors.text_primary, fontWeight: '500' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusText: { fontSize: 14, fontWeight: 'bold' }
});
