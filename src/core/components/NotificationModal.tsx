import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { X, Bell, Circle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadow, moderateScale } from '../theme';
import { notificationService, Notification } from '../services/notificationService';
import { formatDistanceToNow } from 'date-fns';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Bell size={20} color={colors.primary} />
              <Text style={styles.title}>Notifications</Text>
            </View>
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
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <TouchableOpacity key={item.name} style={styles.notificationItem} activeOpacity={0.7}>
                    <View style={styles.itemHeader}>
                      {!item.read && <Circle size={8} color={colors.primary} fill={colors.primary} style={styles.unreadDot} />}
                      <Text style={[styles.subject, !item.read && styles.unreadText]} numberOfLines={2}>
                        {item.subject}
                      </Text>
                    </View>
                    <View style={styles.itemMeta}>
                      <Text style={styles.fromUser}>{item.from_user}</Text>
                      <Text style={styles.time}>{getTimeAgo(item.creation)}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Bell size={48} color={colors.border} />
                  <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '80%',
    ...shadow.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border_light,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  notificationItem: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background_alt,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border_light,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  unreadDot: {
    marginTop: 6,
  },
  subject: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text_primary,
    lineHeight: 20,
  },
  unreadText: {
    fontWeight: typography.weights.bold,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingLeft: spacing.md,
  },
  fromUser: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
    fontWeight: typography.weights.medium,
  },
  time: {
    fontSize: typography.sizes.xs,
    color: colors.text_tertiary,
  },
  emptyState: {
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.text_tertiary,
    fontWeight: typography.weights.medium,
  },
});
