import apiClient from '../../../core/api/client';

export const salesInvoiceService = {
  async getSalesInvoices(): Promise<any[]> {
    const response = await apiClient.get('/api/resource/Sales Invoice', {
      params: {
        fields: '["name", "customer", "customer_name", "posting_date", "grand_total", "status", "currency"]',
        order_by: 'posting_date desc',
        limit_page_length: 20,
      },
    });
    return response.data.data;
  },

  async getSalesInvoice(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Sales Invoice/${name}`);
    return response.data.data;
  },

  async createSalesInvoice(data: any): Promise<any> {
    const response = await apiClient.post('/api/resource/Sales Invoice', {
      ...data,
      doctype: 'Sales Invoice'
    });
    return response.data.data;
  },

  async submitSalesInvoice(doc: any): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.submit', {
      doc: doc
    });
    return response.data.message;
  },

  async cancelSalesInvoice(name: string): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.cancel', {
      doctype: 'Sales Invoice',
      name: name
    });
    return response.data.message;
  }
};
