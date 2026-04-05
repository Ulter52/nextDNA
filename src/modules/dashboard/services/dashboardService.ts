import { SalesStats } from '../types';
import { dashboardApi } from './dashboardApi';
import { getDateRanges } from '../../../core/utils/dateHelpers';
import { calculateCEI } from '../../../core/utils/CEI';
import { companyService } from '../../../core/services/companyService';

export const dashboardService = {
  async getDashboardStats(): Promise<SalesStats> {
    const ranges = getDateRanges();
    const { today, lastMonth } = ranges;

    const companyData = await companyService.ensureCompanySelected();
    const company = companyData?.name || '';
    
    const fy = await companyService.getFiscalYear();
    const financialYear = {
      from_date: fy.year_start_date,
      to_date: fy.year_end_date
    };

    const fyStart = new Date(fy.year_start_date);
    const fyEnd = new Date(fy.year_end_date);
    
    // Exact same date range for previous year
    const prevFinancialYear = {
      from_date: new Date(fyStart.getFullYear() - 1, fyStart.getMonth(), fyStart.getDate()).toISOString().split('T')[0],
      to_date: new Date(fyEnd.getFullYear() - 1, fyEnd.getMonth(), fyEnd.getDate()).toISOString().split('T')[0]
    };

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
      dashboardApi.getRecentInvoices(company, 5),
      dashboardApi.getSalesAnalytics(company, financialYear.from_date, today),
      dashboardApi.getSalesAnalytics(company, prevFinancialYear.from_date, prevFinancialYear.to_date),
      dashboardApi.getGrossProfit(company, financialYear.from_date, financialYear.to_date),
      dashboardApi.getAccountsReceivable(company),
      dashboardApi.getAccountsReceivable(company, lastMonth.to_date),
      dashboardApi.getQuotationsCount(company),
      dashboardApi.getSalesOrdersCount(company),
      dashboardApi.getCustomersCount(),
      dashboardApi.getTodaySales(company, today),
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

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const getMonthKey = (label: string) => {
      const cleanLabel = label.split(' ')[0];
      return monthNames.find(m => cleanLabel.toLowerCase().startsWith(m.toLowerCase()));
    };

    const parseAnalytics = (res: any) => {
      const analytics = res?.result || [];
      const columns = res?.columns || [];
      const totalRow = analytics.find((row: any) => {
        const firstVal = Array.isArray(row) ? row[0] : (row.name || row.item_group || row.customer || "");
        return String(firstVal).toLowerCase().trim() === 'total';
      });

      const monthlyData: { label: string; value: number }[] = [];
      if (totalRow && columns.length > 0) {
        columns.forEach((col: any, idx: number) => {
          const monthKey = getMonthKey(col.label || "");
          // Exclude the 'Total' column itself in the analytics report
          if (monthKey && col.fieldname !== 'total' && col.label !== 'Total') {
            const val = Array.isArray(totalRow) ? totalRow[idx] : totalRow[col.fieldname];
            monthlyData.push({ label: monthKey, value: Number(val) || 0 });
          }
        });
      }
      return monthlyData;
    };

    const padAnalytics = (data: { label: string; value: number }[], startDate: Date) => {
      const orderedMonths = Array.from({ length: 12 }, (_, i) => monthNames[(startDate.getMonth() + i) % 12]);
      return orderedMonths.map(m => {
        const found = data.find(d => d.label === m);
        return { label: m, value: found ? found.value : 0 };
      });
    };

    const rawFySales = parseAnalytics(analyticsRes);
    const rawPrevFySales = parseAnalytics(prevAnalyticsRes);

    stats.fy_monthly_sales = padAnalytics(rawFySales, fyStart);
    stats.prev_fy_monthly_sales = padAnalytics(rawPrevFySales, fyStart);

    // Calculate Trend
    if (rawFySales.length > 0) {
      const currentMonthData = rawFySales[rawFySales.length - 1];
      stats.monthly_sales = currentMonthData.value;
      
      // Determine what to compare against
      let compareValue = 0;
      if (rawFySales.length >= 2) {
        // Normal MoM within same FY
        compareValue = rawFySales[rawFySales.length - 2].value;
      } else {
        // First month of FY (April) -> Compare against same month last year (April LY)
        const sameMonthLY = rawPrevFySales.find(m => m.label === currentMonthData.label);
        if (sameMonthLY) compareValue = sameMonthLY.value;
      }

      if (compareValue > 0) {
        stats.trend = parseFloat(((stats.monthly_sales - compareValue) / compareValue * 100).toFixed(1));
      }
    }

    const gpResult = gpRes?.result || [];
    const gpTotal = gpResult.find((row: any) => row.is_total || row[0] === 'Total' || row.sales_invoice === 'Total');
    if (gpTotal) {
      stats.total_sales = gpTotal.selling_amount || 0;
      stats.profitability = {
        gross_profit: gpTotal.gross_profit || 0,
        margin_percent: parseFloat(Number(gpTotal.gross_profit_percent || 0).toFixed(1))
      };
    }

    const arCols = arRes?.columns || [];
    const arResult = arRes?.result || [];
    const arTotalRow = arResult.find((row: any) => Array.isArray(row) ? (row[0] === 'Total' || row.some(v => v === 'Total')) : (row.name === 'Total'));
    const arBegResult = arBegRes?.result || [];
    const arBegTotalRow = arBegResult.find((row: any) => Array.isArray(row) ? (row[0] === 'Total' || row.some(v => v === 'Total')) : (row.name === 'Total'));

    if (arTotalRow && arCols.length > 0) {
      const getIdx = (label: string) => arCols.findIndex((c: any) => (c.label || c.fieldname || '').toLowerCase().includes(label.toLowerCase()));
      const getVal = (row: any, label: string) => {
        const idx = getIdx(label);
        if (idx === -1) return 0;
        return Array.isArray(row) ? (Number(row[idx]) || 0) : (Number(row[arCols[idx].fieldname]) || 0);
      };
      const totalAR = getVal(arTotalRow, 'Outstanding');
      const bucket1 = getVal(arTotalRow, '0-30');
      const begTotalAR = arBegTotalRow ? getVal(arBegTotalRow, 'Outstanding') : 0;
      stats.collections = {
        cash_sales: Math.max(0, begTotalAR + stats.monthly_sales - totalAR),
        credit_sales: totalAR,
        total_outstanding: totalAR,
        efficiency: calculateCEI(begTotalAR, stats.monthly_sales, totalAR, bucket1),
        aging_ranges: [
          { range: '0-30', amount: bucket1, color: '#10b981' },
          { range: '31-60', amount: getVal(arTotalRow, '31-60'), color: '#f59e0b' },
          { range: '61-90', amount: getVal(arTotalRow, '61-90'), color: '#f97316' },
          { range: '91-120', amount: getVal(arTotalRow, '91-120'), color: '#ef4444' },
          { range: '121+', amount: getVal(arTotalRow, '121'), color: '#b91c1c' }
        ]
      };
    }

    const stockResult = stockAnalyticsRes?.result || [];
    const stockTotal = stockResult.find((row: any) => Array.isArray(row) ? (row[0] === 'Total') : (row.name === 'Total'));
    let totalInvValue = 0;
    if (stockTotal) {
      if (Array.isArray(stockTotal)) totalInvValue = Number(stockTotal[stockTotal.length - 1]) || 0;
      else {
        const valCols = (stockAnalyticsRes?.columns || []).filter((c: any) => !['name', 'item_group'].includes(c.fieldname));
        if (valCols.length > 0) totalInvValue = Number(stockTotal[valCols[valCols.length - 1].fieldname]) || 0;
      }
    }
    stats.inventory = { total_value: totalInvValue, low_stock_count: 0, dead_stock_count: 0 };
    if (!todaySalesRes?.data?.length) stats.alerts.push({ id: 'no_sales', type: 'warning', message: 'No sales recorded yet today.' });
    stats.conversion = { quote_to_order: Math.round(((ordersRes?.data?.length || 0) / (quotesRes?.data?.length || 1)) * 100), order_to_invoice: 95 };

    return stats;
  }
};
