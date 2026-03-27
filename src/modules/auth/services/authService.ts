import apiClient from '../../../core/api/client';

export const authService = {
  async login(usr: string, pwd: string): Promise<any> {
    try {
      const response = await apiClient.post('/api/method/login', { usr, pwd });
      
      // ERPNext returns 'Logged In' message on success
      if (response.data.message === 'Logged In') {
        return {
          success: true,
          full_name: response.data.full_name,
          username: usr
        };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error: any) {
      console.error('Login Error details:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Connection error. Please check your internet.' 
      };
    }
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/method/logout');
  },

  async getLoggedUser(): Promise<string> {
    const response = await apiClient.get('/api/method/frappe.auth.get_logged_user');
    return response.data.message;
  }
};
