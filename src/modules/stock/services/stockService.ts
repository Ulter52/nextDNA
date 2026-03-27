import { stockApi } from './stockApi';
import { StockStats } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../../core/theme';

const CACHE_KEY = 'stock_stats_cache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const CHART_COLORS = [
  colors.primary,
  colors.success,
  colors.warning,
  colors.error,
  colors.purple_500,
  colors.sky_500,
  colors.rose_500,
  colors.teal_500
];

export const stockService = {
  async getStockStats(forceRefresh = false): Promise<StockStats> {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) return data;
      }
    }

    const company = 'DNA Retail Enterprises'; 
    
    const [binRes, itemsRes, entriesRes, salesRes] = await Promise.all([
      stockApi.getBinData(company),
      stockApi.getItems(100),
      stockApi.getStockEntries(10),
      stockApi.getItemSalesData(company)
    ]);

    const bins = binRes?.result || [];
    let totalValue = 0;
    let lowStock = 0;
    let outOfStock = 0;

    bins.forEach((bin: any) => {
      if (Array.isArray(bin)) {
        const qty = parseFloat(bin[3]) || 0;
        const val = parseFloat(bin[8]) || 0;
        totalValue += val;
        if (qty <= 0) outOfStock++;
        else if (qty < 10) lowStock++;
      }
    });

    // Aggressive Sales Grouping
    const salesRows = salesRes?.result || [];
    const salesGroupMap: Record<string, number> = {};
    
    // First pass: Discover all unique groups
    salesRows.forEach((row: any) => {
      if (Array.isArray(row) || !row.item_group) return;
      if (!(row.item_group in salesGroupMap)) {
        salesGroupMap[row.item_group] = 0;
      }
    });

    // Second pass: Aggregate values across all month columns
    salesRows.forEach((row: any) => {
      if (Array.isArray(row) || !row.item_group) return;
      
      const group = row.item_group;
      let rowTotal = 0;
      
      Object.entries(row).forEach(([key, val]) => {
        // Skip non-data keys
        if (['name', 'item_name', 'item_group', 'uom', 'brand', 'indent', 'company', 'doctype', 'parent'].includes(key)) {
          return;
        }

        // Clean and parse numeric values (handling strings/commas)
        const cleanVal = String(val).replace(/,/g, '');
        const numVal = parseFloat(cleanVal);
        
        if (!isNaN(numVal) && numVal !== 0) {
          rowTotal += numVal;
        }
      });
      
      salesGroupMap[group] += rowTotal;
    });

    const salesData = Object.entries(salesGroupMap)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const stats: StockStats = {
      total_items: itemsRes?.data?.length || 0,
      low_stock_count: lowStock,
      out_of_stock_count: outOfStock,
      total_value: totalValue,
      recent_activities: entriesRes?.data || [],
      sales_data: salesData
    };

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }));
    return stats;
  }
};
