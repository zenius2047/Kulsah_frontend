import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from '../../api/messaging.api';
import { isMessagingRealtimeConfigured } from '../../services/messagingRealtime.service';
import type {
  Conversation,
  ConversationListParams,
  ConversationMessageRequest,
  CreateConversationPayload,
  CreateConversationResult,
  MarkConversationReadPayload,
  SendConversationMessagePayload,
  SignalReportPayload,
} from '../../types/messaging.types';

const CONVERSATION_PAGE_SIZE = 30;
const MESSAGE_PAGE_SIZE = 50;
const USER_SEARCH_PAGE_SIZE = 20;
const REALTIME_POLL_FALLBACK_MS = 60_000;

export const conversationsQueryKey = (filters: Omit<ConversationListParams, 'page' | 'per_page'> = {}) =>
  ['messaging', 'conversations', filters] as const;
export const conversationMessagesQueryKey = (conversation?: string | number) =>
  ['messaging', 'conversations', conversation, 'messages'] as const;
export const conversationUnreadCountQueryKey = ['messaging', 'unread-count'] as const;
export const conversationRequestsQueryKey = ['messaging', 'conversation-requests'] as const;
export const userSearchQueryKey = (query: string) => ['messaging', 'user-search', query] as const;

export const useUserSearch = (query: string) => {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: userSearchQueryKey(normalizedQuery),
    queryFn: () => messagingApi.searchUsers({
      q: normalizedQuery,
      limit: USER_SEARCH_PAGE_SIZE,
    }).then((response) => response.data.data.users),
    enabled: normalizedQuery.length >= 2,
    staleTime: 30_000,
  });
};

export const useConversationRequests = (enabled = true) => useQuery({
  queryKey: conversationRequestsQueryKey,
  queryFn: () => messagingApi.getConversationRequests({ per_page: 30 }).then((response) => response.data),
  enabled,
  refetchInterval: isMessagingRealtimeConfigured ? REALTIME_POLL_FALLBACK_MS : 15_000,
});

export const useConversations = (
  filters: Omit<ConversationListParams, 'page' | 'per_page'> = {},
) => useInfiniteQuery({
  queryKey: conversationsQueryKey(filters),
  initialPageParam: 1,
  queryFn: ({ pageParam }) => messagingApi.getConversations({
    ...filters,
    page: Number(pageParam),
    per_page: CONVERSATION_PAGE_SIZE,
  }).then((response) => response.data),
  getNextPageParam: (page) => (
    page.meta.current_page < page.meta.last_page ? page.meta.current_page + 1 : undefined
  ),
  refetchInterval: isMessagingRealtimeConfigured ? REALTIME_POLL_FALLBACK_MS : 15_000,
});

export const useConversationMessages = (conversation?: string | number) => useInfiniteQuery({
  queryKey: conversationMessagesQueryKey(conversation),
  initialPageParam: undefined as number | undefined,
  queryFn: ({ pageParam }) => messagingApi.getMessages(conversation!, {
    ...(pageParam == null ? {} : { before_message_id: Number(pageParam) }),
    per_page: MESSAGE_PAGE_SIZE,
  }).then((response) => response.data),
  getNextPageParam: (page) => (
    page.meta.has_more && page.meta.next_before_message_id != null
      ? page.meta.next_before_message_id
      : undefined
  ),
  enabled: conversation !== undefined && conversation !== null && conversation !== '',
  refetchInterval: isMessagingRealtimeConfigured ? REALTIME_POLL_FALLBACK_MS : 10_000,
});

export const useConversationUnreadCount = (enabled = true) => useQuery({
  queryKey: conversationUnreadCountQueryKey,
  queryFn: () => messagingApi.getUnreadCount().then((response) => response.data.data.unread_count),
  enabled,
  refetchInterval: isMessagingRealtimeConfigured ? REALTIME_POLL_FALLBACK_MS : 30_000,
});

export const useCreateConversation = () => {
  const client = useQueryClient();
  return useMutation<CreateConversationResult, Error, CreateConversationPayload>({
    mutationFn: async (payload) => {
      const response = await messagingApi.createConversation(payload);
      if (response.status === 202) {
        return { kind: 'request', request: response.data.data as ConversationMessageRequest };
      }
      return { kind: 'conversation', conversation: response.data.data as Conversation };
    },
    onSuccess: (result) => {
      if (result.kind === 'conversation') {
        void client.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      } else {
        void client.invalidateQueries({ queryKey: conversationRequestsQueryKey });
      }
    },
  });
};

export const useAcceptConversationRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: string | number) =>
      messagingApi.acceptConversationRequest(request).then((response) => response.data.data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: conversationRequestsQueryKey });
      void client.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    },
  });
};

export const useDeclineConversationRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: string | number) =>
      messagingApi.declineConversationRequest(request).then((response) => response.data.data),
    onSuccess: () => void client.invalidateQueries({ queryKey: conversationRequestsQueryKey }),
  });
};

export const useBlockConversationRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: string | number) =>
      messagingApi.blockConversationRequest(request).then((response) => response.data.data),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: conversationRequestsQueryKey });
      void client.invalidateQueries({ queryKey: ['messaging', 'user-search'] });
    },
  });
};

export const useCancelConversationRequest = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: string | number) =>
      messagingApi.cancelConversationRequest(request).then((response) => response.data.data),
    onSuccess: () => void client.invalidateQueries({ queryKey: conversationRequestsQueryKey }),
  });
};

export const useReportSignalContent = () => useMutation({
  mutationFn: (payload: SignalReportPayload) =>
    messagingApi.reportSignalContent(payload).then((response) => response.data.data.report),
});

export const useSendConversationMessage = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conversation, payload }: {
      conversation: string | number;
      payload: SendConversationMessagePayload;
    }) => messagingApi.sendMessage(conversation, payload).then((response) => response.data.data),
    onSuccess: (_, variables) => {
      void client.invalidateQueries({ queryKey: conversationMessagesQueryKey(variables.conversation) });
      void client.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
    },
  });
};

export const useMarkConversationRead = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ conversation, payload }: {
      conversation: string | number;
      payload: MarkConversationReadPayload;
    }) => messagingApi.markRead(conversation, payload).then((response) => response.data.data),
    onSuccess: (_, variables) => {
      void client.invalidateQueries({ queryKey: conversationMessagesQueryKey(variables.conversation) });
      void client.invalidateQueries({ queryKey: ['messaging', 'conversations'] });
      void client.invalidateQueries({ queryKey: conversationUnreadCountQueryKey });
    },
  });
};

export const useConversationTyping = () => ({
  start: (conversation: string | number) => messagingApi.startTyping(conversation),
  stop: (conversation: string | number) => messagingApi.stopTyping(conversation),
});
