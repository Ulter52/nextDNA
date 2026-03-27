import AsyncStorage from '@react-native-async-storage/async-storage';
import { SalesStats } from '../types';
import { dashboardApi } from './dashboardApi';
import { getDateRanges } from '../../../core/utils/dateHelpers';
import { calculateCEI } from '../../../core/utils/CEI';

const CACHE_KEY = 'dashboard_stats_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const dashboardService = {
  async getDashboardStats(forceRefresh = false): Promise<SalesStats> {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('[CACHE] Returning cached dashboard stats');
          return data;
        }
      }
    }

    const ranges = getDateRanges();
    const { today, lastMonth, financialYear, prevFinancialYear } = ranges;

    let company = '';
    try {
      const companiesRes = await dashboardApi.getCompanies();
      company = companiesRes?.data?.[0]?.name || '';
    } catch (e) {}

    const [
      invoicesRes, 
      analyticsRes, 
      prevAnalyticsRes,
      gpRes, 
      arRes, 
      arBegRes,
      quotesRes, 
      ordersRes, 
      customersRes,
      todaySalesRes,
      stockAnalyticsRes
    ] = await Promise.all([
      dashboardApi.getRecentInvoices(5),
      dashboardApi.getSalesAnalytics(company, financialYear.from_date, today),
      dashboardApi.getSalesAnalytics(company, prevFinancialYear.from_date, prevFinancialYear.to_date),
      dashboardApi.getGrossProfit(company, financialYear.from_date, financialYear.to_date),
      dashboardApi.getAccountsReceivable(company),
      dashboardApi.getAccountsReceivable(company, lastMonth.to_date),
      dashboardApi.getQuotationsCount(),
      dashboardApi.getSalesOrdersCount(),
      dashboardApi.getCustomersCount(),
      dashboardApi.getTodaySales(today),
      dashboardApi.getStockAnalytics(company, financialYear.from_date, financialYear.to_date)
    ]);

    const stats: SalesStats = {
      total_sales: 0,
      monthly_sales: 0,
      order_count: ordersRes?.data?.length || 0,
      customer_count: customersRes?.data?.length || 0,
      recent_orders: invoicesRes?.data || [],
      trend: 0,
      fy_monthly_sales: [],
      prev_fy_monthly_sales: [],
      alerts: [],
      insights: []
    };

    // Helper to parse analytics results
    const parseAnalytics = (res: any) => {
      const analytics = res?.result || [];
      const columns = res?.columns || [];
      const totalRow = analytics.find((row: any) => Array.isArray(row) && row[0] === 'Total');
      const monthlyData: { label: string; value: number }[] = [];
      
      if (totalRow && columns.length > 0) {
        columns.forEach((col: any, idx: number) => {
          const label = col.label || col.fieldname || "";
          if (/[A-Z][a-z]{2}\s\d{4}/.test(label) || /^[A-Z][a-z]{2}$/.test(label)) {
            monthlyData.push({
              label: label.split(' ')[0],
              value: parseFloat(totalRow[idx]) || 0
            });
          }
        });
      }
      return monthlyData;
    };

    stats.fy_monthly_sales = parseAnalytics(analyticsRes);
    stats.prev_fy_monthly_sales = parseAnalytics(prevAnalyticsRes);

    if (stats.fy_monthly_sales.length >= 1) {
      const currentMonthData = stats.fy_monthly_sales[stats.fy_monthly_sales.length - 1];
      const prevMonthData = stats.fy_monthly_sales[stats.fy_monthly_sales.length - 2];
      stats.monthly_sales = currentMonthData.value;
      if (prevMonthData && prevMonthData.value > 0) {
        stats.trend = parseFloat(((currentMonthData.value - prevMonthData.value) / prevMonthData.value * 100).toFixed(1));
      }
    }

    // 1. Process Profitability & Core Sales
    const gpResult = gpRes?.result || [];
    const gpTotal = gpResult.find((row: any) => row.is_total || row[0] === 'Total' || row.sales_invoice === 'Total');
    if (gpTotal) {
      stats.total_sales = gpTotal.selling_amount || 0;
      stats.profitability = {
        gross_profit: gpTotal.gross_profit || 0,
        margin_percent: parseFloat(Number(gpTotal.gross_profit_percent || 0).toFixed(1))
      };
    }

    // 3. Process Accounts Receivable & CEI
    const arCols = arRes?.columns || [];
    const arResult = arRes?.result || [];
    const arTotalRow = arResult.find((row: any) => Array.isArray(row) && row[0] === 'Total');
    const arBegResult = arBegRes?.result || [];
    const arBegTotalRow = arBegResult.find((row: any) => Array.isArray(row) && row[0] === 'Total');

    if (arTotalRow && arCols.length > 0) {
      const getIdx = (label: string) => arCols.findIndex((c: any) => 
        (c.label || c.fieldname || '').toLowerCase().includes(label.toLowerCase())
      );
      const totalIdx = getIdx('Outstanding');
      const b1Idx = getIdx('0-30');
      const totalAR = parseFloat(arTotalRow[totalIdx]) || 0;
      const bucket1 = parseFloat(arTotalRow[b1Idx]) || 0;
      const begTotalAR = arBegTotalRow ? (parseFloat(arBegTotalRow[totalIdx]) || 0) : 0;
      const efficiency = calculateCEI(begTotalAR, stats.monthly_sales, totalAR, bucket1);
      const collectedThisMonth = Math.max(0, begTotalAR + stats.monthly_sales - totalAR);

      stats.collections = {
        cash_sales: collectedThisMonth,
        credit_sales: totalAR,
        total_outstanding: totalAR,
        efficiency: efficiency,
        aging_ranges: [
          { range: '0-30', amount: bucket1, color: '#10b981' },
          { range: '31-60', amount: parseFloat(arTotalRow[getIdx('31-60')]) || 0, color: '#f59e0b' },
          { range: '61-90', amount: parseFloat(arTotalRow[getIdx('61-90')]) || 0, color: '#f97316' },
          { range: '91-120', amount: parseFloat(arTotalRow[getIdx('91-120')]) || 0, color: '#ef4444' },
          { range: '121+', amount: parseFloat(arTotalRow[getIdx('121')]) || 0, color: '#b91c1c' }
        ]
      };
    }

    const stockTotal = (stockAnalyticsRes?.result || []).find((row: any) => row[0] === 'Total');
    stats.inventory = { total_value: stockTotal ? parseFloat(stockTotal[stockTotal.length-1]) : 0, low_stock_count: 0, dead_stock_count: 0 };
    if (!todaySalesRes?.data?.length) stats.alerts.push({ id: 'no_sales', type: 'warning', message: 'No sales recorded yet today.' });
    stats.conversion = { quote_to_order: Math.round(((ordersRes?.data?.length || 0) / (quotesRes?.data?.length || 1)) * 100), order_to_invoice: 95 };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }));
    return stats;
  }
};
