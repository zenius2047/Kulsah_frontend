export type VideoVisibility = 'public' | 'premium';

export type VideoUploadSource = {
  uri: string;
  name?: string;
  type?: string;
};

export type UploadCreatorVideoPayload = {
  video: VideoUploadSource | FormData;
  title?: string | null;
  caption?: string | null;
  visibility: VideoVisibility;
};

export type FeedVideosParams = {
  limit?: number;
  page?: number;
};

