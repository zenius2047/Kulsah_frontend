import type { Sticker } from './sticker.types';

export type PushProvider = 'fcm' | 'apns';

export type DevicePushTokenPayload = {
  token: string;
  platform: 'android' | 'ios';
  device_name?: string | null;
  provider: PushProvider;
  app_version?: string | null;
};

export type NotificationDeviceRegistration = {
  notification_device_id: number;
  provider: PushProvider;
  platform: 'android' | 'ios' | 'web';
  device_name: string | null;
  app_version: string | null;
  last_seen_at: string | null;
};

export type StoredPushRegistration = {
  device_id: number | null;
  user_id: number | null;
  payload: DevicePushTokenPayload;
};

export type PushNotificationData = Record<string, unknown> & {
  notification_id?: string;
  event_id?: string;
  schema_version?: string | number;
  type?: string;
  conversation_id?: string | number;
  conversationId?: string | number;
  message_id?: string | number;
  client_message_id?: string;
  sender_id?: string | number;
  senderId?: string | number;
  receiver_id?: string | number;
  sender?: string | Record<string, unknown>;
  body?: string;
  message_type?: string;
  unread_count?: string | number;
  unreadCount?: string | number;
  request_id?: string | number;
  intro_body?: string;
  intro_type?: string;
  status?: string;
  accepted_at?: string;
  challenge_id?: string | number;
  challengeId?: string | number;
  invite_id?: string | number;
  invitation_type?: string;
  challenge_title?: string;
  challenge_slug?: string;
  challenge_mode?: string;
  challenge_status?: string;
  role?: string;
  invited_by?: string | Record<string, unknown>;
  video_id?: string | number;
  video_title?: string;
  caption?: string;
  content_type?: string;
  mentioned_by?: string | Record<string, unknown>;
  mentions?: string | unknown[];
  hashtags?: string | unknown[];
  live_id?: string | number;
  creator_id?: string | number;
  creator_name?: string;
  creator_username?: string;
  category?: string;
  cover_url?: string | null;
  created_at?: string;
};

export type ConversationUser = {
  id: number | null;
  name: string | null;
  username: string | null;
  avatar: string | null;
  is_online?: boolean;
  last_seen_at?: string | null;
};

export type ConversationParticipant = {
  id: number;
  user_id: number;
  role: string;
  unread_count: number;
  last_read_message_id: number | null;
  last_read_at: string | null;
  archived_at: string | null;
  user: ConversationUser;
};

export type ConversationMessageReaction = {
  emoji: string;
  count: number;
  user_ids: number[];
  reacted: boolean;
};

export type ConversationMessageAttachmentKind =
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'sticker'
  | 'gif';

export type ConversationMessageAttachment = {
  id: number;
  conversation_message_id: number | null;
  conversation_id: number;
  kind: ConversationMessageAttachmentKind | string;
  file_name: string;
  mime_type: string | null;
  size: number | null;
  url: string | null;
  status: string;
  uploaded_at: string | null;
  attached_at: string | null;
};

export type ConversationMessage = {
  id: number;
  client_message_id: string | null;
  conversation_id: number;
  sender: ConversationUser;
  type: string;
  body: string | null;
  sticker?: Sticker | null;
  attachments: ConversationMessageAttachment[];
  reply_to: {
    id: number;
    client_message_id: string | null;
    sender_id: number;
  } | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  edited_at: string | null;
  deleted_at: string | null;
  delivery_status: string;
  reactions: ConversationMessageReaction[];
};

export type Conversation = {
  id: number;
  conversation_key: string;
  context_type: string | null;
  context_id: number | null;
  is_group: boolean;
  participants: ConversationParticipant[];
  last_message: ConversationMessage | null;
  last_message_at: string | null;
  unread_count: number;
  archived_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ConversationPage = {
  data: Conversation[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type ConversationMessagesPage = {
  data: ConversationMessage[];
  meta: {
    has_more: boolean;
    next_before_message_id: number | null;
  };
};

export type ConversationListParams = {
  page?: number;
  per_page?: number;
  archived?: boolean;
  unread_only?: boolean;
  search?: string;
};

export type UserSearchResult = {
  id: number;
  name: string | null;
  handle: string | null;
  avatar: string | null;
  verified: boolean;
  role?: string | null;
  bio?: string | null;
};

export type UserSearchResponse = {
  data: {
    users: UserSearchResult[];
  };
};

export type UserSearchParams = {
  q: string;
  limit?: number;
};

export type ConversationMessageRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'blocked'
  | 'cancelled';

export type ConversationMessageRequest = {
  id: number;
  conversation_id: number | null;
  sender: ConversationUser;
  receiver_id: number;
  status: ConversationMessageRequestStatus;
  intro_client_message_id: string | null;
  intro_type: string;
  intro_body: string | null;
  intro_metadata: Record<string, unknown>;
  accepted_at: string | null;
  declined_at: string | null;
  blocked_at: string | null;
  cancelled_at: string | null;
  cooldown_until: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ConversationMessageRequestPage = {
  data: ConversationMessageRequest[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
};

export type CreateConversationResult =
  | { kind: 'conversation'; conversation: Conversation }
  | { kind: 'request'; request: ConversationMessageRequest };

export type SignalReportPayload = {
  type: 'user' | 'message' | 'request' | 'conversation';
  id: number;
  reason?: string | null;
};

export type SendConversationMessagePayload = {
  client_message_id?: string;
  type: string;
  body?: string | null;
  sticker_id?: number | null;
  attachment_ids?: number[];
  reply_to_message_id?: number | null;
  metadata?: Record<string, unknown>;
  idempotency_key?: string;
};

export type CreateConversationPayload = {
  participant_ids: number[];
  context_type?: string | null;
  context_id?: number | null;
  initial_message?: SendConversationMessagePayload | null;
};

export type MarkConversationReadPayload = {
  last_read_message_id: number;
  read_at?: string;
};

export type MarkConversationReadResult = {
  conversation_id: number;
  last_read_message_id: number;
  last_read_at: string | null;
  unread_count: number;
};

export type InitMessageAttachmentPayload = {
  conversation_id: number;
  file_name: string;
  mime_type: string;
  size: number;
  kind?: ConversationMessageAttachmentKind;
  metadata?: Record<string, unknown>;
};

export type MessageAttachmentUploadSession = {
  attachment_id: number;
  upload: {
    method: 'PUT' | string;
    url: string;
    headers: Record<string, string>;
    expires_at: string | null;
  };
};

export type ConversationRealtimeEvent = {
  event_id: string;
  occurred_at: string;
  user_id: number | null;
  conversation_id?: number;
};

export type ConversationMessageCreatedEvent = ConversationRealtimeEvent & {
  message: ConversationMessage;
};

export type ConversationTypingEvent = ConversationRealtimeEvent & {
  conversation_id: number;
};

export type ConversationUnreadCountEvent = ConversationRealtimeEvent & {
  conversation_id: number;
  unread_count: number;
};

export type ConversationUpdatedEvent = ConversationRealtimeEvent & {
  conversation_id: number;
  changes: Record<string, unknown>;
};

export type ConversationReadEvent = ConversationUpdatedEvent & {
  changes: {
    last_read_message_id?: number;
    last_read_at?: string;
  };
};

export type ConversationMessageRequestRealtimeEvent = {
  type: 'signal.message_request.created' | 'signal.message_request.accepted';
  request: {
    id: number;
    sender_id: number;
    receiver_id: number;
    conversation_id: number | null;
    intro_body?: string | null;
    intro_type?: string;
    status: ConversationMessageRequestStatus;
  };
};
