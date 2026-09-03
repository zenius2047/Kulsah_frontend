import api from './client';
import { API_HEARTBEAT_URL, endpoints } from './endpoints';
import type {
  Conversation,
  ConversationListParams,
  ConversationMessageRequest,
  ConversationMessageRequestPage,
  ConversationMessage,
  ConversationMessageAttachment,
  ConversationMessagesPage,
  ConversationPage,
  CreateConversationPayload,
  InitMessageAttachmentPayload,
  MarkConversationReadPayload,
  MarkConversationReadResult,
  MessageAttachmentUploadSession,
  SendConversationMessagePayload,
  SignalReportPayload,
  UserSearchResponse,
  UserSearchParams,
} from '../types/messaging.types';

type DataEnvelope<T> = { data: T; message?: string };

export const messagingApi = {
  heartbeat: (activeConversationId?: string | number | null) =>
    api.get<{
      status: string;
      timestamp: string;
      presence: {
        status: 'online';
        last_seen_at: string;
        active_conversation_id: number | null;
      } | null;
    }>(API_HEARTBEAT_URL, {
      params: activeConversationId == null
        ? {}
        : { active_conversation_id: activeConversationId },
    }),

  searchUsers: (params: UserSearchParams) =>
    api.get<UserSearchResponse>(endpoints.general.conversationSearch, { params }),

  getConversationRequests: (params: { per_page?: number } = {}) =>
    api.get<ConversationMessageRequestPage>(endpoints.general.conversationRequests, { params }),

  getConversations: (params: ConversationListParams = {}) =>
    api.get<ConversationPage>(endpoints.general.conversations, { params }),

  createConversation: (payload: CreateConversationPayload) =>
    api.post<DataEnvelope<Conversation | ConversationMessageRequest>>(endpoints.general.conversations, payload),

  acceptConversationRequest: (request: string | number) =>
    api.post<DataEnvelope<Conversation>>(endpoints.general.conversationRequestAccept(request)),

  declineConversationRequest: (request: string | number) =>
    api.post<DataEnvelope<ConversationMessageRequest>>(endpoints.general.conversationRequestDecline(request)),

  blockConversationRequest: (request: string | number) =>
    api.post<DataEnvelope<ConversationMessageRequest>>(endpoints.general.conversationRequestBlock(request)),

  cancelConversationRequest: (request: string | number) =>
    api.post<DataEnvelope<ConversationMessageRequest>>(endpoints.general.conversationRequestCancel(request)),

  reportSignalContent: (payload: SignalReportPayload) =>
    api.post<DataEnvelope<{ report: Record<string, unknown> }>>(endpoints.general.conversationReports, payload),

  getMessages: (
    conversation: string | number,
    params: { before_message_id?: number; per_page?: number } = {},
  ) => api.get<ConversationMessagesPage>(
    endpoints.general.conversationMessages(conversation),
    { params },
  ),

  sendMessage: (
    conversation: string | number,
    payload: SendConversationMessagePayload,
  ) => api.post<DataEnvelope<ConversationMessage>>(
    endpoints.general.conversationMessages(conversation),
    payload,
  ),

  markRead: (
    conversation: string | number,
    payload: MarkConversationReadPayload,
  ) => api.post<DataEnvelope<MarkConversationReadResult>>(
    endpoints.general.conversationRead(conversation),
    payload,
  ),

  getUnreadCount: () => api.get<DataEnvelope<{ unread_count: number }>>(
    endpoints.general.conversationsUnreadCount,
  ),

  startTyping: (conversation: string | number) =>
    api.post(endpoints.general.conversationTypingStart(conversation)),

  stopTyping: (conversation: string | number) =>
    api.post(endpoints.general.conversationTypingStop(conversation)),

  initAttachmentUpload: (payload: InitMessageAttachmentPayload) =>
    api.post<DataEnvelope<MessageAttachmentUploadSession>>(
      endpoints.media.messageUploads,
      payload,
    ),

  completeAttachmentUpload: (attachment: string | number) =>
    api.post<DataEnvelope<ConversationMessageAttachment>>(
      endpoints.media.messageUploadComplete(attachment),
    ),
};
