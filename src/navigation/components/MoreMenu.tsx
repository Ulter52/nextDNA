import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  X, 
  ChevronRight, 
  CreditCard, 
  BarChart3, 
  Truck, 
  ShieldCheck,
  LayoutGrid,
  RefreshCw,
  Home,
  Hammer,
  ShoppingCart,
  ShoppingBag,
  Package,
  Briefcase,
  Factory,
  CheckCircle,
  ClipboardList,
  LifeBuoy,
  User,
  Globe,
  FileCheck,
  Link
} from 'lucide-react-native';
import { getInitials } from '../../core/utils/formatters';
import apiClient from '../../core/api/client';

const { width } = Dimensions.get('window');

const WORKSPACE_THEMES: Record<string, { icon: any; color: string; bgColor: string }> = {
  'Home': { icon: Home, color: '#2563eb', bgColor: '#eff6ff' },
  'Build': { icon: Hammer, color: '#4b5563', bgColor: '#f3f4f6' },
  'Invoicing': { icon: FileText, color: '#ea580c', bgColor: '#fff7ed' },
  'Buying': { icon: ShoppingBag, color: '#16a34a', bgColor: '#f0fdf4' },
  'Financial Reports': { icon: BarChart3, color: '#9333ea', bgColor: '#faf5ff' },
  'Selling': { icon: ShoppingCart, color: '#4f46e5', bgColor: '#eef2ff' },
  'Stock': { icon: Package, color: '#2563eb', bgColor: '#eff6ff' },
  'Assets': { icon: Briefcase, color: '#57534e', bgColor: '#f5f5f4' },
  'Manufacturing': { icon: Factory, color: '#dc2626', bgColor: '#fef2f2' },
  'Subcontracting': { icon: Users, color: '#0891b2', bgColor: '#ecfeff' },
  'Quality': { icon: CheckCircle, color: '#059669', bgColor: '#ecfdf5' },
  'Projects': { icon: ClipboardList, color: '#0ea5e9', bgColor: '#f0f9ff' },
  'Support': { icon: LifeBuoy, color: '#e11d48', bgColor: '#fff1f2' },
  'Users': { icon: User, color: '#7c3aed', bgColor: '#f5f3ff' },
  'Website': { icon: Globe, color: '#2563eb', bgColor: '#eff6ff' },
  'GST India': { icon: FileCheck, color: '#d97706', bgColor: '#fffbeb' },
  'CRM': { icon: Users, color: '#db2777', bgColor: '#fdf2f8' },
  'ERPNext Settings': { icon: Settings, color: '#475569', bgColor: '#f8fafc' },
  'Integrations': { icon: Link, color: '#3f3f46', bgColor: '#f4f4f5' },
};

function getWorkspaceTheme(name: string) {
  return WORKSPACE_THEMES[name] || { icon: LayoutGrid, color: '#2563eb', bgColor: '#eff6ff' };
}

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  user: string | null;
  onLogout: () => void;
}

export function MoreMenu({ isOpen, onClose, onNavigate, user, onLogout }: MoreMenuProps) {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/api/method/frappe.desk.desktop.get_workspace_sidebar_items');
      if (response.data.message) {
        setWorkspaces(response.data.message.pages || response.data.message || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { id: 'customers', label: 'Customers', icon: Users, color: '#2563eb', bgColor: '#eff6ff' },
    { id: 'quotations', label: 'Quotations', icon: FileText, color: '#ea580c', bgColor: '#fff7ed' },
    { id: 'payments', label: 'Payments', icon: CreditCard, color: '#16a34a', bgColor: '#f0fdf4' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, color: '#9333ea', bgColor: '#faf5ff' },
    { id: 'shipping', label: 'Shipping', icon: Truck, color: '#4f46e5', bgColor: '#eef2ff' },
    { id: 'hr', label: 'Human Resources', icon: ShieldCheck, color: '#dc2626', bgColor: '#fef2f2' },
    { id: 'settings', label: 'Settings', icon: Settings, color: '#4b5563', bgColor: '#f3f4f6' },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose} 
        />
        <View style={styles.menuPanel}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Menu</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* User Section */}
            <TouchableOpacity 
              onPress={() => { onNavigate('settings'); onClose(); }}
              style={styles.userCard}
              activeOpacity={0.7}
            >
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>{getInitials(user)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user}</Text>
                <Text style={styles.viewProfile}>View Profile</Text>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>

            {/* Workspaces Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTag}>Workspaces</Text>
                <TouchableOpacity onPress={fetchWorkspaces}>
                  <RefreshCw size={12} color={loading ? "#2563eb" : "#9ca3af"} />
                </TouchableOpacity>
              </View>
              
              {loading && workspaces.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              ) : (
                <View style={styles.itemGrid}>
                  {workspaces.map((ws) => {
                    const theme = getWorkspaceTheme(ws.title || ws.name);
                    const Icon = theme.icon;
                    return (
                      <TouchableOpacity
                        key={ws.name}
                        onPress={() => { onNavigate(ws.title || ws.name); onClose(); }}
                        style={styles.menuItem}
                        activeOpacity={0.6}
                      >
                        <View style={[styles.menuIconBox, { backgroundColor: theme.bgColor }]}>
                          <Icon size={20} color={theme.color} />
                        </View>
                        <Text style={styles.menuItemLabel} numberOfLines={1}>{ws.title || ws.name}</Text>
                        <ChevronRight size={14} color="#f3f4f6" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Modules Grid */}
            <View style={styles.section}>
              <Text style={styles.sectionTag}>Quick Access</Text>
              <View style={styles.itemGrid}>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => { onNavigate(item.id); onClose(); }}
                      style={styles.menuItem}
                      activeOpacity={0.6}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: item.bgColor }]}>
                        <Icon size={20} color={item.color} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <ChevronRight size={14} color="#f3f4f6" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={onLogout}
              style={styles.logoutButton}
            >
              <LogOut size={18} color="#ef4444" />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuPanel: {
    width: width * 0.8,
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
  },
  userAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#2563eb',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewProfile: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 32,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
  },
  itemGrid: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 16,
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
