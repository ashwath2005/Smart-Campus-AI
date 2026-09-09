import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const baseURL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL,
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
 * On success, retries each queued request with the new token.
 * On failure, rejects all queued requests.
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

// Request interceptor: attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('campus_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        const token = parsed.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore parse errors
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
      // Don't attempt refresh for login, register, or the refresh endpoint itself (prevents infinite loop)
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/register') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        // Clear session and redirect for expired refresh token
        if (originalRequest.url?.includes('/auth/refresh')) {
          localStorage.removeItem('campus_user');
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
        // Attempt to refresh the token using the HTTP-only refresh token cookie
        const response = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true, timeout: 10000 }
        );

        const newAccessToken = response.data.access_token;

        // Update the stored token in localStorage
        const stored = localStorage.getItem('campus_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.token = newAccessToken;
          localStorage.setItem('campus_user', JSON.stringify(parsed));
        }

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Process all queued requests with the new token
        processQueue(null, newAccessToken);

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear session and redirect to login
        processQueue(refreshError, null);
        localStorage.removeItem('campus_user');
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
