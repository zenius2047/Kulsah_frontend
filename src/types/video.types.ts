export type VideoVisibility = 'public' | 'premium';
export type VideoDisplayOrientation = 'portrait' | 'landscape';
export type VideoContentType = 'music' | 'dance' | 'comedy' | 'tutorial' | 'lifestyle' | 'behind_the_scenes';

export type VideoUploadSource = {
  uri: string;
  name?: string;
  type?: string;
  orientation?: VideoDisplayOrientation;
};

export type UploadCreatorVideoPayload = {
  video: VideoUploadSource | FormData;
  title?: string | null;
  caption?: string | null;
  contentType?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
  orientation?: VideoDisplayOrientation;
};

export type CreateCreatorVideoDraftPayload = {
  title?: string | null;
  caption?: string | null;
  content_type?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
};

export type UploadCreatorVideoToDraftPayload = {
  video: VideoUploadSource | FormData;
};

export type UpdateCreatorVideoProgressPayload = {
  progress_percentage: number;
};

export type UpdateCreatorVideoPayload = {
  title?: string | null;
  caption?: string | null;
  content_type?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
};

export type CreatorVideo = {
  id: string | number;
  title?: string | null;
  caption?: string | null;
  visibility: VideoVisibility;
  content_type?: string | null;
  content_types?: string[];
  is_premium?: boolean;
  cdn_url?: string | null;
  stream_url?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  status?: string | null;
  progress_percentage?: number | null;
  views_count?: number;
  hashtags?: string[];
  mentions?: string[];
};

export type UploadCreatorVideoResponse = {
  message: string;
  data: CreatorVideo;
};

export type CreatorVideoProgress = {
  video_id: string | number;
  status: string;
  progress_percentage: number;
};

export type CreatorVideoProgressResponse = {
  data: CreatorVideoProgress;
};

export type CreatorVideoListItem = {
  id: string;
  title: string;
  views: string;
  date: string;
  duration: string;
  category: string;
  img: string;
  likes: string;
  premium: boolean;
  draft: boolean;
};

export type CreatorVideosParams = {
  per_page?: number;
  category?: string;
  draft?: boolean;
  premium?: boolean;
};

export type CreatorVideosResponse = {
  data: CreatorVideoListItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CreatorVideoAnalytics = {
  total_videos: number;
  ready_videos: number;
  draft_videos: number;
  premium_videos: number;
  public_videos: number;
  processing_videos: number;
  failed_videos: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_duration_seconds: number;
  average_views: number;
  total_duration: string;
};

export type CreatorVideoAnalyticsResponse = {
  data: CreatorVideoAnalytics;
};

export type CreatorVideoDetailItem = {
  id: string;
  creator: string;
  creator_id: string;
  handle: string;
  avatar: string;
  caption: string;
  background: string;
  video: string;
  likes: string;
  comments_count: string;
  comments: unknown[];
  otherVideos: unknown[];
};

export type CreatorVideoDetailResponse = {
  item: CreatorVideoDetailItem;
};

export type FeedVideosParams = {
  limit?: number;
  page?: number;
};
