import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, ScrollView, Dimensions, TouchableOpacity, Alert, Linking, DeviceEventEmitter, Modal } from 'react-native';
import { 
  User, Calendar, Clock, FileText, Send, RefreshCcw, Eye, Ban, ArrowRight, Package, Tag, Edit, CheckCircle2, ChevronRight, Truck, Receipt, Wrench, PackagePlus, ShoppingCart, Briefcase, Banknote, ListChecks, Plus, X
} from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { styles } from '../../../stock/screens/itemDetail/styles';
import detailStyles from './styles';
import { colors, spacing } from '../../../../core/theme';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSalesOrderDetail } from '../../hooks/sellingQueries';
import { sellingService } from '../../services/salesOrderService';
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

export function SalesOrderDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params;
  
  const [user, setUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  const { data: order, isLoading, isRefetching, refetch } = useSalesOrderDetail(orderId);

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
  }, []);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = useCallback(() => {
    navigation.navigate('NewSalesOrder', { orderId });
  }, [navigation, orderId]);

  const handleSubmit = async () => {
    Alert.alert('Submit Order', 'Are you sure you want to submit this sales order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        try {
          setSaving(true);
          await sellingService.submitSalesOrder(order);
          DeviceEventEmitter.emit('sales_orders_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to submit order');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this sales order?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
        try {
          setSaving(true);
          await sellingService.cancelSalesOrder(orderId);
          DeviceEventEmitter.emit('sales_orders_updated');
          refetch();
        } catch (err: any) {
          Alert.alert('Error', err.message || 'Failed to cancel order');
        } finally {
          setSaving(false);
        }
      }}
    ]);
  };

  const handleViewPDF = () => {
    const pdfUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=Sales Order&name=${orderId}&format=Standard&no_letterhead=0`;
    Linking.openURL(pdfUrl).catch(err => console.error("PDF Error", err));
  };

  const sections = useMemo(() => [
    { id: 'basic', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Totals & Taxes', icon: Tag, type: 'green' },
  ], []);

  const isDraft = order?.docstatus === 0;
  const isSubmitted = order?.docstatus === 1;

  const renderSection = useCallback(({ item: section }: { item: any }) => {
    if (!order) return null;
    
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
                  <ShoppingCart size={40} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text_primary, marginTop: spacing.sm }}>{order.name}</Text>
                <View style={{ 
                  backgroundColor: order.docstatus === 1 ? colors.green_100 : order.docstatus === 2 ? colors.red_100 : colors.blue_100,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginTop: 4
                }}>
                  <Text style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: order.docstatus === 1 ? colors.green_600 : order.docstatus === 2 ? colors.error : colors.blue_600 
                  }}>{order.status}</Text>
                </View>
              </View>
              
              <VerticalInfoRow label="Customer" value={order.customer_name || order.customer} icon={User} />
              <VerticalInfoRow label="Order Date" value={formatDate(order.transaction_date)} icon={Calendar} />
              <VerticalInfoRow label="Delivery Date" value={formatDate(order.delivery_date)} icon={Truck} />
              <VerticalInfoRow label="Company" value={order.company} icon={Tag} />
            </View>
          )}

          {section.id === 'items' && (
            <View>
              {order.items?.map((item: any, idx: number) => (
                <View key={idx} style={{ paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border_light }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{item.item_name || item.item_code}</Text>
                      <Text style={{ fontSize: 12, color: colors.text_tertiary, marginTop: 2 }}>{item.qty} {item.uom} x {formatCurrency(item.rate, order.currency)}</Text>
                      <Text style={{ fontSize: 10, color: colors.text_tertiary }}>Warehouse: {item.warehouse}</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text_primary }}>{formatCurrency(item.amount, order.currency)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {section.id === 'totals' && (
            <View>
              <VerticalInfoRow label="Net Total" value={formatCurrency(order.net_total, order.currency)} />
              <VerticalInfoRow label="Taxes" value={formatCurrency(order.total_taxes_and_charges, order.currency)} />
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
                <Text style={{ fontSize: 20, fontWeight: '900', color: colors.primary }}>{formatCurrency(order.grand_total, order.currency)}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    );
  }, [order, isDraft, handleEdit]);

  if (isLoading && !order) {
    return (
      <ModuleLayout title={orderId} showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  const actionOptions = [
    { name: 'Pick List', icon: ListChecks, color: colors.blue_500, bgColor: colors.blue_50 },
    { name: 'Delivery Note', icon: Truck, color: colors.green_500, bgColor: colors.green_100 },
    { name: 'Work Order', icon: Wrench, color: colors.orange_500, bgColor: colors.orange_100 },
    { name: 'Sales Invoice', icon: Receipt, color: colors.error, bgColor: colors.red_100 },
    { name: 'Material Request', icon: PackagePlus, color: colors.purple_500, bgColor: colors.purple_100 },
    { name: 'Purchase Order', icon: ShoppingCart, color: colors.teal_500, bgColor: colors.teal_100 },
    { name: 'Project', icon: Briefcase, color: colors.blue_500, bgColor: colors.blue_50 },
    { name: 'Payment Request', icon: Send, color: colors.error, bgColor: colors.red_100 },
    { name: 'Payment', icon: Banknote, color: colors.teal_500, bgColor: colors.teal_100 },
  ];

  return (
    <ModuleLayout 
      title={order?.name || orderId} 
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
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Submit Order</Text>
            </TouchableOpacity>
          ) : isSubmitted && order?.status !== 'Cancelled' && order?.status !== 'Closed' ? (
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
                onPress={() => setShowActions(true)} 
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
                <Plus size={18} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Create...</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <Modal
          visible={showActions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowActions(false)}
        >
          <View style={detailStyles.modalOverlay}>
            <TouchableOpacity 
              style={detailStyles.modalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowActions(false)} 
            />
            <View style={detailStyles.modalContent}>
              <View style={detailStyles.modalHeader}>
                <Text style={detailStyles.modalTitle}>Create Linked Document</Text>
                <TouchableOpacity onPress={() => setShowActions(false)}>
                  <X size={24} color={colors.neutral_400} />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={detailStyles.actionGrid}>
                    {actionOptions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <TouchableOpacity 
                            key={idx} 
                            style={detailStyles.gridActionItem}
                            onPress={() => {
                              setShowActions(false);
                              Alert.alert('Create ' + action.name, `Creating ${action.name} from Sales Order is coming soon.`);
                            }}
                        >
                            <View style={[detailStyles.gridIconBox, { backgroundColor: action.bgColor }]}>
                              <Icon size={24} color={action.color} />
                            </View>
                            <Text style={detailStyles.gridActionText} numberOfLines={2}>{action.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ModuleLayout>
  );
}
