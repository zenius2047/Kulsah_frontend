import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PushNotificationData } from '../types/messaging.types';
import { nextUnreadMessageCount } from '../utils/messaging';

export type MessagingRealtimeStatus =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'unavailable'
  | 'failed';

type MessagingState = {
  unreadCount: number;
  initialized: boolean;
  realtimeStatus: MessagingRealtimeStatus;
  activeConversationId: number | null;
  onlineUserIds: number[];
  onlinePresenceReady: boolean;
  initializeUnreadCount: (count: number) => void;
  recordIncomingMessage: (data?: PushNotificationData | null) => void;
  markOneMessageRead: () => void;
  setUnreadCount: (count: number) => void;
  clearUnreadCount: () => void;
  setRealtimeStatus: (status: MessagingRealtimeStatus) => void;
  setActiveConversationId: (conversationId: number | null) => void;
  setOnlinePresenceSnapshot: (userIds: number[]) => void;
  setOnlineUserPresence: (userId: number, isOnline: boolean) => void;
  clearOnlinePresence: () => void;
};

export const useMessagingStore = create<MessagingState>()(
  persist(
    (set) => ({
      unreadCount: 0,
      initialized: false,
      realtimeStatus: 'disabled',
      activeConversationId: null,
      onlineUserIds: [],
      onlinePresenceReady: false,
      initializeUnreadCount: (count) => set((state) => (
        state.initialized
          ? state
          : { unreadCount: Math.max(0, Math.floor(count)), initialized: true }
      )),
      recordIncomingMessage: (data) => set((state) => ({
        unreadCount: nextUnreadMessageCount(state.unreadCount, data),
        initialized: true,
      })),
      markOneMessageRead: () => set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
        initialized: true,
      })),
      setUnreadCount: (count) => set({
        unreadCount: Math.max(0, Math.floor(Number(count) || 0)),
        initialized: true,
      }),
      clearUnreadCount: () => set({ unreadCount: 0, initialized: true }),
      setRealtimeStatus: (realtimeStatus) => set({ realtimeStatus }),
      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      setOnlinePresenceSnapshot: (userIds) => set({
        onlineUserIds: Array.from(new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))),
        onlinePresenceReady: true,
      }),
      setOnlineUserPresence: (userId, isOnline) => set((state) => {
        if (!Number.isInteger(userId) || userId <= 0) return state;
        if (isOnline) {
          return state.onlineUserIds.includes(userId)
            ? { onlinePresenceReady: true }
            : { onlineUserIds: [...state.onlineUserIds, userId], onlinePresenceReady: true };
        }
        return {
          onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
          onlinePresenceReady: true,
        };
      }),
      clearOnlinePresence: () => set({ onlineUserIds: [], onlinePresenceReady: false }),
    }),
    {
      name: 'kulsah_messaging',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        initialized: state.initialized,
      }),
    },
  ),
);
