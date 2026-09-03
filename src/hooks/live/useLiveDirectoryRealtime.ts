import { useEffect } from 'react';
import { queryClient } from '../../lib/queryClient';
import {
  getMessagingRealtimeClient,
  isMessagingRealtimeConfigured,
} from '../../services/messagingRealtime.service';
import { useAuthStore } from '../../store/auth.store';
import type { LiveDirectoryUpdatedEvent } from '../../types/live.types';
import { liveQueryKeys, patchCachedLiveSession } from './useLive';

const LIVE_DIRECTORY_EVENTS = ['status', 'ended'] as const;

export const useLiveDirectoryRealtime = (enabled = true) => {
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!enabled || !token || !isMessagingRealtimeConfigured) return;
    const realtime = getMessagingRealtimeClient(token);
    if (!realtime) return;

    const handleUpdate = (event: LiveDirectoryUpdatedEvent) => {
      if (!event?.live_id) return;

      patchCachedLiveSession(queryClient, event.live_id, {
        title: event.title,
        status: event.status,
        category: event.category,
        cover_url: event.cover_url,
        visibility: event.visibility,
        current_viewers: Number(event.current_viewers) || 0,
        likes_count: Number(event.likes_count) || 0,
        comments_count: Number(event.comments_count) || 0,
        gifts_count: Number(event.gifts_count) || 0,
      });
      void queryClient.invalidateQueries({ queryKey: liveQueryKeys.discovery() });
    };

    const channelName = 'lives';
    const channel = realtime.channel(channelName);
    LIVE_DIRECTORY_EVENTS.forEach((event) => channel.listen(`.live.directory.${event}`, handleUpdate));

    return () => realtime.leave(channelName);
  }, [enabled, token]);
};
