import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { hasPermission as checkPermission } from '../permissions';
import { tokenStorage } from '../services/storage/tokenStorage';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getAuth().user);
  const [token, setToken] = useState(() => tokenStorage.getAuth().token);
  const [isLoading, setIsLoading] = useState(() => {
    const auth = tokenStorage.getAuth();
    return Boolean(auth.user && auth.token);
  });

  // Sync token state whenever tokenStorage refreshes the token, and clear across tabs on logout
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      if (e.detail) {
        setToken(e.detail);
      }
    };
    const handleStorageChange = (e) => {
      if (e.key === 'campus_user' && e.storageArea === window.localStorage) {
        const auth = tokenStorage.getAuth();
        setUser(auth.user);
        setToken(auth.token);
      }
    };
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // On mount, verify any stored session with the backend before allowing protected routes
  useEffect(() => {
    const { user: storedUser, token: storedToken } = tokenStorage.getAuth();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      api.get('/auth/me')
        .then((res) => {
          const validatedUser = res.data.user || res.data;
          const latestToken = tokenStorage.getToken() || storedToken;
          setUser(validatedUser);
          setToken(latestToken);
          tokenStorage.updateUser(validatedUser);
        })
        .catch(() => {
          // Token invalid or expired without valid refresh, clear session
          setUser(null);
          setToken(null);
          tokenStorage.clear();
        })
        .finally(() => setIsLoading(false));
    } else {
      setUser(null);
      setToken(null);
      tokenStorage.clear();
      setIsLoading(false);
    }
  }, []);

  const saveAuth = useCallback((userData, authToken, rememberMe = false) => {
    setUser(userData);
    setToken(authToken);
    tokenStorage.setAuth(userData, authToken, rememberMe);
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const { rememberMe = false, ...restCredentials } = credentials || {};
      const payload = {
        ...restCredentials,
        remember_me: Boolean(rememberMe || restCredentials.remember_me),
      };
      const res = await api.post('/auth/login', payload, { withCredentials: true });
      const { token: authToken, user: userData, access_token } = res.data;
      const finalToken = authToken || access_token;
      const finalUser = userData || res.data;

      if (finalToken && finalUser) {
        saveAuth(finalUser, finalToken, payload.remember_me);
        toast.success(`Welcome back, ${finalUser.name || 'User'}!`);
        return { user: finalUser, token: finalToken };
      } else {
        throw new Error('No token received');
      }
    } catch (error) {
      const err = error;
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, [saveAuth]);

  const register = useCallback(async (data) => {
    try {
      const { rememberMe = false, ...restData } = data || {};
      const res = await api.post('/auth/register', restData, { withCredentials: true });
      const { token: authToken, user: userData, access_token } = res.data;
      const finalToken = authToken || access_token;
      const finalUser = userData || res.data;

      if (finalToken && finalUser) {
        saveAuth(finalUser, finalToken, Boolean(rememberMe));
        toast.success('Account created successfully!');
      } else {
        toast.success('Registration successful! Please log in.');
      }
    } catch (error) {
      const err = error;
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    tokenStorage.clear();
    // Revoke refresh token server-side
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch {
      // Proceed with local logout even if server call fails
    }
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      const updatedUser = res.data.user || res.data;
      setUser(updatedUser);
      tokenStorage.updateUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const err = error;
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Update failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    tokenStorage.updateUser(updatedUser);
  }, []);

  const hasPermission = useCallback((permission) => {
    if (!user || !user.role) return false;
    return checkPermission(user.role, permission);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateUser,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
