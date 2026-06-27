import type { UserRole } from './auth.types';

export interface User {
  id: number | string;
  name: string;
  role: UserRole;
  activated? : string;
  activated_at? : string;
  avatar? : string;
  bio?: string;
  created_at?: string;
  email: string;
  handle: string;
  location?: string;
  phone?: string;
  updated_at?: string;
  verified?: boolean;
  verified_at?: string;
}

export type Gender = 'male' | 'female';

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  bio?: string | null;
  phone?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  location?: string | null;
  country_code?: string | null;
};

export type AvatarUploadSource = {
  uri: string;
  name?: string;
  type?: string;
};

export type RootStackParamList = {
  Home: undefined;
  Details: { name: string };
};

export type StoredUser = User | null;
