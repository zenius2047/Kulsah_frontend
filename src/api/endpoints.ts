import { resendOtp } from "./auth.api";

export const API_BASE_URL = 'https://unamended-monkishly-gaylord.ngrok-free.dev/api/v1/';

export const endpoints = {
  auth: {
    login: 'auth/login',
    register: 'auth/register',
    logout: 'auth/logout',
    verifyOtp: '/auth/activate',
    resendOtp: '/auth/resend',
    checkUsername: 'auth/check-username',
  },
  user: {
    me: 'users/me',
    profile: 'users/profile',
  },
  socialLogin: {
    social : 'auth/'
  }
} as const;
