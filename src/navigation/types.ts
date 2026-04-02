export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  User: { screen: keyof UserStackParamList };
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  SellingTab: undefined;
  StockTab: undefined;
  AccountingTab: undefined;
  MoreTab: undefined;
};

export type MoreStackParamList = {
  MoreHub: undefined;
  FinancialReports: undefined;
  Projects: { screen: keyof ProjectsStackParamList };
  Buying: { screen: keyof BuyingStackParamList };
};

export type ProjectsStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  ProjectEdit: { projectId?: string };
};

export type BuyingStackParamList = {
  Dashboard: undefined;
  PurchaseOrderList: undefined;
  PurchaseOrderDetail: { orderId: string };
  PurchaseOrderEdit: { orderId?: string };
  PurchaseInvoiceList: undefined;
  PurchaseInvoiceDetail: { invoiceId: string };
  PurchaseInvoiceEdit: { invoiceId?: string };
  SupplierList: undefined;
  SupplierDetail: { supplierId: string };
  SupplierEdit: { supplierId?: string };
};

export type SellingStackParamList = {
  SellingHub: undefined;
  SalesOrderList: undefined;
  SalesOrderDetail: { orderId: string };
  NewSalesOrder: undefined;
  CustomerList: undefined;
  NewCustomer: undefined;
  CustomerDetail: { customerId: string };
  QuotationList: undefined;
  QuotationDetail: { quotationId: string };
  NewQuotation: undefined;
  SalesInvoiceList: undefined;
  SalesInvoiceDetail: { invoiceId: string };
  NewSalesInvoice: undefined;
};

export type UserStackParamList = {
  Profile: undefined;
};

export type ReportsStackParamList = {
  ReportsHub: undefined;
  ReportViewer: { reportId: string; reportName: string; filters: any };
  SalesAnalytics: undefined;
  SalesRegister: undefined;
  QuotationTrends: undefined;
  StockSummary: undefined;
  StockLedger: undefined;
  LowStock: undefined;
  ProfitAndLoss: undefined;
  BalanceSheet: undefined;
  CashFlow: undefined;
  ARSummary: undefined;
  APSummary: undefined;
  PurchaseAnalytics: undefined;
  PurchaseRegister: undefined;
};
