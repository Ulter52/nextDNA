import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Modal,
  Dimensions,
  Linking
} from 'react-native';
import { 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Calendar, 
  User, 
  FileText,
  Send,
  Edit2,
  X,
  Package,
  RefreshCcw,
  Plus,
  Truck,
  Receipt,
  CreditCard,
  ListChecks,
  Briefcase,
  Layers,
  ShoppingBag,
  Eye,
  Ban,
  ChevronRight,
  Wrench,
  PackagePlus,
  ShoppingCart,
  Banknote
} from 'lucide-react-native';
import { sellingService } from '@sellingServices/salesOrderService';
import { ItemSelector } from '@sellingComponents/ItemSelector';
import { ModuleLayout } from '@components/ModuleLayout';
import { BASE_URL } from '@core/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';
import styles from  './styles';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function SalesOrderDetail() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const [itemsMaster, setItemsMaster] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchOrder();
    fetchMasterData();
  }, [orderId]);

  const fetchMasterData = async () => {
    try {
      const i = await sellingService.getItems();
      setItemsMaster(i);
    } catch (err) {
      console.error("Failed to fetch master data", err);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sellingService.getSalesOrder(orderId);
      if (!data) {
        throw new Error("Order not found");
      }
      setOrder(data);
      setFormData({
        customer: data.customer,
        delivery_date: data.delivery_date,
        transaction_date: data.transaction_date,
        po_no: data.po_no || '',
        modified: data.modified, 
        items: data.items.map((item: any) => ({
          name: item.name,
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          price_list_rate: item.price_list_rate || item.rate,
          discount_amount: item.discount_amount || 0,
          amount: item.amount,
          warehouse: item.warehouse,
          item_tax_template: item.item_tax_template || ''
        }))
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'item_code') {
      const selectedItem = itemsMaster.find(i => i.name === value);
      if (selectedItem) {
        const details = await sellingService.getItemDetails(value);
        const price = await sellingService.getItemPrice(value, order?.selling_price_list || 'Standard Selling');
        item.price_list_rate = price || selectedItem.standard_rate || 0;
        item.rate = item.price_list_rate;
        item.discount_amount = 0;
        item.item_tax_template = details?.item_tax_template || '';
      }
    }
    
    const qty = item.qty || 0;
    const price_list_rate = item.price_list_rate || 0;
    
    if (field === 'discount_amount') {
      item.rate = qty > 0 ? (price_list_rate - (value / qty)) : price_list_rate;
    } else if (field === 'rate') {
      item.discount_amount = qty > 0 ? (price_list_rate - value) * qty : 0;
    } else if (field === 'qty' || field === 'item_code') {
      item.discount_amount = (price_list_rate - item.rate) * qty;
    }
    
    item.amount = qty * item.rate;
    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const latest = await sellingService.getSalesOrder(orderId);
      const dataToSave = { 
        ...formData, 
        modified: latest.modified,
        doctype: 'Sales Order',
        name: orderId 
      };
      
      const updated = await sellingService.updateSalesOrder(orderId, dataToSave);
      setOrder(updated);
      setIsEditing(false);
      setSuccess('Order saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to save order';
      if (err.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(err.response.data._server_messages);
          msg = messages.map((m: any) => JSON.parse(m).message).join(', ');
        } catch (e) {
          msg = err.response.data.message || msg;
        }
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Submit Order',
      'Are you sure you want to submit this order? Once submitted, it cannot be edited.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Submit', 
          onPress: async () => {
            try {
              setSaving(true);
              setError(null);
              const latestDoc = await sellingService.getSalesOrder(orderId);
              await sellingService.submitSalesOrder(latestDoc);
              setSuccess('Order submitted successfully');
              fetchOrder(); 
              setTimeout(() => setSuccess(null), 3000);
            } catch (err: any) {
              console.error('Submit failed:', err.response?.data || err.message);
              let msg = 'Failed to submit order';
              if (err.response?.data?._server_messages) {
                try {
                  const messages = JSON.parse(err.response.data._server_messages);
                  msg = messages.map((m: any) => JSON.parse(m).message).join(', ');
                } catch (e) {
                  msg = err.response.data.message || msg;
                }
              }
              setError(msg);
              if (msg.includes('modified after you have opened it')) {
                fetchOrder();
              }
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              setError(null);
              await sellingService.cancelSalesOrder(orderId);
              setSuccess('Order cancelled successfully');
              fetchOrder();
              setTimeout(() => setSuccess(null), 3000);
            } catch (err: any) {
              console.error('Cancel failed:', err.response?.data || err.message);
              let msg = 'Failed to cancel order';
              if (err.response?.data?._server_messages) {
                try {
                  const messages = JSON.parse(err.response.data._server_messages);
                  msg = messages.map((m: any) => JSON.parse(m).message).join(', ');
                } catch (e) {
                  msg = err.response.data.message || msg;
                }
              }
              setError(msg);
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleViewPDF = async () => {
    const pdfUrl = `${BASE_URL}/api/method/frappe.utils.print_format.download_pdf?doctype=Sales Order&name=${orderId}&format=Standard&no_letterhead=0`;
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert("Error", "Unable to open PDF link on this device.");
      }
    } catch (error) {
      console.error("PDF Error:", error);
    }
  };

  const handleCreateAction = (action: string) => {
    setShowActions(false);
    Alert.alert('Create ' + action, `This feature to create ${action} from Sales Order is currently being implemented.`);
  };

  if (loading && !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading Order...</Text>
      </View>
    );
  }

  const isDraft = order?.docstatus === 0;
  const isSubmitted = order?.docstatus === 1;
  const isCancelled = order?.docstatus === 2;
  const isCompleted = order?.status === 'Completed';

  const actionOptions = [
    { name: 'Pick List', icon: ListChecks, color: '#3b82f6', bgColor: '#eff6ff' },
    { name: 'Delivery Note', icon: Truck, color: '#22c55e', bgColor: '#f0fdf4' },
    { name: 'Work Order', icon: Wrench, color: '#f97316', bgColor: '#fff7ed' },
    { name: 'Sales Invoice', icon: Receipt, color: '#ef4444', bgColor: '#fef2f2' },
    { name: 'Material Request', icon: PackagePlus, color: '#6366f1', bgColor: '#eef2ff' },
    { name: 'Purchase Order', icon: ShoppingCart, color: '#a855f7', bgColor: '#faf5ff' },
    { name: 'Project', icon: Briefcase, color: '#0ea5e9', bgColor: '#f0f9ff' },
    { name: 'Payment Request', icon: Send, color: '#f43f5e', bgColor: '#fff1f2' },
    { name: 'Payment', icon: Banknote, color: '#14b8a6', bgColor: '#f0fdfa' },
  ];

  return (
    <ModuleLayout 
      title={order?.name || "Order Detail"} 
      user={user} 
      showBack={true}
      headerRight={
        <TouchableOpacity onPress={fetchOrder} style={{ padding: 8 }}>
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
          {error && (
            <View style={styles.errorBox}>
              <AlertCircle size={18} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>Order Details</Text>
              <View style={styles.statusRow}>
                  <View style={[
                    styles.statusBadge, 
                    isSubmitted ? styles.submittedBadge : isCancelled ? styles.cancelledBadge : styles.draftBadge
                  ]}>
                      <Text style={[
                        styles.statusText, 
                        isSubmitted ? styles.submittedText : isCancelled ? styles.cancelledText : styles.draftText
                      ]}>
                          {order?.status}
                      </Text>
                  </View>
                  {isDraft && !isEditing && (
                    <TouchableOpacity 
                      onPress={() => setIsEditing(true)}
                      style={styles.editButton}
                    >
                      <Edit2 size={16} color="#2563eb" />
                    </TouchableOpacity>
                  )}
              </View>
              {isEditing && (
                <TouchableOpacity 
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelEditButton}
                >
                  <X size={16} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Customer</Text>
                <View style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={18} color="#9ca3af" />
                  <TextInput 
                    editable={false}
                    value={order?.customer_name || order?.customer}
                    style={[styles.input, styles.inputDisabled]}
                  />
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Order Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                    <TextInput 
                      editable={isEditing}
                      value={formData.transaction_date || ''}
                      onChangeText={(text) => setFormData({ ...formData, transaction_date: text })}
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Delivery Date</Text>
                  <View style={styles.inputWrapper}>
                    <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                    <TextInput 
                      editable={isEditing}
                      value={formData.delivery_date || ''}
                      onChangeText={(text) => setFormData({ ...formData, delivery_date: text })}
                      style={[styles.input, !isEditing && styles.inputDisabled]}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Items Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTag}>Items ({order?.items?.length || 0})</Text>
              <Package size={16} color="#d1d5db" />
            </View>

            <View style={styles.itemsList}>
              {(isEditing ? formData.items : order?.items)?.map((item: any, idx: number) => (
                <View key={idx} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemIconBox}>
                      <Package size={20} color="#2563eb" />
                    </View>
                    <View style={styles.itemMeta}>
                      {isEditing ? (
                        <ItemSelector 
                          items={itemsMaster}
                          value={item.item_code}
                          onChange={(val) => updateItem(idx, 'item_code', val)}
                        />
                      ) : (
                        <>
                          <Text style={styles.itemName} numberOfLines={1}>{item.item_name || item.item_code}</Text>
                          <Text style={styles.itemCode}>Code: {item.item_code}</Text>
                        </>
                      )}
                    </View>
                    {!isEditing && (
                      <View style={styles.itemPriceInfo}>
                        <Text style={styles.itemAmount}>{order?.currency} {item.amount?.toLocaleString()}</Text>
                        <Text style={styles.itemRate}>Rate: {item.rate}</Text>
                      </View>
                    )}
                  </View>

                  {item.item_tax_template && !isEditing ? (
                    <View style={styles.itemTaxBadge}>
                      <Text style={styles.itemTaxText}>Tax: {item.item_tax_template}</Text>
                    </View>
                  ) : null}

                  {isEditing && (
                    <View style={styles.itemEditForm}>
                      <View style={styles.gridRow}>
                        <View style={styles.gridCol}>
                          <Text style={styles.subLabel}>Qty</Text>
                          <TextInput 
                            keyboardType="numeric"
                            value={String(item.qty)}
                            onChangeText={(text) => updateItem(idx, 'qty', parseFloat(text) || 0)}
                            style={styles.gridInput}
                          />
                        </View>
                        <View style={styles.gridCol}>
                          <Text style={styles.subLabel}>Warehouse</Text>
                          <TextInput 
                            editable={false}
                            value={item.warehouse}
                            style={[styles.gridInput, styles.inputDisabled]}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Net Total</Text>
                <Text style={styles.totalValue}>{order?.currency} {order?.net_total?.toLocaleString()}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Taxes</Text>
                <Text style={styles.totalValue}>{order?.currency} {order?.total_taxes_and_charges?.toLocaleString()}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>Grand Total</Text>
                <Text style={styles.grandTotalValue}>{order?.currency} {order?.grand_total?.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footerActions}>
          {isEditing ? (
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
                <Text style={styles.saveBtnText}>Save Order</Text>
              </TouchableOpacity>
            </View>
          ) : isDraft ? (
            <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.submitBtn}>
              {saving ? <ActivityIndicator color="#fff" /> : <Send size={18} color="#fff" />}
              <Text style={styles.submitBtnText}>Submit Order</Text>
            </TouchableOpacity>
          ) : isSubmitted && !isCompleted ? (
            <View style={styles.multiActionRow}>
                <TouchableOpacity onPress={handleViewPDF} style={styles.secondaryActionBtn}>
                  <Eye size={18} color="#4b5563" />
                  <Text style={styles.secondaryActionText}>View PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} disabled={saving} style={styles.secondaryActionBtn}>
                  <Ban size={18} color="#dc2626" />
                  <Text style={[styles.secondaryActionText, { color: '#dc2626' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowActions(true)} style={styles.primaryActionBtn}>
                  <Plus size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>Create...</Text>
                </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Action Grid Modal */}
        <Modal
          visible={showActions}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowActions(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity 
              style={styles.modalBackdrop} 
              activeOpacity={1} 
              onPress={() => setShowActions(false)} 
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Linked Document</Text>
                <TouchableOpacity onPress={() => setShowActions(false)}>
                  <X size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                <View style={styles.actionGrid}>
                    {actionOptions.map((action, idx) => {
                      const Icon = action.icon;
                      return (
                        <TouchableOpacity 
                            key={idx} 
                            style={styles.gridActionItem}
                            onPress={() => handleCreateAction(action.name)}
                        >
                            <View style={[styles.gridIconBox, { backgroundColor: action.bgColor }]}>
                            <Icon size={24} color={action.color} />
                            </View>
                            <Text style={styles.gridActionText} numberOfLines={2}>{action.name}</Text>
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


