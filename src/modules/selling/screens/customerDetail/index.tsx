import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet,
  Alert
} from 'react-native';
import { 
  Save, 
  User, 
  Globe, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  RefreshCcw,
  Edit2,
  X,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react-native';
import { customerService } from '@sellingServices/customerService';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadow } from '@theme';

export function CustomerDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { customerId } = route.params;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_type: '',
    customer_group: '',
    territory: '',
    email_id: '',
    mobile_no: ''
  });

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getCustomerDetails(customerId);
      setCustomer(data);
      setFormData({
        customer_name: data.customer_name || '',
        customer_type: data.customer_type || '',
        customer_group: data.customer_group || '',
        territory: data.territory || '',
        email_id: data.email_id || '',
        mobile_no: data.mobile_no || ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const updated = await customerService.updateCustomer(customerId, formData);
      setCustomer(updated);
      setIsEditing(false);
      setSuccess('Customer updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !customer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ModuleLayout 
      title={customer?.customer_name || "Customer Detail"} 
      user={user} 
      showBack={true}
      headerRight={
        <TouchableOpacity onPress={fetchCustomer} style={{ padding: 8 }}>
          <RefreshCcw size={20} color={colors.neutral_500} />
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {success && (
          <View style={styles.successBox}>
            <CheckCircle size={18} color={colors.success} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}
        {error && (
          <View style={styles.errorBox}>
            <AlertCircle size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTag}>Basic Information</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editBtn}>
                <Edit2 size={16} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <X size={18} color={colors.neutral_500} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Name</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                <User style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  editable={isEditing}
                  value={formData.customer_name}
                  onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                <Briefcase style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  editable={isEditing}
                  value={formData.customer_type}
                  onChangeText={(text) => setFormData({ ...formData, customer_type: text })}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Group</Text>
                <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                  <Layers style={styles.inputIcon} size={18} color={colors.neutral_400} />
                  <TextInput 
                    editable={isEditing}
                    value={formData.customer_group}
                    onChangeText={(text) => setFormData({ ...formData, customer_group: text })}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Territory</Text>
                <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                  <Globe style={styles.inputIcon} size={18} color={colors.neutral_400} />
                  <TextInput 
                    editable={isEditing}
                    value={formData.territory}
                    onChangeText={(text) => setFormData({ ...formData, territory: text })}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTag}>Contact Details</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ID</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                <Mail style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  editable={isEditing}
                  value={formData.email_id}
                  onChangeText={(text) => setFormData({ ...formData, email_id: text })}
                  style={styles.input}
                  keyboardType="email-address"
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile No</Text>
              <View style={[styles.inputWrapper, !isEditing && styles.inputWrapperDisabled]}>
                <Phone style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  editable={isEditing}
                  value={formData.mobile_no}
                  onChangeText={(text) => setFormData({ ...formData, mobile_no: text })}
                  style={styles.input}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {isEditing && (
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.submitBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
            <Text style={styles.submitBtnText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  scrollContent: { padding: 24, gap: 24 },
  card: { 
    backgroundColor: colors.card_bg, 
    borderRadius: borderRadius.xxl, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.border_light,
    ...shadow.light,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  cardTag: { 
    fontSize: typography.sizes.xs, 
    fontFamily: typography.fonts.black, 
    color: colors.neutral_400, 
    textTransform: 'uppercase', 
    letterSpacing: 2,
  },
  editBtn: { padding: 8, backgroundColor: colors.blue_50, borderRadius: borderRadius.md },
  cancelBtn: { padding: 8, backgroundColor: colors.neutral_100, borderRadius: borderRadius.md },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { 
    fontSize: typography.sizes.xs, 
    fontFamily: typography.fonts.bold, 
    color: colors.neutral_400, 
    textTransform: 'uppercase', 
    letterSpacing: 1, 
    marginLeft: 4 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.neutral_100, 
    borderRadius: borderRadius.lg, 
    paddingHorizontal: spacing.md 
  },
  inputWrapperDisabled: { opacity: 0.6 },
  inputIcon: { marginRight: spacing.sm },
  input: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: typography.sizes.md, 
    fontFamily: typography.fonts.bold, 
    color: colors.text_primary 
  },
  gridRow: { flexDirection: 'row', gap: 12 },
  footer: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  submitBtn: { 
    backgroundColor: colors.primary, 
    paddingVertical: 16, 
    borderRadius: borderRadius.xl, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    ...shadow.medium,
  },
  submitBtnText: { color: colors.white, fontSize: typography.sizes.md, fontFamily: typography.fonts.bold },
  successBox: { 
    backgroundColor: colors.success_light, 
    padding: 16, 
    borderRadius: borderRadius.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    borderWidth: 1, 
    borderColor: '#d1fae5' 
  },
  successText: { color: colors.success, fontSize: typography.sizes.sm, fontFamily: typography.fonts.bold },
  errorBox: { 
    backgroundColor: colors.error_light, 
    padding: 16, 
    borderRadius: borderRadius.lg, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    borderWidth: 1, 
    borderColor: '#fee2e2' 
  },
  errorText: { color: colors.error, fontSize: typography.sizes.sm, fontFamily: typography.fonts.bold },
});
