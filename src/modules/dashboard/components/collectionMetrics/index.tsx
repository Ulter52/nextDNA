import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatLakhs } from '@utils/formatters';
import { styles } from './styles';

interface CollectionMetricsProps {
  collections: {
    cash_sales: number;
    credit_sales: number;
    total_outstanding: number;
    efficiency: number;
  };
  totalSales: number;
}

export const CollectionMetrics: React.FC<CollectionMetricsProps> = ({ collections, totalSales }) => {
  const totalSalesForBar = totalSales || 1;
  const cashSalesWidth = (collections.cash_sales / totalSalesForBar) * 100;
  const creditSalesWidth = (collections.credit_sales / totalSalesForBar) * 100;

  return (
    <View style={styles.collectionsCard}>
      <View style={styles.collectionSplit}>
        <View style={styles.splitItem}>
          <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
          <View>
            <Text style={styles.splitLabel}>Cash Sales</Text>
            <Text style={styles.splitValue}>{formatLakhs(collections.cash_sales)}</Text>
          </View>
        </View>
        <View style={styles.splitItem}>
          <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
          <View>
            <Text style={styles.splitLabel}>Credit Sales</Text>
            <Text style={styles.splitValue}>{formatLakhs(collections.credit_sales)}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${cashSalesWidth}%`, backgroundColor: '#10b981' }]} />
        <View style={[styles.progressBarFill, { width: `${creditSalesWidth}%`, backgroundColor: '#f59e0b' }]} />
      </View>

      <View style={styles.arSummary}>
        <View style={styles.arItem}>
          <Text style={styles.arLabel}>Total Outstanding</Text>
          <Text style={[styles.arValue, { color: '#ef4444' }]}>{formatLakhs(collections.total_outstanding)}</Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.arItem}>
          <Text style={styles.arLabel}>Collection Efficiency</Text>
          <Text style={[styles.arValue, { color: '#10b981' }]}>{collections.efficiency}%</Text>
        </View>
      </View>
    </View>
  );
};
