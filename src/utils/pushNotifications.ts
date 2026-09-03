import type {
  DevicePushTokenPayload,
  PushNotificationData,
  StoredPushRegistration,
} from '../types/messaging.types';

const JSON_ENCODED_PUSH_FIELDS = new Set([
  'sender',
  'invited_by',
  'mentioned_by',
  'mentions',
  'hashtags',
]);

const validPositiveInteger = (value: unknown) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isDevicePushTokenPayload = (value: unknown): value is DevicePushTokenPayload => {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.token === 'string'
    && record.token.trim().length > 0
    && (record.platform === 'android' || record.platform === 'ios');
};

type FcmDeviceTokenInput = {
  token: string;
  platform: DevicePushTokenPayload['platform'];
  deviceName?: string | null;
  appVersion?: string | null;
};

export const createFcmDeviceTokenPayload = ({
  token,
  platform,
  deviceName = null,
  appVersion = null,
}: FcmDeviceTokenInput): DevicePushTokenPayload | null => {
  const normalizedToken = token.trim();
  if (!normalizedToken) return null;

  return {
    token: normalizedToken,
    provider: 'fcm',
    platform,
    device_name: deviceName,
    app_version: appVersion,
  };
};

const parseJsonPushValue = (key: string, value: unknown) => {
  if (!JSON_ENCODED_PUSH_FIELDS.has(key) || typeof value !== 'string') return value;

  const normalizedValue = value.trim();
  if (!normalizedValue.startsWith('{') && !normalizedValue.startsWith('[')) return value;

  try {
    return JSON.parse(normalizedValue) as unknown;
  } catch {
    return value;
  }
};

export const normalizePushNotificationData = (value: unknown): PushNotificationData => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, parseJsonPushValue(key, item)]),
  ) as PushNotificationData;
};

export const parseStoredPushRegistration = (raw: string | null): StoredPushRegistration | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;

    if (isDevicePushTokenPayload(record.payload)) {
      return {
        device_id: validPositiveInteger(record.device_id),
        user_id: validPositiveInteger(record.user_id),
        payload: record.payload,
      };
    }

    // Migrate the token-only shape used before the backend registration ID was stored.
    if (isDevicePushTokenPayload(parsed)) {
      return {
        device_id: null,
        user_id: null,
        payload: parsed,
      };
    }
  } catch {
    return null;
  }

  return null;
};

export const pushNotificationIdentity = (
  data: PushNotificationData,
  fallbackIdentifier?: string | null,
) => {
  const explicitId = data.notification_id ?? data.event_id;
  if (typeof explicitId === 'string' && explicitId.trim()) {
    return `event:${explicitId.trim()}`;
  }

  if (fallbackIdentifier?.trim()) return `native:${fallbackIdentifier.trim()}`;

  const type = typeof data.type === 'string' ? data.type.trim() : 'notification';
  const conversationId = data.conversation_id ?? data.conversationId ?? '';
  const messageId = data.message_id ?? '';
  const requestId = data.request_id ?? '';
  const challengeId = data.challenge_id ?? data.challengeId ?? '';
  const videoId = data.video_id ?? '';
  return `payload:${type}:${String(conversationId)}:${String(messageId)}:${String(requestId)}:${String(challengeId)}:${String(videoId)}`;
};

export const retainRecentNotificationIds = (ids: string[], limit = 100) => (
  ids.filter((id, index) => id.length > 0 && ids.indexOf(id) === index).slice(-Math.max(1, limit))
);
