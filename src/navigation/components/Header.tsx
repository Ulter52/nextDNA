import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell, Search, ArrowLeft, ChevronDown, Building2, LucideIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadow } from '../../core/theme';
import { CompanyPickerModal } from '../../core/components/CompanyPickerModal';
import { SearchModal } from '../../core/components/SearchModal';
import { NotificationModal } from '../../core/components/NotificationModal';
import { companyService, Company } from '../../core/services/companyService';
import { notificationService } from '../../core/services/notificationService';

interface HeaderAction {
  icon: LucideIcon;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  user?: string | null;
  onProfileClick?: () => void;
  onBack?: () => void;
  hideRightIcons?: boolean;
  extraAction?: HeaderAction;
}

export function Header({ title, onBack, hideRightIcons = false, extraAction }: HeaderProps) {
  const navigation = useNavigation<any>();
  const [companyModalVisible, setCompanyModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      const [company, count] = await Promise.all([
        companyService.ensureCompanySelected(),
        notificationService.getUnreadCount()
      ]);
      
      if (isMounted) {
        setSelectedCompany(company);
        setUnreadCount(count);
      }
    };

    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleCompanySelect = async (company: Company) => {
    await companyService.setSelectedCompany(company);
    setSelectedCompany(company);
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color={colors.text_secondary} />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
      </View>

      {!hideRightIcons && (
        <View style={styles.rightSection}>
          {extraAction && (
            <TouchableOpacity 
              style={styles.iconButton} 
              activeOpacity={0.7}
              onPress={extraAction.onPress}
            >
              <extraAction.icon size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.iconButton} 
            activeOpacity={0.7}
            onPress={() => setSearchModalVisible(true)}
          >
            <Search size={20} color={colors.text_secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            activeOpacity={0.7}
            onPress={() => setNotificationModalVisible(true)}
          >
            <Bell size={20} color={colors.text_secondary} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.companySelector} 
            activeOpacity={0.7}
            onPress={() => setCompanyModalVisible(true)}
          >
            <View style={styles.companyIcon}>
              <Building2 size={14} color={colors.primary} />
            </View>
            <Text style={styles.companyAbbr}>{selectedCompany?.abbr || '??'}</Text>
            <ChevronDown size={14} color={colors.text_tertiary} />
          </TouchableOpacity>
        </View>
      )}

      <CompanyPickerModal 
        visible={companyModalVisible}
        onClose={() => setCompanyModalVisible(false)}
        onSelect={handleCompanySelect}
        currentCompany={selectedCompany?.name || null}
      />

      <SearchModal 
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
      />

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => {
          setNotificationModalVisible(false);
          notificationService.getUnreadCount().then(setUnreadCount);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
    ...shadow.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.round,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.white,
  },
  companySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginLeft: spacing.xs,
  },
  companyIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.blue_50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyAbbr: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text_primary,
    textTransform: 'uppercase',
  },
});
