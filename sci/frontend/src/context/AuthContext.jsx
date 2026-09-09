import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { hasPermission as checkPermission } from '../permissions';

const AuthContext = createContext(undefined);

const STORAGE_KEY = 'campus_user';

function getStoredAuth() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { user: parsed.user || null, token: parsed.token || null };
    }
  } catch { /* ignore */ }
  return { user: null, token: null };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore session from localStorage
  useEffect(() => {
    const { user: storedUser, token: storedToken } = getStoredAuth();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      // Validate token by fetching current user
      api.get('/auth/me')
        .then((res) => {
          const validatedUser = res.data.user || res.data;
          setUser(validatedUser);
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: validatedUser, token: storedToken }));
        })
        .catch(() => {
          // Token invalid, clear session
          setUser(null);
          setToken(null);
          localStorage.removeItem(STORAGE_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const saveAuth = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: userData, token: authToken }));
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials, { withCredentials: true });
      const { token: authToken, user: userData, access_token } = res.data;
      const finalToken = authToken || access_token;
      const finalUser = userData || res.data;
      
      if (finalToken) {
        saveAuth(finalUser, finalToken);
        toast.success(`Welcome back, ${finalUser.name || 'User'}!`);
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
      const res = await api.post('/auth/register', data, { withCredentials: true });
      const { token: authToken, user: userData, access_token } = res.data;
      const finalToken = authToken || access_token;
      const finalUser = userData || res.data;
      
      if (finalToken) {
        saveAuth(finalUser, finalToken);
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
    // Revoke refresh token server-side before clearing local session
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch {
      // Proceed with local logout even if server call fails
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Logged out successfully');
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      const updatedUser = res.data.user || res.data;
      setUser(updatedUser);
      const currentToken = token || getStoredAuth().token;
      if (currentToken) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser, token: currentToken }));
      }
      toast.success('Profile updated successfully!');
    } catch (error) {
      const err = error;
      const message = err.response?.data?.detail || err.response?.data?.message || err.message || 'Update failed';
      toast.error(message);
      throw error;
    }
  }, [token]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    const currentToken = token || getStoredAuth().token;
    if (currentToken) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser, token: currentToken }));
    }
  }, [token]);

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
