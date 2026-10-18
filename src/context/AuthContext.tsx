import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.ts';
import { api, getAuthToken, setAuthToken, clearAuthToken } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    organization: string;
    phoneNumber?: string;
  }) => Promise<void>;
  demoLogin: (role: 'participant' | 'admin', userEmail?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, remember = true) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.token, remember);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    organization: string;
    phoneNumber?: string;
  }) => {
    setLoading(true);
    try {
      const res = await api.register(data);
      setAuthToken(res.token, true);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: 'participant' | 'admin', userEmail?: string) => {
    setLoading(true);
    try {
      const res = await api.demoLogin(role, userEmail);
      setAuthToken(res.token, true);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
