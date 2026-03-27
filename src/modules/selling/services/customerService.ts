import apiClient from '../../../core/api/client';
import { Customer } from '../types';

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const response = await apiClient.get('/api/resource/Customer', {
      params: {
        fields: '["name", "customer_name", "customer_group", "territory", "customer_type"]',
        limit_page_length: 100,
      },
    });
    return response.data.data;
  },

  async getCustomerDetails(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Customer/${name}`);
    return response.data.data;
  },

  async createCustomer(data: any): Promise<any> {
    const response = await apiClient.post('/api/resource/Customer', {
      ...data,
      doctype: 'Customer'
    });
    return response.data.data;
  },

  async updateCustomer(name: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/resource/Customer/${name}`, data);
    return response.data.data;
  }
};
