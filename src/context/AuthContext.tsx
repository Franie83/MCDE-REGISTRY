/**
 * AuthContext — provides the currently logged-in user to the whole app.
 *
 * On mount, if a token exists in localStorage, we call /api/auth/me
 * to validate it. If the token is stale or invalid, we clear it and
 * show the login screen.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { ApiUser, clearToken, getStoredUser, getToken, setStoredUser } from '../utils/api';

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserInPlace: (user: ApiUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState<boolean>(() => !!getToken());
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const fresh = await api.me();
      setUser(fresh);
      setStoredUser(fresh);
      setError(null);
    } catch (err: any) {
      // Token expired or invalid — clear and show login
      clearToken();
      setUser(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: if we have a token, validate it against the server
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    try {
      const { user: loggedIn } = await api.login(username, password);
      setUser(loggedIn);
    } catch (err: any) {
      const msg = err?.message || 'Login failed';
      setError(msg);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    setError(null);
  }, []);

  const updateUserInPlace = useCallback((updated: ApiUser) => {
    setUser(updated);
    setStoredUser(updated);
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    updateUserInPlace,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;