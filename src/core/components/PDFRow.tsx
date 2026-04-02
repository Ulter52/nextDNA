import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Printer, Lock } from 'lucide-react-native';
import { colors, spacing } from '../theme';

interface PDFRowProps {
  doctype: string;
  name: string;
  label?: string;
  icon?: any;
}

/**
 * PDFRow - Temporary placeholder for PDF functionality.
 * PDF generation is scheduled for Version 2.0.
 */
export function PDFRow({ label = "Print Format / PDF", icon: Icon = Printer }: PDFRowProps) {
  
  const handleOpenPDF = () => {
    Alert.alert(
      "Coming Soon (V2.0)",
      "PDF Download and Export functionality is currently being optimized and will be available in Version 2.0. Stay tuned!",
      [{ text: "OK", style: "default" }]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handleOpenPDF}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          <Icon size={12} color={colors.text_tertiary} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>Export PDF (V2.0)</Text>
          <Lock size={14} color={colors.text_tertiary} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
    paddingVertical: spacing.md,
    width: '100%',
  },
  content: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '700',
    color: colors.text_tertiary,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  value: {
    fontSize: 14,
    color: colors.text_tertiary,
    fontWeight: '600',
    fontStyle: 'italic'
  }
});
