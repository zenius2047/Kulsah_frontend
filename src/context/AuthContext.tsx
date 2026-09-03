import React, { createContext, useContext, useMemo } from 'react';
import { authApi } from '../api/auth.api';
import { signOutGoogleAsync } from '../config/auth-google';
import { unregisterCurrentPushTokenAsync } from '../hooks/messaging/useFcmMessaging';
import { useAuthStore } from '../store/auth.store';
import type { User } from '../types/user.types';

type AuthContextValue = {
  user: User | null;
  token: string;
  isReady: boolean;
  setUser: (value: User | null) => void;
  setAuthToken: (value: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady: true,
      setUser: (nextUser) => {
        useAuthStore.getState().setUser(nextUser);
      },
      setAuthToken: async (nextToken) => {
        useAuthStore.getState().setToken(nextToken);
      },
      logout: async () => {
        const token = useAuthStore.getState().token;
        try {
          await unregisterCurrentPushTokenAsync();
        } catch {
          // Native/local notification state is still cleared when revocation fails.
        }

        if (token) {
          try {
            await authApi.logout(token);
          } catch {
            // Ignore network failures during logout and still clear local auth.
          }
        }

        try {
          await signOutGoogleAsync();
        } catch {
          // Always clear local application auth even if a provider SDK fails.
        }

        useAuthStore.getState().clearAuth();
      },
      refresh: async () => undefined,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
