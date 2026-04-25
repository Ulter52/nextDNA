import apiClient from '../../../core/api/client';
import { Quotation } from '../types';

export const quotationService = {
  async getQuotations(search?: string, status?: string, start: number = 0, limit: number = 20): Promise<Quotation[]> {
    const filters: any[] = [];
    if (search) {
      filters.push(["name", "like", `%${search}%`]);
    }
    if (status && status !== 'All') {
      filters.push(["status", "=", status]);
    }

    const response = await apiClient.get('/api/resource/Quotation', {
      params: {
        fields: '["name", "party_name", "customer_name", "transaction_date", "grand_total", "status", "currency"]',
        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
        limit_start: start,
        limit_page_length: limit,
        order_by: 'transaction_date desc',
      },
    });
    return response.data.data;
  },

  async getQuotation(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Quotation/${name}`);
    return response.data.data;
  },

  async createQuotation(data: any): Promise<any> {
    const response = await apiClient.post('/api/resource/Quotation', {
      ...data,
      doctype: 'Quotation'
    });
    return response.data.data;
  },

  async submitQuotation(doc: any): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.submit', {
      doc: doc
    });
    return response.data.message;
  },

  async cancelQuotation(name: string): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.cancel', {
      doctype: 'Quotation',
      name: name
    });
    return response.data.message;
  }
};
