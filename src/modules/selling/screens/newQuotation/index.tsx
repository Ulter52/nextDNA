import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
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
  Package,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react-native';
import { sellingService } from '@sellingServices/salesOrderService';
import { quotationService } from '@sellingServices/quotationService';
import { customerService } from '@sellingServices/customerService';
import { ItemSelector } from '@sellingComponents/ItemSelector';
import { CustomerSelector } from '@sellingComponents/CustomerSelector';
import { CompanySelector } from '@sellingComponents/CompanySelector';
import { SalesTaxesTemplateSelector } from '@sellingComponents/SalesTaxesTemplateSelector';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from '../newSalesOrder/styles';

export function NewQuotation() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [taxTemplates, setTaxTemplates] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    company: '',
    quotation_to: 'Customer',
    party_name: '',
    transaction_date: new Date().toISOString().split('T')[0],
    valid_till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxes_and_charges: '',
    items: [{ item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0 }],
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
      const [customerData, itemData, companyData] = await Promise.all([
        customerService.getCustomers(),
        sellingService.getItems(),
        sellingService.getCompanies()
      ]);
      setCustomers(customerData);
      setItems(itemData);
      setCompanies(companyData);
      
      if (companyData && companyData.length > 0) {
        const defaultCo = companyData[0];
        setFormData(prev => ({ 
          ...prev, 
          company: defaultCo.name,
          currency: defaultCo.default_currency || 'INR'
        }));
        const templates = await sellingService.getSalesTaxesTemplates(defaultCo.name);
        setTaxTemplates(templates);
      }
    } catch (err) {
      setError('Failed to load required data');
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
      items: [...formData.items, { item_code: '', qty: 1, rate: 0, price_list_rate: 0, discount_amount: 0, amount: 0 }]
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
        const price = await sellingService.getItemPrice(value, formData.selling_price_list);
        item.price_list_rate = price || selectedItem.standard_rate || 0;
        item.rate = item.price_list_rate;
        item.discount_amount = 0;
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
    if (!formData.company) return setError('Please select a company');
    if (!formData.party_name) return setError('Please select a customer');
    if (formData.items.some(i => !i.item_code)) return setError('Please select items');

    try {
      setSaving(true);
      setError(null);
      
      const newQuotation = await quotationService.createQuotation(formData);
      setSuccess('Quotation created successfully');
      setTimeout(() => {
        navigation.replace('QuotationDetail', { quotationId: newQuotation.name });
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create Quotation');
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
    <ModuleLayout title="New Quotation" user={user} showBack={true}>
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
                value={formData.party_name}
                onChange={(val) => setFormData({ ...formData, party_name: val })}
              />
            </View>

            <View style={styles.gridRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Date</Text>
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
                <Text style={styles.label}>Valid Till</Text>
                <View style={styles.inputWrapper}>
                  <Calendar style={styles.inputIcon} size={18} color="#9ca3af" />
                  <TextInput 
                    value={formData.valid_till}
                    onChangeText={(text) => setFormData({ ...formData, valid_till: text })}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Taxes and Charges</Text>
              <SalesTaxesTemplateSelector 
                templates={taxTemplates}
                value={formData.taxes_and_charges}
                onChange={handleTaxTemplateChange}
              />
            </View>
          </View>
        </View>

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
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Qty</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={String(item.qty)}
                      onChangeText={(text) => updateItem(idx, 'qty', parseFloat(text) || 0)}
                      style={styles.subInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Rate</Text>
                    <TextInput 
                      keyboardType="numeric"
                      value={String(item.rate)}
                      onChangeText={(text) => updateItem(idx, 'rate', parseFloat(text) || 0)}
                      style={styles.subInput}
                    />
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
          <Text style={styles.submitBtnText}>Create Quotation</Text>
        </TouchableOpacity>
      </View>
    </ModuleLayout>
  );
}
