import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications.api';

export const notificationsQueryKey = ['notifications'] as const;

export const useNotifications = () => useQuery({
  queryKey: notificationsQueryKey,
  queryFn: () => notificationsApi.list().then((response) => response.data),
});

export const useMarkNotificationRead = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (notification: string) => notificationsApi.markRead(notification),
    onSuccess: () => client.invalidateQueries({ queryKey: notificationsQueryKey }),
  });
};
