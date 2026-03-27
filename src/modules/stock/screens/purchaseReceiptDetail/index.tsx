import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { 
  ShoppingBag, Package, Calendar, MapPin, Clock, Edit,
  FileText, User, Info, CheckCircle2, CreditCard, Truck,
  Briefcase, Tag, Layers, FileBadge, Scale, Send, Building2
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../itemDetail/styles';
import { colors, spacing, borderRadius, shadow } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePurchaseReceiptDetail, useSubmitPurchaseReceipt } from '../../hooks/purchaseReceiptQueries';
import { formatCurrency } from '../../../../core/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// MEMOIZED SUB-COMPONENTS
const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || '—'}</Text>
  </View>
));

export function PurchaseReceiptDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { receiptId } = route.params;
  
  // Use React Query for caching
  const { 
    data: receipt, 
    isLoading, 
    isRefetching, 
    refetch 
  } = usePurchaseReceiptDetail(receiptId);

  const submitMutation = useSubmitPurchaseReceipt();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = useCallback(() => {
    navigation.navigate('PurchaseReceiptEdit', { receiptId });
  }, [navigation, receiptId]);

  const handleSubmit = useCallback(() => {
    Alert.alert(
      "Submit Purchase Receipt",
      "Are you sure you want to submit this receipt? This action is irreversible and will update stock levels.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          style: "default",
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitMutation.mutateAsync(receiptId);
              Alert.alert("Success", "Purchase Receipt submitted successfully");
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || "Failed to submit receipt");
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      ]
    );
  }, [receiptId, submitMutation]);

  const sections = useMemo(() => [
    { id: 'overview', title: 'Overview', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'taxes', title: 'Taxes & Totals', icon: CreditCard, type: 'green' },
    { id: 'audit', title: 'Audit Info', icon: Info, type: 'cyan' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!receipt) return null;
    
    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
      section.type === 'cyan' && styles.cyanCard,
    ];

    const titleColor = colors[
      section.type === 'blue' ? 'blue_500' : 
      section.type === 'orange' ? 'orange_500' : 
      section.type === 'green' ? 'green_500' : 'teal_500'
    ];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'overview' && receipt.docstatus === 0 && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'overview' && (
            <View>
              <VerticalInfoRow label="Status" value={receipt.status} icon={Clock} />
              <VerticalInfoRow label="Company" value={receipt.company} icon={Building2} />
              <VerticalInfoRow label="Supplier" value={receipt.supplier} icon={Truck} />
              <VerticalInfoRow label="Date" value={receipt.posting_date} icon={Calendar} />
              <VerticalInfoRow label="Posting Time" value={receipt.posting_time} icon={Clock} />
              <VerticalInfoRow label="Supplier Del. Note" value={receipt.supplier_delivery_note} icon={Truck} />
              <VerticalInfoRow label="Project" value={receipt.project} icon={Briefcase} />
              <VerticalInfoRow label="Cost Center" value={receipt.cost_center} icon={Briefcase} />
              <VerticalInfoRow label="Default Warehouse" value={receipt.set_warehouse} icon={MapPin} />
              
              {receipt.docstatus === 0 && (
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
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {receipt.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light }}>
                  <Text style={[styles.infoLabel, { color: colors.orange_600, marginBottom: spacing.xs, fontSize: 10, textTransform: 'uppercase' }]}>{item.item_code}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.sm }}>{item.item_name}</Text>
                  
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Warehouse</Text>
                    <Text style={{ fontSize: 12, color: colors.text_secondary }}>{item.warehouse || '—'}</Text>
                  </View>

                  {item.serial_no ? (
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Serial No</Text>
                      <Text style={{ fontSize: 12, color: colors.text_secondary }}>{item.serial_no}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border_light, paddingTop: spacing.sm }}>
                    <View>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Quantity</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.qty} {item.stock_uom || item.uom}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Rate</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.rate, receipt.currency || 'INR')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Amount</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.amount, receipt.currency || 'INR')}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'taxes' && (
            <View>
              <VerticalInfoRow label="Tax Category" value={receipt.tax_category} icon={Layers} />
              <VerticalInfoRow label="Taxes Template" value={receipt.taxes_and_charges} icon={FileBadge} />
              <View style={{ marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.green_50, borderRadius: borderRadius.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={{ color: colors.text_secondary }}>Total Qty</Text>
                  <Text style={{ fontWeight: 'bold' }}>{receipt.total_qty}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <Text style={{ color: colors.text_secondary }}>Total Net Weight</Text>
                  <Text style={{ fontWeight: 'bold' }}>{receipt.total_net_weight}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.green_200, paddingTop: spacing.sm }}>
                  <Text style={{ color: colors.text_primary, fontWeight: 'bold' }}>Grand Total</Text>
                  <Text style={{ color: colors.green_600, fontWeight: '900', fontSize: 18 }}>{formatCurrency(receipt.grand_total, receipt.currency || 'INR')}</Text>
                </View>
              </View>
            </View>
          )}

          {section.id === 'audit' && (
            <View>
              <VerticalInfoRow label="Owner" value={receipt.owner} icon={User} />
              <VerticalInfoRow label="Created On" value={receipt.creation?.split('.')[0]} icon={Clock} />
              <VerticalInfoRow label="Last Modified" value={receipt.modified?.split('.')[0]} icon={Clock} />
              {receipt.remarks && (
                <View style={[styles.descriptionContainer, { marginTop: spacing.md }]}>
                  <Text style={[styles.infoLabel, { marginBottom: 4, color: titleColor, fontSize: 10, textTransform: 'uppercase' }]}>Remarks</Text>
                  <Text style={styles.descriptionText}>{receipt.remarks}</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [receipt, handleEdit, handleSubmit, isSubmitting]);

  if (isLoading && !receipt) {
    return (
      <ModuleLayout title={receiptId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={receipt?.name || receiptId} showBack>
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
          refreshControl={
            <RefreshControl 
              refreshing={isRefetching} 
              onRefresh={refetch} 
              tintColor={colors.primary} 
            />
          }
        />
      </View>
    </ModuleLayout>
  );
}
