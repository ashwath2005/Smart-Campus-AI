import axios from 'axios';
import toast from 'react-hot-toast';
import { ENV } from '../../config/env';
import { tokenStorage } from '../storage/tokenStorage';

const api = axios.create({
  baseURL: ENV.API_ENDPOINT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Flag to prevent infinite refresh loops
let isRefreshing = false;
// Queue of failed requests waiting for token refresh
let failedQueue = [];

/**
 * Process the queue of failed requests after a token refresh attempt.
 */
function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

// Request interceptor: attach JWT from tokenStorage
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 with token refresh, and other errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors, when we have a config, and haven't already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Don't attempt refresh for login, register, or the refresh endpoint itself
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        if (originalRequest.url?.includes('/auth/refresh')) {
          tokenStorage.clear();
          if (!/^\/login(\/|$)/.test(window.location.pathname)) {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post(
          `/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );

        const newAccessToken = response.data.access_token;
        tokenStorage.updateToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clear();
        if (!/^\/login(\/|$)/.test(window.location.pathname)) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle non-401 errors
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.detail ||
        error.response.data?.message ||
        'An error occurred';

      if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 429) {
        toast.error('Too many requests. Please slow down.');
      } else if (status === 500) {
        toast.error('Server error. Please try again later.');
      }

      return Promise.reject({ ...error, message });
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
export { api as apiClient };
