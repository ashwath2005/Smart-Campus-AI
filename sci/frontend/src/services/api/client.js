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
  timeout: 60000,
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

function isAuthBypassUrl(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

async function refreshAccessToken() {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const currentToken = tokenStorage.getToken();
    const response = await axios.post(
      `${ENV.API_ENDPOINT}/auth/refresh`,
      {},
      {
        withCredentials: true,
        timeout: 10000,
        headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
      }
    );

    const newAccessToken = response.data.access_token || response.data.token;
    if (!newAccessToken) {
      throw new Error('No access token returned');
    }
    tokenStorage.updateToken(newAccessToken);
    processQueue(null, newAccessToken);
    return newAccessToken;
  } catch (refreshError) {
    processQueue(refreshError, null);
    tokenStorage.clear();
    if (!/^\/login(\/|$)/.test(window.location.pathname)) {
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

// Request interceptor: attach JWT from tokenStorage (and proactively refresh if expired)
api.interceptors.request.use(
  async (config) => {
    let token = tokenStorage.getToken();
    if (token && !isAuthBypassUrl(config.url) && tokenStorage.isTokenExpired(token)) {
      try {
        token = await refreshAccessToken();
      } catch (err) {
        return Promise.reject(err);
      }
    }
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

    // Only attempt refresh for 401 errors, when we have a config, a stored token, and haven't already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      tokenStorage.getToken()
    ) {
      // Don't attempt refresh for login, register, or the refresh endpoint itself
      if (isAuthBypassUrl(originalRequest.url)) {
        if (originalRequest.url?.includes('/auth/refresh')) {
          tokenStorage.clear();
          if (!/^\/login(\/|$)/.test(window.location.pathname)) {
            toast.error('Session expired. Please log in again.');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
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
