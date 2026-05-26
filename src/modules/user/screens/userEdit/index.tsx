import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User as UserIcon, Mail, MapPin, UserCircle2, Save, X } from 'lucide-react-native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { FormInput } from '../../../../core/components/FormInput';
import { useUserDetail, useUpdateUser } from '../../hooks/userQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { SaveSection } from '../../../../core/components/SaveSection';

const userSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  location: z.string().optional(),
  enabled: z.number().default(1),
});

type UserFormValues = z.infer<typeof userSchema>;

export function UserEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { email } = route.params;

  const { data: user, isLoading: loadingDetail } = useUserDetail(email);
  const updateUserMutation = useUpdateUser();

  const { control, handleSubmit, reset, setValue } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      full_name: '',
      gender: '',
      birth_date: '',
      location: '',
      enabled: 1,
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        gender: user.gender || '',
        birth_date: user.birth_date || '',
        location: user.location || '',
        enabled: user.enabled ? 1 : 0,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormValues) => {
    try {
      await updateUserMutation.mutateAsync({ email, data });
      Alert.alert("Success", "User updated successfully");
      navigation.goBack();
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update user");
    }
  };

  if (loadingDetail) {
    return (
      <ModuleLayout title="Edit User" showBack>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Edit User" showBack>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Controller
            control={control}
            name="full_name"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <FormInput
                label="Full Name"
                value={value}
                onChangeText={onChange}
                error={error?.message}
                icon={UserIcon}
              />
            )}
          />

          <View style={styles.readOnlyContainer}>
            <Mail size={18} color={colors.text_tertiary} style={styles.readOnlyIcon} />
            <View>
              <Text style={styles.readOnlyLabel}>Email ID (Read Only)</Text>
              <Text style={styles.readOnlyValue}>{email}</Text>
            </View>
          </View>

          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Gender"
                value={value}
                onChangeText={onChange}
                icon={UserCircle2}
                placeholder="Male / Female / Other"
              />
            )}
          />

          <Controller
            control={control}
            name="birth_date"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Birth Date"
                value={value}
                onChangeText={onChange}
                icon={UserCircle2}
                placeholder="YYYY-MM-DD"
              />
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact & Location</Text>
          <Controller
            control={control}
            name="location"
            render={({ field: { onChange, value } }) => (
              <FormInput
                label="Location"
                value={value}
                onChangeText={onChange}
                icon={MapPin}
                multiline
                numberOfLines={3}
              />
            )}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account Access</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>User Enabled</Text>
            <Controller
              control={control}
              name="enabled"
              render={({ field: { onChange, value } }) => (
                <Switch
                  value={value === 1}
                  onValueChange={(val) => onChange(val ? 1 : 0)}
                  trackColor={{ false: colors.neutral_200, true: colors.primary }}
                />
              )}
            />
          </View>
        </View>

        <SaveSection
          isEdit={true}
          isPending={updateUserMutation.isPending}
          handleSubmit={handleSubmit(onSubmit)}
          label="Update User"
          title="Save Changes?"
          subtitle="Are you sure you want to update this user's profile?"
        />
      </ScrollView>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.small,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text_tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    letterSpacing: 1,
  },
  readOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral_50,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  readOnlyIcon: { marginRight: spacing.md },
  readOnlyLabel: { fontSize: 10, color: colors.text_tertiary, textTransform: 'uppercase' },
  readOnlyValue: { fontSize: 14, color: colors.text_secondary, fontWeight: '500' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchLabel: { fontSize: 14, color: colors.text_primary, fontWeight: '500' },
});
