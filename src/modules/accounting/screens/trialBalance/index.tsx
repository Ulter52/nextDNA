import React, { useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { BarChart3, PieChart, TrendingUp, Landmark } from 'lucide-react-native';
import { ModuleLayout } from '../../../../core/components/ModuleLayout';
import { formatCurrency } from '../../../../core/utils/formatters';
import { useAccountingStats } from '../../hooks/accountingQueries';
import { colors, spacing } from '../../../../core/theme';
import { styles } from './styles';

export function TrialBalance() {
  const { 
    data: stats, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useAccountingStats();

  // Process trial balance rows for hierarchical display
  const processedRows = useMemo(() => {
    if (!stats?.trial_balance) return [];

    return stats.trial_balance.filter((row: any) => {
      // Skip top-level system rows
      if (row.account === "'Total'") return false;
      
      // Indent depth limit (prevent too much nesting on small screens)
      if (row.indent > 4) return false;

      const balance = row.closing_balance || 0;
      
      // Show only groups or non-zero accounts
      if (balance === 0 && row.indent > 0) return false;

      return true;
    });
  }, [stats?.trial_balance]);

  if (isLoading && !stats) {
    return (
      <ModuleLayout title="Trial Balance" showBack>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout title="Financial Overview" showBack>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={refetch} 
            tintColor={colors.primary} 
          />
        }
      >
        {/* Quick Balance Summary */}
        <View style={styles.summaryRow}>
           <View style={[styles.summaryCard, { backgroundColor: colors.blue_50 }]}>
              <Landmark size={20} color={colors.primary} />
              <Text style={styles.summaryLabel}>Bank Balance</Text>
              <Text style={styles.summaryValue}>{formatCurrency(stats?.bank_balance || 0, 'INR')}</Text>
           </View>
           <View style={[styles.summaryCard, { backgroundColor: colors.green_50 }]}>
              <PieChart size={20} color={colors.success} />
              <Text style={styles.summaryLabel}>Cash in Hand</Text>
              <Text style={styles.summaryValue}>{formatCurrency(stats?.cash_balance || 0, 'INR')}</Text>
           </View>
        </View>

        {/* Trial Balance Detail Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconBox}>
               <BarChart3 size={20} color={colors.primary} />
            </View>
            <View>
               <Text style={styles.cardTitle}>Trial Balance</Text>
               <Text style={styles.cardSubtitle}>Current Fiscal Period</Text>
            </View>
          </View>
          
          <View style={styles.list}>
            {processedRows.map((row: any, i: number) => {
              const balance = row.closing_balance || 0;
              const isGroup = row.indent === 0;

              return (
                <View
                  key={i}
                  style={[
                    styles.row,
                    i < processedRows.length - 1 && styles.borderBottom,
                    { paddingLeft: spacing.md + (row.indent * spacing.lg) }
                  ]}
                >
                  <Text 
                    style={[
                      styles.accountName,
                      isGroup ? styles.accountGroup : styles.accountItem
                    ]}
                    numberOfLines={1}
                  >
                    {row.account_name || row.account}
                  </Text>
                  <Text style={[
                    styles.balance,
                    { color: balance < 0 ? colors.error : colors.text_primary }
                  ]}>
                    {formatCurrency(Math.abs(balance), 'INR')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Updated Footer Info */}
        <View style={styles.footerInfo}>
           <TrendingUp size={14} color={colors.text_tertiary} />
           <Text style={styles.lastUpdated}>
             Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'Just now'}
           </Text>
        </View>
      </ScrollView>
    </ModuleLayout>
  );
}
