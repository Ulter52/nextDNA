import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, StyleSheet, Alert, Dimensions, FlatList } from 'react-native';
import { 
  FileText, Calendar, User, 
  CreditCard, Edit, Package, Hash, Info, Landmark, Send, Clock
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { usePurchaseInvoiceDetail, useSubmitPurchaseInvoice } from '../../hooks/purchaseInvoiceQueries';
import { colors, spacing, borderRadius, shadow, typography } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { formatCurrency } from '../../../../core/utils/formatters';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[detailStyles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[detailStyles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[detailStyles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || '—'}</Text>
  </View>
));

export function PurchaseInvoiceDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { invoiceId } = route.params;
  
  const { data: invoice, isLoading, refetch, isRefetching } = usePurchaseInvoiceDetail(invoiceId);
  const submitMutation = useSubmitPurchaseInvoice();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = useCallback(() => {
    navigation.navigate('PurchaseInvoiceEdit', { invoiceId });
  }, [navigation, invoiceId]);

  const handleSubmit = useCallback(() => {
    Alert.alert(
      "Submit Purchase Invoice",
      "Are you sure you want to submit this invoice? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitMutation.mutateAsync(invoiceId);
              Alert.alert("Success", "Purchase Invoice submitted successfully");
            } catch (err: any) {
              let msg = 'Failed to submit invoice';
              if (err.response?.data?._server_messages) {
                try {
                  const messages = JSON.parse(err.response.data._server_messages);
                  msg = messages.map((m: any) => {
                    try {
                      return JSON.parse(m).message;
                    } catch {
                      return m;
                    }
                  }).join('\n');
                } catch (e) {
                  msg = err.response.data.message || msg;
                }
              } else {
                msg = err.response?.data?.message || err.message || msg;
              }
              Alert.alert("Error", msg);
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  }, [invoiceId, submitMutation]);

  const sections = useMemo(() => [
    { id: 'overview', title: 'Overview', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Taxes & Totals', icon: CreditCard, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!invoice) return null;
    
    const SectionIcon = section.icon;
    const cardStyle = [
      detailStyles.sectionCard,
      section.type === 'blue' && detailStyles.blueCard,
      section.type === 'orange' && detailStyles.orangeCard,
      section.type === 'green' && detailStyles.greenCard,
    ];

    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : 'green_500'];

    return (
      <View style={cardStyle}>
        <View style={[detailStyles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'overview' && invoice.docstatus === 0 && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'overview' && (
            <View>
              <VerticalInfoRow label="Status" value={invoice.status} icon={Clock} />
              <VerticalInfoRow label="Supplier" value={invoice.supplier} icon={User} />
              <VerticalInfoRow label="Posting Date" value={invoice.posting_date} icon={Calendar} />
              <VerticalInfoRow label="Due Date" value={invoice.due_date} icon={Calendar} />
              <VerticalInfoRow label="Supplier Invoice No" value={invoice.bill_no} icon={FileText} />
              <VerticalInfoRow label="Supplier Invoice Date" value={invoice.bill_date} icon={Calendar} />
              <VerticalInfoRow label="Cost Center" value={invoice.cost_center || 'N/A'} icon={Landmark} />

              {invoice.docstatus === 0 && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.success, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: borderRadius.lg }]} 
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Send size={18} color={colors.white} />
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Invoice</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {invoice.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light }}>
                  <Text style={[detailStyles.infoLabel, { color: colors.orange_600, marginBottom: spacing.xs, fontSize: 10, textTransform: 'uppercase' }]}>{item.item_code}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.sm }}>{item.item_name}</Text>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border_light, paddingTop: spacing.sm }}>
                    <View>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Quantity</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.qty} {item.uom}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Rate</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.rate, invoice.currency || 'INR')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Amount</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.amount, invoice.currency || 'INR')}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'totals' && (
            <View>
              <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.green_50, borderRadius: borderRadius.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={{ color: colors.text_secondary }}>Grand Total</Text>
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.grand_total, invoice.currency || 'INR')}</Text>
                </View>
                {invoice.outstanding_amount > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.green_200, paddingTop: spacing.sm }}>
                    <Text style={{ color: colors.text_primary, fontWeight: 'bold' }}>Outstanding</Text>
                    <Text style={{ color: colors.error, fontWeight: '900', fontSize: 18 }}>{formatCurrency(invoice.outstanding_amount, invoice.currency || 'INR')}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [invoice, handleEdit, handleSubmit, isSubmitting]);

  if (isLoading && !invoice) {
    return (
      <ModuleLayout title={invoiceId} showBack>
        <View style={detailStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={invoice?.name || invoiceId} showBack>
      <View style={detailStyles.container}>
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2}
          contentContainerStyle={detailStyles.horizontalList}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        />
      </View>
    </ModuleLayout>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    ...shadow.small,
  }
});
