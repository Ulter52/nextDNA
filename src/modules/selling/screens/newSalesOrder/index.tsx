import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { 
  Save, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import { sellingService } from '@sellingServices/salesOrderService';
import { customerService } from '@sellingServices/customerService';
import { ItemSelector } from '@sellingComponents/ItemSelector';
import { CustomerSelector } from '@sellingComponents/CustomerSelector';
import { WarehouseSelector } from '@sellingComponents/WarehouseSelector';
import { CompanySelector } from '@sellingComponents/CompanySelector';
import { TaxCategorySelector } from '@sellingComponents/TaxCategorySelector';
import { SalesTaxesTemplateSelector } from '@sellingComponents/SalesTaxesTemplateSelector';
import { ModuleLayout } from '@core/components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from './styles';

export function NewSalesOrder() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [taxCategories, setTaxCategories] = useState<any[]>([]);
  const [taxTemplates, setTaxTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    company: '',
    customer: '',
    transaction_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date().toISOString().split('T')[0],
    tax_category: '',
    taxes_and_charges: '',
    set_warehouse: '',
    items: [{ item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0, warehouse: '', item_tax_template: '' }],
    taxes: [] as any[],
    currency: 'INR',
    selling_price_list: 'Standard Selling'
  });

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customerData, itemData, companyData, warehouseData, taxCatData] = await Promise.all([
        customerService.getCustomers(),
        sellingService.getItems(),
        sellingService.getCompanies(),
        sellingService.getWarehouses(),
        sellingService.getTaxCategories()
      ]);
      setCustomers(customerData);
      setItems(itemData);
      setCompanies(companyData);
      setWarehouses(warehouseData);
      setTaxCategories(taxCatData);
      
      if (companyData && companyData.length > 0) {
        const defaultCo = companyData[0];
        setFormData(prev => ({ 
          ...prev, 
          company: defaultCo.name,
          currency: defaultCo.default_currency || 'INR',
          selling_price_list: 'Standard Selling'
        }));
        const templates = await sellingService.getSalesTaxesTemplates(defaultCo.name);
        setTaxTemplates(templates);
      }
    } catch (err) {
      setError('Failed to load required data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = async (companyName: string) => {
    const co = companies.find(c => c.name === companyName);
    setFormData({ 
      ...formData, 
      company: companyName,
      currency: co?.default_currency || 'INR',
      selling_price_list: 'Standard Selling',
      taxes_and_charges: '',
      taxes: []
    });
    const templates = await sellingService.getSalesTaxesTemplates(companyName);
    setTaxTemplates(templates);
  };

  const handleTaxTemplateChange = async (templateName: string) => {
    try {
      const detail = await sellingService.getSalesTaxesTemplateDetail(templateName);
      setFormData({
        ...formData,
        taxes_and_charges: templateName,
        taxes: detail.taxes || []
      });
    } catch (err) {
      console.error("Failed to fetch tax template details", err);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0, warehouse: formData.set_warehouse || '', item_tax_template: '' }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = async (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const item = { ...newItems[index], [field]: value };
    
    if (field === 'item_code') {
      const selectedItem = items.find(i => i.name === value);
      if (selectedItem) {
        // Fetch full details to get item_tax_template securely
        const details = await sellingService.getItemDetails(value);
        console.log('Item Details for ' + value + ':', details);
        
        const price = await sellingService.getItemPrice(value, formData.selling_price_list);
        
        item.price_list_rate = price || selectedItem.standard_rate || 0;
        item.rate = item.price_list_rate;
        item.discount_amount = 0;
        item.warehouse = formData.set_warehouse || item.warehouse;
        
        // Pick item tax template: priority to child table 'taxes', then main field
        let taxTemplate = details?.item_tax_template || '';
        if (details?.taxes && details.taxes.length > 0) {
           taxTemplate = details.taxes[0].item_tax_template;
           console.log('Using first tax template from child table:', taxTemplate);
        }
        item.item_tax_template = taxTemplate;
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

  const handleCommonWarehouseChange = (warehouse: string) => {
    setFormData({
      ...formData,
      set_warehouse: warehouse,
      items: formData.items.map(item => ({ ...item, warehouse }))
    });
  };

  const handleSave = async () => {
    if (!formData.company) return setError('Please select a company');
    if (!formData.customer) return setError('Please select a customer');
    if (formData.items.some(i => !i.item_code)) return setError('Please select items');
    if (formData.items.some(i => !i.warehouse)) return setError('Please select warehouses');

    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          delivery_date: formData.delivery_date
        }))
      };

      const newOrder = await sellingService.createSalesOrder(payload);
      setSuccess('Sales Order created successfully');
      setTimeout(() => {
        navigation.replace('SalesOrderDetail', { orderId: newOrder.name });
      }, 1500);
    } catch (err: any) {
      console.error(err);
      let msg = 'Failed to create Sales Order';
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ModuleLayout title="New Order" user={user} showBack={true}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
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

        {/* Header Details Card */}
        <View style={styles.card}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Company</Text>
              <CompanySelector 
                companies={companies}
                value={formData.company}
                onChange={handleCompanyChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Customer</Text>
              <CustomerSelector 
                customers={customers}
                value={formData.customer}
                onChange={(val) => setFormData({ ...formData, customer: val })}
              />
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Transaction Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                  <TextInput 
                    value={formData.transaction_date}
                    onChangeText={(text) => setFormData({ ...formData, transaction_date: text })}
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Delivery Date</Text>
                <View style={styles.inputWrapper}>
                  <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                  <TextInput 
                    value={formData.delivery_date}
                    onChangeText={(text) => setFormData({ ...formData, delivery_date: text })}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tax Category</Text>
              <TaxCategorySelector 
                categories={taxCategories}
                value={formData.tax_category}
                onChange={(val) => setFormData({ ...formData, tax_category: val })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sales Taxes and Charges Template</Text>
              <SalesTaxesTemplateSelector 
                templates={taxTemplates}
                value={formData.taxes_and_charges}
                onChange={handleTaxTemplateChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Common Warehouse</Text>
              <WarehouseSelector 
                warehouses={warehouses}
                value={formData.set_warehouse}
                onChange={handleCommonWarehouseChange}
                placeholder="Set for all items"
              />
            </View>
          </View>
        </View>

        {/* Items Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTag}>Items</Text>
            <TouchableOpacity onPress={addItem} style={styles.addItemBtn}>
              <Plus size={16} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.itemsList}>
            {formData.items.map((item, idx) => (
              <View key={idx} style={styles.itemCard}>
                {formData.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)} style={styles.removeBtn}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Item</Text>
                  <ItemSelector 
                    items={items}
                    value={item.item_code}
                    onChange={(val) => updateItem(idx, 'item_code', val)}
                  />
                </View>

                <View style={styles.gridRow}>
                  <View style={[styles.inputGroup, { flex: 2 }]}>
                    <Text style={styles.label}>Warehouse</Text>
                    <WarehouseSelector 
                      warehouses={warehouses}
                      value={item.warehouse}
                      onChange={(val) => updateItem(idx, 'warehouse', val)}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={String(item.qty)}
                      onChangeText={(text) => updateItem(idx, 'qty', parseFloat(text) || 0)}
                      style={styles.subInput}
                    />
                  </View>
                </View>

                {item.item_tax_template ? (
                  <View style={styles.taxInfo}>
                    <Text style={styles.taxInfoText}>Tax Template: {item.item_tax_template}</Text>
                  </View>
                ) : null}

                <View style={styles.gridRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Price List Rate</Text>
                    <TextInput editable={false} value={String(item.price_list_rate)} style={[styles.subInput, styles.inputDisabled]} />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Discount Amt</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={String(item.discount_amount)}
                      onChangeText={(text) => updateItem(idx, 'discount_amount', parseFloat(text) || 0)}
                      style={styles.subInput}
                    />
                  </View>
                </View>

                <View style={styles.gridRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Rate</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={String(item.rate)}
                      onChangeText={(text) => updateItem(idx, 'rate', parseFloat(text) || 0)}
                      style={styles.subInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput editable={false} value={String(item.amount)} style={[styles.subInput, styles.amountInput]} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.submitBtn}>
          {saving ? <ActivityIndicator color="#fff" /> : <Save size={18} color="#fff" />}
          <Text style={styles.submitBtnText}>Create Sales Order</Text>
        </TouchableOpacity>
      </View>
    </ModuleLayout>
  );
}
