import api from './client';
import { endpoints } from './endpoints';
import type { AppNotification, NotificationsResponse } from '../types/notification.types';

export const notificationsApi = {
  list: (page = 1, perPage = 30) => api.get<NotificationsResponse>(endpoints.general.notifications, {
    params: { page, per_page: perPage },
  }),
  markRead: (notification: string) => api.patch<{ data: AppNotification }>(endpoints.general.notificationRead(notification)),
};
