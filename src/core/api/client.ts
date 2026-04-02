import axios from 'axios';
import Config from 'react-native-config';

export const BASE_URL = `${Config.ERPNEXT_URL}`;

let logoutHandler: (() => void) | null = null;

export const setLogoutHandler = (handler: () => void) => {
  logoutHandler = handler;
};

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

apiClient.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;

    // 401 (Unauthorized) or 403 (Session Expired/Forbidden)
    // often indicate session issues in ERPNext
    if ((status === 401 || status === 403) && logoutHandler) {
      console.warn('Session expired or unauthorized. Logging out...');
      logoutHandler();
    }

    console.error('API Error:', status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default apiClient;
