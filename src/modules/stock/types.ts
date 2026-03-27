export interface StockStats {
  total_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_value: number;
  recent_activities: any[];
  warehouse_distribution?: { warehouse: string; count: number }[];
  top_items?: { item_code: string; actual_qty: number; valuation_rate: number }[];
  sales_data?: { name: string; value: number; color: string }[];
}

export interface StockItem {
  item_code: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  valuation_rate: number;
  actual_qty: number;
  warehouse: string;
}
