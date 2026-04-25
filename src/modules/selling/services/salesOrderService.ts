import apiClient from '../../../core/api/client';
import { SalesOrder } from '../types';

export const sellingService = {
  async getCompanies(): Promise<any[]> {
    const response = await apiClient.get('/api/resource/Company', {
      params: {
        fields: '["name", "company_name", "default_currency"]',
        limit_page_length: 10,
      },
    });
    return response.data.data;
  },

  async getItems(search?: string): Promise<any[]> {
    const filters: any[] = [["disabled", "=", 0], ["is_sales_item", "=", 1]];
    
    if (search) {
      // Search in both code and name
      filters.push(["name", "like", `%${search}%`]);
      // Note: Frappe's simpler filtering doesn't easily support OR without complex JSON.
      // Usually, searching by 'name' (Item Code) covers most exact/ID lookups like '29066'.
    }
    
    const response = await apiClient.get('/api/resource/Item', {
      params: {
        fields: '["name", "item_name", "item_code", "stock_uom", "standard_rate"]',
        filters: JSON.stringify(filters),
        limit_page_length: 100,
        order_by: 'name asc'
      },
    });
    return response.data.data;
  },

  async getItemDetails(itemCode: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Item/${itemCode}`);
    return response.data.data;
  },

  async getWarehouses(): Promise<any[]> {
    const response = await apiClient.get('/api/resource/Warehouse', {
      params: {
        fields: '["name", "warehouse_name"]',
        filters: '[["disabled", "=", 0]]',
        limit_page_length: 50,
      },
    });
    return response.data.data;
  },

  async getTaxCategories(): Promise<any[]> {
    const response = await apiClient.get('/api/resource/Tax Category', {
      params: {
        fields: '["name", "title"]',
        limit_page_length: 50,
      },
    });
    return response.data.data;
  },

  async getSalesTaxesTemplates(company?: string): Promise<any[]> {
    const params: any = {
      fields: '["name", "title"]',
      filters: '[["disabled", "=", 0]]',
      limit_page_length: 50,
    };
    if (company) {
      params.filters = `[["disabled", "=", 0], ["company", "=", "${company}"]]`;
    }
    const response = await apiClient.get('/api/resource/Sales Taxes and Charges Template', { params });
    return response.data.data;
  },

  async getSalesTaxesTemplateDetail(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Sales Taxes and Charges Template/${name}`);
    return response.data.data;
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
      return response.data.data?.[0]?.price_list_rate || 0;
    } catch (error) {
      console.error("Error fetching item price:", error);
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

  async getSalesOrders(): Promise<SalesOrder[]> {
    const response = await apiClient.get('/api/resource/Sales Order', {
      params: {
        fields: '["name", "customer_name", "transaction_date", "grand_total", "status", "currency"]',
        order_by: 'transaction_date desc',
        limit_page_length: 20,
      },
    });
    return response.data.data;
  },

  async getSalesOrder(name: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/Sales Order/${name}`);
    return response.data.data;
  },

  async updateSalesOrder(name: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/resource/Sales Order/${name}`, data);
    return response.data.data;
  },

  async submitSalesOrder(doc: any): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.submit', {
      doc: doc
    });
    return response.data.message;
  },

  async cancelSalesOrder(name: string): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.client.cancel', {
      doctype: 'Sales Order',
      name: name
    });
    return response.data.message;
  },

  async getItemSalesAnalytics(): Promise<any[]> {
    const response = await apiClient.get('/api/method/frappe.desk.query_report.run', {
      params: {
        report_name: 'Sales Analytics',
        filters: JSON.stringify({
          tree_type: 'Item',
          doc_type: 'Sales Invoice',
          value_quantity: 'Quantity',
        })
      }
    });
    return response.data.message.result || [];
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
    return response.data.message;
  },

  async getMonthlySalesTrends(company?: string, fromDate: string = '2025-04-01', toDate: string = '2026-03-31'): Promise<any[]> {
    const filters: any = {
      tree_type: 'Item',
      doc_type: 'Sales Invoice',
      value_quantity: 'Value',
      from_date: fromDate,
      to_date: toDate,
      range: 'Monthly'
    };
    if (company) {
      filters.company = company;
    }
    const response = await apiClient.get('/api/method/frappe.desk.query_report.run', {
      params: {
        report_name: 'Sales Analytics',
        filters: JSON.stringify(filters)
      }
    });
    return response.data.message.result || [];
  }
};
