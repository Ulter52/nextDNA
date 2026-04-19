import apiClient from '../../../core/api/client';
import { Customer } from '../types';

export const customerService = {
  async getCustomers(search?: string, start: number = 0, limit: number = 20, filters: any = {}): Promise<Customer[]> {
    const frappeFilters: any[] = [];
    if (search) {
      frappeFilters.push(["customer_name", "like", `%${search}%`]);
    }
    
    // Merge additional filters (e.g., customer_group)
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'All') {
        frappeFilters.push([key, "=", filters[key]]);
      }
    });

    const response = await apiClient.get('/api/resource/Customer', {
      params: {
        fields: '["name", "customer_name", "customer_group", "territory", "customer_type", "image"]',
        filters: frappeFilters.length > 0 ? JSON.stringify(frappeFilters) : undefined,
        limit_start: start,
        limit_page_length: limit,
        order_by: 'modified desc'
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
