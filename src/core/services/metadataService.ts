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

  getItems: (search?: string) => {
    const filters = search ? `[["item_name", "like", "%${search}%"]]` : undefined;
    return fetchResource('Item', {
      fields: '["name", "item_name", "stock_uom", "has_serial_no", "barcode", "valuation_rate", "item_tax_template"]',
      filters,
      limit_page_length: 50,
      order_by: 'name asc'
    });
  },

  /**
   * Smart lookup for barcodes that could be Item codes, Item Barcodes, or Serial Numbers.
   */
  lookupBarcode: async (barcode: string) => {
    // 1. Try lookup as Item Code or Item Barcode
    const itemFilters = [
      ["disabled", "=", 0],
      ["barcode", "=", barcode]
    ];
    
    let itemRes = await fetchResource('Item', {
      fields: '["name", "item_name", "stock_uom", "has_serial_no", "item_tax_template", "valuation_rate"]',
      filters: JSON.stringify(itemFilters),
      limit_page_length: 1
    });

    if (!itemRes?.data?.length) {
      // Try searching by name (item_code)
      itemRes = await fetchResource('Item', {
        fields: '["name", "item_name", "stock_uom", "has_serial_no", "item_tax_template", "valuation_rate"]',
        filters: JSON.stringify([["name", "=", barcode]]),
        limit_page_length: 1
      });
    }

    if (itemRes?.data?.length > 0) {
      return { type: 'item', item: itemRes.data[0] };
    }

    // 2. Try lookup as Serial No
    const snRes = await fetchResource('Serial No', {
      fields: '["name", "item_code"]',
      filters: JSON.stringify([["name", "=", barcode]]),
      limit_page_length: 1
    });

    if (snRes?.data?.length > 0) {
      const sn = snRes.data[0];
      const itemDetail = await fetchResource('Item', {
        fields: '["name", "item_name", "stock_uom", "has_serial_no", "item_tax_template", "valuation_rate"]',
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
