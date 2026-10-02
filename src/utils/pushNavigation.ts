import type { PushNotificationData } from '../types/messaging.types';
import {
  isMessagePushNotification,
  isMessageRequestAcceptedPushNotification,
  pushConversationId,
} from './messaging';
import { isVoiceCallPushNotification, pushCallId } from './pushNotifications';

export type ConversationPushNavigation = {
  conversationId: string;
  senderId?: string | number;
  callId?: number;
  name?: string;
  avatar?: string;
};

export const resolveConversationPushNavigation = (
  data: PushNotificationData,
): ConversationPushNavigation | null => {
  const conversationId = pushConversationId(data);
  if (!conversationId) return null;

  if (isVoiceCallPushNotification(data)) {
    const caller = data.caller && typeof data.caller === 'object'
      ? data.caller as Record<string, unknown>
      : {};
    return {
      conversationId,
      callId: pushCallId(data),
      senderId: typeof caller.id === 'string' || typeof caller.id === 'number' ? caller.id : undefined,
      name: typeof caller.name === 'string' ? caller.name : undefined,
      avatar: typeof caller.avatar === 'string' ? caller.avatar : undefined,
    };
  }

  if (isMessagePushNotification(data)) {
    return {
      conversationId,
      senderId: data.sender_id ?? data.senderId,
    };
  }

  if (isMessageRequestAcceptedPushNotification(data)) {
    return {
      conversationId,
      senderId: data.receiver_id ?? data.sender_id,
    };
  }

  return null;
};
