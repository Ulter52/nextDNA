export interface ReportItem {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

export interface AgingBucket {
  range: string;
  amount: number;
  color?: string;
}

export interface ReportStats {
  net_profit: number;
  total_expenses: number;
  gross_profit: number;
  receivables: AgingBucket[];
  payables: AgingBucket[];
  revenue_trend: { month: string; amount: number }[];
}
