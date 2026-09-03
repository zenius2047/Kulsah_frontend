import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  conversationDisplayName,
  flattenConversationMessagePages,
  formatChatPresence,
  formatUnreadBadgeCount,
  isChallengeInvitationPushNotification,
  isMessagePushNotification,
  isMessageRequestAcceptedPushNotification,
  isMessageRequestCreatedPushNotification,
  isMessageRequestPushNotification,
  isVideoMentionPushNotification,
  nextUnreadMessageCount,
  pushChallengeId,
  pushConversationId,
  pushRequestId,
  pushVideoId,
} from '../src/utils/messaging';
import { endpoints } from '../src/api/endpoints';
import { conversationMessagesQueryKey } from '../src/hooks/messaging/useConversations';
import { applyRealtimeReadReceipt, mergeRealtimeMessage } from '../src/utils/messagingRealtime';
import {
  normalizePresenceMember,
  normalizePresenceMembers,
  resolvePusherConstructor,
} from '../src/services/messagingRealtime.service';
import {
  createFcmDeviceTokenPayload,
  normalizePushNotificationData,
  parseStoredPushRegistration,
  pushNotificationIdentity,
  retainRecentNotificationIds,
} from '../src/utils/pushNotifications';
import type { Conversation, ConversationMessage, ConversationMessagesPage } from '../src/types/messaging.types';

const message = (id: number): ConversationMessage => ({
  id,
  client_message_id: `client-${id}`,
  conversation_id: 9,
  sender: { id: 2, name: 'Ari', username: 'ari', avatar: null },
  type: 'text',
  body: `Message ${id}`,
  attachments: [],
  reply_to: null,
  metadata: {},
  created_at: '2026-08-25T08:00:00.000Z',
  edited_at: null,
  deleted_at: null,
  delivery_status: 'sent',
  reactions: [],
});

describe('realtime runtime compatibility', () => {
  it('resolves the named constructor exported by the React Native Pusher bundle', () => {
    const PusherConstructor = function PusherConstructor() {};

    expect(resolvePusherConstructor({ Pusher: PusherConstructor })).toBe(PusherConstructor);
    expect(resolvePusherConstructor({ default: { Pusher: PusherConstructor } })).toBe(PusherConstructor);
  });

  it('accepts the callable web/node module shape and rejects non-callable modules', () => {
    const PusherConstructor = function PusherConstructor() {};

    expect(resolvePusherConstructor(PusherConstructor)).toBe(PusherConstructor);
    expect(resolvePusherConstructor({})).toBeNull();
  });

  it('preserves presence IDs supplied as member fields or member-map keys', () => {
    expect(normalizePresenceMember({ id: '8', info: { name: 'Ama' } })).toEqual({ id: '8', name: 'Ama' });
    expect(normalizePresenceMembers({ members: { 12: { name: 'Kojo' } } })).toEqual([
      { id: '12', name: 'Kojo' },
    ]);
  });
});

