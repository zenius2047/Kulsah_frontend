import api from './client';
import { endpoints } from './endpoints';
import type {
  DevicePushTokenPayload,
  NotificationDeviceRegistration,
} from '../types/messaging.types';

type NotificationDeviceResponse = {
  message: string;
  data: NotificationDeviceRegistration;
};

export const pushNotificationsApi = {
  registerDeviceToken: (payload: DevicePushTokenPayload) =>
    api.post<NotificationDeviceResponse>(endpoints.auth.notificationDevices, payload),
  revokeDeviceToken: (device: string | number) =>
    api.delete(endpoints.auth.notificationDevice(device)),
};
