import api from './client';
import { ENDPOINTS } from './endpoints';

export const authApi = {
  login: (credentials) => api.post(ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => api.post(ENDPOINTS.AUTH.REGISTER, userData),
  forgotPassword: (data) => api.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, data),
  changePassword: (data) => api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, data),
  refreshToken: () => api.post(ENDPOINTS.AUTH.REFRESH, {}, { withCredentials: true }),
  getProfile: () => api.get(ENDPOINTS.AUTH.ME),
};

export default authApi;
