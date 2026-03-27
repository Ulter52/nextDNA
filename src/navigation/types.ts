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
