import { useEffect } from 'react';
import { AppState, Platform, TurboModuleRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { pushNotificationsApi } from '../../api/pushNotifications.api';
import { queryClient } from '../../lib/queryClient';
import { useAuthStore } from '../../store/auth.store';
import { useMessagingStore } from '../../store/messaging.store';
import {
  isMessagePushNotification,
  isMessageRequestPushNotification,
} from '../../utils/messaging';
import { conversationRequestsQueryKey } from './useConversations';
import { invalidateConversationLists } from '../../utils/messagingRealtime';
import {
  createFcmDeviceTokenPayload,
  normalizePushNotificationData,
  parseStoredPushRegistration,
  pushNotificationIdentity,
  retainRecentNotificationIds,
} from '../../utils/pushNotifications';
import type {
  DevicePushTokenPayload,
  PushNotificationData,
  StoredPushRegistration,
} from '../../types/messaging.types';

const STORED_PUSH_TOKEN_KEY = 'kulsah_device_push_token';
const PROCESSED_NOTIFICATION_IDS_KEY = 'kulsah_processed_push_notifications';
const MESSAGE_CHANNEL_ID = 'messages';
const MAX_PROCESSED_NOTIFICATION_IDS = 100;
const processedNotificationIds = new Set<string>();
const handledNotificationResponseIds = new Set<string>();
type NativeFirebaseMessagingModule = typeof import('@react-native-firebase/messaging');
let cachedNativeFirebaseMessaging: NativeFirebaseMessagingModule | null | undefined;

export type PushNotificationPermissionState =
  | 'checking'
  | 'granted'
  | 'prompt'
  | 'blocked'
  | 'unsupported';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const canUseNativePushNotifications = () => (
  Platform.OS !== 'web' && (Platform.OS !== 'ios' || Device.isDevice)
);

const ensureMessageChannelAsync = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(MESSAGE_CHANNEL_ID, {
    name: 'Messages',
    description: 'New direct messages and conversation updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 180, 250],
    lightColor: '#38a9e5',
    showBadge: true,
  });
};

const getNativeFirebaseMessaging = (): NativeFirebaseMessagingModule | null => {
  if (cachedNativeFirebaseMessaging !== undefined) return cachedNativeFirebaseMessaging;

  // Importing RNFirebase while its native modules are absent throws before
  // the Expo Notifications fallback can run. Probe them safely first.
  if (
    !TurboModuleRegistry.get('NativeRNFBTurboApp')
    || !TurboModuleRegistry.get('NativeRNFBTurboMessaging')
  ) {
    cachedNativeFirebaseMessaging = null;
    return cachedNativeFirebaseMessaging;
  }

  try {
    const nativeModule = require('@react-native-firebase/messaging') as NativeFirebaseMessagingModule;
    // Accessing the instance verifies that this JavaScript bundle is running
    // inside a client that was rebuilt with the RNFirebase native modules.
    nativeModule.getMessaging();
    cachedNativeFirebaseMessaging = nativeModule;
  } catch {
    cachedNativeFirebaseMessaging = null;
  }

  return cachedNativeFirebaseMessaging;
};

const deviceTokenPayload = (token: string): DevicePushTokenPayload | null => {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;
  return createFcmDeviceTokenPayload({
    token,
    platform: Platform.OS,
    deviceName: Device.deviceName || null,
    appVersion: Constants.expoConfig?.version || null,
  });
};

const registerFcmTokenAsync = async (token: string): Promise<StoredPushRegistration | null> => {
  const payload = deviceTokenPayload(token);
  if (!payload) return null;

  const previousRegistration = parseStoredPushRegistration(
    await AsyncStorage.getItem(STORED_PUSH_TOKEN_KEY),
  );
  const response = await pushNotificationsApi.registerDeviceToken(payload);
  const registration = response.data.data;
  const currentUserId = Number(useAuthStore.getState().user?.id);
  const storedRegistration: StoredPushRegistration = {
    device_id: registration.notification_device_id,
    user_id: Number.isInteger(currentUserId) ? currentUserId : null,
    payload,
  };

  // Only persist a token after the backend has accepted it, so a failed request
  // is retried the next time the app becomes active.
  await AsyncStorage.setItem(STORED_PUSH_TOKEN_KEY, JSON.stringify(storedRegistration));

  if (
    previousRegistration?.device_id
    && previousRegistration.device_id !== storedRegistration.device_id
    && previousRegistration.payload.token !== payload.token
  ) {
    await pushNotificationsApi.revokeDeviceToken(previousRegistration.device_id).catch((error) => {
      console.warn('Previous push-token revocation failed.', error);
    });
  }

  return storedRegistration;
};

