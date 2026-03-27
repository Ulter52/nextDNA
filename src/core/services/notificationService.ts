import { fetchResource } from '../api/frappeApiHelpers';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_CACHE_KEY = 'erp_notifications_cache';

export interface Notification {
  name: string;
  subject: string;
  from_user: string;
  creation: string;
  read: number;
  document_type?: string;
  document_name?: string;
}

export const notificationService = {
  async getNotifications(limit = 20): Promise<Notification[]> {
    try {
      const res = await fetchResource('Notification Log', {
        fields: '["name", "subject", "from_user", "creation", "read", "document_type", "document_name"]',
        order_by: 'creation desc',
        limit_page_length: limit
      });
      
      const notifications = res?.data || [];
      if (notifications.length > 0) {
        await AsyncStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(notifications));
      }
      return notifications;
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      const cached = await AsyncStorage.getItem(NOTIFICATIONS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async getUnreadCount(): Promise<number> {
    const notifications = await this.getNotifications(50);
    return notifications.filter(n => !n.read).length;
  }
};
