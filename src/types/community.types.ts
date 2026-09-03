import type { PaginationMeta } from './general.types';
import type { KulCoinTransaction } from './kulcoin.types';
import type { Sticker } from './sticker.types';

export type CommunityPostType = 'text' | 'image' | 'video' | 'poll' | 'challenge' | 'live';
export type CommunityAudience = 'public' | 'subscribers';

export type CommunityAuthor = {
  id: string | number;
  name: string;
  handle: string;
  avatar_url: string | null;
  role?: 'creator' | 'fan';
  is_verified: boolean;
  is_following?: boolean;
};

export type CommunityMedia = {
  id: string | number;
  type: 'image' | 'video';
  url: string;
  streaming_url?: string | null;
  thumbnail_url?: string | null;
  width?: number | null;
  height?: number | null;
  duration_seconds?: number | null;
};

export type CommunityPollOption = {
  id: string | number;
  text: string;
  votes_count: number;
  percentage?: number;
  is_selected: boolean;
};

export type CommunityPost = {
  id: string | number;
  type: CommunityPostType;
  content: string | null;
  audience: CommunityAudience;
  status: string;
  author: CommunityAuthor;
  media: CommunityMedia[];
  poll: {
    question?: string | null;
    options: CommunityPollOption[];
    total_votes: number;
    has_voted: boolean;
    selected_option_id: string | number | null;
    closes_at: string | null;
    allow_multiple?: boolean;
    show_results_after_voting?: boolean;
  } | null;
  live?: {
    session_id: string | number;
    status: string;
    playback_url?: string | null;
    viewer_count?: number;
    started_at?: string | null;
  } | null;
  community_count: number;
  stats: {
    likes_count: number;
    comments_count: number;
    shares_count: number;
    gifts_count: number;
    views_count: number;
  };
  viewer: {
    is_liked: boolean;
    is_shared: boolean;
    is_following: boolean;
    can_view: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
  };
  comments?: CommunityComment[];
  created_at: string;
  updated_at: string;
};

export type CommunityComment = {
  id: string | number;
  post_id: string | number;
  parent_id: string | number | null;
  content: string;
  /** Backward-compatible alias returned by older API versions. */
  body?: string;
  sticker_id?: number | null;
  sticker_url?: string | null;
  sticker?: Sticker | null;
  author: CommunityAuthor;
  stats: {
    likes_count: number;
    replies_count: number;
  };
  viewer: {
    is_liked: boolean;
    can_edit: boolean;
    can_delete: boolean;
  };
  replies?: CommunityComment[];
  created_at: string;
  updated_at?: string;
};

export type CommunityPage<T> = {
  data: T[];
  meta?: PaginationMeta | { pagination?: PaginationMeta; [key: string]: unknown };
  links?: { next?: string | null; prev?: string | null; [key: string]: unknown };
};

export type CommunityItemResponse<T> = { data: T; message?: string };

export type CommunityMediaSource = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export type CreateCommunityPostPayload = {
  type: Exclude<CommunityPostType, 'live'>;
  audience: CommunityAudience;
  content?: string;
  media?: CommunityMediaSource[];
  poll?: {
    question?: string;
    options: string[];
    closes_at?: string | null;
    allow_multiple?: boolean;
    show_results_after_voting?: boolean;
  };
};

export type CreateCommunityCommentPayload = {
  body?: string;
  sticker_id?: number;
  parent_id?: string | number;
};

export type CommunityGiftPayload = {
  gift_id: string | number;
  quantity?: number;
  message?: string;
  idempotency_key?: string;
  device_info?: Record<string, unknown>;
};

export type CommunityGiftResponse = {
  message: string;
  data: {
    post: CommunityPost;
    gift: {
      id: string | number;
      gift_id: string | number;
      quantity: number;
      coin_amount: number;
      message?: string | null;
      transaction: KulCoinTransaction;
    };
  };
};
