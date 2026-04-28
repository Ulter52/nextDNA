import apiClient from '../../../core/api/client';
import { SalesOrder } from '../types';

export const sellingService = {
  async getCompanies(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/resource/Company', {
        params: {
          fields: '["name", "company_name", "default_currency"]',
          limit_page_length: 10,
        },
      });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getItems(search?: string, start: number = 0, limit: number = 100): Promise<any[]> {
    try {
      const filters: any[] = [["disabled", "=", 0], ["is_sales_item", "=", 1]];
      if (search) {
        filters.push(["item_name", "like", `%${search}%`]);
      }
      const response = await apiClient.get('/api/resource/Item', {
        params: {
          fields: '["name", "item_name", "item_code", "stock_uom", "standard_rate"]',
          filters: JSON.stringify(filters),
          limit_start: start,
          limit_page_length: limit,
          order_by: 'name asc'
        },
      });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getItemDetails(itemCode: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Item/${itemCode}`);
    return response?.data?.data;
  },

  async getWarehouses(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/resource/Warehouse', {
        params: {
          fields: '["name", "warehouse_name"]',
          filters: '[["disabled", "=", 0]]',
          limit_page_length: 50,
        },
      });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getTaxCategories(): Promise<any[]> {
    try {
      const response = await apiClient.get('/api/resource/Tax Category', {
        params: {
          fields: '["name", "title"]',
          limit_page_length: 50,
        },
      });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getSalesTaxesTemplates(company?: string): Promise<any[]> {
    try {
      const params: any = {
        fields: '["name", "title"]',
        filters: '[["disabled", "=", 0]]',
        limit_page_length: 50,
      };
      if (company) {
        params.filters = `[["disabled", "=", 0], ["company", "=", "${company}"]]`;
      }
      const response = await apiClient.get('/api/resource/Sales Taxes and Charges Template', { params });
      return response?.data?.data || [];
    } catch (e) {
      return [];
    }
  },

  async getItemPrice(itemCode: string, priceList: string = 'Standard Selling'): Promise<number> {
    try {
      const response = await apiClient.get('/api/resource/Item Price', {
        params: {
          fields: '["price_list_rate"]',
          filters: `[["item_code", "=", "${itemCode}"], ["price_list", "=", "${priceList}"]]`,
          limit_page_length: 1
        }
      });
      return response?.data?.data?.[0]?.price_list_rate || 0;
    } catch (error) {
      return 0;
    }
  },

  async createSalesOrder(data: any): Promise<any> {
    const response = await apiClient.post('/api/resource/Sales Order', {
      ...data,
      doctype: 'Sales Order'
    });
    return response.data.data;
  },

  async getSalesOrders(search?: string, status?: string, start: number = 0, limit: number = 20): Promise<SalesOrder[]> {
    const filters: any[] = [];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);

    const response = await apiClient.get('/api/resource/Sales Order', {
      params: {
        fields: '["name", "customer_name", "transaction_date", "grand_total", "status", "currency"]',
        filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
        limit_start: start,
        limit_page_length: limit,
        order_by: 'transaction_date desc',
      },
    });
    return response?.data?.data || [];
  },

  async getSalesOrder(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Sales Order/${name}`);
    return response?.data?.data;
  },

  async updateSalesOrder(name: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/resource/Sales Order/${name}`, data);
    return response?.data?.data;
  },

  async getSalesAnalytics(company: string, fromDate: string, toDate: string): Promise<any> {
    const response = await apiClient.get('/api/method/frappe.desk.query_report.run', {
      params: {
        report_name: 'Sales Analytics',
        filters: JSON.stringify({
          company: company,
          tree_type: 'Customer',
          doc_type: 'Sales Invoice',
          value_quantity: 'Value',
          from_date: fromDate,
          to_date: toDate,
          range: 'Monthly'
        })
      }
    });
    return response?.data?.message;
  }
};
