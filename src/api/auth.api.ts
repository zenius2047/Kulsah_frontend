import api from './client';
import { endpoints } from './endpoints';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export const authApi = {
  login: (payload: LoginPayload) => api.post(endpoints.auth.login, payload),
  register: (payload: RegisterPayload) => api.post(endpoints.auth.register, payload),
  checkUsername: (payload: { username: string }) => api.post(endpoints.auth.checkUsername, payload),
  verifyOtp: (payload: { otp: string}, token: string) => api.post(endpoints.auth.verifyOtp, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }),
  resendOtp: (token: string) => api.post(endpoints.auth.resendOtp, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }),
  social: (payload: {token: string, provider: 'google'| 'apple' | 'tiktok' | 'facebook'}) =>
    api.post(`${endpoints.socialLogin.social}${payload.provider}`, payload)
};

export const login = authApi.login;
export const register = authApi.register;
export const checkUsername = authApi.checkUsername;
export const verifyOtp = authApi.verifyOtp;
export const resendOtp = authApi.resendOtp;
