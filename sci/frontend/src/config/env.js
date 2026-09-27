/**
 * Centralized Environment Configuration
 */
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ENV = {
  NODE_ENV: import.meta.env.MODE || 'development',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  API_BASE_URL: rawApiUrl,
  API_ENDPOINT: rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`,
  WS_ENDPOINT: rawApiUrl.replace(/^http/, 'ws'),
};

export default ENV;
