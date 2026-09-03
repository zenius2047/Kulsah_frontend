import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/user.types';
import type { UserRole } from '../types/auth.types';

const isUserRole = (value: unknown): value is UserRole =>
  value === 'fan' || value === 'creator' || value === 'guest';

const normalizeUser = (value: User | null | undefined | Record<string, unknown>): User | null => {
  if (!value) return null;

  const legacyId = value.id;
  const derivedHandle =
    typeof value.handle === 'string' && value.handle.trim()
      ? value.handle.trim()
      : typeof legacyId === 'string' && legacyId.trim()
        ? legacyId.trim()
        : typeof value.name === 'string' && value.name.trim()
          ? value.name.trim().toLowerCase().replace(/\s+/g, '_')
          : 'user';
  const numericId =
    typeof legacyId === 'number' && Number.isFinite(legacyId)
      ? legacyId
      : typeof legacyId === 'string' && legacyId.trim()
        ? Number(legacyId)
        : Number.NaN;

  return {
    id: Number.isFinite(numericId) ? numericId : Date.now(),
    name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Guest',
    role: isUserRole(value.role) ? value.role : 'fan',
    email: typeof value.email === 'string' ? value.email : '',
    handle: derivedHandle,
    ...(typeof value.avatar === 'string' || value.avatar === null ? { avatar: value.avatar } : {}),
    ...(typeof value.banner === 'string' || value.banner === null ? { banner: value.banner } : {}),
    ...(typeof value.bio === 'string' || value.bio === null ? { bio: value.bio } : {}),
    ...(typeof value.created_at === 'string' ? { created_at: value.created_at } : {}),
    ...(typeof value.activated === 'string' || typeof value.activated === 'boolean' ? { activated: value.activated } : {}),
    ...(typeof value.activated_at === 'string' ? { activated_at: value.activated_at } : {}),
    ...(typeof value.location === 'string' || value.location === null ? { location: value.location } : {}),
    ...(typeof value.country_code === 'string' || value.country_code === null ? { country_code: value.country_code } : {}),
    ...(typeof value.country === 'string' || value.country === null ? { country: value.country } : {}),
    ...(typeof value.currency === 'string' || value.currency === null ? { currency: value.currency } : {}),
    ...(typeof value.phone === 'string' || value.phone === null ? { phone: value.phone } : {}),
    ...(typeof value.total_followers === 'number' ? { total_followers: value.total_followers } : {}),
    ...(typeof value.total_subscribers === 'number' ? { total_subscribers: value.total_subscribers } : {}),
    ...(typeof value.total_likes === 'number' ? { total_likes: value.total_likes } : {}),
    ...(Array.isArray(value.vibes) ? { vibes: value.vibes.filter((item): item is string => typeof item === 'string') } : {}),
    ...(typeof value.updated_at === 'string' ? { updated_at: value.updated_at } : {}),
    ...(typeof value.verified === 'boolean' ? { verified: value.verified } : {}),
    ...(typeof value.verified_at === 'string' ? { verified_at: value.verified_at } : {}),
  };
};

type AuthState = {
  user: User | null;
  token: string;
  setUser: (value: User | null) => void;
  setToken: (value: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        user: null,
        token: '',
        setUser: (value) => set({ user: normalizeUser(value) }),
        setToken: (value) => set({ token: value }),
        clearAuth: () => set({ user: null, token: '' }),
      }),
      {
        name: 'pulsar_auth',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({ user: state.user, token: state.token }),
        version: 2,
        migrate: (persistedState) => ({
          ...(persistedState as Record<string, unknown>),
          user: normalizeUser((persistedState as { user?: User | null })?.user ?? null),
        }),
      }
    )
  )
);

export let user: User | null = useAuthStore.getState().user;

useAuthStore.subscribe((state) => state.user, (nextUser) => {
  user = nextUser;
});

export const setUser = (value: User | null) => {
  useAuthStore.getState().setUser(value);
};

export const subscribeUser = (listener: (value: User | null) => void) =>
  useAuthStore.subscribe((state) => state.user, listener);

export const Auth = {
  get token() {
    return useAuthStore.getState().token;
  },
  set token(value: string) {
    useAuthStore.getState().setToken(value);
  },
};

export const setToken = (value: string) => {
  useAuthStore.getState().setToken(value);
};

export const clearAuth = () => {
  useAuthStore.getState().clearAuth();
};
