import type { User } from './user.types';

export type UserRole = 'fan' | 'creator' | 'guest';

export type AuthCredentials = {
  identifier: string;
  password: string;
};

export type RegisterPayload = {
  name: string;
  username: string;
  email: string;
  password: string;
  country_code: string;
};

export type LoginPayload = {
  email?: string;
  phone?: string;
  password: string;
};

export type ResetPasswordPayload = {
  email?: string;
  phone?: string;
  password: string;
};

export type UpdateVibePayload = {
  onboarding: {
    vibe: string[];
  };
};

export type SwitchRolePayload = {
  role: 'fan' | 'creator';
};

export type AuthSession = {
  token: string;
};

export type SocialLoginProvider = 'google' | 'apple' | 'facebook';

export type SocialLoginPayload = {
  token: string;
  provider: SocialLoginProvider;
};

export type SocialLoginResponse = {
  message: string;
  access_token: string;
  user: User;
};
