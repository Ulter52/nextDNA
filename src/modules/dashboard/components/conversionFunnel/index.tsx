import React from 'react';
import { View, Text } from 'react-native';
import { BarChart3, CheckCircle2 } from 'lucide-react-native';
import { styles } from './styles';

interface ConversionFunnelProps {
  conversion?: {
    quote_to_order: number;
    order_to_invoice: number;
  };
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ conversion }) => {
  return (
    <View style={styles.funnelCard}>
      <View style={styles.funnelStep}>
        <View style={styles.stepInfo}>
          <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
          <Text style={styles.stepLabel}>Quotes to Orders</Text>
        </View>
        <View style={styles.stepStats}>
          <Text style={styles.stepValue}>{conversion?.quote_to_order || 0}%</Text>
          <BarChart3 size={16} color="#2563eb" />
        </View>
      </View>
      <View style={styles.funnelConnector} />
      <View style={styles.funnelStep}>
        <View style={styles.stepInfo}>
          <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
          <Text style={styles.stepLabel}>Orders to Invoices</Text>
        </View>
        <View style={styles.stepStats}>
          <Text style={styles.stepValue}>{conversion?.order_to_invoice || 0}%</Text>
          <CheckCircle2 size={16} color="#10b981" />
        </View>
      </View>
    </View>
  );
};
