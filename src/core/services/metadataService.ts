import { fetchResource, callMethod } from '../api/frappeApiHelpers';

export const metadataService = {
  getBrands: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Brand', { 
      fields: '["name"]',
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getItemGroups: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Item Group', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getUOMs: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('UOM', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getWarehouses: (company?: string, search?: string) => {
    const filters: any[] = [];
    if (company) filters.push(["company", "=", company]);
    if (search) filters.push(["name", "like", `%${search}%`]);
    
    return fetchResource('Warehouse', { 
      fields: '["name", "warehouse_name", "company"]', 
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getSuppliers: (search?: string) => {
    const filters = search ? `[["supplier_name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Supplier', {
      fields: '["name", "supplier_name"]',
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getSupplierGroups: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Supplier Group', {
      fields: '["name"]',
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getCustomers: (search?: string) => {
    const filters = search ? `[["customer_name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Customer', {
      fields: '["name", "customer_name"]',
      filters,
      limit_page_length: 100,
      order_by: 'customer_name asc'
    });
  },

  getSupplierDetails: (supplier: string) => {
    return fetchResource(`Supplier/${supplier}`);
  },

  getAccounts: (company?: string, search?: string) => {
    const filters: any[] = [["is_group", "=", 0]];
    if (company) filters.push(["company", "=", company]);
    if (search) filters.push(["name", "like", `%${search}%`]);

    return fetchResource('Account', { 
      fields: '["name", "account_name", "company", "account_type"]', 
      filters: JSON.stringify(filters),
      limit_page_length: 500,
      order_by: 'name asc'
    });
  },

  getItemTaxTemplates: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Item Tax Template', { 
      fields: '["name", "title"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getHSNCodes: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('GST HSN Code', { 
      fields: '["name", "description"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getCostCenters: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Cost Center', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getProjects: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Project', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getTaxCategories: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Tax Category', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getPurchaseTaxesTemplates: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Purchase Taxes and Charges Template', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getPurchaseTaxesTemplateDetails: (templateId: string) => {
    return fetchResource(`Purchase Taxes and Charges Template/${templateId}`);
  },

  getSerialNos: (itemCode?: string, search?: string) => {
    const filters: any[] = [];
    if (itemCode) filters.push(["item_code", "=", itemCode]);
    if (search) filters.push(["name", "like", `%${search}%`]);
    
    return fetchResource('Serial No', {
      fields: '["name", "item_code"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_page_length: 50,
      order_by: 'name asc'
    });
  },

  getPriceLists: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Price List', { 
      fields: '["name"]', 
      filters,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getItems: (search?: string) => {
    const filters: any[] = [["disabled", "=", 0]];
    if (search) {
      filters.push(["item_name", "like", `%${search}%`]);
    }
    
    return fetchResource('Item', {
      fields: '["name", "item_name", "stock_uom", "has_serial_no", "valuation_rate"]',
      filters: JSON.stringify(filters),
      limit_page_length: 50,
      order_by: 'name asc'
    });
  },

  getCountries: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Country', { fields: '["name"]', filters, limit_page_length: 250 });
  },

  getStates: (country?: string, search?: string) => {
    const filters: any[] = [];
    if (country) filters.push(["country", "=", country]);
    if (search) filters.push(["name", "like", `%${search}%`]);
    
    return fetchResource('State', { 
      fields: '["name"]', 
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_page_length: 100,
      order_by: 'name asc'
    });
  },

  getCurrencies: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Currency', { fields: '["name"]', filters, limit_page_length: 200 });
  },

  getPaymentTerms: (search?: string) => {
    const filters = search ? `[["name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Payment Terms Template', { fields: '["name"]', filters, limit_page_length: 100 });
  },

  getGSTCategories: () => {
    return Promise.resolve({
      data: [
        { name: 'Registered Regular' },
        { name: 'Registered Composition' },
        { name: 'Unregistered' },
        { name: 'Consumer' },
        { name: 'Overseas' },
        { name: 'Special Economic Zone' },
        { name: 'Deemed Export' },
        { name: 'UIN Holders' }
      ]
    });
  },

  /**
   * Smart lookup for barcodes that could be Item codes, Item Barcodes, or Serial Numbers.
   */
  lookupBarcode: async (barcode: string) => {
    // 1. Try lookup as Item Code directly (name)
    let itemRes = await fetchResource('Item', {
      fields: '["name", "item_name", "stock_uom", "has_serial_no", "valuation_rate"]',
      filters: JSON.stringify([["name", "=", barcode]]),
      limit_page_length: 1
    });

    // 2. If not found by name, try lookup via Item Barcode DocType
    if (!itemRes?.data?.length) {
      try {
        const barcodeRes = await fetchResource('Item Barcode', {
          fields: '["parent"]',
          filters: JSON.stringify([["barcode", "=", barcode]]),
          limit_page_length: 1
        });

        if (barcodeRes?.data?.length > 0) {
          const itemCode = barcodeRes.data[0].parent;
          itemRes = await fetchResource('Item', {
            fields: '["name", "item_name", "stock_uom", "has_serial_no", "valuation_rate"]',
            filters: JSON.stringify([["name", "=", itemCode]]),
            limit_page_length: 1
          });
        }
      } catch (e) {
        console.log("Item Barcode lookup failed");
      }
    }

    if (itemRes?.data?.length > 0) {
      return { type: 'item', item: itemRes.data[0] };
    }

    // 3. Try lookup as Serial No
    const snRes = await fetchResource('Serial No', {
      fields: '["name", "item_code"]',
      filters: JSON.stringify([["name", "=", barcode]]),
      limit_page_length: 1
    });

    if (snRes?.data?.length > 0) {
      const sn = snRes.data[0];
      const itemDetail = await fetchResource('Item', {
        fields: '["name", "item_name", "stock_uom", "has_serial_no", "valuation_rate"]',
        filters: JSON.stringify([["name", "=", sn.item_code]]),
        limit_page_length: 1
      });
      return { 
        type: 'serial', 
        item: itemDetail?.data?.[0], 
        serial_no: barcode 
      };
    }

    return null;
  }
};
