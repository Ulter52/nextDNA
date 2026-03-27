import apiClient from '../../../core/api/client';
import { ReportStats } from '../types';

export const reportService = {
  async getReportOverview(company: string): Promise<ReportStats> {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const now = new Date();
    const firstDayCurrent = formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const today = formatDate(now);

    try {
      const [arRes, apRes, plRes, gpRes] = await Promise.all([
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Accounts Receivable Summary',
            filters: JSON.stringify({ company })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Accounts Payable Summary',
            filters: JSON.stringify({ company })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Profit and Loss Statement',
            filters: JSON.stringify({ company, periodicity: 'Monthly', from_date: firstDayCurrent, to_date: today })
          }
        }),
        apiClient.get('/api/method/frappe.desk.query_report.run', {
          params: {
            report_name: 'Gross Profit',
            filters: JSON.stringify({ company, from_date: firstDayCurrent, to_date: today })
          }
        })
      ]);

      const arData = arRes.data.message?.result || [];
      const arTotal = arData.find((row: any) => row.is_total || row[0] === 'Total');

      const plData = plRes.data.message?.result || [];
      const netProfitRow = plData.find((row: any) => row.account_name?.includes('Total Profit'));
      const totalExpenseRow = plData.find((row: any) => row.account_name?.includes('Total Expense'));

      const gpData = gpRes.data.message?.result || [];
      const gpTotal = gpData.find((row: any) => row.is_total || row[0] === 'Total');

      return {
        net_profit: netProfitRow?.total || 0,
        total_expenses: totalExpenseRow?.total || 0,
        gross_profit: gpTotal?.gross_profit || 0,
        receivables: [
          { range: '0-30', amount: arTotal?.range1 || 0, color: '#10b981' },
          { range: 30-60, amount: arTotal?.range2 || 0, color: '#f59e0b' },
          { range: 60-90, amount: arTotal?.range3 || 0, color: '#f97316' },
          { range: '90+', amount: arTotal?.range4 || 0, color: '#ef4444' },
        ],
        payables: [],
        revenue_trend: []
      };
    } catch (error) {
      console.error('Report Service Error:', error);
      throw error;
    }
  }
};
