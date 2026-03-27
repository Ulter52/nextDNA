import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AgingBucket } from '../types';
import { ReportCard } from './ReportCard';

interface AgingReportProps {
  data: AgingBucket[];
  title?: string;
}

export const AgingReport = ({ data, title = "Receivables Aging" }: AgingReportProps) => {
  return (
    <ReportCard title={title}>
      <View style={styles.container}>
        {data.map((bucket, i) => (
          <View key={i} style={styles.bucket}>
            <Text style={styles.label}>{bucket.range}d</Text>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: `${Math.min((bucket.amount / 100000) * 50, 100)}%`, 
                    backgroundColor: bucket.color || '#2563eb' 
                  }
                ]} 
              />
            </View>
            <Text style={styles.value}>₹{(bucket.amount / 100000).toFixed(1)}L</Text>
          </View>
        ))}
      </View>
    </ReportCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  bucket: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    width: 30,
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: 8,
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  value: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1e293b',
  },
});
