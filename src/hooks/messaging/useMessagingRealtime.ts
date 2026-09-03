import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { queryClient } from '../../lib/queryClient';
import { messagingApi } from '../../api/messaging.api';
import { useAuthStore } from '../../store/auth.store';
import { useMessagingStore, type MessagingRealtimeStatus } from '../../store/messaging.store';
import {
  conversationRequestsQueryKey,
  conversationUnreadCountQueryKey,
} from './useConversations';
import {
  acceptRealtimeEvent,
  disconnectMessagingRealtime,
  getMessagingRealtimeClient,
  isMessagingRealtimeConfigured,
} from '../../services/messagingRealtime.service';
import {
  applyRealtimeConversationUnreadCount,
  applyRealtimeReadReceipt,
  invalidateConversationLists,
  mergeRealtimeMessage,
} from '../../utils/messagingRealtime';
import type {
  ConversationMessageCreatedEvent,
  ConversationMessageRequestRealtimeEvent,
  ConversationReadEvent,
  ConversationTypingEvent,
  ConversationUnreadCountEvent,
  ConversationUpdatedEvent,
} from '../../types/messaging.types';

type PusherConnectionStateChange = {
  current?: string;
};

type RealtimePresenceMember = {
  id?: unknown;
  user_id?: unknown;
};

const realtimeStatus = (state?: string): MessagingRealtimeStatus => {
  switch (state) {
    case 'connected':
    case 'connecting':
    case 'disconnected':
    case 'unavailable':
    case 'failed':
      return state;
    case 'initialized':
      return 'connecting';
    default:
      return 'reconnecting';
  }
};

const validId = (value: unknown) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const presenceMemberId = (member: RealtimePresenceMember) => validId(member.id ?? member.user_id);

export const useMessagingRealtime = (enabled = true) => {
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const setUnreadCount = useMessagingStore((state) => state.setUnreadCount);
  const setRealtimeStatus = useMessagingStore((state) => state.setRealtimeStatus);
  const activeConversationId = useMessagingStore((state) => state.activeConversationId);
  const setOnlinePresenceSnapshot = useMessagingStore((state) => state.setOnlinePresenceSnapshot);
  const setOnlineUserPresence = useMessagingStore((state) => state.setOnlineUserPresence);
  const clearOnlinePresence = useMessagingStore((state) => state.clearOnlinePresence);
  const unreadRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const normalizedUserId = validId(userId);
    if (!enabled || !token || !normalizedUserId) return;

    const sendHeartbeat = () => {
      if (AppState.currentState !== 'active') return;
      void messagingApi.heartbeat(activeConversationId).catch(() => undefined);
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60_000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sendHeartbeat();
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, [activeConversationId, enabled, token, userId]);

  useEffect(() => {
    const normalizedUserId = validId(userId);
    if (!enabled || !token || !normalizedUserId || !isMessagingRealtimeConfigured) {
      setRealtimeStatus(isMessagingRealtimeConfigured ? 'disconnected' : 'disabled');
      clearOnlinePresence();
      if (!enabled || !token) disconnectMessagingRealtime();
      return;
    }

    const echo = getMessagingRealtimeClient(token);
    if (!echo) {
      setRealtimeStatus('disabled');
      return;
    }

    const connection = echo.connector.pusher.connection;
    const handleStateChange = ({ current }: PusherConnectionStateChange) => {
      const status = realtimeStatus(current);
      setRealtimeStatus(status);
      if (status === 'connected') {
        void queryClient.invalidateQueries({ queryKey: ['messaging'] });
      } else {
        clearOnlinePresence();
      }
    };
    const handleConnectionError = () => {
      setRealtimeStatus('unavailable');
      clearOnlinePresence();
    };
    connection.bind('state_change', handleStateChange);
    connection.bind('error', handleConnectionError);
    setRealtimeStatus(realtimeStatus(connection.state));

    const refreshUnreadCount = () => {
      if (unreadRefreshTimerRef.current) clearTimeout(unreadRefreshTimerRef.current);
      unreadRefreshTimerRef.current = setTimeout(() => {
        void messagingApi.getUnreadCount()
          .then((response) => {
            const count = response.data.data.unread_count;
            queryClient.setQueryData(conversationUnreadCountQueryKey, count);
            setUnreadCount(count);
          })
          .catch(() => undefined);
      }, 150);
    };

    const handleUnreadCount = (event: ConversationUnreadCountEvent) => {
      if (!acceptRealtimeEvent(event.event_id)) return;
      const conversationId = validId(event.conversation_id);
      if (conversationId) {
        applyRealtimeConversationUnreadCount(queryClient, conversationId, Number(event.unread_count) || 0);
        void invalidateConversationLists(queryClient).then(refreshUnreadCount, refreshUnreadCount);
        return;
      }
      refreshUnreadCount();
    };

    const handleMessageRequest = (event: ConversationMessageRequestRealtimeEvent) => {
      if (event.request?.id == null) return;
      void queryClient.invalidateQueries({ queryKey: conversationRequestsQueryKey });
      void invalidateConversationLists(queryClient);
    };

    const userChannelName = `users.${normalizedUserId}`;
    echo.private(userChannelName)
      .listen('.conversation.unread_count', handleUnreadCount)
      .listen('.signal.message_request.created', handleMessageRequest)
      .listen('.signal.message_request.accepted', handleMessageRequest);

    const onlineChannelName = 'online';
    echo.join(onlineChannelName)
      .here((members: RealtimePresenceMember[]) => {
        setOnlinePresenceSnapshot(
          members.map(presenceMemberId).filter((id): id is number => id !== null),
        );
      })
      .joining((member: RealtimePresenceMember) => {
        const memberId = presenceMemberId(member);
        if (memberId) setOnlineUserPresence(memberId, true);
      })
      .leaving((member: RealtimePresenceMember) => {
        const memberId = presenceMemberId(member);
        if (memberId) setOnlineUserPresence(memberId, false);
      })
      .error(() => clearOnlinePresence());

    return () => {
      if (unreadRefreshTimerRef.current) clearTimeout(unreadRefreshTimerRef.current);
      connection.unbind('state_change', handleStateChange);
      connection.unbind('error', handleConnectionError);
      echo.leave(userChannelName);
      echo.leave(onlineChannelName);
      clearOnlinePresence();
      disconnectMessagingRealtime();
      setRealtimeStatus('disconnected');
    };
  }, [
    clearOnlinePresence,
    enabled,
    setOnlinePresenceSnapshot,
    setOnlineUserPresence,
    setRealtimeStatus,
    setUnreadCount,
    token,
    userId,
  ]);
};

