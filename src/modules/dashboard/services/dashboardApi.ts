import { fetchResource, runReport } from '@core/api/frappeApiHelpers';

export const dashboardApi = {
  async getCompanies() {
    return await fetchResource('Company', {
      fields: '["name", "company_name", "default_currency"]',
      limit_page_length: 1,
    });
  },

  async getRecentInvoices(limit = 5) {
    return await fetchResource('Sales Invoice', {
      fields: '["name", "customer_name", "posting_date", "grand_total", "status", "currency"]',
      order_by: 'posting_date desc',
      limit_page_length: limit,
    });
  },

  async getTodaySales(today: string) {
    return await fetchResource('Sales Invoice', {
      filters: JSON.stringify([['posting_date', '=', today]]),
      limit_page_length: 1
    });
  },

  async getSalesAnalytics(company: string, fromDate: string, toDate: string) {
    return await runReport('Sales Analytics', { 
      tree_type: 'Item', doc_type: 'Sales Invoice', value_quantity: 'Value', 
      from_date: fromDate, to_date: toDate, range: 'Monthly', company 
    });
  },

  async getGrossProfit(company: string, fromDate: string, toDate: string) {
    return await runReport('Gross Profit', { 
      company, 
      from_date: fromDate, 
      to_date: toDate,
      group_by: 'Invoice',
      include_returned_invoices: 1
    });
  },

  async getAccountsReceivable(company: string, reportDate?: string) {
    return await runReport('Accounts Receivable Summary', { 
      company,
      report_date: reportDate,
      range1: 30,
      range2: 60,
      range3: 90,
      range4: 120
    });
  },

  async getStockAnalytics(company: string, fromDate: string, toDate: string) {
    return await runReport('Stock Analytics', { 
      value_quantity: 'Value', 
      company, 
      from_date: fromDate, 
      to_date: toDate, 
      range: 'Monthly' 
    });
  },

  async getQuotationsCount() {
    return await fetchResource('Quotation', { limit_page_length: 100, fields: '["name"]' });
  },

  async getSalesOrdersCount() {
    return await fetchResource('Sales Order', { limit_page_length: 100, fields: '["name"]' });
  },

  async getCustomersCount() {
    return await fetchResource('Customer', { limit_page_length: 1, fields: '["name"]' });
  }
};