const getCurrentFcmTokenAsync = async (): Promise<string | null> => {
  const nativeFirebase = getNativeFirebaseMessaging();
  if (nativeFirebase) {
    const messaging = nativeFirebase.getMessaging();
    if (Platform.OS === 'ios') {
      await nativeFirebase.registerDeviceForRemoteMessages(messaging);
    }
    return nativeFirebase.getToken(messaging);
  }

  // Expo Notifications returns an FCM token on Android, so existing/Expo Go
  // clients can register safely without the RNFirebase native module.
  if (Platform.OS === 'android') {
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' && token.data.trim() ? token.data : null;
  }

  // Expo returns an APNs token on iOS, which must not be mislabeled as FCM.
  return null;
};

const deleteCurrentFcmTokenAsync = async () => {
  const nativeFirebase = getNativeFirebaseMessaging();
  if (!nativeFirebase) return;
  await nativeFirebase.deleteToken(nativeFirebase.getMessaging());
};

const subscribeToFcmTokenRefresh = () => {
  const nativeFirebase = getNativeFirebaseMessaging();
  if (nativeFirebase) {
    return nativeFirebase.onTokenRefresh(nativeFirebase.getMessaging(), (token) => {
      void registerFcmTokenAsync(token).catch((error) => {
        console.warn('Push token refresh registration failed.', error);
      });
    });
  }

  if (Platform.OS === 'android') {
    const subscription = Notifications.addPushTokenListener((token) => {
      if (typeof token.data !== 'string') return;
      void registerFcmTokenAsync(token.data).catch((error) => {
        console.warn('Push token refresh registration failed.', error);
      });
    });
    return () => subscription.remove();
  }

  return () => undefined;
};

export const getPushNotificationPermissionStateAsync = async (
): Promise<PushNotificationPermissionState> => {
  if (!canUseNativePushNotifications()) return 'unsupported';

  await ensureMessageChannelAsync();
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'prompt' : 'blocked';
};

export const syncCurrentPushRegistrationAsync = async () => {
  const permissionState = await getPushNotificationPermissionStateAsync();
  if (permissionState !== 'granted') return null;

  const token = await getCurrentFcmTokenAsync();
  return token ? registerFcmTokenAsync(token) : null;
};

export const requestAndRegisterFcmTokenAsync = async () => {
  const permissionState = await getPushNotificationPermissionStateAsync();
  if (permissionState === 'unsupported' || permissionState === 'blocked') return null;

  if (permissionState === 'prompt') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    if (!requestedPermission.granted) return null;
  }

  const token = await getCurrentFcmTokenAsync();
  return token ? registerFcmTokenAsync(token) : null;
};

export const unregisterCurrentPushTokenAsync = async () => {
  const stored = parseStoredPushRegistration(
    await AsyncStorage.getItem(STORED_PUSH_TOKEN_KEY),
  );
  let revocationError: unknown;

  if (stored?.device_id) {
    try {
      await pushNotificationsApi.revokeDeviceToken(stored.device_id);
    } catch (error) {
      revocationError = error;
    }
  }

  // Invalidate the native token even when backend revocation is temporarily
  // unavailable. The server-side token then becomes stale and can be pruned.
  if (Platform.OS !== 'web') {
    await deleteCurrentFcmTokenAsync().catch(() => undefined);
    await Notifications.unregisterForNotificationsAsync().catch(() => undefined);
    await Notifications.setBadgeCountAsync(0).catch(() => undefined);
  }

  processedNotificationIds.clear();
  handledNotificationResponseIds.clear();
  await AsyncStorage.multiRemove([
    STORED_PUSH_TOKEN_KEY,
    PROCESSED_NOTIFICATION_IDS_KEY,
  ]);

  if (revocationError) throw revocationError;
};

const notificationData = (notification: Notifications.Notification): PushNotificationData =>
  normalizePushNotificationData(notification.request.content.data);

