export type LiveVisibility = 'public' | 'fans' | 'subscribers';

export type LiveCategory = 'music' | 'gaming' | 'talk_show' | 'lifestyle' | 'education';

export type LiveStreamQuality = '720p_30fps' | '1080p_30fps' | '1080p_60fps';

export type LiveOrientation = 'portrait' | 'landscape' | 'auto_rotate';

export interface LiveModerationSettings {
  profanity_filter_enabled: boolean;
  followers_only_chat: boolean;
  slow_mode_seconds: number | null;
  blocked_words: string[];
}

export type LiveStatus =
  | 'scheduled'
  | 'created'
  | 'starting'
  | 'live'
  | 'reconnecting'
  | 'ending'
  | 'ended'
  | 'terminated'
  | 'cancelled'
  | 'failed';

export type LiveProviderRole = 'broadcaster' | 'audience';

export interface LiveCreator {
  id: number | string;
  name: string;
  handle?: string | null;
  username?: string | null;
  avatar?: string | null;
  banner?: string | null;
  verified?: boolean;
  is_following?: boolean;
}

export interface LiveSession {
  id: string;
  creator: LiveCreator;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  visibility: LiveVisibility;
  status: LiveStatus;
  provider?: string | null;
  provider_channel?: string | null;
  join_endpoint?: string | null;
  preview_endpoint?: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  chat_enabled: boolean;
  gifts_enabled: boolean;
  recording_enabled: boolean;
  notify_followers: boolean;
  age_restricted: boolean;
  stream_quality: LiveStreamQuality;
  orientation: LiveOrientation;
  moderation: LiveModerationSettings;
  current_viewers: number;
  unique_viewers: number;
  peak_viewers: number;
  average_viewers: number;
  watch_seconds_total: number;
  likes_count: number;
  comments_count: number;
  gifts_count: number;
  gift_value_kc: number;
  earnings_kc: number;
  termination_reason: string | null;
  recording_state: string | null;
  replay_state: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface LiveCredentials {
  provider: 'agora';
  app_id: string;
  channel: string;
  uid: number;
  token: string;
  expires_at: string;
  role: LiveProviderRole;
}

export interface LivePage {
  data: LiveSession[];
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
}

export interface LiveSessionResponse {
  data: LiveSession;
}

export interface LiveCredentialsResponse extends LiveSessionResponse {
  credentials: LiveCredentials;
  watch_session_id?: number;
}

export interface CreateLivePayload {
  title: string;
  description?: string | null;
  category: LiveCategory;
  cover_url?: string | null;
  visibility: Exclude<LiveVisibility, 'fans'>;
  scheduled_at?: string | null;
  notify_followers: boolean;
  chat_enabled: boolean;
  gifts_enabled: boolean;
  recording_enabled: boolean;
  age_restricted: boolean;
  stream_quality: LiveStreamQuality;
  orientation: LiveOrientation;
  moderation: LiveModerationSettings;
}

export interface LiveHeartbeatPayload {
  broadcast_state?: string | null;
  network_quality?: number | null;
  bitrate?: number | null;
  packet_loss?: number | null;
  fps?: number | null;
  resolution?: string | null;
  audio_state?: string | null;
  video_state?: string | null;
}

export interface LiveCommentUser {
  id: number;
  name?: string;
  username?: string;
  avatar?: string | null;
}

export interface LiveComment {
  id: number;
  live_session_id?: number;
  user_id: number;
  body: string;
  user?: LiveCommentUser;
  created_at: string | null;
  updated_at?: string | null;
}

export interface LiveLikeResult {
  live_id: string;
  likes_count: number;
}

export interface SendLiveGiftPayload {
  gift_id: number;
  quantity?: number;
  idempotency_key: string;
  message?: string | null;
}

export interface LiveModerationPayload {
  target_id: number;
  action: 'mute' | 'unmute' | 'remove' | 'ban_from_live' | 'unban_from_live' | 'terminate_live';
  reason?: string | null;
  duration_seconds?: number | null;
}

export interface LiveAnalytics {
  id: number;
  live_session_id: number;
  unique_viewers: number;
  peak_viewers: number;
  average_viewers: number;
  watch_seconds: number;
  comments_count: number;
  likes_count: number;
  gifts_count: number;
  gross_gift_value_kc: number;
  creator_earnings_kc: number;
  platform_revenue_kc: number;
  new_fans_count: number;
  new_subscribers_count: number;
  cohost_requests_count: number;
  successful_cohosts_count: number;
  reports_count: number;
  mutes_count: number;
  removals_count: number;
  disconnects_count: number;
  reconnects_count: number;
  calculated_at: string | null;
}

export interface LiveUpdatedEvent {
  live_id: string;
  status: LiveStatus;
  title: string;
  creator_id: number;
  current_viewers: number;
  unique_viewers: number;
  peak_viewers: number;
  likes_count: number;
  comments_count: number;
  gifts_count: number;
  gift_value_kc: number;
  termination_reason: string | null;
  comment?: LiveRealtimeComment;
  gift?: LiveRealtimeGift;
}

export interface LiveRealtimeComment {
  id: number;
  user_id: number;
  body: string;
  user?: LiveCommentUser;
  created_at: string | null;
}

export interface LiveRealtimeGift {
  transaction_id: number;
  reference: string;
  gift_id: number;
  gift_name: string;
  quantity: number;
  coin_amount: number;
  sender_id: number;
}

export interface LiveDirectoryUpdatedEvent {
  live_id: string;
  creator_id: number;
  title: string;
  status: LiveStatus;
  category: string | null;
  cover_url: string | null;
  visibility: LiveVisibility;
  current_viewers: number;
  likes_count: number;
  comments_count: number;
  gifts_count: number;
}

export type LiveCohostRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'expired'
  | 'active'
  | 'removed';

export interface LiveCohostRequest {
  id: number;
  live_session_id: number;
  requester_id: number;
  invitee_id: number;
  requested_by_id: number;
  status: LiveCohostRequestStatus;
  message: string | null;
  expires_at: string | null;
  responded_at: string | null;
}

export interface LiveCohostAcceptance {
  cohost: Record<string, unknown>;
  credentials: LiveCredentials;
}

export type LiveBattleStatus = 'pending' | 'accepted' | 'active' | 'ended' | 'cancelled' | 'expired' | 'failed';

export interface LiveBattle {
  id: number;
  public_id: string;
  creator_live_session_id: number;
  opponent_live_session_id: number;
  creator_id: number;
  opponent_id: number;
  status: LiveBattleStatus;
  creator_score: number;
  opponent_score: number;
  winner_user_id: number | null;
  accepted_at: string | null;
  started_at: string | null;
  ended_at: string | null;
}
