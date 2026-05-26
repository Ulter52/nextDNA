import apiClient from '../../../core/api/client';
import { fetchResource } from '../../../core/api/frappeApiHelpers';

export const userService = {
  async getUsers(search = '', status = 'Enabled', start = 0, limit = 20): Promise<any[]> {
    const filters: any[] = [];
    
    if (status === 'Enabled') {
      filters.push(["enabled", "=", 1]);
    } else if (status === 'Disabled') {
      filters.push(["enabled", "=", 0]);
    }
    
    if (search) {
      filters.push(["full_name", "like", `%${search}%`]);
    }
    
    const res = await fetchResource('User', {
      fields: '["name", "full_name", "email", "user_image", "enabled"]',
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      limit_start: start,
      limit_page_length: limit,
      order_by: 'full_name asc'
    });
    
    return Array.isArray(res?.data) ? res.data : [];
  },

  async getUserDetails(email: string): Promise<any> {
    const response = await apiClient.get(`/api/resource/User/${email}`);
    return response.data.data;
  },

  async updateUserDetails(email: string, data: any): Promise<any> {
    const response = await apiClient.put(`/api/resource/User/${email}`, data);
    return response.data.data;
  },

  async updatePassword(oldPassword: string, newPassword: string): Promise<any> {
    const response = await apiClient.post('/api/method/frappe.core.doctype.user.user.update_password', {
      old_password: oldPassword,
      new_password: newPassword,
      logout_all_sessions: 0
    });
    return response.data.message;
  }
};
