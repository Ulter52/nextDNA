import React from 'react';
import { View, Text } from 'react-native';
import { PieChart, Package, TrendingUp } from 'lucide-react-native';
import { formatLakhs } from '@utils/formatters';
import { styles } from './styles';

interface HealthGridProps {
  profitability?: {
    gross_profit: number;
    margin_percent: number;
  };
  inventory?: {
    total_value: number;
    dead_stock_count: number;
  };
}

export const HealthGrid: React.FC<HealthGridProps> = ({ profitability, inventory }) => {
  return (
    <View style={styles.grid}>
      <View style={styles.gridCard}>
        <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
          <PieChart size={20} color="#10b981" />
        </View>
        <Text style={styles.gridLabel}>Gross Profit</Text>
        <Text style={styles.gridValue}>{formatLakhs(profitability?.gross_profit || 0)}</Text>
        <View style={styles.gridFooter}>
          <TrendingUp size={12} color="#10b981" />
          <Text style={styles.gridSubText}>{profitability?.margin_percent}% Margin</Text>
        </View>
      </View>
      
      <View style={styles.gridCard}>
        <View style={[styles.iconBox, { backgroundColor: '#fef2f2' }]}>
          <Package size={20} color="#ef4444" />
        </View>
        <Text style={styles.gridLabel}>Inventory Val</Text>
        <Text style={styles.gridValue}>{formatLakhs(inventory?.total_value || 0)}</Text>
        <Text style={styles.gridSubText}>FY Total Stock</Text>
      </View>
    </View>
  );
};