describe('FCM messaging payload helpers', () => {
  it('recognizes message notifications and extracts the conversation id', () => {
    const data = { type: 'conversation.message.created', conversation_id: 42 };
    expect(isMessagePushNotification(data)).toBe(true);
    expect(pushConversationId(data)).toBe('42');
  });

  it('recognizes backend challenge invitations for deep linking', () => {
    const data = { type: 'challenge.invited', challenge_id: 81 };
    expect(isChallengeInvitationPushNotification(data)).toBe(true);
    expect(pushChallengeId(data)).toBe('81');
  });

  it('keeps message requests separate from unread conversation messages', () => {
    const created = {
      type: 'signal.message_request.created',
      request_id: '17',
      conversation_id: '',
    };
    const accepted = {
      type: 'signal.message_request.accepted',
      request_id: '17',
      conversation_id: '42',
    };

    expect(isMessageRequestPushNotification(created)).toBe(true);
    expect(isMessageRequestCreatedPushNotification(created)).toBe(true);
    expect(isMessageRequestAcceptedPushNotification(accepted)).toBe(true);
    expect(isMessagePushNotification(created)).toBe(false);
    expect(isMessagePushNotification(accepted)).toBe(false);
    expect(pushRequestId(created)).toBe('17');
    expect(nextUnreadMessageCount(4, accepted)).toBe(4);
  });

  it('recognizes video mentions and extracts their destination id', () => {
    const data = { type: 'video.mentioned', video_id: '93' };
    expect(isVideoMentionPushNotification(data)).toBe(true);
    expect(pushVideoId(data)).toBe('93');
  });

  it('uses an authoritative unread count when FCM supplies one', () => {
    expect(nextUnreadMessageCount(7, {
      type: 'message',
      unread_count: '12',
    })).toBe(12);
  });

  it('increments message pushes and ignores unrelated notifications', () => {
    expect(nextUnreadMessageCount(2, { type: 'direct_message' })).toBe(3);
    expect(nextUnreadMessageCount(2, { type: 'challenge_started' })).toBe(2);
  });

  it('formats a compact navigation badge', () => {
    expect(formatUnreadBadgeCount(0)).toBeUndefined();
    expect(formatUnreadBadgeCount(8)).toBe(8);
    expect(formatUnreadBadgeCount(120)).toBe('99+');
  });

  it('formats online and last-seen presence for chat', () => {
    const now = new Date('2026-08-27T12:00:00.000Z').getTime();
    expect(formatChatPresence(true, null, now)).toBe('Online');
    expect(formatChatPresence(false, '2026-08-27T11:52:00.000Z', now)).toBe('Last seen 8m ago');
    expect(formatChatPresence(false, null, now)).toBe('Offline');
  });

  it('uses the callable backend routes for messaging and push registration', () => {
    expect(endpoints.auth.socialLogin).toBe('auth/social-login');
    expect(endpoints.auth.notificationDevices).toBe('auth/notification-devices');
    expect(endpoints.auth.notificationDevice(27)).toBe('auth/notification-devices/27');
    expect(endpoints.general.conversationSearch).toBe('general/conversations/search');
    expect(endpoints.general.conversationRequests).toBe('general/conversations/requests');
    expect(endpoints.general.conversationRequestAccept(12)).toBe('general/conversations/12/accept');
    expect(endpoints.general.conversationMessages(9)).toBe('general/conversations/9/messages');
    expect(endpoints.general.stickerPack(3)).toBe('general/stickers/packs/3');
    expect(endpoints.media.messageUploadComplete(12)).toBe('media/message-uploads/12/complete');
  });

  it('shows the other participant and orders cursor pages oldest to newest', () => {
    const conversation = {
      id: 9,
      is_group: false,
      participants: [
        { user_id: 1, user: { name: 'Current user', username: 'me' } },
        { user_id: 2, user: { name: 'Ari', username: 'ari' } },
      ],
    } as Conversation;
    const newest = { data: [message(3), message(4)] } as ConversationMessagesPage;
    const older = { data: [message(1), message(2), message(3)] } as ConversationMessagesPage;

    expect(conversationDisplayName(conversation, 1)).toBe('Ari');
    expect(flattenConversationMessagePages([newest, older]).map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });
});

describe('push registration and delivery identity', () => {
  it('registers native tokens as FCM on both supported platforms', () => {
    expect(createFcmDeviceTokenPayload({
      token: ' android-fcm-token ',
      platform: 'android',
    })).toMatchObject({
      token: 'android-fcm-token',
      platform: 'android',
      provider: 'fcm',
    });
    expect(createFcmDeviceTokenPayload({
      token: 'ios-fcm-token',
      platform: 'ios',
    })).toMatchObject({
      token: 'ios-fcm-token',
      platform: 'ios',
      provider: 'fcm',
    });
  });

  it('normalizes the revised backend FCM message payload', () => {
    expect(normalizePushNotificationData({
      schema_version: '1',
      type: 'conversation.message.created',
      conversation_id: '42',
      message_id: '91',
      content_type: 'text',
      unread_count: '3',
      sender: '{"id":9,"name":"Jordan Blaze"}',
    })).toEqual({
      schema_version: '1',
      type: 'conversation.message.created',
      conversation_id: '42',
      message_id: '91',
      content_type: 'text',
      unread_count: '3',
      sender: { id: 9, name: 'Jordan Blaze' },
    });
  });

  it('reads the current registration shape and migrates a legacy token payload', () => {
    const payload = { token: 'native-token', platform: 'android' as const, provider: 'fcm' as const };

    expect(parseStoredPushRegistration(JSON.stringify({
      device_id: 18,
      user_id: 7,
      payload,
    }))).toEqual({ device_id: 18, user_id: 7, payload });
    expect(parseStoredPushRegistration(JSON.stringify(payload))).toEqual({
      device_id: null,
      user_id: null,
      payload,
    });
  });

  it('prefers a stable event id and falls back to the native notification id', () => {
    expect(pushNotificationIdentity({
      type: 'conversation.message.created',
      notification_id: 'push-91',
      message_id: 91,
    }, 'native-1')).toBe('event:push-91');
    expect(pushNotificationIdentity({ type: 'message' }, 'native-1')).toBe('native:native-1');
  });

  it('retains unique recent delivery ids within the configured limit', () => {
    expect(retainRecentNotificationIds(['one', 'two', 'one', 'three'], 2)).toEqual(['two', 'three']);
  });
});

describe('realtime messaging cache updates', () => {
  it('appends a broadcast message once and reconciles matching client ids', () => {
    const client = new QueryClient();
    const queryKey = conversationMessagesQueryKey(9);
    client.setQueryData(queryKey, {
      pages: [{ data: [message(1)], meta: { has_more: false, next_before_message_id: null } }],
      pageParams: [undefined],
    });

    mergeRealtimeMessage(client, message(2));
    mergeRealtimeMessage(client, { ...message(20), client_message_id: 'client-2', body: 'Reconciled' });

    const data = client.getQueryData<{ pages: ConversationMessagesPage[] }>(queryKey);
    expect(data?.pages[0].data.map((item) => item.id)).toEqual([1, 20]);
    expect(data?.pages[0].data[1].body).toBe('Reconciled');
  });

  it('applies read receipts only to messages read by the other participant', () => {
    const client = new QueryClient();
    const queryKey = conversationMessagesQueryKey(9);
    client.setQueryData(queryKey, {
      pages: [{
        data: [
          { ...message(1), sender: { ...message(1).sender, id: 1 } },
          { ...message(2), sender: { ...message(2).sender, id: 2 } },
        ],
        meta: { has_more: false, next_before_message_id: null },
      }],
      pageParams: [undefined],
    });

    applyRealtimeReadReceipt(client, 9, 2, 2);

    const data = client.getQueryData<{ pages: ConversationMessagesPage[] }>(queryKey);
    expect(data?.pages[0].data.map((item) => item.delivery_status)).toEqual(['read', 'sent']);
  });
});
