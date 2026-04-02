import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text } from 'react-native';
import { FileText, Package, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { BarcodeScanner } from '../../../../core/components/BarcodeScanner';
import { SerialNoModal } from '../../../../core/components/serialNoModal';
import { useDebounce } from '../../../../core/utils/debounce';
import { colors, spacing } from '../../../../core/theme';
import { styles as detailStyles } from '../../../stock/screens/itemDetail/styles';

import { 
  usePurchaseInvoiceDetail, 
  useSavePurchaseInvoice,
  usePISuppliers,
  usePIItems,
} from '../../hooks/purchaseInvoiceQueries';
import { metadataService } from '../../../../core/services/metadataService';
import { companyService } from '../../../../core/services/companyService';
import { stockApi } from '../../../stock/services/stockApi';

import { HeaderSection } from '../../../../core/components/HeaderSection';
import { ItemsSection } from '../../../../core/components/ItemsSection';
import { TotalsSection } from '../../../../core/components/TotalsSection';
import { SaveSection } from '../../../../core/components/SaveSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PurchaseInvoiceEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { invoiceId } = route.params || {};
  const isEdit = !!invoiceId;

  // --- Search & Metadata State ---
  const [itemSearch, setItemSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [company, setCompany] = useState('');
  
  const [extraMeta, setExtraMeta] = useState<any>({ 
    projects: [], 
    costCenters: [], 
    taxCategories: [], 
    taxTemplates: [],
    warehouses: [] 
  });

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isSerialModalVisible, setIsSerialModalVisible] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
  const [activeScanTarget, setActiveScanTarget] = useState<{ type: 'item' | 'serial', index?: number }>({ type: 'item' });
  
  const debouncedItemSearch = useDebounce(itemSearch);
  const debouncedSupplierSearch = useDebounce(supplierSearch);

  const [formData, setFormData] = useState<any>({
    supplier: '',
    posting_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    bill_no: '',
    bill_date: new Date().toISOString().split('T')[0],
    company: '',
    items: [],
    taxes: [],
    net_total: 0,
    total: 0,
    grand_total: 0,
    currency: 'INR',
    cost_center: 'Main - DRE'
  });

  // --- Queries ---
  const { data: invoiceDetail, isLoading: loadingDetail } = usePurchaseInvoiceDetail(invoiceId);
  const { data: suppliers } = usePISuppliers(debouncedSupplierSearch);
  const { data: itemsLookup, isLoading: loadingItems } = usePIItems(debouncedItemSearch);
  const saveMutation = useSavePurchaseInvoice();

  // --- Initial Load ---
  useEffect(() => {
    companyService.getSelectedCompany().then(c => {
      const compName = c?.name || '';
      setCompany(compName);
      if (!isEdit) setFormData(prev => ({ ...prev, company: compName }));
      
      metadataService.getWarehouses(compName).then(res => {
        setExtraMeta(prev => ({ ...prev, warehouses: res.data || [] }));
      });
    });
    
    Promise.all([
      metadataService.getProjects(),
      metadataService.getCostCenters(),
      metadataService.getTaxCategories(),
      metadataService.getPurchaseTaxesTemplates()
    ]).then(([projects, costCenters, taxCats, taxTemps]) => {
      setExtraMeta(prev => ({
        ...prev,
        projects: projects?.data || [],
        costCenters: costCenters?.data || [],
        taxCategories: taxCats?.data || [],
        taxTemplates: taxTemps?.data || []
      }));
    });
  }, [isEdit]);

  useEffect(() => {
    if (isEdit && invoiceDetail) {
      setFormData(invoiceDetail);
    }
  }, [isEdit, invoiceDetail]);

  // --- Calculation Logic ---
  const calculateTotals = useCallback((updatedFormData: any) => {
    let netTotal = 0;
    const updatedItems = (updatedFormData.items || []).map((item: any) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const amount = qty * rate;
      netTotal += amount;
      return { ...item, amount, qty, rate };
    });

    let taxAmount = 0;
    const updatedTaxes = (updatedFormData.taxes || []).map((tax: any) => {
      let currentTaxAmount = 0;
      if (tax.charge_type === 'On Net Total') {
        currentTaxAmount = (netTotal * (parseFloat(tax.rate) || 0)) / 100;
      } else if (tax.charge_type === 'Actual') {
        currentTaxAmount = parseFloat(tax.tax_amount) || 0;
      }
      taxAmount += currentTaxAmount;
      return { ...tax, tax_amount: currentTaxAmount, doctype: 'Purchase Taxes and Charges' };
    });

    return {
      ...updatedFormData,
      items: updatedItems,
      taxes: updatedTaxes,
      net_total: netTotal,
      total: netTotal,
      grand_total: netTotal + taxAmount
    };
  }, []);

  // --- Event Handlers ---
  const handleChange = useCallback((name: string, value: any) => {
    if (name === 'supplier' && value) {
      metadataService.getSupplierDetails(value).then(res => {
        const details = res?.data;
        if (details) {
          const updates: any = { supplier: value };
          if (details.tax_category) updates.tax_category = details.tax_category;
          const taxTemplate = details.default_purchase_taxes_and_charges;
          if (taxTemplate) {
            updates.taxes_and_charges = taxTemplate;
            metadataService.getPurchaseTaxesTemplateDetails(taxTemplate).then(tRes => {
              if (tRes?.data) {
                setFormData(prev => calculateTotals({
                  ...prev,
                  ...updates,
                  taxes: (tRes.data.taxes || []).map((t: any) => ({ ...t, name: undefined, doctype: 'Purchase Taxes and Charges' }))
                }));
              } else {
                setFormData(prev => calculateTotals({ ...prev, ...updates }));
              }
            });
          } else {
            setFormData(prev => calculateTotals({ ...prev, ...updates }));
          }
        }
      });
    } else if (name === 'taxes_and_charges' && value) {
      metadataService.getPurchaseTaxesTemplateDetails(value).then(res => {
        if (res?.data) {
          setFormData(prev => calculateTotals({ 
            ...prev, 
            [name]: value,
            taxes: (res.data.taxes || []).map((t: any) => ({ ...t, name: undefined, doctype: 'Purchase Taxes and Charges' }))
          }));
        }
      });
    } else {
      setFormData(prev => calculateTotals({ ...prev, [name]: value }));
    }
  }, [calculateTotals]);

  const handleItemChange = useCallback(async (index: number, field: string, value: any) => {
    if (field === 'item_code' && value) {
      try {
        const res = await stockApi.getItemDetails(value);
        const details = res?.data;
        if (details) {
          setFormData((prev: any) => {
            const updatedItems = [...prev.items];
            updatedItems[index] = { 
              ...updatedItems[index], 
              item_code: value,
              item_name: details.item_name,
              uom: details.stock_uom,
              rate: details.valuation_rate || 0,
              qty: 1,
              warehouse: prev.set_warehouse || updatedItems[index].warehouse || ''
            };
            return calculateTotals({ ...prev, items: updatedItems });
          });
          return;
        }
      } catch (e) { console.error(e); }
    }
    setFormData((prev: any) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return calculateTotals({ ...prev, items: updatedItems });
    });
  }, [calculateTotals]);

  const onScanSuccess = useCallback(async (code: string) => {
    setIsScannerVisible(false);
    if (activeScanTarget.type === 'item') {
      try {
        const result = await metadataService.lookupBarcode(code);
        if (result?.item) {
          const detailRes = await stockApi.getItemDetails(result.item.name);
          const details = detailRes?.data || result.item;
          setFormData(prev => {
            const existingIdx = prev.items.findIndex((i: any) => i.item_code === details.name);
            const updatedItems = [...prev.items];
            if (existingIdx >= 0) {
              updatedItems[existingIdx].qty = (parseFloat(updatedItems[existingIdx].qty) || 0) + 1;
            } else {
              updatedItems.push({
                item_code: details.name, 
                item_name: details.item_name,
                qty: 1, 
                uom: details.stock_uom, 
                warehouse: prev.set_warehouse || '',
                rate: details.valuation_rate || 0,
              });
            }
            return calculateTotals({ ...prev, items: updatedItems });
          });
        } else { Alert.alert("Not Found", `Barcode ${code} not recognized.`); }
      } catch (e) { Alert.alert("Error", "Scan failed."); }
    }
  }, [activeScanTarget, calculateTotals]);

  const handleSubmit = async () => {
    if (!formData.supplier) return Alert.alert("Error", "Supplier required");
    if (formData.items.length === 0) return Alert.alert("Error", "Items required");

    try {
      const res = await saveMutation.mutateAsync({ data: formData, id: invoiceId });
      const newId = res?.data?.name || invoiceId;
      Alert.alert("Success", "Purchase Invoice saved.");
      
      // Navigate to detail view instead of list
      navigation.replace('PurchaseInvoiceDetail', { invoiceId: newId });
    } catch (e: any) { 
      let msg = 'Save failed';
      if (e.response?.data?._server_messages) {
        try {
          const messages = JSON.parse(e.response.data._server_messages);
          msg = messages.map((m: any) => JSON.parse(m).message).join('\n');
        } catch (err) {
          msg = e.response.data.message || msg;
        }
      }
      Alert.alert("Error", msg);
    }
  };

  // --- Sections Meta ---
  const sections = useMemo(() => [
    { id: 'header', title: 'Basic Info', icon: FileText, type: 'blue' },
    { id: 'items', title: 'Items', icon: Package, type: 'orange' },
    { id: 'totals', title: 'Totals & Taxes', icon: CreditCard, type: 'green' },
    { id: 'save', title: 'Finish', icon: CheckCircle2, type: 'blue' },
  ], []);

  const renderSection = useCallback(({ item: section }: any) => {
    const titleColor = colors[section.type === 'blue' ? 'blue_500' : section.type === 'orange' ? 'orange_500' : 'green_500'];
    return (
      <View style={[detailStyles.sectionCard, detailStyles[`${section.type}Card` as keyof typeof detailStyles]]}>
        <View style={detailStyles.cardTitleRow}>
          <section.icon size={22} color={titleColor} strokeWidth={2.5} />
          <Text style={[detailStyles.cardTitle, { color: titleColor }]}>{section.title}</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {section.id === 'header' && (
            <HeaderSection 
              formData={formData} company={company} suppliers={suppliers || []} projects={extraMeta.projects}
              costCenters={extraMeta.costCenters} warehouses={extraMeta.warehouses}
              handleChange={handleChange} setSupplierSearch={setSupplierSearch}
              setProjectSearch={(q: string) => metadataService.getProjects(q).then(r => setExtraMeta((p: any) => ({...p, projects: r.data})))}
              setCostCenterSearch={(q: string) => metadataService.getCostCenters(q).then(r => setExtraMeta((p: any) => ({...p, costCenters: r.data})))}
              setWarehouseSearch={(q: string) => metadataService.getWarehouses(company, q).then(r => setExtraMeta((p: any) => ({...p, warehouses: r.data})))}
              showDueDate={true}
              showBillNo={true}
              showBillDate={true}
            />
          )}
          {section.id === 'items' && (
            <ItemsSection 
              items={formData.items} itemsMetadata={itemsLookup || []} warehousesMetadata={extraMeta.warehouses} loadingItems={loadingItems}
              addItem={() => setFormData((prev: any) => ({...prev, items: [...prev.items, { item_code: '', qty: 1, uom: '', rate: 0 }]}))}
              removeItem={(i: number) => setFormData((prev: any) => calculateTotals({ ...prev, items: prev.items.filter((_: any, idx: number) => idx !== i) }))}
              handleItemChange={handleItemChange} onItemSearch={setItemSearch}
              onOpenItemScanner={() => { setActiveScanTarget({ type: 'item' }); setIsScannerVisible(true); }}
              onOpenSerialModal={(i: number) => { setActiveItemIndex(i); setActiveScanTarget({ type: 'serial', index: i }); setIsSerialModalVisible(true); }}
            />
          )}
          {section.id === 'totals' && (
            <TotalsSection 
              formData={formData} taxCategories={extraMeta.taxCategories} taxTemplates={extraMeta.taxTemplates}
              handleChange={handleChange}
              setTaxCategorySearch={(q: string) => metadataService.getTaxCategories(q).then(r => setExtraMeta((p: any) => ({...p, taxCategories: r.data})))}
              setTaxTemplateSearch={(q: string) => metadataService.getPurchaseTaxesTemplates(q).then(r => setExtraMeta((p: any) => ({...p, taxTemplates: r.data})))}
            />
          )}
          {section.id === 'save' && (
            <SaveSection isEdit={isEdit} isPending={saveMutation.isPending} handleSubmit={handleSubmit} label={isEdit ? "Update Invoice" : "Create Invoice"} />
          )}
        </ScrollView>
      </View>
    );
  }, [formData, suppliers, extraMeta, company, itemsLookup, loadingItems, handleChange, handleItemChange, isEdit, saveMutation.isPending, handleSubmit, calculateTotals]);

  if (loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit PI` : "New Purchase Invoice"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={detailStyles.container}>
          <FlatList data={sections} renderItem={renderSection} keyExtractor={(s) => s.id} horizontal showsHorizontalScrollIndicator={false} snapToAlignment="start" decelerationRate="fast" snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} contentContainerStyle={detailStyles.horizontalList} />
        </View>
      </KeyboardAvoidingView>
      <BarcodeScanner isVisible={isScannerVisible} onClose={() => setIsScannerVisible(false)} onScan={onScanSuccess} />
      <SerialNoModal 
        isVisible={isSerialModalVisible} onClose={() => setIsSerialModalVisible(false)} 
        onSave={(serials) => {
          if (activeItemIndex === null) return;
          setFormData((prev: any) => {
            const updated = [...prev.items];
            updated[activeItemIndex].serial_no = serials.join('\n');
            if (serials.length > 0) updated[activeItemIndex].qty = serials.length;
            return calculateTotals({ ...prev, items: updated });
          });
        }} 
        initialSerials={activeItemIndex !== null ? formData.items[activeItemIndex]?.serial_no : ''}
        itemCode={activeItemIndex !== null ? formData.items[activeItemIndex]?.item_code : ''}
        itemName={activeItemIndex !== null ? formData.items[activeItemIndex]?.item_name : ''}
        targetQty={activeItemIndex !== null ? parseFloat(formData.items[activeItemIndex]?.qty) || 0 : 0}
        onOpenScanner={() => { setActiveScanTarget({ type: 'serial', index: activeItemIndex! }); setIsSerialModalVisible(false); setIsScannerVisible(true); }}
      />
    </ModuleLayout>
  );
}
