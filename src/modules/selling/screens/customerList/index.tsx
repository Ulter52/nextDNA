import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Search, Plus, RefreshCw, AlertCircle, MoreVertical, UserPlus, X } from 'lucide-react-native';
import { customerService } from '@sellingServices/customerService';
import { Customer } from '../types';
import { ModuleLayout } from '@components/ModuleLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SellingStackParamList } from '@navigation/types';
import styles from './styles';

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<string | null>(null);
  
  const navigation = useNavigation<NativeStackNavigationProp<SellingStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('erp_user').then(setUser);
    fetchCustomers();
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (err: any) {
      console.error("Fetch Customers Error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to fetch customers";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredCustomers = customers.filter(c => 
    (c.customer_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <ModuleLayout title="Customers" user={user} showBack={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchWrapper}>
            <Search style={styles.searchIcon} size={18} color="#9ca3af" />
            <TextInput 
              placeholder="Search customers..." 
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={fetchCustomers}
              disabled={loading}
              style={styles.iconButton}
            >
              <RefreshCw size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => (navigation as any).navigate('NewCustomer')}
              style={styles.addButton}
            >
              <Plus size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <AlertCircle size={24} color="#dc2626" />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchCustomers}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <UserPlus size={32} color="#d1d5db" />
            </View>
            <Text style={styles.emptyTitle}>No Customers Found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or add a new customer.</Text>
            <TouchableOpacity onPress={() => {setSearchQuery(''); fetchCustomers();}}>
              <Text style={styles.refreshText}>Reset List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredCustomers.map((customer) => (
              <TouchableOpacity 
                key={customer.name} 
                style={styles.customerCard}
                activeOpacity={0.7}
                onPress={() => (navigation as any).navigate('CustomerDetail', { customerId: customer.name })}
              >
                <View style={styles.customerLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(customer.customer_name || customer.name || '?').charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName} numberOfLines={1}>{customer.customer_name}</Text>
                    <Text style={styles.customerDetails} numberOfLines={1}>
                      {customer.customer_group} • {customer.territory}
                    </Text>
                  </View>
                </View>
                <MoreVertical size={18} color="#d1d5db" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </ModuleLayout>
  );
}
