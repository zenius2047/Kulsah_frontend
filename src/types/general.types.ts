import type { AvatarUploadSource, Gender, User } from './user.types';

export type PaginationMeta = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  page?: number;
  limit?: number;
  has_more?: boolean;
  next_page?: number | null;
};

export type GeneralFeedParams = {
  limit?: number;
  page?: number;
};

export type GeneralFeedCard = {
  id: string | number;
  creator?: unknown;
  creator_id?: string | number;
  creatorId?: string | number;
  user_id?: string | number;
  userId?: string | number;
  handle?: string;
  avatar?: string;
  caption?: string;
  contentType?: string;
  contentTypes?: string[];
  hashtags?: string[];
  mentions?: string[];
  background?: string;
  video?: string;
  likes?: number | string;
  comments?: number | string;
  views?: number | string;
  isLiked?: boolean;
  isSubscribed?: boolean;
  isPremium?: boolean;
  ticketsAvailable?: boolean;
  ticketLocation?: string;
  originalSound?: boolean;
  soundArtist?: string;
  soundTitle?: string;
  following?: boolean;
  bookmarks?: number | string;
  saves?: number | string;
  [key: string]: unknown;
};

export type GeneralFeedResponse = {
  data: GeneralFeedCard[];
  meta?: {
    cache_hit?: boolean;
    cache_key?: string;
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
};

export type GeneralVideo = {
  id: string | number;
  user_id?: string | number;
  title?: string | null;
  caption?: string | null;
  visibility?: string;
  content_type?: string | null;
  content_types?: string[];
  is_premium?: boolean;
  cdn_url?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  status?: string;
  progress_percentage?: number;
  views_count?: number;
  hashtags?: string[];
  mentions?: string[];
  metadata?: Record<string, unknown>;
  created_at?: string;
  [key: string]: unknown;
};

export type GeneralVideoResponse = {
  data: GeneralVideo;
  message?: string;
};

export type WatchedVideoListItem = {
  id: string;
  title: string;
  views: string;
  duration: string;
  img: string | null;
  watched_at?: string | null;
};

export type WatchedVideosParams = {
  per_page?: number;
  page?: number;
};

export type WatchedVideosResponse = {
  data: {
    videos: WatchedVideoListItem[];
  };
  meta?: PaginationMeta;
};

export type VideoActionState = {
  video_id: string | number;
  user_id: string | number;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  isLiked: boolean;
  isBookmarked: boolean;
};

export type VideoActionResponse = {
  message?: string;
  data: VideoActionState;
};

export type AddCommentPayload = {
  body: string;
};

export type GeneralCommentsParams = {
  per_page?: number;
  page?: number;
};

export type GeneralCommentReplyPreview = {
  handle: string;
  avatar: string | null;
  text: string;
  time: string;
};

export type GeneralComment = {
  id: string | number;
  handle: string;
  avatar: string | null;
  text: string;
  stickerUrl?: string | null;
  gift?: unknown | null;
  time: string;
  likes: number;
  verified?: boolean;
  reply?: GeneralCommentReplyPreview | null;
  video_id?: string | number;
  parent_id?: string | number | null;
  body?: string;
  user?: User | Record<string, unknown>;
  created_at?: string;
};

export type GeneralCommentsResponse = {
  data: GeneralComment[];
  meta?: PaginationMeta | {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
  links?: {
    next?: string | null;
    prev?: string | null;
    [key: string]: unknown;
  };
};

export type GeneralCommentResponse = {
  message?: string;
  data: GeneralComment;
};

export type GeneralCommentLikeResponse = {
  message?: string;
  data: GeneralComment | (Partial<GeneralComment> & Pick<GeneralComment, 'id' | 'likes'>);
};

export type FollowCreatorResponse = {
  message?: string;
  data: {
    creator_id: string | number;
    follower_id: string | number;
    following?: boolean;
    is_following?: boolean;
  };
};

export type UploadAvatarPayload = AvatarUploadSource | FormData | null | undefined;
export type UploadBannerPayload = AvatarUploadSource | FormData | null | undefined;

export type UploadAvatarResponse = {
  message?: string;
  user: Pick<User, 'id' | 'avatar'> & Partial<User>;
};

export type UploadBannerResponse = {
  message?: string;
  user: Pick<User, 'id' | 'banner'> & Partial<User>;
};

export type UpdateGeneralProfilePayload = {
  name?: string;
  username?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  location?: string | null;
  country_code?: string | null;
};

export type UpdateGeneralProfileResponse = {
  message?: string;
  user: User;
};

export type WalletBalance = {
  available_usd: number | string;
  pending_usd: number | string;
  held_usd: number | string;
  total_usd: number | string;
};

export type Wallet = {
  id: string | number;
  user_id: string | number;
  account_key?: string;
  account_name?: string;
  base_currency?: string;
  status?: string;
  balances?: WalletBalance;
  user?: User | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type WalletResponse = {
  data: Wallet;
};

export type WalletTransaction = {
  id: string | number;
  amount_usd?: number | string;
  type?: string;
  status?: string;
  description?: string | null;
  created_at?: string;
  [key: string]: unknown;
};

export type PaginatedWalletResponse<T> = {
  data: T[];
  meta?: PaginationMeta;
};

export type WalletLedgerEntry = WalletTransaction;

export type WalletTransferPayload = {
  recipient_id: number;
  amount_usd: number;
  description?: string;
};

export type WalletTopUpPayload = {
  amount_usd: number;
  description?: string;
  payment_reference?: string;
};

export type WalletMutationResponse = {
  message?: string;
  data: WalletTransaction;
};
