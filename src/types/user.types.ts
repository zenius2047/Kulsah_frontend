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

export type RootStackParamList = {
  Home: undefined;
  Details: { name: string };
};

export type StoredUser = User | null;
