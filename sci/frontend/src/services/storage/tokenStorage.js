/**
 * Safe local storage service for session and user credentials
 */
const STORAGE_KEY = 'campus_user';

export const tokenStorage = {
  getUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    const user = this.getUser();
    return user?.token || null;
  },

  getRole() {
    const user = this.getUser();
    return user?.role || null;
  },

  setUser(userData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // quota exceeded or storage disabled
    }
  },

  updateToken(newToken) {
    const user = this.getUser();
    if (user) {
      user.token = newToken;
      this.setUser(user);
    }
  },

  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

export default tokenStorage;
