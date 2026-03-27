import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { formatCurrency } from '../../../core/utils/formatters';

interface SummaryStatProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  trend?: number;
  isCurrency?: boolean;
}

export const SummaryStat = ({ label, value, icon: Icon, color, trend, isCurrency = true }: SummaryStatProps) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
        <Icon size={20} color={color} />
      </View>
      <View>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {isCurrency ? formatCurrency(value, 'INR') : value}
        </Text>
        {trend !== undefined && (
          <Text style={[styles.trend, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
            {trend >= 0 ? '+' : ''}{trend}% vs last month
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b',
  },
  trend: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
});
