export type VideoVisibility = 'public' | 'premium';
export type VideoDisplayOrientation = 'portrait' | 'landscape';
export type VideoContentType = 'music' | 'dance' | 'comedy' | 'tutorial' | 'lifestyle' | 'behind_the_scenes';

export type VideoUploadSource = {
  uri: string;
  name?: string;
  type?: string;
  orientation?: VideoDisplayOrientation;
  size?: number;
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

export type CreatorVideoTextEditOverlay = {
  type: 'text';
  text: string;
  x: number;
  y: number;
  start: number;
  end: number;
  font_size: number;
  color: string;
  box: boolean;
  box_color?: string;
};

export type CreatorVideoDrawingEditOverlay = {
  type: 'drawing';
  file_index: number;
  x: number;
  y: number;
  start: number;
  end: number;
  width: number;
  height: number;
};

export type CreatorVideoEditOverlay = CreatorVideoTextEditOverlay | CreatorVideoDrawingEditOverlay;

export type CreatorVideoTimelineTextLayer = {
  type: 'text';
  text: string;
  font?: string;
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  start?: number;
  end?: number | null;
};

export type CreatorVideoTimelineDrawingLayer = {
  type: 'drawing';
  asset_url?: string;
  file_index?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  start?: number;
  end?: number | null;
};

export type CreatorVideoTimelineStickerLayer = {
  type: 'sticker';
  public_id: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  start?: number;
  end?: number | null;
};

export type CreatorVideoTimelineLayer =
  | CreatorVideoTimelineTextLayer
  | CreatorVideoTimelineDrawingLayer
  | CreatorVideoTimelineStickerLayer;

export type CreatorVideoEditTimeline = {
  layers: CreatorVideoTimelineLayer[];
  filters?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
  trim?: {
    start: number;
    end: number;
  };
  output?: {
    format?: string;
    quality?: string | number;
    width?: number;
    height?: number;
  };
};

export type SubmitCreatorVideoEditsPayload = {
  timeline?: CreatorVideoEditTimeline;
  /** Retained for older API responses and in-flight navigation state. */
  overlays?: CreatorVideoEditOverlay[];
  drawingFiles?: VideoUploadSource[];
};

export const hasCreatorVideoEdits = (
  payload?: SubmitCreatorVideoEditsPayload | null,
): payload is SubmitCreatorVideoEditsPayload =>
  Boolean(payload?.timeline?.layers.length || payload?.timeline?.trim || payload?.overlays?.length);

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
  streaming_url?: string | null;
  rendered_url?: string | null;
  thumbnail?: string | null;
  poster_url?: string | null;
  duration?: number | null;
  status?: string | null;
  render_status?: string | null;
  progress_percentage?: number | null;
  render_completed_at?: string | null;
  views_count?: number;
  hashtags?: string[];
  mentions?: string[];
};

export type UploadCreatorVideoResponse = {
  message: string;
  data: CreatorVideo;
};

export type CreatorVideoUploadStatus =
  | 'idle'
  | 'initializing'
  | 'uploading'
  | 'finalizing'
  | 'submitting_edits'
  | 'processing'
  | 'ready'
  | 'failed';

export type InitCreatorVideoUploadPayload = {
  original_name?: string;
  file_name?: string;
  filename?: string;
  mime_type?: string;
  content_type?: Array<VideoContentType | string> | string;
  title?: string | null;
  caption?: string | null;
  visibility?: VideoVisibility;
  size?: number;
};

export type CreatorVideoUploadSession = {
  video: CreatorVideo;
  upload: {
    upload_url: string;
    upload_headers?: Record<string, unknown>;
    expires_at: string;
  };
};

export type InitCreatorVideoUploadResponse = {
  data: CreatorVideoUploadSession;
};

export type CompleteCreatorVideoUploadResponse = {
  data: CreatorVideo;
  message?: string;
};

export type CreatorVideoProgress = {
  video_id: string | number;
  status: string;
  render_status?: string | null;
  progress_percentage: number;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
  poster_url?: string | null;
  thumbnail?: string | null;
  render_completed_at?: string | null;
  error?: string | null;
  message?: string | null;
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
  poster_url?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  video?: string | null;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
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

export type CreatorVideoPlaylist = {
  id: number;
  user_id: number;
  name: string;
  videos_count: number;
  created_at: string;
  updated_at: string;
  videos: CreatorVideoListItem[];
};

export type CreatorVideoPlaylistsParams = {
  page?: number;
  per_page?: number;
};

export type CreatorVideoPlaylistsResponse = {
  data: CreatorVideoPlaylist[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type CreatorVideoPlaylistResponse = {
  data: CreatorVideoPlaylist;
};

export type CreateCreatorVideoPlaylistPayload = {
  name: string;
};

export type UpdateCreatorVideoPlaylistPayload = {
  name: string;
};

export type BulkAddCreatorVideoPlaylistVideosPayload = {
  video_ids: number[];
};

export type CreatorVideoPlaylistPlaybackResponse = {
  playlist_id: string;
  playlist_name: string;
  item: Record<string, unknown>;
  next_videos: Record<string, unknown>[];
};

export type DeleteCreatorVideoPlaylistResponse = {
  message: string;
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
  poster_url?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
  status?: string | null;
  render_status?: string | null;
  progress_percentage?: number | null;
  render_completed_at?: string | null;
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
