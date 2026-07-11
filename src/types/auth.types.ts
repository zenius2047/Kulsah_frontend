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
