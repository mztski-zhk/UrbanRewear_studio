import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, getProfile, type UserProfile, type SignupData, type TokenResponse, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ur_token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('ur_token'));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ur_token');
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const profile = await getProfile(token);
      setUser(profile);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      refreshProfile().finally(() => setIsLoading(false));
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    const res: TokenResponse = await apiLogin(username, password);
    localStorage.setItem('ur_token', res.access_token);
    setToken(res.access_token);
    toast({ title: 'Logged in', description: 'Welcome back!' });
  };

  const signup = async (data: SignupData) => {
    await apiSignup(data);
    toast({ title: 'Account created', description: 'You can now log in.' });
  };

  return (
    <AuthContext.Provider value={{
      token, user, isLoading,
      isAuthenticated: !!token && !!user,
      login, signup, logout, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
