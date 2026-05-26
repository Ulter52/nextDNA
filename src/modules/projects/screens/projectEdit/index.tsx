import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Save,
  FileText,
  Calendar,
  Layers,
  Briefcase,
  Info,
  Users,
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from './styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useProjectDetail,
  useSaveProject,
  useProjectTypes,
} from '../../hooks/projectQueries';
import { Selector } from '../../../../core/components/Selector';
import { useDebounce } from '../../../../core/utils/debounce';
import { metadataService } from '../../../../core/services/metadataService';

const FormInput = memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    icon: Icon,
    keyboardType = 'default',
    editable = true,
  }: any) => (
    <View
      style={[
        styles.infoRow,
        {
          flexDirection: 'column',
          alignItems: 'flex-start',
          borderBottomWidth: 1,
          borderBottomColor: colors.border_light,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginBottom: 4,
        }}
      >
        {Icon && <Icon size={12} color={colors.text_tertiary} />}
        <Text
          style={[
            styles.infoLabel,
            { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 },
          ]}
        >
          {label}
        </Text>
      </View>
      <TextInput
        style={{
          fontSize: 14,
          color: colors.text_primary,
          fontWeight: '600',
          padding: 0,
          width: '100%',
        }}
        value={String(value ?? '')}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor={colors.text_tertiary}
        editable={editable}
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  )
);

export function ProjectEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { projectId } = route.params || {};
  const isEdit = !!projectId;

  const [formData, setFormData] = useState<any>({
    project_name: '',
    status: 'Open',
    project_type: '',
    expected_end_date: '',
    customer: '',
    department: '',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const { data: project, isLoading: loadingDetail } = useProjectDetail(
    projectId || ''
  );
  
  // projectTypes is an InfiniteData object
  const { data: projectTypesData, isLoading: loadingTypes } = useProjectTypes();
  
  const projectTypes = useMemo(() => {
    return projectTypesData?.pages?.flat() || [];
  }, [projectTypesData]);

  const saveMutation = useSaveProject();

  useEffect(() => {
    if (isEdit && project) {
      setFormData(project);
    }
  }, [isEdit, project]);

  useEffect(() => {
    setLoadingCustomers(true);
    metadataService
      .getCustomers(debouncedCustomerSearch)
      .then((res) => setCustomers(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoadingCustomers(false));
  }, [debouncedCustomerSearch]);

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    if (!formData.project_name) {
      Alert.alert('Error', 'Project Name is required');
      return;
    }

    try {
      await saveMutation.mutateAsync({
        data: formData,
        id: projectId,
      });
      Alert.alert(
        'Success',
        `Project ${isEdit ? 'updated' : 'created'} successfully`
      );
      navigation.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Action failed';
      Alert.alert('Error', typeof msg === 'string' ? msg : 'Action failed');
    }
  };

  if (isEdit && loadingDetail) {
    return (
      <ModuleLayout title="Edit Project" showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={isEdit ? 'Edit Project' : 'New Project'} showBack>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.sectionCard, styles.blueCard, { width: '100%' }]}>
            <View style={styles.cardTitleRow}>
              <Briefcase size={22} color={colors.blue_500} strokeWidth={2.5} />
              <Text style={[styles.cardTitle, { color: colors.blue_500 }]}>
                Project Info
              </Text>
            </View>

            <FormInput
              label="Project Name"
              value={formData.project_name}
              onChangeText={(val: string) => handleChange('project_name', val)}
              icon={FileText}
              placeholder="Required"
            />

            <Selector
              label="Project Type"
              options={projectTypes}
              value={formData.project_type}
              onChange={(val) => handleChange('project_type', val)}
              loading={loadingTypes}
              icon={Layers}
              placeholder="Select Type"
            />

            <Selector
              label="Customer"
              options={customers}
              value={formData.customer}
              onChange={(val) => handleChange('customer', val)}
              onSearch={setCustomerSearch}
              loading={loadingCustomers}
              icon={Users}
              placeholder="Select Customer"
              displayField="customer_name"
              valueField="name"
            />

            <FormInput
              label="Expected End Date"
              value={formData.expected_end_date}
              onChangeText={(val: string) =>
                handleChange('expected_end_date', val)
              }
              icon={Calendar}
              placeholder="YYYY-MM-DD"
            />

            <FormInput
              label="Department"
              value={formData.department}
              onChangeText={(val: string) => handleChange('department', val)}
              icon={Info}
              placeholder="e.g. Sales"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSubmit}
              disabled={saveMutation.isPending}
              activeOpacity={0.8}
            >
              {saveMutation.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Save size={20} color={colors.white} />
                  <Text style={styles.saveBtnText}>
                    {isEdit ? 'Update Project' : 'Create Project'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ModuleLayout>
  );
}
