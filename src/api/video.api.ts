import api from './client';
import { API_BASE_URL, endpoints } from './endpoints';
import { generalApi } from './general.api';
import { useAuthStore } from '../store/auth.store';
import type { AxiosRequestConfig } from 'axios';
import type {
  CreateCreatorVideoDraftPayload,
  CreatorVideoAnalyticsResponse,
  CreatorVideoDetailResponse,
  CreatorVideosParams,
  CreatorVideosResponse,
  CreatorVideoProgressResponse,
  FeedVideosParams,
  UpdateCreatorVideoPayload,
  UpdateCreatorVideoProgressPayload,
  UploadCreatorVideoPayload,
  UploadCreatorVideoResponse,
  UploadCreatorVideoToDraftPayload,
  VideoUploadSource,
} from '../types/video.types';

const creatorVideoAuthConfig = (config: AxiosRequestConfig = {}): AxiosRequestConfig => {
  const token = useAuthStore.getState().token;

  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

const appendContentTypes = (formData: FormData, contentTypes?: UploadCreatorVideoPayload['contentType']) => {
  if (!contentTypes) return;

  if (typeof contentTypes === 'string') {
    formData.append('content_type', contentTypes);
    return;
  }

  contentTypes.forEach((contentType) => {
    formData.append('content_type[]', contentType);
  });
};

const createVideoFormData = ({
  video,
  title,
  caption,
  contentType,
  visibility,
}: UploadCreatorVideoPayload) => {
  if (video instanceof FormData) {
    if (title != null) video.append('title', title);
    if (caption != null) video.append('caption', caption);
    appendContentTypes(video, contentType);
    if (visibility != null) video.append('visibility', visibility);

    return video;
  }

  const formData = new FormData();
  const source = video as VideoUploadSource;

  formData.append('video', {
    uri: source.uri,
    name: source.name ?? 'video.mp4',
    type: source.type ?? 'video/mp4',
  } as any);

  if (title != null) formData.append('title', title);
  if (caption != null) formData.append('caption', caption);
  appendContentTypes(formData, contentType);
  if (visibility != null) formData.append('visibility', visibility);

  return formData;
};

const createVideoOnlyFormData = ({ video }: UploadCreatorVideoToDraftPayload) => {
  if (video instanceof FormData) {
    return video;
  }

  const formData = new FormData();
  const source = video as VideoUploadSource;

  formData.append('video', {
    uri: source.uri,
    name: source.name ?? 'video.mp4',
    type: source.type ?? 'video/mp4',
  } as any);

  return formData;
};

const parseUploadResponse = (responseText: string) => {
  if (!responseText) return {};

  return JSON.parse(responseText);
};

const uploadCreatorVideoToDraftWithXhr = (
  video: string | number,
  payload: UploadCreatorVideoToDraftPayload,
  onUploadProgress?: (percent: number) => void,
) =>
  new Promise<UploadCreatorVideoResponse>((resolve, reject) => {
    const token = useAuthStore.getState().token;
    const xhr = new XMLHttpRequest();

    xhr.open('POST', `${API_BASE_URL}${endpoints.creator.videoUpload(video)}`);
    xhr.setRequestHeader('Accept', 'application/json');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const percent = Math.max(0, Math.min(100, Math.round((event.loaded * 100) / event.total)));
      onUploadProgress?.(percent);
    };

    xhr.onload = () => {
      try {
        const response = parseUploadResponse(xhr.responseText) as UploadCreatorVideoResponse;

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
          return;
        }

        reject(response);
      } catch (error) {
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(createVideoOnlyFormData(payload));
  });

export const videoApi = {
  getCreatorVideos: (params?: CreatorVideosParams) =>
    api.get<CreatorVideosResponse>(endpoints.creator.videos, creatorVideoAuthConfig({ params })),
  getCreatorVideoAnalytics: () =>
    api.get<CreatorVideoAnalyticsResponse>(endpoints.creator.videoAnalytics, creatorVideoAuthConfig()),
  getCreatorVideo: (video: string | number) =>
    api.get<CreatorVideoDetailResponse>(endpoints.creator.video(video), creatorVideoAuthConfig()),
  createCreatorVideoDraft: (payload: CreateCreatorVideoDraftPayload) =>
    api.post<UploadCreatorVideoResponse>(endpoints.creator.videoDrafts, payload, creatorVideoAuthConfig()),
  uploadCreatorVideo: (payload: UploadCreatorVideoPayload) =>
    api.post<UploadCreatorVideoResponse>(endpoints.creator.videos, createVideoFormData(payload), creatorVideoAuthConfig({
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })),
  uploadCreatorVideoToDraft: (
    video: string | number,
    payload: UploadCreatorVideoToDraftPayload,
    onUploadProgress?: (percent: number) => void,
  ) =>
    uploadCreatorVideoToDraftWithXhr(video, payload, onUploadProgress),
  updateCreatorVideo: (video: string | number, payload: UpdateCreatorVideoPayload) =>
    api.patch(endpoints.creator.video(video), payload, creatorVideoAuthConfig()),
  getCreatorVideoProgress: (video: string | number) =>
    api.get<CreatorVideoProgressResponse>(endpoints.creator.videoProgress(video), creatorVideoAuthConfig()),
  updateCreatorVideoProgress: (video: string | number, payload: UpdateCreatorVideoProgressPayload) =>
    api.patch<CreatorVideoProgressResponse>(endpoints.creator.videoProgress(video), payload, creatorVideoAuthConfig()),
  getFeedVideos: (params?: FeedVideosParams) => generalApi.getFeed(params),
};

export const getCreatorVideos = videoApi.getCreatorVideos;
export const getCreatorVideoAnalytics = videoApi.getCreatorVideoAnalytics;
export const getCreatorVideo = videoApi.getCreatorVideo;
export const createCreatorVideoDraft = videoApi.createCreatorVideoDraft;
export const uploadCreatorVideo = videoApi.uploadCreatorVideo;
export const uploadCreatorVideoToDraft = videoApi.uploadCreatorVideoToDraft;
export const updateCreatorVideo = videoApi.updateCreatorVideo;
export const getCreatorVideoProgress = videoApi.getCreatorVideoProgress;
export const updateCreatorVideoProgress = videoApi.updateCreatorVideoProgress;
export const getFeedVideos = videoApi.getFeedVideos;
