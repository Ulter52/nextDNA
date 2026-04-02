import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { 
  ShoppingCart, Package, Calendar, MapPin, Clock, Edit,
  FileText, User, Info, CreditCard, Truck,
  Briefcase, Hash, Landmark, Building2, Send
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import { colors, spacing, borderRadius } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usePurchaseOrderDetail, useSubmitPurchaseOrder } from '../../hooks/purchaseOrderQueries';
import { formatCurrency } from '../../../../core/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VerticalInfoRow = React.memo(({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
  <View style={[styles.infoRow, { flexDirection: 'column', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.border_light, paddingVertical: spacing.md }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {Icon && <Icon size={12} color={colors.text_tertiary} />}
      <Text style={[styles.infoLabel, { textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, fontWeight: '700' }]}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, { textAlign: 'left', fontSize: 14, color: colors.text_primary, fontWeight: '600' }]}>{value || '—'}</Text>
  </View>
));

export function PurchaseOrderDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params;
  
  const { data: order, isLoading, isRefetching, refetch } = usePurchaseOrderDetail(orderId);
  const submitMutation = useSubmitPurchaseOrder();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = useCallback(() => {
    navigation.navigate('PurchaseOrderEdit', { orderId });
  }, [navigation, orderId]);

  const handleSubmit = useCallback(() => {
    Alert.alert(
      "Submit Purchase Order",
      "Are you sure you want to submit this order? This action is irreversible.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Submit", 
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await submitMutation.mutateAsync(orderId);
              Alert.alert("Success", "Purchase Order submitted successfully");
            } catch (err: any) {
              let msg = 'Failed to submit order';
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
  }, [orderId, submitMutation]);

  const sections = useMemo(() => [
    { id: 'overview', title: 'Overview', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items List', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Taxes & Totals', icon: CreditCard, type: 'green' },
  ], []);

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!order) return null;
    
    const SectionIcon = section.icon;
    const cardStyle = [
      styles.sectionCard,
      section.type === 'blue' && styles.blueCard,
      section.type === 'orange' && styles.orangeCard,
      section.type === 'green' && styles.greenCard,
    ];

    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : section.type === 'green' ? 'green_500' : 'teal_500'];

    return (
      <View style={cardStyle}>
        <View style={[styles.cardTitleRow, { justifyContent: 'space-between' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SectionIcon size={22} color={titleColor} strokeWidth={2.5} />
            <Text style={[styles.cardTitle, { color: titleColor }]}>{section.title}</Text>
          </View>
          {section.id === 'overview' && order.docstatus === 0 && (
            <TouchableOpacity onPress={handleEdit} activeOpacity={0.7}>
              <Edit size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'overview' && (
            <View>
              <VerticalInfoRow label="Status" value={order.status} icon={Clock} />
              <VerticalInfoRow label="Supplier" value={order.supplier} icon={User} />
              <VerticalInfoRow label="Date" value={order.transaction_date} icon={Calendar} />
              <VerticalInfoRow label="Required By" value={order.schedule_date} icon={Calendar} />
              <VerticalInfoRow label="Company" value={order.company} icon={Building2} />
              <VerticalInfoRow label="Project" value={order.project} icon={Briefcase} />

              {order.docstatus === 0 && (
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
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>Submit Order</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {order.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ marginBottom: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border_light }}>
                  <Text style={[styles.infoLabel, { color: colors.orange_600, marginBottom: spacing.xs, fontSize: 10, textTransform: 'uppercase' }]}>{item.item_code}</Text>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary, marginBottom: spacing.sm }}>{item.item_name}</Text>
                  
                  <View style={{ marginBottom: spacing.sm }}>
                    <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Required By</Text>
                    <Text style={{ fontSize: 12, color: colors.text_secondary }}>{item.schedule_date || '—'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border_light, paddingTop: spacing.sm }}>
                    <View>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Quantity</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{item.qty} {item.uom}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Rate</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.rate, order.currency || 'INR')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 9, color: colors.text_tertiary, textTransform: 'uppercase', fontWeight: 'bold' }}>Amount</Text>
                        <Text style={{ fontSize: 13, fontWeight: 'bold' }}>{formatCurrency(item.amount, order.currency || 'INR')}</Text>
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
                  <Text style={{ color: colors.text_secondary }}>Net Total</Text>
                  <Text style={{ fontWeight: 'bold' }}>{formatCurrency(order.net_total, order.currency || 'INR')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.green_200, paddingTop: spacing.sm }}>
                  <Text style={{ color: colors.text_primary, fontWeight: 'bold' }}>Grand Total</Text>
                  <Text style={{ color: colors.green_600, fontWeight: '900', fontSize: 18 }}>{formatCurrency(order.grand_total, order.currency || 'INR')}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [order, handleEdit, handleSubmit, isSubmitting]);

  if (isLoading && !order) {
    return (
      <ModuleLayout title={orderId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title={order?.name || orderId} showBack>
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
      </View>
    </ModuleLayout>
  );
}
