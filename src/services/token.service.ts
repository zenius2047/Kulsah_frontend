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

// A stale Expo Go/dev-client binary can temporarily lack the native module even
// though the package is installed and configured. Keep auth usable in memory
// until the binary is rebuilt instead of crashing during app startup.
const safeGet = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
};

const safeSet = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value, secureOptions);
  } catch {
    // SecureStore is unavailable in this binary; the Zustand session remains
    // available for the current process and will recover after a native rebuild.
  }
};

const safeDelete = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore unavailable native storage during graceful degradation.
  }
};

export const tokenService = {
  async getToken() {
    const inMemory = useAuthStore.getState().token;
    if (inMemory) return inMemory;
    return safeGet(TOKEN_KEY);
  },
  async getRefreshToken() {
    const inMemory = useAuthStore.getState().refreshToken;
    if (inMemory) return inMemory;
    return safeGet(REFRESH_TOKEN_KEY);
  },
  async setSession({ accessToken, refreshToken = '', expiresIn }: AuthSessionTokens) {
    useAuthStore.getState().setSession(accessToken, refreshToken, expiresIn);
    await Promise.all([
      safeSet(TOKEN_KEY, accessToken),
      refreshToken
        ? safeSet(REFRESH_TOKEN_KEY, refreshToken)
        : safeDelete(REFRESH_TOKEN_KEY),
      expiresIn
        ? safeSet(TOKEN_EXPIRY_KEY, String(Date.now() + expiresIn * 1000))
        : safeDelete(TOKEN_EXPIRY_KEY),
    ]);
  },
  async setToken(token: string) {
    const refreshToken = await this.getRefreshToken();
    await this.setSession({ accessToken: token, refreshToken: refreshToken ?? undefined });
  },
  async hydrate() {
    const [accessToken, refreshToken, expiresAt] = await Promise.all([
      safeGet(TOKEN_KEY),
      safeGet(REFRESH_TOKEN_KEY),
      safeGet(TOKEN_EXPIRY_KEY),
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
        await safeSet(TOKEN_KEY, legacyToken);
      }
    }
  },
  async clearToken() {
    const currentUser = useAuthStore.getState().user;
    const isGuest = currentUser?.role === 'guest' || currentUser?.name === 'guest' || currentUser?.id === 0;

    if (!isGuest) {
      useAuthStore.getState().clearAuth();
    } else {
      useAuthStore.setState({ token: '', refreshToken: '', tokenExpiresAt: null });
    }
    await Promise.all([
      safeDelete(TOKEN_KEY),
      safeDelete(REFRESH_TOKEN_KEY),
      safeDelete(TOKEN_EXPIRY_KEY),
    ]);
  },
};

export const getToken = () => tokenService.getToken();
export const setAuthToken = (token: string) => tokenService.setToken(token);
export const setAuthSession = (session: AuthSessionTokens) => tokenService.setSession(session);
export const hydrateAuthSession = () => tokenService.hydrate();
export const clearAuthToken = () => tokenService.clearToken();