const markNotificationProcessedAsync = async (
  data: PushNotificationData,
  nativeIdentifier?: string | null,
) => {
  const identifier = pushNotificationIdentity(data, nativeIdentifier);
  if (processedNotificationIds.has(identifier)) return false;

  // Mark synchronously before reading storage to prevent foreground and tap
  // listeners from racing each other for the same delivery.
  processedNotificationIds.add(identifier);

  try {
    const rawIds = await AsyncStorage.getItem(PROCESSED_NOTIFICATION_IDS_KEY);
    const storedIds = rawIds ? JSON.parse(rawIds) as unknown : [];
    const recentIds = Array.isArray(storedIds)
      ? storedIds.filter((id): id is string => typeof id === 'string')
      : [];
    if (recentIds.includes(identifier)) return false;

    const retainedIds = retainRecentNotificationIds(
      [...recentIds, identifier],
      MAX_PROCESSED_NOTIFICATION_IDS,
    );
    await AsyncStorage.setItem(PROCESSED_NOTIFICATION_IDS_KEY, JSON.stringify(retainedIds));

    while (processedNotificationIds.size > MAX_PROCESSED_NOTIFICATION_IDS) {
      const oldestIdentifier = processedNotificationIds.values().next().value;
      if (!oldestIdentifier) break;
      processedNotificationIds.delete(oldestIdentifier);
    }
  } catch {
    // In-memory deduplication still protects the active process if persistence
    // is unavailable.
  }

  return true;
};

const recordNotification = async (notification: Notifications.Notification) => {
  const data = notificationData(notification);
  const shouldProcess = await markNotificationProcessedAsync(
    data,
    notification.request.identifier,
  );
  if (!shouldProcess) return;

  if (isMessagePushNotification(data)) {
    await invalidateConversationLists(queryClient).catch(() => undefined);
    useMessagingStore.getState().recordIncomingMessage(data);
  } else if (isMessageRequestPushNotification(data)) {
    await Promise.allSettled([
      queryClient.invalidateQueries({ queryKey: conversationRequestsQueryKey }),
      invalidateConversationLists(queryClient),
    ]);
  }

  await Notifications.setBadgeCountAsync(
    useMessagingStore.getState().unreadCount,
  ).catch(() => undefined);
};

const handleNotificationResponseAsync = async (
  response: Notifications.NotificationResponse,
  onNotificationPress: (data: PushNotificationData) => void,
) => {
  const data = notificationData(response.notification);
  const identifier = pushNotificationIdentity(data, response.notification.request.identifier);
  if (handledNotificationResponseIds.has(identifier)) return;

  // Claim the response before awaiting cache work because the response listener
  // and cold-start lookup can both surface the same tap.
  handledNotificationResponseIds.add(identifier);
  while (handledNotificationResponseIds.size > MAX_PROCESSED_NOTIFICATION_IDS) {
    const oldestIdentifier = handledNotificationResponseIds.values().next().value;
    if (!oldestIdentifier) break;
    handledNotificationResponseIds.delete(oldestIdentifier);
  }

  await recordNotification(response.notification);
  onNotificationPress(data);
};

type UseFcmMessagingOptions = {
  enabled: boolean;
  onNotificationPress: (data: PushNotificationData) => void;
};

export const useFcmMessaging = ({ enabled, onNotificationPress }: UseFcmMessagingOptions) => {
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (!enabled) return;

    // Refresh an already-authorized registration without prompting at login.
    // The contextual Inbox prompt owns the first permission request.
    void syncCurrentPushRegistrationAsync().catch((error) => {
      console.warn('Push token registration failed.', error);
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void syncCurrentPushRegistrationAsync().catch((error) => {
        console.warn('Push token registration refresh failed.', error);
      });
    });
    const unsubscribeFromTokenRefresh = subscribeToFcmTokenRefresh();
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      void recordNotification(notification);
    });
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void handleNotificationResponseAsync(response, onNotificationPress).catch((error) => {
        console.warn('Push notification response handling failed.', error);
      });
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      void handleNotificationResponseAsync(response, onNotificationPress)
        .catch((error) => console.warn('Initial push notification handling failed.', error))
        .finally(() => Notifications.clearLastNotificationResponseAsync());
    }).catch((error) => {
      console.warn('Could not read the initial push notification response.', error);
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeFromTokenRefresh();
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [enabled, onNotificationPress, userId]);
};
