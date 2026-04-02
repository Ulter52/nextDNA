import React, { memo } from 'react';
import { View } from 'react-native';
import { Building2, User, Calendar, Clock, Truck, Briefcase, MapPin, FileText } from 'lucide-react-native';
import { Selector } from '@core/components/Selector';
import { FormInput } from './FormInput';

export const HeaderSection = memo(({ 
  formData, 
  handleChange, 
  suppliers, 
  customers,
  setSupplierSearch,
  setCustomerSearch,
  projects,
  setProjectSearch,
  costCenters,
  setCostCenterSearch,
  warehouses,
  setWarehouseSearch,
  company,
  loadingWh,
  isDeliveryNote = false,
  showScheduleDate = false,
  showDueDate = false,
  showPostingTime = true,
  showBillNo = false,
  showBillDate = false
}: any) => {
  return (
    <View>
      <Selector 
        label="Company" 
        options={[{ name: company, value: company }]} 
        value={formData.company} 
        onChange={() => {}} 
        icon={Building2} 
        disabled 
      />
      
      {!isDeliveryNote ? (
        <Selector 
          label="Supplier" 
          options={suppliers || []} 
          value={formData.supplier} 
          onChange={(v: any) => handleChange('supplier', v)} 
          onSearch={setSupplierSearch} 
          icon={User} 
          displayField="supplier_name" 
        />
      ) : (
        <Selector 
          label="Customer" 
          options={customers || []} 
          value={formData.customer} 
          onChange={(v: any) => handleChange('customer', v)} 
          onSearch={setCustomerSearch} 
          icon={User} 
          displayField="customer_name" 
        />
      )}

      <FormInput 
        label="Date" 
        value={formData.posting_date} 
        onChangeText={(v: any) => handleChange('posting_date', v)} 
        icon={Calendar} 
      />

      {showBillNo && (
        <FormInput 
          label="Supplier Invoice No" 
          value={formData.bill_no} 
          onChangeText={(v: any) => handleChange('bill_no', v)} 
          icon={FileText} 
          placeholder="INV-XXXXX"
        />
      )}

      {showBillDate && (
        <FormInput 
          label="Supplier Invoice Date" 
          value={formData.bill_date} 
          onChangeText={(v: any) => handleChange('bill_date', v)} 
          icon={Calendar} 
          placeholder="YYYY-MM-DD"
        />
      )}

      {showScheduleDate && (
        <FormInput 
          label="Required By" 
          value={formData.schedule_date} 
          onChangeText={(v: any) => handleChange('schedule_date', v)} 
          icon={Calendar} 
          placeholder="YYYY-MM-DD"
        />
      )}

      {showDueDate && (
        <FormInput 
          label="Due Date" 
          value={formData.due_date} 
          onChangeText={(v: any) => handleChange('due_date', v)} 
          icon={Calendar} 
          placeholder="YYYY-MM-DD"
        />
      )}

      {showPostingTime && (
        <FormInput 
          label="Posting Time" 
          value={formData.posting_time} 
          onChangeText={(v: any) => handleChange('posting_time', v)} 
          icon={Clock} 
        />
      )}
      
      {!isDeliveryNote && !showScheduleDate && !showDueDate && !showBillNo && (
        <FormInput 
          label="Supplier Del. Note" 
          value={formData.supplier_delivery_note} 
          onChangeText={(v: string) => handleChange('supplier_delivery_note', v)} 
          icon={Truck} 
        />
      )}

      <Selector 
        label="Project" 
        options={projects || []} 
        value={formData.project} 
        onChange={(v: any) => handleChange('project', v)} 
        onSearch={setProjectSearch}
        icon={Briefcase} 
      />
      <Selector 
        label="Cost Center" 
        options={costCenters || []} 
        value={formData.cost_center} 
        onChange={(v: any) => handleChange('cost_center', v)} 
        onSearch={setCostCenterSearch}
        icon={Briefcase} 
      />
      <Selector 
        label="Default Warehouse" 
        options={warehouses || []} 
        value={formData.set_warehouse} 
        onChange={(v: any) => handleChange('set_warehouse', v)} 
        onSearch={setWarehouseSearch}
        loading={loadingWh}
        icon={MapPin} 
        displayField="warehouse_name" 
      />
    </View>
  );
});
