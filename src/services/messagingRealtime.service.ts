import { API_BASE_URL } from '../api/endpoints';

type RealtimeConnection = {
  state?: string;
  bind: (event: string, callback: CallableFunction) => unknown;
  unbind: (event: string, callback?: CallableFunction) => unknown;
};

type RealtimePusherChannel = {
  name: string;
  bind: (event: string, callback: CallableFunction) => unknown;
};

type RealtimePusherClient = {
  connection: RealtimeConnection;
  subscribe: (channel: string) => RealtimePusherChannel;
  unsubscribe: (channel: string) => void;
  allChannels: () => RealtimePusherChannel[];
  disconnect: () => void;
};

type RealtimePusherConstructor = new (
  key: string,
  options: Record<string, unknown>,
) => RealtimePusherClient;

type PusherPackageShape = {
  Pusher?: unknown;
  default?: unknown;
};

type PresenceMemberRecord = Record<string, unknown>;

const asPresenceRecord = (value: unknown): PresenceMemberRecord => (
  value !== null && typeof value === 'object' ? value as PresenceMemberRecord : {}
);

export const normalizePresenceMember = (
  value: unknown,
  fallbackId?: string | number,
): PresenceMemberRecord => {
  const member = asPresenceRecord(value);
  const info = member.info !== null && typeof member.info === 'object'
    ? asPresenceRecord(member.info)
    : member;
  const id = info.id ?? info.user_id ?? member.id ?? member.user_id ?? fallbackId;

  return {
    ...info,
    ...(id === undefined ? {} : { id }),
  };
};

export const normalizePresenceMembers = (value: unknown): PresenceMemberRecord[] => {
  if (Array.isArray(value)) return value.map((member) => normalizePresenceMember(member));

  const payload = asPresenceRecord(value);
  const memberMap = asPresenceRecord(payload.members);
  return Object.entries(memberMap).map(([id, member]) => normalizePresenceMember(member, id));
};

export const resolvePusherConstructor = (moduleValue: unknown): RealtimePusherConstructor | null => {
  const packageShape = moduleValue && typeof moduleValue === 'object'
    ? moduleValue as PusherPackageShape
    : null;
  const defaultShape = packageShape?.default && typeof packageShape.default === 'object'
    ? packageShape.default as PusherPackageShape
    : null;
  const candidates = [
    packageShape?.Pusher,
    defaultShape?.Pusher,
    packageShape?.default,
    moduleValue,
  ];
  const constructor = candidates.find((candidate) => typeof candidate === 'function');

  return constructor ? constructor as RealtimePusherConstructor : null;
};

const normalizedEventName = (event: string) => event.startsWith('.') ? event.slice(1) : event;

class MessagingPrivateChannel {
  constructor(protected readonly channel: RealtimePusherChannel) {}

  listen(event: string, callback: CallableFunction) {
    this.channel.bind(normalizedEventName(event), callback);
    return this;
  }
}

class MessagingPresenceChannel extends MessagingPrivateChannel {
  here(callback: CallableFunction) {
    this.channel.bind('pusher:subscription_succeeded', (members: unknown) => {
      callback(normalizePresenceMembers(members));
    });
    return this;
  }

  joining(callback: CallableFunction) {
    this.channel.bind('pusher:member_added', (member: unknown) => {
      callback(normalizePresenceMember(member));
    });
    return this;
  }

  leaving(callback: CallableFunction) {
    this.channel.bind('pusher:member_removed', (member: unknown) => {
      callback(normalizePresenceMember(member));
    });
    return this;
  }

  error(callback: CallableFunction) {
    this.channel.bind('pusher:subscription_error', callback);
    return this;
  }
}

export type MessagingRealtimeClient = {
  connector: { pusher: RealtimePusherClient };
  channel: (channel: string) => MessagingPrivateChannel;
  private: (channel: string) => MessagingPrivateChannel;
  join: (channel: string) => MessagingPresenceChannel;
  leave: (channel: string) => void;
  leaveAllChannels: () => void;
  disconnect: () => void;
};

const parseApiUrl = () => {
  try {
    return new URL(API_BASE_URL);
  } catch {
    return null;
  }
};

const apiUrl = parseApiUrl();
const DEFAULT_REVERB_APP_KEY = 'local';
const configuredScheme = process.env.EXPO_PUBLIC_REVERB_SCHEME?.trim().toLowerCase();
const scheme = configuredScheme === 'http' || configuredScheme === 'https'
  ? configuredScheme
  : apiUrl?.protocol === 'http:' ? 'http' : 'https';
