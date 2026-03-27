import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';
import { styles } from './agingReportStyles';
import { formatCurrency } from '../../../../core/utils/formatters';

interface AgingData {
  range: string;
  amount: number;
  color: string;
}

interface AgingReportModalProps {
  visible: boolean;
  onClose: () => void;
  agingData: AgingData[];
}

export const AgingReportModal: React.FC<AgingReportModalProps> = ({ visible, onClose, agingData }) => {
  const totalOutstanding = agingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Aging Analysis</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {agingData.map((item, index) => (
              <View key={index} style={styles.agingRow}>
                <View style={styles.agingLabelGroup}>
                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                  <Text style={styles.rangeText}>{item.range} Days</Text>
                </View>
                <Text style={styles.amountText}>{formatCurrency(item.amount, 'INR')}</Text>
              </View>
            ))}

            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total AR Buckets</Text>
                <Text style={styles.summaryValue}>{agingData.length}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Outstanding</Text>
                <Text style={styles.totalValue}>{formatCurrency(totalOutstanding, 'INR')}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
