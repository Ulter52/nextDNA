import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { X, Scan, Plus, Trash2, Hash } from 'lucide-react-native';
import { colors } from '@core/theme';
import { styles } from './styles';

interface SerialNoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (serials: string[]) => void;
  initialSerials: string;
  itemCode: string;
  itemName: string;
  targetQty: number;
  onOpenScanner: () => void;
}

export const SerialNoModal = React.memo(({
  isVisible,
  onClose,
  onSave,
  initialSerials,
  itemCode,
  itemName,
  targetQty,
  onOpenScanner
}: SerialNoModalProps) => {
  const [localSerials, setLocalSerials] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');

  // Sync initial serials when modal opens
  useEffect(() => {
    if (isVisible) {
      const serials = initialSerials ? initialSerials.split('\n').map(s => s.trim()).filter(Boolean) : [];
      setLocalSerials(serials);
    }
  }, [isVisible, initialSerials]);

  const addSerial = useCallback((serial: string) => {
    const trimmed = serial.trim();
    if (!trimmed) return;

    if (localSerials.includes(trimmed)) {
      Alert.alert("Duplicate", "This serial number is already in the list");
      return;
    }

    setLocalSerials(prev => [...prev, trimmed]);
    setManualInput('');
  }, [localSerials]);

  const removeSerial = useCallback((index: number) => {
    setLocalSerials(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(() => {
    onSave(localSerials);
    onClose();
  }, [localSerials, onSave, onClose]);

  const renderItem = useCallback(({ item, index }: { item: string, index: number }) => (
    <View style={styles.serialRow}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Hash size={14} color={colors.text_tertiary} />
        <Text style={styles.serialText}>{item}</Text>
      </View>
      <TouchableOpacity onPress={() => removeSerial(index)}>
        <Trash2 size={18} color={colors.error} />
      </TouchableOpacity>
    </View>
  ), [removeSerial]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Manage Serial Numbers</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text_secondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Item Info Summary */}
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{itemName}</Text>
            <Text style={styles.itemCode}>{itemCode}</Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Target Qty</Text>
                <Text style={styles.statValue}>{targetQty}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statLabel}>Scanned</Text>
                <Text style={[
                  styles.statValue,
                  { color: localSerials.length === targetQty ? colors.success : colors.orange_600 }
                ]}>
                  {localSerials.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Manual Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter serial manually..."
              value={manualInput}
              onChangeText={setManualInput}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addSerial(manualInput)}
            >
              <Plus size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* List of Serials */}
          <View style={styles.listContainer}>
            <FlatList
              data={localSerials}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item}-${index}`}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Hash size={48} color={colors.border} />
                  <Text style={styles.emptyText}>No serial numbers added yet</Text>
                </View>
              }
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={onOpenScanner}
            >
              <Scan size={20} color={colors.white} />
              <Text style={styles.buttonText}>Scan Serial</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});