const configuredPort = Number(process.env.EXPO_PUBLIC_REVERB_PORT);

export const messagingRealtimeConfig = {
  key: process.env.EXPO_PUBLIC_REVERB_APP_KEY?.trim() || DEFAULT_REVERB_APP_KEY,
  host: process.env.EXPO_PUBLIC_REVERB_HOST?.trim() || apiUrl?.hostname || '',
  port: Number.isInteger(configuredPort) && configuredPort > 0
    ? configuredPort
    : scheme === 'https' ? 443 : 80,
  scheme,
  authEndpoint: process.env.EXPO_PUBLIC_REVERB_AUTH_ENDPOINT?.trim()
    || (apiUrl ? `${apiUrl.origin}/broadcasting/auth` : ''),
  path: process.env.EXPO_PUBLIC_REVERB_PATH?.trim() || '',
} as const;

export const isMessagingRealtimeConfigured = Boolean(
  messagingRealtimeConfig.key
  && messagingRealtimeConfig.host
  && messagingRealtimeConfig.authEndpoint,
);

const createMessagingRealtimeClient = (
  PusherConstructor: RealtimePusherConstructor,
  token: string,
): MessagingRealtimeClient => {
  const pusher = new PusherConstructor(messagingRealtimeConfig.key, {
    cluster: '',
    wsHost: messagingRealtimeConfig.host,
    wsPort: messagingRealtimeConfig.port,
    wssPort: messagingRealtimeConfig.port,
    forceTLS: messagingRealtimeConfig.scheme === 'https',
    enabledTransports: ['ws', 'wss'],
    enableStats: false,
    channelAuthorization: {
      transport: 'ajax',
      endpoint: messagingRealtimeConfig.authEndpoint,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    ...(messagingRealtimeConfig.path ? { wsPath: messagingRealtimeConfig.path } : {}),
  });

  return {
    connector: { pusher },
    channel: (channel) => new MessagingPrivateChannel(pusher.subscribe(channel)),
    private: (channel) => new MessagingPrivateChannel(pusher.subscribe(`private-${channel}`)),
    join: (channel) => new MessagingPresenceChannel(pusher.subscribe(`presence-${channel}`)),
    leave: (channel) => {
      [channel, `private-${channel}`, `private-encrypted-${channel}`, `presence-${channel}`]
        .forEach((candidate) => pusher.unsubscribe(candidate));
    },
    leaveAllChannels: () => {
      pusher.allChannels().forEach((channel) => pusher.unsubscribe(channel.name));
    },
    disconnect: () => pusher.disconnect(),
  };
};

let realtimeClient: MessagingRealtimeClient | null = null;
let realtimeToken: string | null = null;
let hasWarnedAboutRealtimeInitialization = false;

export const getMessagingRealtimeClient = (token: string): MessagingRealtimeClient | null => {
  if (!isMessagingRealtimeConfigured || !token) return null;
  if (realtimeClient && realtimeToken === token) return realtimeClient;

  realtimeClient?.disconnect();
  try {
    const pusherPackage = require('pusher-js') as unknown;
    const PusherConstructor = resolvePusherConstructor(pusherPackage);
    if (!PusherConstructor) throw new TypeError('The React Native Pusher constructor could not be resolved.');

    realtimeToken = token;
    realtimeClient = createMessagingRealtimeClient(PusherConstructor, token);
  } catch (error) {
    realtimeClient = null;
    realtimeToken = null;
    if (!hasWarnedAboutRealtimeInitialization) {
      hasWarnedAboutRealtimeInitialization = true;
      console.warn(
        'Realtime messaging could not be initialized.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  return realtimeClient;
};

export const disconnectMessagingRealtime = () => {
  realtimeClient?.leaveAllChannels();
  realtimeClient?.disconnect();
  realtimeClient = null;
  realtimeToken = null;
};

const processedEventIds = new Set<string>();

export const acceptRealtimeEvent = (eventId?: string | null) => {
  if (!eventId) return true;
  if (processedEventIds.has(eventId)) return false;

  if (processedEventIds.size >= 500) {
    const oldestEventId = processedEventIds.values().next().value;
    if (oldestEventId) processedEventIds.delete(oldestEventId);
  }
  processedEventIds.add(eventId);
  return true;
};
