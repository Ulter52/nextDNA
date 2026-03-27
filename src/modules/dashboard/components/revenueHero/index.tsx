import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { formatCurrency } from '@utils/formatters';
import { styles } from './styles';
import { LineGraphModal } from './lineGraphModal';

interface RevenueHeroProps {
  monthlySales: number;
  trend: number;
  fyMonthlySales?: { label: string; value: number }[];
  prevFyMonthlySales?: { label: string; value: number }[];
}

export const RevenueHero: React.FC<RevenueHeroProps> = ({ 
  monthlySales, 
  trend, 
  fyMonthlySales,
  prevFyMonthlySales 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const isTrendUp = trend >= 0;
  const TrendIcon = isTrendUp ? ArrowUpRight : ArrowDownRight;
  const trendColor = isTrendUp ? '#10b981' : '#ef4444';

  // Use real FY data if available
  const chartData = fyMonthlySales && fyMonthlySales.length > 0 ? fyMonthlySales : [];

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroMain}>
        <View>
          <Text style={styles.heroTitle}>Monthly Revenue</Text>
          <Text style={styles.heroAmount}>{formatCurrency(monthlySales || 0, 'INR')}</Text>
        </View>
        <TouchableOpacity 
          style={styles.heroIconBg} 
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <TrendingUp size={28} color="#ffffff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.heroDivider} />
      
      <View style={styles.heroFooter}>
        <View style={[styles.trendBadge, { backgroundColor: trendColor }]}>
          <TrendIcon size={14} color="#ffffff" />
          <Text style={styles.trendPercent}>{Math.abs(trend)}%</Text>
        </View>
        <Text style={styles.heroSubText}>vs. last month performance</Text>
      </View>

      <LineGraphModal 
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        data={chartData}
        prevData={prevFyMonthlySales}
        title="Revenue Performance Trend"
      />
    </View>
  );
};
