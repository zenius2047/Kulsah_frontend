import axios, { type AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './endpoints';
import { useAuthStore } from '../store/auth.store';
import { tokenService } from '../services/token.service';

type RetryableRequest = AxiosRequestConfig & { _retry?: boolean };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await tokenService.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token is available.');

    const response = await axios.post(
      `${API_BASE_URL}auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    const data = response.data as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    await tokenService.setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
    });
    return data.access_token;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as RetryableRequest | undefined;
    const requestUrl = String(originalRequest?.url ?? '');
    const isAuthenticationRequest = /auth\/(login|register|refresh|forgotton-password|reset-password)/.test(requestUrl);

    if (error?.response?.status !== 401 || !originalRequest || originalRequest._retry || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const accessToken = await refreshAccessToken();
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api.request(originalRequest);
    } catch (refreshError) {
      await tokenService.clearToken();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
