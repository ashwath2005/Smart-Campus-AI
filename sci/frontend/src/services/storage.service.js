/**
 * LocalStorage and SessionStorage abstraction service with safe JSON handling.
 */

export const StorageService = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return localStorage.getItem(key) || defaultValue;
    }
  },

  set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error('StorageService set error:', e);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  },

  getUser() {
    return this.get('campus_user', null);
  },

  getToken() {
    return localStorage.getItem('token') || localStorage.getItem('access_token');
  },
};

export default StorageService;
