import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Text } from 'react-native';
import { FileText, Package, CreditCard, CheckCircle2 } from 'lucide-react-native';
import { useRoute, useNavigation } from '@react-navigation/native';

import { ModuleLayout } from '@core/components/ModuleLayout';
import { BarcodeScanner } from '@core/components/BarcodeScanner';
import { SerialNoModal } from '@core/components/serialNoModal';
import { useDebounce } from '@core/utils/debounce';
import { colors, spacing } from '@core/theme';
import { styles as detailStyles } from '../itemDetail/styles';

import { 
  usePurchaseReceiptDetail, 
  useSavePurchaseReceipt 
} from '../../hooks/purchaseReceiptQueries';
import { useItems } from '../../hooks/itemQueries';
import { stockApi } from '../../services/stockApi';
import { metadataService } from '@core/services/metadataService';
import { companyService } from '@core/services/companyService';

import { HeaderSection } from '../../components/HeaderSection';
import { ItemsSection } from '../../components/ItemsSection';
import { TotalsSection } from '../../components/TotalsSection';
import { SaveSection } from '../../components/SaveSection';
import { formStyles } from './styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function PurchaseReceiptEdit() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { receiptId } = route.params || {};
  const isEdit = !!receiptId;

  // --- Search & Metadata State ---
  const [itemSearch, setItemSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [company, setCompany] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
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
    posting_time: new Date().toTimeString().split(' ')[0],
    company: '',
    items: [],
    taxes: [],
    net_total: 0,
    total: 0,
    grand_total: 0
  });

  // --- Queries ---
  const { data: receiptDetail, isLoading: loadingDetail } = usePurchaseReceiptDetail(receiptId);
  const { data: items, isLoading: loadingItems } = useItems(debouncedItemSearch);
  const saveMutation = useSavePurchaseReceipt();

  // --- Initial Load ---
  useEffect(() => {
    companyService.getSelectedCompany().then(c => {
      const compName = c?.name || '';
      setCompany(compName);
      if (!isEdit) setFormData(prev => ({ ...prev, company: compName }));
      
      // Load initial warehouses for the company
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

  // --- Debounced Metadata Sync ---
  useEffect(() => {
    metadataService.getSuppliers(debouncedSupplierSearch).then(res => setSuppliers(res.data || []));
  }, [debouncedSupplierSearch]);

  useEffect(() => {
    if (isEdit && receiptDetail) {
      setFormData(receiptDetail);
      if (receiptDetail.company) setCompany(receiptDetail.company);
    }
  }, [isEdit, receiptDetail]);

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
      grand_total: netTotal + taxAmount,
      base_net_total: netTotal,
      base_grand_total: netTotal + taxAmount
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
          
          // Use default_purchase_taxes_and_charges only
          // tax_withholding_category is NOT a Purchase Taxes Template and causes 404
          const taxTemplate = details.default_purchase_taxes_and_charges;
          if (taxTemplate) {
            updates.taxes_and_charges = taxTemplate;
            metadataService.getPurchaseTaxesTemplateDetails(taxTemplate).then(tRes => {
              if (tRes?.data) {
                setFormData(prev => calculateTotals({
                  ...prev,
                  ...updates,
                  taxes: (tRes.data.taxes || []).map((t: any) => ({ 
                    ...t, 
                    name: undefined, 
                    doctype: 'Purchase Taxes and Charges' 
                  }))
                }));
              } else {
                setFormData(prev => calculateTotals({ ...prev, ...updates }));
              }
            });
          } else {
            setFormData(prev => calculateTotals({ ...prev, ...updates }));
          }
        } else {
          setFormData(prev => calculateTotals({ ...prev, [name]: value }));
        }
      });
    } else if (name === 'taxes_and_charges' && value) {
      metadataService.getPurchaseTaxesTemplateDetails(value).then(res => {
        if (res?.data) {
          setFormData(prev => calculateTotals({ 
            ...prev, 
            [name]: value,
            taxes: (res.data.taxes || []).map((t: any) => ({ 
              ...t, 
              name: undefined, 
              doctype: 'Purchase Taxes and Charges' 
            }))
          }));
        }
      });
    } else {
      setFormData(prev => calculateTotals({ ...prev, [name]: value }));
    }
  }, [calculateTotals]);

  const handleItemChange = useCallback(async (index: number, field: string, value: any) => {
    if (field === 'item_code') {
      try {
        const res = await stockApi.getItemDetails(value);
        const details = res?.data;
        
        if (details) {
          setFormData((prev: any) => {
            const updatedItems = [...prev.items];
            const currentItem = { ...updatedItems[index] };
            
            currentItem.item_code = value;
            currentItem.item_name = details.item_name || currentItem.item_name;
            currentItem.uom = details.stock_uom || currentItem.uom;
            currentItem.qty = currentItem.qty || 1;
            currentItem.rate = details.last_purchase_rate || details.valuation_rate || 0;
            currentItem.warehouse = prev.set_warehouse || currentItem.warehouse;
            currentItem.use_serial_batch_fields = details.has_serial_no === 1 ? 1 : 0;
            
            let taxTemplate = details.item_tax_template || "";
            if (details.taxes && details.taxes.length > 0) {
              taxTemplate = details.taxes[0].item_tax_template;
            }
            currentItem.item_tax_template = taxTemplate;
            
            updatedItems[index] = currentItem;
            return calculateTotals({ ...prev, items: updatedItems });
          });
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        setFormData((prev: any) => {
          const updatedItems = [...prev.items];
          updatedItems[index] = { ...updatedItems[index], [field]: value };
          return calculateTotals({ ...prev, items: updatedItems });
        });
      }
    } else {
      setFormData((prev: any) => {
        const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        return calculateTotals({ ...prev, items: updatedItems });
      });
    }
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
            
            let taxTemplate = details.item_tax_template || "";
            if (details.taxes && details.taxes.length > 0) {
              taxTemplate = details.taxes[0].item_tax_template;
            }

            if (existingIdx >= 0) {
              updatedItems[existingIdx].qty = (parseFloat(updatedItems[existingIdx].qty) || 0) + 1;
              if (result.type === 'serial') {
                const current = updatedItems[existingIdx].serial_no ? updatedItems[existingIdx].serial_no.split('\n') : [];
                if (!current.includes(result.serial_no)) updatedItems[existingIdx].serial_no = [...current, result.serial_no].join('\n');
              }
            } else {
              updatedItems.push({
                item_code: details.name, 
                item_name: details.item_name,
                qty: 1, 
                uom: details.stock_uom, 
                warehouse: prev.set_warehouse || '',
                rate: details.last_purchase_rate || details.valuation_rate || 0,
                serial_no: result.type === 'serial' ? result.serial_no : '',
                use_serial_batch_fields: details.has_serial_no === 1 ? 1 : 0,
                item_tax_template: taxTemplate
              });
            }
            return calculateTotals({ ...prev, items: updatedItems });
          });
        } else { Alert.alert("Not Found", `Barcode ${code} not recognized.`); }
      } catch (e) { Alert.alert("Error", "Scan failed."); }
    } else if (activeScanTarget.type === 'serial' && activeScanTarget.index !== undefined) {
      setFormData(prev => {
        const updated = [...prev.items];
        const item = updated[activeScanTarget.index!];
        const current = item.serial_no ? item.serial_no.split('\n').filter(Boolean) : [];
        if (!current.includes(code)) {
          item.serial_no = [...current, code].join('\n');
          if (item.serial_no.split('\n').length > parseFloat(item.qty)) item.qty = item.serial_no.split('\n').length;
        }
        return calculateTotals({ ...prev, items: updated });
      });
      setIsSerialModalVisible(true);
    }
  }, [activeScanTarget, calculateTotals]);

  const handleSubmit = useCallback(async () => {
    if (!formData.supplier || !formData.company) return Alert.alert("Error", "Supplier and Company required");
    if (formData.items.length === 0) return Alert.alert("Error", "Items required");

    try {
      const dataToSave = calculateTotals({ ...formData, docstatus: 0 });
      const cleanData = { ...dataToSave };
      
      ['project', 'cost_center', 'tax_category', 'taxes_and_charges', 'set_warehouse', 'supplier_delivery_note'].forEach(f => {
        if (!cleanData[f]) delete cleanData[f];
      });

      cleanData.items = cleanData.items.map((i: any) => ({
        ...i,
        qty: parseFloat(i.qty) || 0, 
        rate: parseFloat(i.rate) || 0,
        amount: (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0),
        use_serial_batch_fields: parseInt(i.use_serial_batch_fields) || 0,
        item_tax_template: i.item_tax_template || ""
      }));

      if (cleanData.taxes && cleanData.taxes.length > 0) {
        cleanData.taxes = cleanData.taxes.map((t: any) => ({
          ...t,
          doctype: 'Purchase Taxes and Charges'
        }));
      }

      const res = await saveMutation.mutateAsync({ data: cleanData, id: receiptId });
      Alert.alert("Success", "Draft saved.");
      isEdit ? navigation.goBack() : navigation.replace('PurchaseReceiptDetail', { receiptId: res?.data?.name || receiptId });
    } catch (e: any) { Alert.alert("Error", e.response?.data?.message || "Save failed"); }
  }, [formData, receiptId, isEdit, saveMutation, navigation, calculateTotals]);

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
              formData={formData} company={company} suppliers={suppliers} projects={extraMeta.projects}
              costCenters={extraMeta.costCenters} warehouses={extraMeta.warehouses}
              handleChange={handleChange} setSupplierSearch={setSupplierSearch}
              setProjectSearch={(q: string) => metadataService.getProjects(q).then(r => setExtraMeta((p: any) => ({...p, projects: r.data})))}
              setCostCenterSearch={(q: string) => metadataService.getCostCenters(q).then(r => setExtraMeta((p: any) => ({...p, costCenters: r.data})))}
              setWarehouseSearch={(q: string) => metadataService.getWarehouses(company, q).then(r => setExtraMeta((p: any) => ({...p, warehouses: r.data})))}
            />
          )}
          {section.id === 'items' && (
            <ItemsSection 
              items={formData.items} itemsMetadata={items} warehousesMetadata={extraMeta.warehouses} loadingItems={loadingItems}
              addItem={() => setFormData((prev: any) => ({...prev, items: [...prev.items, { item_code: '', qty: 1, uom: '', warehouse: prev.set_warehouse || '', rate: 0, serial_no: '', use_serial_batch_fields: 0, item_tax_template: "" }]}))}
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
            <SaveSection isEdit={isEdit} isPending={saveMutation.isPending} handleSubmit={handleSubmit} />
          )}
        </ScrollView>
      </View>
    );
  }, [formData, suppliers, extraMeta, company, items, loadingItems, handleChange, handleItemChange, isEdit, saveMutation.isPending, handleSubmit, calculateTotals]);

  if (loadingDetail) return <ModuleLayout title="Loading..." showBack><View style={detailStyles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View></ModuleLayout>;

  return (
    <ModuleLayout title={isEdit ? `Edit Receipt` : "New Purchase Receipt"} showBack>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <View style={detailStyles.container}>
          <FlatList data={sections} renderItem={renderSection} keyExtractor={(s) => s.id} horizontal showsHorizontalScrollIndicator={false} snapToAlignment="start" decelerationRate="fast" snapToInterval={SCREEN_WIDTH * 0.9 + spacing.xs * 2} contentContainerStyle={detailStyles.horizontalList} keyboardShouldPersistTaps="handled" />
        </View>
      </KeyboardAvoidingView>
      <BarcodeScanner isVisible={isScannerVisible} onClose={() => { setIsScannerVisible(false); if (activeScanTarget.type === 'serial') setIsSerialModalVisible(true); }} onScan={onScanSuccess} />
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
