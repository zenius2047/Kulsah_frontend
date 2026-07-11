import api from './client';
import { endpoints } from './endpoints';
import { Auth } from '../store/auth.store';
import type {
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  SwitchRolePayload,
  UpdateVibePayload,
} from '../types/auth.types';

const authHeaderConfig = (token = Auth.token) =>
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : undefined;

export const authApi = {
  login: (payload: LoginPayload) => api.post(endpoints.auth.login, payload),
  register: (payload: RegisterPayload) => api.post(endpoints.auth.register, payload),
  checkUsername: (payload: { username: string }) => api.post(endpoints.auth.checkUsername, payload),
  forgotPassword: (payload: { email?: string; phone?: string }) =>
    api.post(endpoints.auth.forgotPassword, payload),
  resetPassword: (payload: ResetPasswordPayload) =>
    api.post(endpoints.auth.resetPassword, payload),
  logout: (token?: string) => api.post(endpoints.auth.logout, {}, authHeaderConfig(token)),
  updateVibe: (payload: UpdateVibePayload) => api.post(endpoints.auth.updateVibe, payload),
  switchRole: (payload: SwitchRolePayload, token?: string) =>
    api.post(endpoints.auth.switchRole, payload, authHeaderConfig(token)),
  verifyResetOtp: (payload: { email?: string; phone?: string; otp: string }) =>
    api.post(endpoints.auth.verifyResetOtp, payload),
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
export const forgotPassword = authApi.forgotPassword;
export const resetPassword = authApi.resetPassword;
export const verifyResetOtp = authApi.verifyResetOtp;
export const switchRole = authApi.switchRole;
