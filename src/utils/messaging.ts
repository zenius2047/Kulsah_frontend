import type {
  Conversation,
  ConversationMessage,
  ConversationMessagesPage,
  ConversationParticipant,
  PushNotificationData,
} from '../types/messaging.types';

const MESSAGE_NOTIFICATION_TYPES = new Set([
  'message',
  'chat_message',
  'direct_message',
  'new_message',
  'conversation.message.created',
]);

const MESSAGE_REQUEST_NOTIFICATION_TYPES = new Set([
  'signal.message_request.created',
  'signal.message_request.accepted',
]);

export const pushNotificationType = (data?: PushNotificationData | null) => (
  typeof data?.type === 'string' ? data.type.trim().toLowerCase() : ''
);

const hasPushValue = (value: unknown) => value != null && String(value).trim() !== '';

export const isMessagePushNotification = (data?: PushNotificationData | null) => {
  const type = pushNotificationType(data);
  if (type) return MESSAGE_NOTIFICATION_TYPES.has(type);
  return hasPushValue(data?.conversation_id ?? data?.conversationId);
};

export const isMessageRequestPushNotification = (data?: PushNotificationData | null) =>
  MESSAGE_REQUEST_NOTIFICATION_TYPES.has(pushNotificationType(data));

export const isMessageRequestCreatedPushNotification = (data?: PushNotificationData | null) =>
  pushNotificationType(data) === 'signal.message_request.created';

export const isMessageRequestAcceptedPushNotification = (data?: PushNotificationData | null) =>
  pushNotificationType(data) === 'signal.message_request.accepted';

export const isChallengeInvitationPushNotification = (data?: PushNotificationData | null) =>
  pushNotificationType(data) === 'challenge.invited';

export const isVideoMentionPushNotification = (data?: PushNotificationData | null) =>
  pushNotificationType(data) === 'video.mentioned';

export const pushConversationId = (data?: PushNotificationData | null) => {
  const value = data?.conversation_id ?? data?.conversationId;
  return value == null || String(value).trim() === '' ? undefined : String(value);
};

export const pushChallengeId = (data?: PushNotificationData | null) => {
  const value = data?.challenge_id ?? data?.challengeId;
  return value == null || String(value).trim() === '' ? undefined : String(value);
};

export const pushRequestId = (data?: PushNotificationData | null) => {
  const value = data?.request_id;
  return hasPushValue(value) ? String(value) : undefined;
};

export const pushVideoId = (data?: PushNotificationData | null) => {
  const value = data?.video_id;
  return hasPushValue(value) ? String(value) : undefined;
};

export const nextUnreadMessageCount = (
  currentCount: number,
  data?: PushNotificationData | null,
) => {
  const explicitCount = Number(data?.unread_count ?? data?.unreadCount);
  if (Number.isFinite(explicitCount) && explicitCount >= 0) {
    return Math.floor(explicitCount);
  }
  return isMessagePushNotification(data) ? Math.max(0, currentCount) + 1 : Math.max(0, currentCount);
};

export const formatUnreadBadgeCount = (count: number) => {
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  if (normalized === 0) return undefined;
  return normalized > 99 ? '99+' : normalized;
};

export const formatChatPresence = (
  isOnline: boolean,
  lastSeenAt?: string | null,
  now = Date.now(),
) => {
  if (isOnline) return 'Online';
  if (!lastSeenAt) return 'Offline';

  const lastSeen = new Date(lastSeenAt);
  if (Number.isNaN(lastSeen.getTime())) return 'Offline';

  const elapsedMinutes = Math.max(0, Math.floor((now - lastSeen.getTime()) / 60_000));
  if (elapsedMinutes < 1) return 'Last seen just now';
  if (elapsedMinutes < 60) return `Last seen ${elapsedMinutes}m ago`;
  if (elapsedMinutes < 1_440) return `Last seen ${Math.floor(elapsedMinutes / 60)}h ago`;

  const nowDate = new Date(now);
  const yesterday = new Date(nowDate);
  yesterday.setDate(nowDate.getDate() - 1);
  const isYesterday = lastSeen.getFullYear() === yesterday.getFullYear()
    && lastSeen.getMonth() === yesterday.getMonth()
    && lastSeen.getDate() === yesterday.getDate();
  const time = lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return `Last seen yesterday at ${time}`;

  return `Last seen ${lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${time}`;
};

export const conversationPartner = (
  conversation: Conversation,
  currentUserId?: string | number | null,
): ConversationParticipant | undefined => {
  const normalizedUserId = currentUserId == null ? null : Number(currentUserId);
  return conversation.participants.find((participant) => (
    normalizedUserId == null || participant.user_id !== normalizedUserId
  )) ?? conversation.participants[0];
};

export const conversationDisplayName = (
  conversation: Conversation,
  currentUserId?: string | number | null,
) => {
  if (conversation.is_group) {
    const names = conversation.participants
      .filter((participant) => Number(participant.user_id) !== Number(currentUserId))
      .map((participant) => participant.user.name || participant.user.username)
      .filter((name): name is string => Boolean(name));
    return names.join(', ') || 'Group conversation';
  }

  const partner = conversationPartner(conversation, currentUserId);
  return partner?.user.name || partner?.user.username || 'Conversation';
};

export const conversationAvatar = (
  conversation: Conversation,
  currentUserId?: string | number | null,
) => conversationPartner(conversation, currentUserId)?.user.avatar || null;

export const flattenConversationMessagePages = (
  pages?: ConversationMessagesPage[],
): ConversationMessage[] => {
  const messages = (pages ?? [])
    .slice()
    .reverse()
    .flatMap((page) => page.data ?? []);
  const seen = new Set<number>();

  return messages.filter((message) => {
    if (seen.has(message.id)) return false;
    seen.add(message.id);
    return true;
  });
};

export const createClientMessageId = () =>
  `message-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
