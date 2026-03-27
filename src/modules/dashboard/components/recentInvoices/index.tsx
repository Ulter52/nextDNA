import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { formatCurrency } from '@utils/formatters';
import { styles } from './styles';

interface RecentInvoicesProps {
  invoices: any[];
}

export const RecentInvoices: React.FC<RecentInvoicesProps> = ({ invoices }) => {
  return (
    <View style={styles.invoiceList}>
      {invoices?.map((inv, i) => (
        <View key={i} style={styles.invoiceItem}>
          <View style={styles.invLeft}>
            <View style={styles.invIcon}>
              <FileText size={20} color="#64748b" />
            </View>
            <View>
              <Text style={styles.invCustomer} numberOfLines={1}>{inv.customer_name}</Text>
              <Text style={styles.invMeta}>{inv.name} • {inv.posting_date}</Text>
            </View>
          </View>
          <View style={styles.invRight}>
            <Text style={styles.invAmount}>{formatCurrency(inv.grand_total, 'INR')}</Text>
            <Text 
              style={[
                styles.invStatus, 
                { color: inv.status === 'Paid' ? '#10b981' : '#f59e0b' }
              ]}
            >
              {inv.status}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};
