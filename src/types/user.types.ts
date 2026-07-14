import type { UserRole } from './auth.types';

export interface User {
  id: number | string;
  name: string;
  role: UserRole;
  activated? : string | boolean;
  activated_at? : string;
  avatar? : string | null;
  banner?: string | null;
  bio?: string | null;
  created_at?: string;
  email: string;
  handle: string;
  location?: string | null;
  phone?: string | null;
  total_followers?: number;
  total_subscribers?: number;
  total_likes?: number;
  vibes?: string[];
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
