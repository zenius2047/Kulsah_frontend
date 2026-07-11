import api from './client';
import { endpoints } from './endpoints';
import type {
  FeedVideosParams,
  UploadCreatorVideoPayload,
  VideoUploadSource,
} from '../types/video.types';

const createVideoFormData = ({
  video,
  title,
  caption,
  visibility,
}: UploadCreatorVideoPayload) => {
  if (video instanceof FormData) {
    if (title != null) video.append('title', title);
    if (caption != null) video.append('caption', caption);
    video.append('visibility', visibility);

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
  formData.append('visibility', visibility);

  return formData;
};

export const videoApi = {
  uploadCreatorVideo: (payload: UploadCreatorVideoPayload) =>
    api.post(endpoints.creator.videos, createVideoFormData(payload), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getFeedVideos: (token: string, params?: FeedVideosParams, ) =>
    api.get(endpoints.general.feed, {
      params,
      headers: {
              Authorization: `Bearer ${token}`,
            },
    }),
};

export const uploadCreatorVideo = videoApi.uploadCreatorVideo;
export const getFeedVideos = videoApi.getFeedVideos;
