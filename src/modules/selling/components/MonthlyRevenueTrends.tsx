import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { TrendingUp, BarChart3 } from 'lucide-react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { formatCurrency } from '../../../core/utils/formatters';
import { colors, spacing, shadow } from '../../../core/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MonthlyRevenueTrendsProps {
  data: any[];
  isLoading: boolean;
  fiscalYearLabel: string;
}

// Fiscal Year Months starting from April
// Common Frappe Analytics report structure for 12 months:
// [0]: Entity Name (e.g., "Total")
// [1]: Row Total
// [2]: April (First month of range)
// [3]: May
// ...
// [13]: March (Last month of range)
const FISCAL_MONTHS = [
  { label: 'Apr', index: 2 },
  { label: 'May', index: 3 },
  { label: 'Jun', index: 4 },
  { label: 'Jul', index: 5 },
  { label: 'Aug', index: 6 },
  { label: 'Sep', index: 7 },
  { label: 'Oct', index: 8 },
  { label: 'Nov', index: 9 },
  { label: 'Dec', index: 10 },
  { label: 'Jan', index: 11 },
  { label: 'Feb', index: 12 },
  { label: 'Mar', index: 13 },
];

export const MonthlyRevenueTrends: React.FC<MonthlyRevenueTrendsProps> = ({ 
  data, 
  isLoading, 
  fiscalYearLabel 
}) => {
  const trendData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return FISCAL_MONTHS.map(m => ({ label: m.label, value: 0 }));
    }

    // Find the 'Total' array row
    const totalRow = data.find(row => Array.isArray(row) && row[0] === 'Total');
    if (totalRow) {
      return FISCAL_MONTHS.map(month => ({
        label: month.label,
        value: parseFloat(totalRow[month.index]) || 0
      }));
    }
    
    return FISCAL_MONTHS.map(m => ({ label: m.label, value: 0 }));
  }, [data]);

  const maxDataValue = useMemo(() => 
    Math.max(...trendData.map(d => d.value), 0)
  , [trendData]);

  const BarChart = useCallback(() => {
    const chartHeight = 150;
    const chartWidth = SCREEN_WIDTH - 80;
    const barWidth = 14;
    const gap = (chartWidth - (trendData.length * barWidth)) / (trendData.length - 1);
    
    const maxValue = maxDataValue > 0 ? maxDataValue * 1.2 : 1000;
    
    return (
      <View style={styles.chartWrapper}>
        <Svg width={chartWidth} height={chartHeight + 35}>
          <G y={chartHeight}>
            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
              <Line
                key={i}
                x1="0"
                y1={-chartHeight * p}
                x2={chartWidth}
                y2={-chartHeight * p}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}
            
            {trendData.map((item, index) => {
              const barHeight = (item.value / maxValue) * chartHeight;
              const x = index * (barWidth + gap);
              
              return (
                <G key={index}>
                  <Rect
                    x={x}
                    y={-Math.max(barHeight, 4)} 
                    width={barWidth}
                    height={Math.max(barHeight, 4)}
                    fill={item.value > 0 ? colors.primary : "#f1f5f9"}
                    rx="3"
                  />
                  <SvgText
                    x={x + barWidth / 2}
                    y="22"
                    fontSize="8"
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {item.label}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
        <View style={styles.chartFooter}>
            <View style={styles.trendInfo}>
                <TrendingUp size={14} color={colors.success} />
                <Text style={styles.trendPercent}>{fiscalYearLabel}</Text>
            </View>
            <Text style={styles.totalSalesText}>
                Peak: {formatCurrency(maxDataValue, 'INR')}
            </Text>
        </View>
      </View>
    );
  }, [trendData, maxDataValue, fiscalYearLabel]);

  return (
    <View style={styles.analyticsCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Monthly Revenue Trends</Text>
          <Text style={styles.cardSubtitle}>Sales Invoices (Apr - Mar)</Text>
        </View>
        <View style={styles.headerIcon}>
          <BarChart3 size={18} color={colors.primary} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.chartPlaceholder}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Fetching FY data...</Text>
        </View>
      ) : (
        <BarChart />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  analyticsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    ...shadow.medium,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  headerIcon: {
    padding: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
  },
  chartWrapper: {
    alignItems: 'center',
  },
  chartPlaceholder: {
    height: 185,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  trendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trendPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalSalesText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
});