export const useConversationRealtime = (conversation?: string | number) => {
  const token = useAuthStore((state) => state.token);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);
  const typingTimersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const conversationId = validId(conversation);

  useEffect(() => {
    if (!token || !conversationId || !isMessagingRealtimeConfigured) return;
    const echo = getMessagingRealtimeClient(token);
    if (!echo) return;

    const clearTypingUser = (userId: number) => {
      const timer = typingTimersRef.current.get(userId);
      if (timer) clearTimeout(timer);
      typingTimersRef.current.delete(userId);
      setTypingUserIds((current) => current.filter((id) => id !== userId));
    };
    const handleMessageCreated = (event: ConversationMessageCreatedEvent) => {
      if (!event.message || !acceptRealtimeEvent(event.event_id)) return;
      if (Number(event.message.conversation_id) !== conversationId) return;
      mergeRealtimeMessage(queryClient, event.message);
    };
    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      if (!acceptRealtimeEvent(event.event_id)) return;
      void invalidateConversationLists(queryClient);
    };
    const handleMessageRead = (event: ConversationReadEvent) => {
      if (!acceptRealtimeEvent(event.event_id)) return;
      const lastReadMessageId = Number(event.changes?.last_read_message_id);
      if (!Number.isInteger(lastReadMessageId) || lastReadMessageId <= 0) return;
      applyRealtimeReadReceipt(
        queryClient,
        conversationId,
        validId(event.user_id),
        lastReadMessageId,
      );
    };
    const handleTypingStarted = (event: ConversationTypingEvent) => {
      if (!acceptRealtimeEvent(event.event_id)) return;
      const typingUserId = validId(event.user_id);
      if (!typingUserId || typingUserId === Number(currentUserId)) return;
      const existingTimer = typingTimersRef.current.get(typingUserId);
      if (existingTimer) clearTimeout(existingTimer);
      setTypingUserIds((current) => (
        current.includes(typingUserId) ? current : [...current, typingUserId]
      ));
      typingTimersRef.current.set(typingUserId, setTimeout(() => clearTypingUser(typingUserId), 4_000));
    };
    const handleTypingStopped = (event: ConversationTypingEvent) => {
      if (!acceptRealtimeEvent(event.event_id)) return;
      const typingUserId = validId(event.user_id);
      if (typingUserId) clearTypingUser(typingUserId);
    };

    const channelName = `conversations.${conversationId}`;
    echo.private(channelName)
      .listen('.message.created', handleMessageCreated)
      .listen('.conversation.updated', handleConversationUpdated)
      .listen('.message.read', handleMessageRead)
      .listen('.typing.started', handleTypingStarted)
      .listen('.typing.stopped', handleTypingStopped);

    return () => {
      typingTimersRef.current.forEach((timer) => clearTimeout(timer));
      typingTimersRef.current.clear();
      setTypingUserIds([]);
      echo.leave(channelName);
    };
  }, [conversationId, currentUserId, token]);

  return useMemo(() => ({
    isParticipantTyping: typingUserIds.length > 0,
    typingUserIds,
  }), [typingUserIds]);
};
