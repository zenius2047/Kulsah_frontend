import { useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { queryClient } from '../../lib/queryClient';
import {
  getMessagingRealtimeClient,
  isMessagingRealtimeConfigured,
} from '../../services/messagingRealtime.service';
import type { LiveUpdatedEvent } from '../../types/live.types';
import { isLiveTerminal } from '../../utils/live';
import { liveQueryKeys, patchCachedLiveSession } from './useLive';

const LIVE_EVENTS = [
  'status',
  'ended',
  'chat_created',
  'like_count',
  'gift_created',
  'moderation_applied',
  'cohost_accepted',
  'cohost_removed',
  'battle_start',
  'battle_score',
  'battle_end',
] as const;

export const useLiveRealtime = (liveSession?: string | number, enabled = true) => {
  const token = useAuthStore((state) => state.token);
  const liveId = liveSession == null ? '' : String(liveSession);

  useEffect(() => {
    if (!enabled || !token || !liveId || !isMessagingRealtimeConfigured) return;
    const realtime = getMessagingRealtimeClient(token);
    if (!realtime) return;

    const handleUpdate = (event: LiveUpdatedEvent) => {
      if (!event || String(event.live_id) !== liveId) return;
      patchCachedLiveSession(queryClient, liveId, {
        status: event.status,
        current_viewers: Number(event.current_viewers) || 0,
        unique_viewers: Number(event.unique_viewers) || 0,
        peak_viewers: Number(event.peak_viewers) || 0,
        likes_count: Number(event.likes_count) || 0,
        comments_count: Number(event.comments_count) || 0,
        gifts_count: Number(event.gifts_count) || 0,
        termination_reason: event.termination_reason ?? null,
      });
      if (isLiveTerminal(event.status)) {
        void queryClient.invalidateQueries({ queryKey: liveQueryKeys.discovery() });
      }
    };

    const channelName = `lives.${liveId}`;
    const channel = realtime.private(channelName);
    LIVE_EVENTS.forEach((event) => channel.listen(`.live.${event}`, handleUpdate));

    return () => realtime.leave(channelName);
  }, [enabled, liveId, token]);
};
