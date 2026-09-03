import type { InfiniteData, Query, QueryClient } from '@tanstack/react-query';
import type {
  Conversation,
  ConversationMessage,
  ConversationMessagesPage,
  ConversationPage,
} from '../types/messaging.types';
import { conversationMessagesQueryKey } from '../hooks/messaging/useConversations';

const isConversationListQuery = (query: Query) => (
  query.queryKey.length === 3
  && query.queryKey[0] === 'messaging'
  && query.queryKey[1] === 'conversations'
  && typeof query.queryKey[2] === 'object'
);

const updateConversationLists = (
  client: QueryClient,
  conversationId: number,
  update: (conversation: Conversation) => Conversation,
) => {
  client.setQueriesData<InfiniteData<ConversationPage>>(
    { predicate: isConversationListQuery },
    (current) => {
      if (!current) return current;
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          data: page.data.map((conversation) => (
            Number(conversation.id) === conversationId ? update(conversation) : conversation
          )),
        })),
      };
    },
  );
};

export const invalidateConversationLists = (client: QueryClient) => client.invalidateQueries({
  predicate: isConversationListQuery,
});

export const mergeRealtimeMessage = (client: QueryClient, message: ConversationMessage) => {
  const conversationId = Number(message.conversation_id);
  if (!Number.isInteger(conversationId) || conversationId <= 0) return;

  client.setQueryData<InfiniteData<ConversationMessagesPage>>(
    conversationMessagesQueryKey(conversationId),
    (current) => {
      if (!current?.pages.length) return current;
      const duplicate = current.pages.some((page) => page.data.some((item) => (
        item.id === message.id
        || Boolean(message.client_message_id && item.client_message_id === message.client_message_id)
      )));
      if (duplicate) {
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            data: page.data.map((item) => (
              item.id === message.id
              || Boolean(message.client_message_id && item.client_message_id === message.client_message_id)
                ? message
                : item
            )),
          })),
        };
      }

      return {
        ...current,
        pages: current.pages.map((page, index) => (
          index === 0 ? { ...page, data: [...page.data, message] } : page
        )),
      };
    },
  );

  updateConversationLists(client, conversationId, (conversation) => ({
    ...conversation,
    last_message: message,
    last_message_at: message.created_at,
    updated_at: message.created_at ?? conversation.updated_at,
  }));
};

export const applyRealtimeReadReceipt = (
  client: QueryClient,
  conversationId: number,
  readerUserId: number | null,
  lastReadMessageId: number,
) => {
  client.setQueryData<InfiniteData<ConversationMessagesPage>>(
    conversationMessagesQueryKey(conversationId),
    (current) => {
      if (!current) return current;
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          data: page.data.map((message) => (
            message.id <= lastReadMessageId
            && (readerUserId == null || Number(message.sender.id) !== readerUserId)
              ? { ...message, delivery_status: 'read' }
              : message
          )),
        })),
      };
    },
  );
};

export const applyRealtimeConversationUnreadCount = (
  client: QueryClient,
  conversationId: number,
  unreadCount: number,
) => {
  updateConversationLists(client, conversationId, (conversation) => ({
    ...conversation,
    unread_count: Math.max(0, unreadCount),
  }));
};
