const DEFAULT_API_BASE_URL = 'https://unamended-monkishly-gaylord.ngrok-free.dev/api/v1/';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/?$/, '/');

export const endpoints = {
  auth: {
    login: 'auth/login',
    register: 'auth/register',
    logout: 'auth/logout',
    verifyOtp: 'auth/activate',
    resendOtp: 'auth/resend',
    checkUsername: 'auth/check-username',
  },
  general: {
    updateProfile: 'general/update-profile',
    uploadAvatar: 'general/upload-avatar',
  },
  subscription: {
    fanSubscribe: 'fan/subscription-plans',
    creatorPlan: 'creator/subscription-plans',
  },
  user: {
    me: 'users/me',
    profile: 'users/profile',
  },
  socialLogin: {
    social: 'auth/',
  }
} as const;
