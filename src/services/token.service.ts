import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/auth.store';

const TOKEN_KEY = 'pulsar_auth_token';
const REFRESH_TOKEN_KEY = 'pulsar_refresh_token';
const TOKEN_EXPIRY_KEY = 'pulsar_auth_token_expiry';

export type AuthSessionTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const tokenService = {
  async getToken() {
    const inMemory = useAuthStore.getState().token;
    if (inMemory) return inMemory;
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async getRefreshToken() {
    const inMemory = useAuthStore.getState().refreshToken;
    if (inMemory) return inMemory;
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async setSession({ accessToken, refreshToken = '', expiresIn }: AuthSessionTokens) {
    useAuthStore.getState().setSession(accessToken, refreshToken, expiresIn);
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, accessToken, secureOptions),
      refreshToken
        ? SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, secureOptions)
        : SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      expiresIn
        ? SecureStore.setItemAsync(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000), secureOptions)
        : SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
    ]);
  },
  async setToken(token: string) {
    const refreshToken = await this.getRefreshToken();
    await this.setSession({ accessToken: token, refreshToken: refreshToken ?? undefined });
  },
  async hydrate() {
    const [accessToken, refreshToken, expiresAt] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.getItemAsync(TOKEN_EXPIRY_KEY),
    ]);

    // Migrate a token written by older builds from Zustand/AsyncStorage.
    const legacyToken = useAuthStore.getState().token;
    const resolvedAccessToken = accessToken || legacyToken;
    if (resolvedAccessToken) {
      const parsedExpiry = expiresAt ? Number(expiresAt) : null;
      useAuthStore.setState({
        token: resolvedAccessToken,
        refreshToken: refreshToken || '',
        tokenExpiresAt: parsedExpiry && Number.isFinite(parsedExpiry) ? parsedExpiry : null,
      });
      if (!accessToken && legacyToken) {
        await SecureStore.setItemAsync(TOKEN_KEY, legacyToken, secureOptions);
      }
    }
  },
  async clearToken() {
    useAuthStore.getState().clearAuth();
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      SecureStore.deleteItemAsync(TOKEN_EXPIRY_KEY),
    ]);
  },
};

export const getToken = () => tokenService.getToken();
export const setAuthToken = (token: string) => tokenService.setToken(token);
export const setAuthSession = (session: AuthSessionTokens) => tokenService.setSession(session);
export const hydrateAuthSession = () => tokenService.hydrate();
export const clearAuthToken = () => tokenService.clearToken();
