import { clearAuth, setToken as setStoreToken, useAuthStore } from '../store/auth.store';

const TOKEN_KEY = 'pulsar_auth_token';

export const tokenService = {
  async getToken() {
    return useAuthStore.getState().token || null;
  },
  async setToken(token: string) {
    setStoreToken(token);
  },
  async clearToken() {
    clearAuth();
  },
};

export const getToken = () => tokenService.getToken();
export const setAuthToken = (token: string) => tokenService.setToken(token);
export const clearAuthToken = () => tokenService.clearToken();
