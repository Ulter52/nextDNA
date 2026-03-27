import apiClient from '../../../core/api/client';

export const userService = {
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
