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

export type AuthSession = {
  token: string;
};

