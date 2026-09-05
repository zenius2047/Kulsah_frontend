export type VideoVisibility = 'public' | 'premium';
export type VideoDisplayOrientation = 'portrait' | 'landscape';
export type VideoContentType = 'music' | 'dance' | 'comedy' | 'tutorial' | 'lifestyle' | 'behind_the_scenes';
export type VideoPurpose = 'post_video' | 'challenge_video' | 'challenge_instruction_video' | 'challenge_entry' | 'message_video' | 'other';

export type VideoUploadSource = {
  uri: string;
  name?: string;
  type?: string;
  orientation?: VideoDisplayOrientation;
  size?: number;
};

export type UploadCreatorVideoPayload = {
  video: VideoUploadSource | FormData;
  thumbnail?: VideoUploadSource | null;
  title?: string | null;
  caption?: string | null;
  contentType?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
  orientation?: VideoDisplayOrientation;
  purpose?: VideoPurpose;
  allowDuet?: boolean;
};

export type CreateCreatorVideoDraftPayload = {
  title?: string | null;
  caption?: string | null;
  content_type?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
  allow_duet?: boolean;
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
  font_size?: number;
  color?: string;
  opacity?: number;
  box?: boolean;
  box_color?: string;
  box_border_width?: number;
  border_width?: number;
  border_color?: string;
  border_radius?: number;
  stroke?: { enabled: boolean; color: string; width: number };
  shadow?: { enabled: boolean; color: string };
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
  project: import('./videoProject.types').VideoProjectV3;
  assetFiles: VideoUploadSource[];
};

export const hasCreatorVideoEdits = (
  payload?: SubmitCreatorVideoEditsPayload | null,
): payload is SubmitCreatorVideoEditsPayload =>
  Boolean(payload?.project?.scenes?.some((scene) => scene.tracks.length > 0) || payload?.project?.trim);

export type UpdateCreatorVideoProgressPayload = {
  progress_percentage: number;
};

export type UpdateCreatorVideoPayload = {
  title?: string | null;
  caption?: string | null;
  content_type?: Array<VideoContentType | string> | string;
  visibility?: VideoVisibility;
  allow_duet?: boolean;
  music?: import('./music.types').MusicSelectionPayload | null;
};

export type CreateCreatorVideoDuetDraftPayload = CreateCreatorVideoDraftPayload;

export type CreatorVideo = {
  id: string | number;
  title?: string | null;
  caption?: string | null;
  visibility: VideoVisibility;
  content_type?: string | null;
  content_types?: string[];
  purpose?: VideoPurpose;
  allowDuet?: boolean;
  isDuet?: boolean;
  duetSourceVideoId?: string | number | null;
  is_premium?: boolean;
  cdn_url?: string | null;
  stream_url?: string | null;
  streaming_url?: string | null;
  rendered_url?: string | null;
  playback?: {
    type?: string | null;
    url?: string | null;
    fallbackUrl?: string | null;
    posterUrl?: string | null;
  } | null;
  thumbnail?: string | null;
  poster_url?: string | null;
  duration?: number | null;
  durationMs?: number | null;
  status?: string | null;
  render_status?: string | null;
  progress_percentage?: number | null;
  requires_editing?: boolean;
  upload_state?: string | null;
  upload_status?: string | null;
  processing_status?: string | null;
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
  purpose?: VideoPurpose;
  requires_editing?: boolean;
  allow_duet?: boolean;
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
  data: CreatorVideoUploadSession | {
    videoId: string | number;
    status: string;
    video: CreatorVideo;
    upload: {
      method: 'PUT' | string;
      url: string;
      headers?: Record<string, unknown>;
      expiresAt: string;
      expiresIn?: number;
    };
  };
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
  requires_editing?: boolean;
  upload_state?: string | null;
  processing_state?: string | null;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
  poster_url?: string | null;
  thumbnail?: string | null;
  render_completed_at?: string | null;
  error?: string | null;
  message?: string | null;
  metadata?: {
    edit_status?: string | null;
    edit_error?: string | null;
    [key: string]: unknown;
  } | null;
};

export type CreatorVideoProgressResponse = {
  data: CreatorVideoProgress;
  message?: string;
};

export type SubmitCreatorVideoEditsResponse = {
  message: string;
  data?: CreatorVideoProgress;
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
  allowDuet?: boolean;
  isDuet?: boolean;
  duetSourceVideoId?: string | number | null;
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
  background?: string | null;
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
  allowDuet?: boolean;
  isDuet?: boolean;
  duetSourceVideoId?: string | number | null;
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
