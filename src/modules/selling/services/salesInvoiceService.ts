import apiClient from '../../../core/api/client';

export const salesInvoiceService = {
  async getSalesInvoices(search?: string, status?: string, start: number = 0, limit: number = 20): Promise<any[]> {
    try {
      const filters: any[] = [];
      if (search) {
        filters.push(["name", "like", `%${search}%`]);
      }
      if (status && status !== 'All') {
        filters.push(["status", "=", status]);
      }

      const response = await apiClient.get('/api/resource/Sales Invoice', {
        params: {
          fields: '["name", "customer", "customer_name", "posting_date", "grand_total", "status", "currency"]',
          filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
          limit_start: start,
          limit_page_length: limit,
          order_by: 'posting_date desc',
        },
      });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getSalesInvoice(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Sales Invoice/${name}`);
    return response?.data?.data;
  },

  async createSalesInvoice(data: any): Promise<any> {
    const response = await apiClient.post('/api/resource/Sales Invoice', {
      ...data,
      doctype: 'Sales Invoice'
    });
    return response.data.data;
  },

  async updateSalesInvoice(name: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/resource/Sales Invoice/${name}`, data);
    return response?.data?.data;
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
