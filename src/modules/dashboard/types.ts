export interface SalesStats {
  total_sales: number; // FY Total Sales
  monthly_sales: number; // Current Month Sales
  order_count: number;
  customer_count: number;
  recent_orders: any[];
  trend: number;
  fy_monthly_sales?: { label: string; value: number }[]; // Monthly data for the whole current FY
  prev_fy_monthly_sales?: { label: string; value: number }[]; // Monthly data for the whole previous FY
  // New Business Intelligence Metrics
  profitability?: {
    gross_profit: number;
    margin_percent: number;
  };
  collections?: {
    cash_sales: number;
    credit_sales: number;
    total_outstanding: number;
    efficiency: number;
    aging_ranges?: { range: string; amount: number; color: string }[];
  };
  aging?: {
    range1: number; // 0-30
    range2: number; // 30-60
    range3: number; // 60-90
    range4: number; // 90+
  };
  inventory?: {
    total_value: number;
    dead_stock_count: number;
    low_stock_count: number;
  };
  conversion?: {
    quote_to_order: number;
    order_to_invoice: number;
  };
  expenses?: {
    total_expenses: number;
    top_heads: { name: string; amount: number }[];
  };
  alerts?: {
    id: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    actionLabel?: string;
  }[];
  insights?: string[];
}
