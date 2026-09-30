import React, { createContext, useContext, useMemo } from 'react';
import { authApi } from '../api/auth.api';
import { signOutGoogleAsync } from '../config/auth-google';
import { unregisterCurrentPushTokenAsync } from '../hooks/messaging/useFcmMessaging';
import { useAuthStore } from '../store/auth.store';
import { clearAuthToken, setAuthToken, tokenService } from '../services/token.service';
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
        await setAuthToken(nextToken);
      },
      logout: async () => {
        const token = useAuthStore.getState().token;
        const refreshToken = useAuthStore.getState().refreshToken;
        try {
          await unregisterCurrentPushTokenAsync();
        } catch {
          // Native/local notification state is still cleared when revocation fails.
        }

        if (token) {
          try {
            await authApi.logout(token, refreshToken);
          } catch {
            // Ignore network failures during logout and still clear local auth.
          }
        }

        try {
          await signOutGoogleAsync();
        } catch {
          // Always clear local application auth even if a provider SDK fails.
        }

        await clearAuthToken();
      },
      refresh: async () => {
        const refreshToken = await tokenService.getRefreshToken();
        if (!refreshToken) return;
        const response = await authApi.refresh(refreshToken);
        await tokenService.setSession({
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token || refreshToken,
          expiresIn: response.data.expires_in,
        });
      },
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
