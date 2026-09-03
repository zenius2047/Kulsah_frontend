import api from './client';
import { API_BASE_URL, endpoints } from './endpoints';
import { generalApi } from './general.api';
import { useAuthStore } from '../store/auth.store';
import type { AxiosRequestConfig } from 'axios';
import type {
  CreateCreatorVideoDraftPayload,
  CreateCreatorVideoDuetDraftPayload,
  CreatorVideoAnalyticsResponse,
  CreatorVideoDetailResponse,
  CreatorVideosParams,
  CreatorVideosResponse,
  CreatorVideoProgressResponse,
  CompleteCreatorVideoUploadResponse,
  BulkAddCreatorVideoPlaylistVideosPayload,
  CreateCreatorVideoPlaylistPayload,
  CreatorVideoPlaylistPlaybackResponse,
  CreatorVideoPlaylistResponse,
  CreatorVideoPlaylistsParams,
  CreatorVideoPlaylistsResponse,
  DeleteCreatorVideoPlaylistResponse,
  FeedVideosParams,
  InitCreatorVideoUploadPayload,
  InitCreatorVideoUploadResponse,
  SubmitCreatorVideoEditsPayload,
  SubmitCreatorVideoEditsResponse,
  UpdateCreatorVideoPlaylistPayload,
  UpdateCreatorVideoPayload,
  UpdateCreatorVideoProgressPayload,
  UploadCreatorVideoPayload,
  UploadCreatorVideoResponse,
  UploadCreatorVideoToDraftPayload,
  VideoUploadSource,
} from '../types/video.types';
import { createVideoProjectV3FormData } from '../services/videoProjectSubmission.service';

