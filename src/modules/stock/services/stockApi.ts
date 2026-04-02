import { fetchResource, runReport, createResource, updateResource, callMethod } from '../../../core/api/frappeApiHelpers';
import { getDateRanges } from '../../../core/utils/dateHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { companyService } from '../../../core/services/companyService';
import { colors } from '../../../core/theme';
import { StockStats } from '../types';

const STATS_CACHE_KEY = 'stock_stats_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const CHART_COLORS = [
  colors.primary, colors.success, colors.warning, colors.error,
  colors.purple_500, colors.sky_500, colors.rose_500, colors.teal_500
];

export const stockApi = {
  // --- Core Resource Methods ---

  getItemDetails: (itemCode: string) => fetchResource(`Item/${itemCode}`),

  getItems: (limit = 20, search?: string, filters?: any) => {
    const finalFilters: any[] = [["disabled", "=", 0]];
    if (search) finalFilters.push(["item_name", "like", `%${search}%`]);
    if (filters?.item_group) finalFilters.push(["item_group", "=", filters.item_group]);
    if (filters?.brand) finalFilters.push(["brand", "=", filters.brand]);

    return fetchResource('Item', {
      fields: '["name", "item_name", "item_group", "stock_uom", "valuation_rate", "image", "modified"]',
      filters: JSON.stringify(finalFilters),
      limit_page_length: limit,
      order_by: 'modified desc'
    });
  },

  createItem: (data: any) => createResource('Item', data),

  updateItem: (itemCode: string, data: any) => updateResource('Item', itemCode, data),

  getStockEntries: (limit = 10) =>
    fetchResource('Stock Entry', {
      fields: '["name", "posting_date", "stock_entry_type", "total_outgoing_value", "total_incoming_value"]',
      order_by: 'modified desc',
      limit_page_length: limit
    }),

  updateResource: (doctype: string, name: string, data: any) => updateResource(doctype, name, data),

  // --- Material Request Methods ---
  getMaterialRequests: (company: string, search?: string, status?: string, type?: string, limit = 20) => {
    const filters: any[] = [["company", "=", company]];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);
    if (type && type !== 'All') filters.push(["material_request_type", "=", type]);

    return fetchResource('Material Request', {
      fields: '["name", "transaction_date", "status", "material_request_type", "per_ordered", "per_received"]',
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      order_by: 'transaction_date desc'
    }).then(r => r?.data || []);
  },

  getMaterialRequestMeta: () => {
    // Standard desk method for loading DocType meta
    return callMethod('frappe.desk.form.load.getdoctype', { doctype: 'Material Request' })
      .then(r => r?.docs?.[0]);
  },

  createMaterialRequest: (data: any) => createResource('Material Request', data),

  // --- Purchase Receipt Methods ---
  getPurchaseReceipts: (company: string, search?: string, status?: string, limit = 20) => {
    const filters: any[] = [["company", "=", company]];
    if (search) filters.push(["name", "like", `%${search}%`]);
    if (status && status !== 'All') filters.push(["status", "=", status]);

    return fetchResource('Purchase Receipt', {
      fields: '["name", "supplier", "posting_date", "status", "grand_total", "currency"]',
      filters: JSON.stringify(filters),
      limit_page_length: limit,
      order_by: 'posting_date desc'
    }).then(r => r?.data || []);
  },

  // --- Dashboard Stats ---
  getStockDashboardStats: async (forceRefresh = false): Promise<StockStats> => {
    if (!forceRefresh) {
      const cached = await AsyncStorage.getItem(STATS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) return data;
      }
    }

    const [selectedCompany, fy] = await Promise.all([
      companyService.getSelectedCompany(),
      companyService.getFiscalYear()
    ]);

    const company = selectedCompany?.name || 'DNA Retail Enterprises';

    try {
      // 1. Fetch live stock data (Bin) and Item metadata concurrently
      const [binRes, itemsRes] = await Promise.all([
        fetchResource('Bin', { fields: '["item_code", "actual_qty", "valuation_rate", "warehouse"]', limit_page_length: 5000 }),
        stockApi.getItems(1000)
      ]);

      const bins = binRes?.data || [];
      const items = itemsRes?.data || [];
      const itemMap = items.reduce((acc: any, it: any) => ({ ...acc, [it.name]: it }), {});

      let totalValue = 0;
      let outOfStock = 0;
      let lowStock = 0;
      
      const groupValueMap: Record<string, number> = {};
      const itemAggregator: Record<string, { qty: number, val: number, group: string }> = {};

      // 2. Aggregate quantity across all warehouses for unique items
      bins.forEach((bin: any) => {
        const item = itemMap[bin.item_code];
        const qty = parseFloat(bin.actual_qty || 0);
        const rate = parseFloat(bin.valuation_rate || item?.valuation_rate || 0);
        const val = qty * rate;
        const group = item?.item_group || 'Others';

        if (!itemAggregator[bin.item_code]) {
          itemAggregator[bin.item_code] = { qty: 0, val: 0, group };
        }
        itemAggregator[bin.item_code].qty += qty;
        itemAggregator[bin.item_code].val += val;
      });

      // 3. Derive metrics from system-wide aggregated totals
      Object.values(itemAggregator).forEach(item => {
        if (item.qty <= 0) {
          outOfStock++;
        } else if (item.qty < 10) {
          lowStock++;
        }

        if (item.val > 0) {
          totalValue += item.val;
          groupValueMap[item.group] = (groupValueMap[item.group] || 0) + item.val;
        }
      });

      // Format Chart Data
      const stockValueData = Object.entries(groupValueMap)
        .map(([name, value], index) => ({
          name, value, color: CHART_COLORS[index % CHART_COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const stats: StockStats = {
        total_items: Object.keys(itemAggregator).length || items.length,
        low_stock_count: lowStock,
        out_of_stock_count: outOfStock,
        total_value: totalValue,
        recent_activities: [],
        sales_data: stockValueData,
        last_updated: new Date().toISOString(),
        company: company
      };

      await AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data: stats, timestamp: Date.now() }));
      return stats;
    } catch (error) {
      console.error("Stock Stats Sync Error:", error);
      throw error;
    }
  }
};
