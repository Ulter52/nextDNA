import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { X, Check, Building2 } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '../theme';
import { companyService, Company } from '../services/companyService';

interface CompanyPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (company: Company) => void;
  currentCompany: string | null;
}

export const CompanyPickerModal: React.FC<CompanyPickerModalProps> = ({ 
  visible, 
  onClose, 
  onSelect, 
  currentCompany 
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCompanies();
    }
  }, [visible]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await companyService.getAvailableCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('[CompanyPicker] Failed to load companies', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (company: Company) => {
    onSelect(company);
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="none" 
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Company</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.text_secondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {companies.map((item) => (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.item,
                    currentCompany === item.name && styles.itemActive
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.itemMain}>
                    <View style={[
                      styles.iconBg,
                      currentCompany === item.name ? styles.iconBgActive : null
                    ]}>
                      <Building2 
                        size={18} 
                        color={currentCompany === item.name ? colors.primary : colors.text_tertiary} 
                      />
                    </View>
                    <View>
                      <Text style={[
                        styles.itemName,
                        currentCompany === item.name && styles.itemNameActive
                      ]}>
                        {item.company_name}
                      </Text>
                      <Text style={styles.itemAbbr}>{item.abbr}</Text>
                    </View>
                  </View>
                  {currentCompany === item.name && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    maxHeight: '80%',
    ...shadow.medium,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  loaderContainer: {
    padding: spacing.xxxl,
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.blue_50,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBg: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: {
    backgroundColor: colors.white,
  },
  itemName: {
    fontSize: typography.sizes.md,
    color: colors.text_primary,
    fontWeight: typography.weights.medium,
  },
  itemNameActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  itemAbbr: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
    fontWeight: typography.weights.bold,
  }
});
