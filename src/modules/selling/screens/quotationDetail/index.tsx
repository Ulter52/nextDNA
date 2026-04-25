import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert, Linking, DeviceEventEmitter } from 'react-native';
import { 
  User, Calendar, Clock, FileText, Send, RefreshCcw, Eye, Ban, ArrowRight, Package, Tag, Edit, ChevronRight
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuotationDetail } from '../../hooks/quotationQueries';
import { quotationService } from '../../services/quotationService';
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

export function QuotationDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { quotationId } = route.params;
  
  const [user, setUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { data: quotation, isLoading, isRefetching, refetch } = useQuotationDetail(quotationId);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = useCallback(() => {
    navigation.navigate('NewQuotation', { quotationId });
  }, [navigation, quotationId]);

  const handleSubmit = async () => {
    Alert.alert('Submit Quotation', 'Are you sure you want to submit this quotation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          setSaving(true);
          await quotationService.submitQuotation(quotation);
          DeviceEventEmitter.emit('quotations_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to submit quotation');
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
          DeviceEventEmitter.emit('quotations_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to cancel quotation');
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

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Totals & Taxes', icon: Tag, type: 'green' },
  ], []);

  const isDraft = quotation?.docstatus === 0;
  const isSubmitted = quotation?.docstatus === 1;

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!quotation) return null;
    
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
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text_primary, marginTop: spacing.sm }}>{quotation.name}</Text>
                <View style={{
                  backgroundColor: quotation.docstatus === 1 ? colors.green_100 : colors.blue_100,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 4
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: quotation.docstatus === 1 ? colors.green_600 : colors.blue_600 
                  }}>{quotation.status}</Text>
                </View>
              </View>
              
              <VerticalInfoRow label="Customer" value={quotation.customer_name || quotation.party_name} icon={User} />
              <VerticalInfoRow label="Date" value={formatDate(quotation.transaction_date)} icon={Calendar} />
              <VerticalInfoRow label="Valid Till" value={formatDate(quotation.valid_till)} icon={Clock} />
              <VerticalInfoRow label="Company" value={quotation.company} icon={Tag} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {quotation.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{item.item_name || item.item_code}</Text>
                      <Text style={{ fontSize: 12, color: colors.text_tertiary, marginTop: 2 }}>{item.qty} {item.uom} x {formatCurrency(item.rate, quotation.currency)}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{formatCurrency(item.amount, quotation.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'totals' && (
            <View>
              <VerticalInfoRow label="Net Total" value={formatCurrency(quotation.total, quotation.currency)} />
              <VerticalInfoRow label="Taxes" value={formatCurrency(quotation.total_taxes_and_charges, quotation.currency)} />
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
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{formatCurrency(quotation.grand_total, quotation.currency)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [quotation, isDraft, handleEdit]);

  if (isLoading && !quotation) {
    return (
      <ModuleLayout title={quotationId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout 
      title={quotation?.name || quotationId} 
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit Quotation</Text>
            </TouchableOpacity>
          ) : isSubmitted && quotation?.status !== 'Cancelled' ? (
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
                onPress={() => Alert.alert('Sales Order', 'Feature coming soon')} 
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
                <ArrowRight size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Sales Order</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </View>
    </ModuleLayout>
  );
}
