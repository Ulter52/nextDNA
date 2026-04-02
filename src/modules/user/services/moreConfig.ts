import {
  Users, FileText, Settings, BarChart3, PersonStanding, UserStar,
  Home, Hammer, ShoppingCart, ShoppingBag, Package, Briefcase,
  Factory, CheckCircle, ClipboardList, LifeBuoy, Globe, Link,
  FileCheck, CreditCard, Truck, ShieldCheck, Plus, SquareSigma
} from 'lucide-react-native';

export const STATIC_WORKSPACES = [
  { name: 'Home', icon: Home, color: '#2563eb', bgColor: '#eff6ff', visible: true, route: 'Dashboard' },
  { name: 'Build', icon: Hammer, color: '#4b5563', bgColor: '#f3f4f6', visible: false, route: 'Build' },
  { name: 'Invoicing', icon: FileText, color: '#ea580c', bgColor: '#fff7ed', visible: false, route: 'Invoicing' },
  { name: 'Buying', icon: ShoppingBag, color: '#16a34a', bgColor: '#f0fdf4', visible: true, route: 'Buying' },
  { name: 'Financial Reports', icon: BarChart3, color: '#9333ea', bgColor: '#faf5ff', visible: true, route: 'FinancialReports' },
  { name: 'Selling', icon: ShoppingCart, color: '#4f46e5', bgColor: '#eef2ff', visible: true, route: 'Selling' },
  { name: 'Stock', icon: Package, color: '#2563eb', bgColor: '#eff6ff', visible: true, route: 'Inventory' },
  { name: 'Assets', icon: Briefcase, color: '#57534e', bgColor: '#f5f5f4', visible: false, route: 'Assets' },
  { name: 'Manufacturing', icon: Factory, color: '#dc2626', bgColor: '#fef2f2', visible: false, route: 'Manufacturing' },
  { name: 'Subcontracting', icon: Users, color: '#0891b2', bgColor: '#ecfeff', visible: false, route: 'Subcontracting' },
  { name: 'Quality', icon: CheckCircle, color: '#059669', bgColor: '#ecfdf5', visible: false, route: 'Quality' },
  { name: 'Projects', icon: ClipboardList, color: '#0ea5e9', bgColor: '#f0f9ff', visible: true, route: 'Projects' },
  { name: 'Support', icon: LifeBuoy, color: '#e11d48', bgColor: '#fff1f2', visible: false, route: 'Support' },
  { name: 'Users', icon: PersonStanding, color: '#7c3aed', bgColor: '#f5f3ff', visible: true, route: 'Users' },
  { name: 'Website', icon: Globe, color: '#2563eb', bgColor: '#eff6ff', visible: false, route: 'Website' },
  { name: 'GST India', icon: FileCheck, color: '#d97706', bgColor: '#fffbeb', visible: false, route: 'GSTIndia' },
  { name: 'CRM', icon: Users, color: '#db2777', bgColor: '#fdf2f8', visible: false, route: 'CRM' },
  { name: 'ERPNext Settings', icon: Settings, color: '#475569', bgColor: '#f8fafc', visible: false, route: 'Settings' },
  { name: 'Integrations', icon: Link, color: '#3f3f46', bgColor: '#f4f4f5', visible: false, route: 'Integrations' },
];

export const QUICK_ACTIONS = [
  { id: 'addPurchaseInvoice', label: 'Add Purchase Invoice', icon: Plus, color: '#16a34a', bgColor: '#f0fdf4' },
  { id: 'addProject', label: 'Add Project', icon: FileText, color: '#ea580c', bgColor: '#fff7ed' },
  { id: 'addSupplier', label: 'Add Supplier', icon: UserStar, color: '#4f46e5', bgColor: '#eef2ff' },
  { id: 'stockSummary', label: 'Stock Summary', icon: SquareSigma, color: '#dc2626', bgColor: '#fef2f2' },
];