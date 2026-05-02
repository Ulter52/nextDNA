import { fetchResource, createResource, updateResource, callMethod } from '../../../core/api/frappeApiHelpers';

export const buyingApi = {
  // --- Supplier Methods ---
  getSuppliers: (search?: string, start: number = 0, limit: number = 20) => {
    const filters: any[] = [];
    if (search) filters.push(["supplier_name", "like", `%${search}%`]);
    
    return fetchResource('Supplier', {
      fields: '["name", "supplier_name", "supplier_group", "supplier_type", "image"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_start: start,
      limit_page_length: limit,
      order_by: 'modified desc'
    });
  },

  getSupplierDetail: (id: string) => fetchResource(`Supplier/${id}`),

  createSupplier: (data: any) => createResource('Supplier', data),

  updateSupplier: (id: string, data: any) => updateResource('Supplier', id, data),

  // --- Linked Doc Methods ---
  getAddressDetail: (id: string) => fetchResource(`Address/${id}`),
  updateAddress: (id: string, data: any) => updateResource('Address', id, data),
  
  getContactDetail: (id: string) => fetchResource(`Contact/${id}`),
  updateContact: (id: string, data: any) => updateResource('Contact', id, data),

  // --- Purchase Order Methods ---
  getPurchaseOrders: (search?: string, status?: string, start: number = 0, limit: number = 20) => {
    const filters: any[] = [];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);

    return fetchResource('Purchase Order', {
      fields: '["name", "supplier", "transaction_date", "status", "grand_total", "currency"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_start: start,
      limit_page_length: limit,
      order_by: 'transaction_date desc'
    }).then(r => r?.data || []);
  },

  getPurchaseOrderDetail: (id: string) => fetchResource(`Purchase Order/${id}`),

  createPurchaseOrder: (data: any) => createResource('Purchase Order', data),

  updatePurchaseOrder: (id: string, data: any) => updateResource('Purchase Order', id, data),

  submitPurchaseOrder: (id: string) => updateResource('Purchase Order', id, { docstatus: 1 }),

  // --- Purchase Invoice Methods ---
  getPurchaseInvoices: (search?: string, status?: string, start: number = 0, limit: number = 20) => {
    const filters: any[] = [];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);

    return fetchResource('Purchase Invoice', {
      fields: '["name", "supplier", "posting_date", "status", "grand_total", "currency", "outstanding_amount"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_start: start,
      limit_page_length: limit,
      order_by: 'posting_date desc'
    }).then(r => r?.data || []);
  },

  getPurchaseInvoiceDetail: (id: string) => fetchResource(`Purchase Invoice/${id}`),

  createPurchaseInvoice: (data: any) => createResource('Purchase Invoice', data),

  updatePurchaseInvoice: (id: string, data: any) => updateResource('Purchase Invoice', id, data),

  submitPurchaseInvoice: (id: string) => updateResource('Purchase Invoice', id, { docstatus: 1 }),

  // --- Analytics ---
  getPurchaseStats: (company: string, fromDate: string, toDate: string) => callMethod('frappe.desk.query_report.run', {
    report_name: 'Purchase Analytics',
    filters: JSON.stringify({
      company: company,
      tree_type: 'Supplier',
      doc_type: 'Purchase Invoice',
      value_quantity: 'Value',
      from_date: fromDate,
      to_date: toDate,
      range: 'Monthly'
    })
  }),
};
