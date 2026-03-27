import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  StyleSheet 
} from 'react-native';
import { 
  Save, 
  User, 
  Globe, 
  Layers, 
  Tag, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react-native';
import { customerService } from '@sellingServices/customerService';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import { colors, spacing, borderRadius, typography, shadow } from '@theme';

export function NewCustomer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_type: 'Company',
    customer_group: 'All Customer Groups',
    territory: 'All Territories',
  });

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const handleSave = async () => {
    if (!formData.customer_name) return setError('Customer Name is required');

    try {
      setLoading(true);
      setError(null);
      const newCustomer = await customerService.createCustomer(formData);
      setSuccess('Customer created successfully');
      setTimeout(() => {
        navigation.replace('CustomerDetail', { customerId: newCustomer.name });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModuleLayout title="New Customer" user={user} showBack={true}>
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
          <Text style={styles.cardTag}>Basic Details</Text>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  placeholder="Enter customer name"
                  value={formData.customer_name}
                  onChangeText={(text) => setFormData({ ...formData, customer_name: text })}
                  style={styles.input}
                  placeholderTextColor={colors.neutral_400}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeRow}>
                {['Company', 'Individual'].map((type) => (
                  <TouchableOpacity 
                    key={type}
                    onPress={() => setFormData({ ...formData, customer_type: type })}
                    style={[
                      styles.typeBtn, 
                      formData.customer_type === type && styles.typeBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.typeBtnText, 
                      formData.customer_type === type && styles.typeBtnTextActive
                    ]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer Group</Text>
              <View style={styles.inputWrapper}>
                <Layers style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  value={formData.customer_group}
                  onChangeText={(text) => setFormData({ ...formData, customer_group: text })}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Territory</Text>
              <View style={styles.inputWrapper}>
                <Globe style={styles.inputIcon} size={18} color={colors.neutral_400} />
                <TextInput 
                  value={formData.territory}
                  onChangeText={(text) => setFormData({ ...formData, territory: text })}
                  style={styles.input}
                />
              </View>
            </View>
          </View>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.submitBtn}>
          {loading ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
          <Text style={styles.submitBtnText}>Create Customer</Text>
        </TouchableOpacity>
      </View>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 24, gap: 24 },
  card: { 
    backgroundColor: colors.card_bg, 
    borderRadius: borderRadius.xxl, 
    padding: spacing.lg, 
    borderWidth: 1, 
    borderColor: colors.border_light,
    ...shadow.light,
  },
  cardTag: { 
    fontSize: typography.sizes.xs, 
    fontFamily: typography.fonts.black, 
    color: colors.neutral_400, 
    textTransform: 'uppercase', 
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
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
  inputIcon: { marginRight: spacing.sm },
  input: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: typography.sizes.md, 
    fontFamily: typography.fonts.bold, 
    color: colors.text_primary 
  },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: borderRadius.lg, 
    backgroundColor: colors.neutral_100, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: 'transparent' 
  },
  typeBtnActive: { 
    backgroundColor: colors.blue_50, 
    borderColor: colors.primary 
  },
  typeBtnText: { 
    fontSize: typography.sizes.sm, 
    fontFamily: typography.fonts.bold, 
    color: colors.text_secondary 
  },
  typeBtnTextActive: { color: colors.primary },
  footer: { 
    position: 'absolute', 
    bottom: 24, 
    left: 24, 
    right: 24 
  },
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
  submitBtnText: { 
    color: colors.white, 
    fontSize: typography.sizes.md, 
    fontFamily: typography.fonts.bold 
  },
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
  successText: { 
    color: colors.success, 
    fontSize: typography.sizes.sm, 
    fontFamily: typography.fonts.bold 
  },
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
  errorText: { 
    color: colors.error, 
    fontSize: typography.sizes.sm, 
    fontFamily: typography.fonts.bold 
  },
});