const creatorVideoAuthConfig = (config: AxiosRequestConfig = {}): AxiosRequestConfig => {
  const token = useAuthStore.getState().token;

  return {
    ...config,
    headers: {
      Accept: 'application/json',
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
  allowDuet,
}: UploadCreatorVideoPayload) => {
  if (video instanceof FormData) {
    if (title != null) video.append('title', title);
    if (caption != null) video.append('caption', caption);
    appendContentTypes(video, contentType);
    if (visibility != null) video.append('visibility', visibility);
    if (allowDuet != null) video.append('allow_duet', allowDuet ? '1' : '0');

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
  if (allowDuet != null) formData.append('allow_duet', allowDuet ? '1' : '0');

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
  createCreatorVideoDuetDraft: (video: string | number, payload: CreateCreatorVideoDuetDraftPayload = {}) =>
    api.post<UploadCreatorVideoResponse>(endpoints.creator.videoDuetDraft(video), payload, creatorVideoAuthConfig()),
  initCreatorVideoUpload: (payload: InitCreatorVideoUploadPayload) =>
    api.post<InitCreatorVideoUploadResponse>(endpoints.creator.videoUploadInit, payload, creatorVideoAuthConfig()),
  completeCreatorVideoUpload: (video: string | number) =>
    api.post<CompleteCreatorVideoUploadResponse>(endpoints.creator.videoUploadComplete(video), {}, creatorVideoAuthConfig()),
  retryCreatorVideoProcessing: (video: string | number) =>
    api.post<CompleteCreatorVideoUploadResponse>(endpoints.creator.videoRetryProcessing(video), {}, creatorVideoAuthConfig()),
  submitCreatorVideoEdits: (video: string | number, payload: SubmitCreatorVideoEditsPayload) =>
    api.post<SubmitCreatorVideoEditsResponse>(
      endpoints.creator.videoEdits(video),
      createVideoProjectV3FormData(payload),
      creatorVideoAuthConfig(),
    ),
  uploadCreatorVideo: (payload: UploadCreatorVideoPayload) =>
    api.post<UploadCreatorVideoResponse>(endpoints.creator.videos, createVideoFormData(payload), creatorVideoAuthConfig()),
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
  getCreatorVideoPlaylists: (params?: CreatorVideoPlaylistsParams) =>
    api.get<CreatorVideoPlaylistsResponse>(endpoints.creator.videoPlaylists, creatorVideoAuthConfig({ params })),
  createCreatorVideoPlaylist: (payload: CreateCreatorVideoPlaylistPayload) =>
    api.post<CreatorVideoPlaylistResponse>(endpoints.creator.videoPlaylists, payload, creatorVideoAuthConfig()),
  getCreatorVideoPlaylist: (playlist: string | number) =>
    api.get<CreatorVideoPlaylistResponse>(endpoints.creator.videoPlaylist(playlist), creatorVideoAuthConfig()),
  getCreatorVideoPlaylistPlayback: (playlist: string | number) =>
    api.get<CreatorVideoPlaylistPlaybackResponse>(endpoints.creator.videoPlaylistVideos(playlist), creatorVideoAuthConfig()),
  updateCreatorVideoPlaylist: (playlist: string | number, payload: UpdateCreatorVideoPlaylistPayload) =>
    api.patch<CreatorVideoPlaylistResponse>(endpoints.creator.videoPlaylist(playlist), payload, creatorVideoAuthConfig()),
  deleteCreatorVideoPlaylist: (playlist: string | number) =>
    api.delete<DeleteCreatorVideoPlaylistResponse>(endpoints.creator.videoPlaylist(playlist), creatorVideoAuthConfig()),
  addCreatorVideoToPlaylist: (playlist: string | number, video: string | number) =>
    api.post(endpoints.creator.videoPlaylistVideo(playlist, video), {}, creatorVideoAuthConfig()),
  bulkAddCreatorVideosToPlaylist: (playlist: string | number, payload: BulkAddCreatorVideoPlaylistVideosPayload) =>
    api.post(endpoints.creator.videoPlaylistBulkVideos(playlist), payload, creatorVideoAuthConfig()),
  removeCreatorVideoFromPlaylist: (playlist: string | number, video: string | number) =>
    api.delete(endpoints.creator.videoPlaylistVideo(playlist, video), creatorVideoAuthConfig()),
  getFeedVideos: (params?: FeedVideosParams) => generalApi.getFeed(params),
};

export const getCreatorVideos = videoApi.getCreatorVideos;
export const getCreatorVideoAnalytics = videoApi.getCreatorVideoAnalytics;
export const getCreatorVideo = videoApi.getCreatorVideo;
export const createCreatorVideoDraft = videoApi.createCreatorVideoDraft;
export const createCreatorVideoDuetDraft = videoApi.createCreatorVideoDuetDraft;
export const initCreatorVideoUpload = videoApi.initCreatorVideoUpload;
export const completeCreatorVideoUpload = videoApi.completeCreatorVideoUpload;
export const retryCreatorVideoProcessing = videoApi.retryCreatorVideoProcessing;
export const submitCreatorVideoEdits = videoApi.submitCreatorVideoEdits;
export const uploadCreatorVideo = videoApi.uploadCreatorVideo;
export const uploadCreatorVideoToDraft = videoApi.uploadCreatorVideoToDraft;
export const updateCreatorVideo = videoApi.updateCreatorVideo;
export const getCreatorVideoProgress = videoApi.getCreatorVideoProgress;
export const updateCreatorVideoProgress = videoApi.updateCreatorVideoProgress;
export const getCreatorVideoPlaylists = videoApi.getCreatorVideoPlaylists;
export const createCreatorVideoPlaylist = videoApi.createCreatorVideoPlaylist;
export const getCreatorVideoPlaylist = videoApi.getCreatorVideoPlaylist;
export const getCreatorVideoPlaylistPlayback = videoApi.getCreatorVideoPlaylistPlayback;
export const updateCreatorVideoPlaylist = videoApi.updateCreatorVideoPlaylist;
export const deleteCreatorVideoPlaylist = videoApi.deleteCreatorVideoPlaylist;
export const addCreatorVideoToPlaylist = videoApi.addCreatorVideoToPlaylist;
export const bulkAddCreatorVideosToPlaylist = videoApi.bulkAddCreatorVideosToPlaylist;
export const removeCreatorVideoFromPlaylist = videoApi.removeCreatorVideoFromPlaylist;
export const getFeedVideos = videoApi.getFeedVideos;
