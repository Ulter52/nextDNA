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
  Receipt,
  CreditCard,
  Banknote
} from 'lucide-react-native';
import { salesInvoiceService } from '@sellingServices/salesInvoiceService';
import { ModuleLayout } from '@components/ModuleLayout';
import { BASE_URL } from '@core/api/client';
import { formatDate, formatCurrency } from '@utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import styles from '../salesOrderDetail/styles';

export function SalesInvoiceDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await salesInvoiceService.getSalesInvoice(invoiceId);
      setInvoice(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert('Submit Invoice', 'Are you sure you want to submit this invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          setSaving(true);
          await salesInvoiceService.submitSalesInvoice(invoice);
          setSuccess('Invoice submitted successfully');
          fetchInvoice();
        } catch (err: any) {
          setError(err.message || 'Failed to submit invoice');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Invoice', 'Are you sure you want to cancel this invoice?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await salesInvoiceService.cancelSalesInvoice(invoiceId);
          setSuccess('Invoice cancelled');
          fetchInvoice();
        } catch (err: any) {
          setError(err.message || 'Failed to cancel invoice');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleViewPDF = () => {
    const pdfUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=Sales Invoice&name=${invoiceId}&format=Standard&no_letterhead=0`;
    Linking.openURL(pdfUrl).catch(err => console.error("PDF Error", err));
  };

  if (loading && !invoice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isDraft = invoice?.docstatus === 0;
  const isSubmitted = invoice?.docstatus === 1;

  return (
    <ModuleLayout 
      title={invoice?.name || "Invoice Detail"} 
      user={user} 
      showBack={true}
      headerRight={
        <TouchableOpacity onPress={fetchInvoice} style={{ padding: 8 }}>
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
              <Text style={styles.cardTag}>General Information</Text>
              <View style={[
                styles.statusBadge, 
                isSubmitted ? styles.submittedBadge : styles.draftBadge
              ]}>
                <Text style={[
                  styles.statusText, 
                  isSubmitted ? styles.submittedText : styles.draftText
                ]}>
                  {invoice?.status}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer</Text>
                <View style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={18} color="#9ca3af" />
                  <Text style={styles.input}>{invoice?.customer_name || invoice?.customer}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Posting Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                    <Text style={styles.input}>{formatDate(invoice?.posting_date)}</Text>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Due Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                    <Text style={styles.input}>{formatDate(invoice?.due_date)}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTag}>Items</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              {invoice?.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ borderBottomWidth: 1, borderBottomColor: '#f3f4f6', paddingBottom: 12 }}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>{item.item_name || item.item_code}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>{item.qty} x {formatCurrency(item.rate, invoice.currency)}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>{formatCurrency(item.amount, invoice.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <View style={{ marginTop: 24, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#9ca3af', fontSize: 12 }}>Grand Total</Text>
                <Text style={{ color: '#2563eb', fontSize: 18, fontWeight: '900' }}>{formatCurrency(invoice?.grand_total, invoice?.currency)}</Text>
              </View>
            </View>
          </View>
          
          <View style={{ height: 120 }} />
        </ScrollView>

        <View style={styles.footerActions}>
          {isDraft ? (
            <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.submitBtn}>
              {saving ? <ActivityIndicator color="#fff" /> : <Send size={18} color="#fff" />}
              <Text style={styles.submitBtnText}>Submit Invoice</Text>
            </TouchableOpacity>
          ) : isSubmitted && invoice?.status !== 'Paid' ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity onPress={handleViewPDF} style={styles.secondaryActionBtn}>
                  <Eye size={18} color="#4b5563" />
                  <Text style={styles.secondaryActionText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} style={styles.secondaryActionBtn}>
                  <Ban size={18} color="#dc2626" />
                  <Text style={[styles.secondaryActionText, { color: '#dc2626' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Alert.alert('Payment', 'Feature coming soon')} style={styles.primaryActionBtn}>
                  <Banknote size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Pay Now</Text>
                </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    </ModuleLayout>
  );
}
