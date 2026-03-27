import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface AgingChartProps {
  agingData: {
    range: string;
    amount: number;
    color: string;
  }[];
}

export const AgingChart: React.FC<AgingChartProps> = ({ agingData }) => {
  const maxAgingVal = Math.max(...agingData.map(d => d.amount), 1);

  return (
    <View style={styles.agingContainer}>
      {agingData.map((bucket, i) => (
        <View key={i} style={styles.agingBucket}>
          <Text style={styles.agingLabel}>{bucket.range}</Text>
          <View style={styles.agingBarContainer}>
            <View 
              style={[
                styles.agingBar, 
                { 
                  height: `${(bucket.amount / maxAgingVal) * 100}%`, 
                  backgroundColor: bucket.color 
                }
              ]} 
            />
          </View>
          <Text style={styles.agingValue} numberOfLines={1}>
            ₹{(bucket.amount / 100000).toFixed(1)}L
          </Text>
        </View>
      ))}
    </View>
  );
};
