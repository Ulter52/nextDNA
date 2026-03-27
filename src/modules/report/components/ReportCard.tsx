import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface ReportCardProps {
  title: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const ReportCard = ({ title, children, style }: ReportCardProps) => (
  <View style={[styles.card, style]}>
    <Text style={styles.title}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
});
