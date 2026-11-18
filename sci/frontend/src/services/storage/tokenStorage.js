/**
 * Safe storage service for session and user credentials.
 * Un-remembered sessions are kept in sessionStorage (cleared when tab/browser closes).
 * Persistent localStorage sessions require an explicit rememberMe === true flag.
 */
const STORAGE_KEY = 'campus_user';

function readStorageEntry(storage, requireRememberFlag = false) {
  if (typeof window === 'undefined' || !storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.user || !parsed.token) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    if (requireRememberFlag && parsed.rememberMe !== true) {
      storage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      user: parsed.user,
      token: parsed.token,
      rememberMe: Boolean(parsed.rememberMe),
    };
  } catch {
    try {
      storage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export const tokenStorage = {
  getAuth() {
    if (typeof window === 'undefined') {
      return { user: null, token: null, rememberMe: false };
    }
    const sessionEntry = readStorageEntry(window.sessionStorage, false);
    if (sessionEntry) return sessionEntry;

    const persistentEntry = readStorageEntry(window.localStorage, true);
    if (persistentEntry) return persistentEntry;

    return { user: null, token: null, rememberMe: false };
  },

  getUser() {
    return this.getAuth().user;
  },

  getToken() {
    return this.getAuth().token;
  },

  getRole() {
    return this.getAuth().user?.role || null;
  },

  isRemembered() {
    return this.getAuth().rememberMe;
  },

  setAuth(userData, authToken, rememberMe = false) {
    if (typeof window === 'undefined') return;
    if (!userData || !authToken) {
      this.clear();
      return;
    }
    const persist = Boolean(rememberMe);
    const payload = JSON.stringify({
      user: userData,
      token: authToken,
      rememberMe: persist,
    });
    try {
      if (persist) {
        window.localStorage.setItem(STORAGE_KEY, payload);
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(STORAGE_KEY, payload);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // quota exceeded or storage disabled
    }
  },

  setUser(data) {
    if (!data) {
      this.clear();
      return;
    }
    if (data.user && data.token) {
      this.setAuth(data.user, data.token, Boolean(data.rememberMe));
      return;
    }
    const current = this.getAuth();
    if (current.token) {
      this.setAuth(data, current.token, current.rememberMe);
    }
  },

  updateUser(userData) {
    const current = this.getAuth();
    if (current.token && userData) {
      this.setAuth(userData, current.token, current.rememberMe);
    }
  },

  updateToken(newToken) {
    const current = this.getAuth();
    if (current.user && newToken) {
      this.setAuth(current.user, newToken, current.rememberMe);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: newToken }));
    }
  },

  isTokenExpired(token) {
    const rawToken = token || this.getToken();
    if (!rawToken) return true;
    try {
      const parts = rawToken.split('.');
      if (parts.length !== 3) return false;
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now() + 5000;
    } catch {
      return false;
    }
  },

  clear() {
    if (typeof window === 'undefined') return;
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  },
};

export default tokenStorage;
