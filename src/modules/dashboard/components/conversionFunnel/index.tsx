import React from 'react';
import { View, Text } from 'react-native';
import { FileText, CheckCircle2 } from 'lucide-react-native';
import { styles } from './styles';

interface ConversionFunnelProps {
  conversion?: {
    order_to_invoice: number;
  };
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ conversion }) => {
  const efficiency = conversion?.order_to_invoice || 0;
  
  // Determine status color based on efficiency
  const getStatusColor = () => {
    if (efficiency >= 90) return '#10b981'; // Excellent
    if (efficiency >= 70) return '#2563eb'; // Good
    if (efficiency >= 40) return '#f59e0b'; // Warning
    return '#ef4444'; // Critical
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.funnelCard}>
      <View style={styles.funnelStep}>
        <View style={styles.stepInfo}>
          <View style={[styles.stepCircle, { backgroundColor: '#f8fafc' }]}>
            <FileText size={16} color="#64748b" />
          </View>
          <View>
            <Text style={styles.stepLabel}>Order to Invoice Efficiency</Text>
            <Text style={{ fontSize: 10, color: '#94a3b8' }}>Overall billing performance</Text>
          </View>
        </View>
        <View style={styles.stepStats}>
          <Text style={[styles.stepValue, { color: statusColor }]}>{efficiency}%</Text>
          <CheckCircle2 size={18} color={statusColor} />
        </View>
      </View>
      
      {/* Progress Indicator */}
      <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
        <View 
          style={{ 
            height: '100%', 
            width: `${efficiency}%`, 
            backgroundColor: statusColor,
            borderRadius: 3 
          }} 
        />
      </View>

      <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 10, color: '#64748b' }}>
          {efficiency < 100 ? `${100 - efficiency}% orders pending billing` : 'All orders billed'}
        </Text>
        <Text style={{ fontSize: 10, fontWeight: 'bold', color: statusColor }}>
          {efficiency >= 90 ? 'Excellent' : efficiency >= 70 ? 'Healthy' : 'Needs Attention'}
        </Text>
      </View>
    </View>
  );
};
