import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert, Linking, DeviceEventEmitter } from 'react-native';
import { 
  User, Calendar, FileText, Send, RefreshCcw, Eye, Ban, Package, Tag, Edit, Banknote, ShoppingCart, Truck
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSalesInvoiceDetail } from '../../hooks/salesInvoiceQueries';
import { salesInvoiceService } from '../../services/salesInvoiceService';
import { formatDate, formatCurrency } from '../../../../core/utils/formatters';
import { BASE_URL } from '../../../../core/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>
      {String(value ?? '') || '—'}
    </Text>
  </View>
));

export function SalesInvoiceDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { invoiceId } = route.params;
  
  const [user, setUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: invoice, isLoading, isRefetching, refetch } = useSalesInvoiceDetail(invoiceId);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = useCallback(() => {
    navigation.navigate('NewSalesInvoice', { invoiceId });
  }, [navigation, invoiceId]);

  const handleSubmit = async () => {
    Alert.alert('Submit Invoice', 'Are you sure you want to submit this sales invoice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          setSaving(true);
          await salesInvoiceService.submitSalesInvoice(invoice);
          DeviceEventEmitter.emit('sales_invoices_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to submit invoice');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Invoice', 'Are you sure you want to cancel this sales invoice?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await salesInvoiceService.cancelSalesInvoice(invoiceId);
          DeviceEventEmitter.emit('sales_invoices_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to cancel invoice');
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

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Totals & Taxes', icon: Tag, type: 'green' },
  ], []);

  const isDraft = invoice?.docstatus === 0;
  const isSubmitted = invoice?.docstatus === 1;

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!invoice) return null;
    
    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
    ];

    const titleColor = colors[section.type === 'blue' ? 'blue_500' : (section.type === 'orange' ? 'orange_500' : 'green_500')];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'basic' && isDraft && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'basic' && (
            <View>
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.blue_50, justifyContent: 'center', alignItems: 'center' }}>
                  <FileText size={40} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text_primary, marginTop: spacing.sm }}>{invoice.name}</Text>
                <View style={{
                  backgroundColor: invoice.status === 'Paid' ? colors.green_100 : invoice.status === 'Unpaid' ? colors.red_100 : colors.blue_100,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 4
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: invoice.status === 'Paid' ? colors.green_600 : invoice.status === 'Unpaid' ? colors.error : colors.blue_600 
                  }}>{invoice.status}</Text>
                </View>
              </View>
              
              <VerticalInfoRow label="Customer" value={invoice.customer_name || invoice.customer} icon={User} />
              <VerticalInfoRow label="Posting Date" value={formatDate(invoice.posting_date)} icon={Calendar} />
              <VerticalInfoRow label="Due Date" value={formatDate(invoice.due_date)} icon={Calendar} />
              <VerticalInfoRow label="Company" value={invoice.company} icon={Tag} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {invoice.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{item.item_name || item.item_code}</Text>
                      <Text style={{ fontSize: 12, color: colors.text_tertiary, marginTop: 2 }}>{item.qty} {item.uom} x {formatCurrency(item.rate, invoice.currency)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{formatCurrency(item.amount, invoice.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'totals' && (
            <View>
              <VerticalInfoRow label="Net Total" value={formatCurrency(invoice.total, invoice.currency)} />
              <VerticalInfoRow label="Taxes" value={formatCurrency(invoice.total_taxes_and_charges, invoice.currency)} />
              <View style={{ 
                marginTop: spacing.xl, 
                padding: spacing.md, 
                backgroundColor: colors.blue_50, 
                borderRadius: 12,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary }}>Grand Total</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{formatCurrency(invoice.grand_total, invoice.currency)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [invoice, isDraft, handleEdit]);

  if (isLoading && !invoice) {
    return (
      <ModuleLayout title={invoiceId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout 
      title={invoice?.name || invoiceId} 
      user={user} 
      showBack={true}
      headerRight={
        <TouchableOpacity onPress={handleRefresh} style={{ padding: 8 }}>
          <RefreshCcw size={20} color={colors.neutral_500} />
        </TouchableOpacity>
      }
    >
      <View style={styles.container}>
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2}
          contentContainerStyle={styles.horizontalList}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        />

        <View style={{ 
          position: 'absolute', 
          bottom: 24, 
          left: 24, 
          right: 24,
          flexDirection: 'row',
          gap: 12
        }}>
          {isDraft ? (
            <TouchableOpacity 
              onPress={handleSubmit} 
              disabled={saving} 
              style={{ 
                flex: 1,
                backgroundColor: colors.primary, 
                paddingVertical: 16, 
                borderRadius: 16, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8,
                elevation: 4
              }}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Send size={18} color="#fff" />}
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit Invoice</Text>
            </TouchableOpacity>
          ) : isSubmitted && invoice?.status !== 'Paid' && invoice?.status !== 'Cancelled' ? (
            <>
              <TouchableOpacity 
                onPress={handleViewPDF} 
                style={{ 
                  flex: 1,
                  backgroundColor: colors.white, 
                  paddingVertical: 16, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.border_light
                }}
              >
                <Eye size={18} color={colors.text_secondary} />
                <Text style={{ color: colors.text_secondary, fontSize: 14, fontWeight: 'bold' }}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCancel} 
                style={{ 
                  flex: 1,
                  backgroundColor: colors.white, 
                  paddingVertical: 16, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8,
                  borderWidth: 1,
                  borderColor: colors.red_100
                }}
              >
                <Ban size={18} color={colors.error} />
                <Text style={{ color: colors.error, fontSize: 14, fontWeight: 'bold' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => Alert.alert('Payment', 'Payment feature coming soon')} 
                style={{ 
                  flex: 1.5,
                  backgroundColor: colors.primary, 
                  paddingVertical: 16, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8
                }}
              >
                <Banknote size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Pay Now</Text>
              </TouchableOpacity>
            </>
          ) : isSubmitted && invoice?.status === 'Paid' ? (
            <TouchableOpacity 
                onPress={handleViewPDF} 
                style={{ 
                  flex: 1,
                  backgroundColor: colors.primary, 
                  paddingVertical: 16, 
                  borderRadius: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 8
                }}
              >
                <Eye size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>View Paid Invoice (PDF)</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </ModuleLayout>
  );
}
