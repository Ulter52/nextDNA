import apiClient from '../../../core/api/client';
import { Quotation } from '../types';

export const quotationService = {
  async getQuotations(): Promise<Quotation[]> {
    const response = await apiClient.get('/api/resource/Quotation', {
      params: {
        fields: '["name", "party_name", "customer_name", "transaction_date", "grand_total", "status", "currency"]',
        order_by: 'transaction_date desc',
        limit_page_length: 20,
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
