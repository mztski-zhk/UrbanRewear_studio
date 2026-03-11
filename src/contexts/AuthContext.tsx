import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, signup as apiSignup, getProfile, type UserProfile, type SignupData, type TokenResponse, type SignupResponse, ApiError } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<SignupResponse>;
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

  // On mount or when token/user changes, fetch the profile if we have a
  // token but no user yet (e.g. page refresh with a stored token).
  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      refreshProfile().finally(() => setIsLoading(false));
    }
  }, [token, user, refreshProfile]);

  const login = async (username: string, password: string) => {
    const res: TokenResponse = await apiLogin(username, password);
    // Fetch the profile atomically with the new token so that
    // isAuthenticated becomes true immediately when login() resolves.
    const profile = await getProfile(res.access_token);
    localStorage.setItem('ur_token', res.access_token);
    setToken(res.access_token);
    setUser(profile);
    toast({ title: 'Logged in', description: `Welcome back, ${profile.username}!` });
  };

  const signup = async (data: SignupData): Promise<SignupResponse> => {
    return apiSignup(data);
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
