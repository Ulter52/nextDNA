import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  Linking
} from 'react-native';
import { 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  Send,
  RefreshCcw,
  Eye,
  Ban,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react-native';
import { quotationService } from '@sellingServices/quotationService';
import { ModuleLayout } from '@components/ModuleLayout';
import { BASE_URL } from '@core/api/client';
import { formatDate, formatCurrency } from '@utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import styles from '../salesOrderDetail/styles';

export function QuotationDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { quotationId } = route.params;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotationService.getQuotation(quotationId);
      setQuotation(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert('Submit Quotation', 'Are you sure you want to submit this quotation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          setSaving(true);
          await quotationService.submitQuotation(quotation);
          setSuccess('Quotation submitted successfully');
          fetchQuotation();
        } catch (err: any) {
          setError(err.message || 'Failed to submit quotation');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Quotation', 'Are you sure you want to cancel this quotation?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await quotationService.cancelQuotation(quotationId);
          setSuccess('Quotation cancelled');
          fetchQuotation();
        } catch (err: any) {
          setError(err.message || 'Failed to cancel quotation');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleViewPDF = () => {
    const pdfUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=Quotation&name=${quotationId}&format=Standard&no_letterhead=0`;
    Linking.openURL(pdfUrl).catch(err => console.error("PDF Error", err));
  };

  if (loading && !quotation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isDraft = quotation?.docstatus === 0;
  const isSubmitted = quotation?.docstatus === 1;

  return (
    <ModuleLayout 
      title={quotation?.name || "Quotation Detail"} 
      user={user} 
      showBack={true}
      headerRight={
        <TouchableOpacity onPress={fetchQuotation} style={{ padding: 8 }}>
          <RefreshCcw size={20} color="#6b7280" />
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {success && (
            <View style={styles.successBox}>
              <CheckCircle size={18} color="#059669" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>Quotation Information</Text>
              <View style={[
                styles.statusBadge, 
                isSubmitted ? styles.submittedBadge : styles.draftBadge
              ]}>
                <Text style={[
                  styles.statusText, 
                  isSubmitted ? styles.submittedText : styles.draftText
                ]}>
                  {quotation?.status}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer / Lead</Text>
                <View style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={18} color="#9ca3af" />
                  <Text style={styles.input}>{quotation?.customer_name || quotation?.party_name}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                    <Text style={styles.input}>{formatDate(quotation?.transaction_date)}</Text>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Valid Till</Text>
                  <View style={styles.inputWrapper}>
                    <Clock style={styles.inputIcon} size={18} color="#9ca3af" />
                    <Text style={styles.input}>{formatDate(quotation?.valid_till)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTag}>Items</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {quotation?.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>{item.item_name || item.item_code}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.qty} x {formatCurrency(item.rate, quotation.currency)}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>{formatCurrency(item.amount, quotation.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={{ marginTop: 24, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Grand Total</Text>
                <Text style={{ color: '#2563eb', fontSize: 18, fontWeight: '900' }}>{formatCurrency(quotation?.grand_total, quotation?.currency)}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footerActions}>
          {isDraft ? (
            <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.submitBtn}>
              {saving ? <ActivityIndicator color="#fff" /> : <Send size={18} color="#fff" />}
              <Text style={styles.submitBtnText}>Submit Quotation</Text>
            </TouchableOpacity>
          ) : isSubmitted && quotation?.status === 'Open' ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={handleViewPDF} style={styles.secondaryActionBtn}>
                  <Eye size={18} color="#4b5563" />
                  <Text style={styles.secondaryActionText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} style={styles.secondaryActionBtn}>
                  <Ban size={18} color="#dc2626" />
                  <Text style={[styles.secondaryActionText, { color: '#dc2626' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => Alert.alert('Sales Order', 'Feature coming soon')} 
                  style={styles.primaryActionBtn}
                >
                  <ArrowRight size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Sales Order</Text>
                </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </ModuleLayout>
  );
}
