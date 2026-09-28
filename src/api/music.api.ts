import api from './client';
import { API_BASE_URL, endpoints } from './endpoints';
import type { MusicBrowseParams, MusicBrowseResponse, MusicTrack, MusicTrackResponse } from '../types/music.types';

const isLoopbackUrl = (value: string) => {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname);
  } catch {
    return false;
  }
};

const musicStreamUrl = (track: MusicTrack) => {
  const fallback = new URL(
    `${endpoints.creator.musicTrack(track.id)}/stream`,
    API_BASE_URL,
  ).toString();

  return !track.stream_url || isLoopbackUrl(track.stream_url) ? fallback : track.stream_url;
};

const normalizeTrack = (track: MusicTrack): MusicTrack => {
  const streamUrl = musicStreamUrl(track);

  return {
    ...track,
    stream_url: streamUrl,
    stream_endpoint: !track.stream_endpoint || isLoopbackUrl(track.stream_endpoint)
      ? streamUrl
      : track.stream_endpoint,
  };
};

export const musicApi = {
  browse: (params?: MusicBrowseParams) =>
    api.get<MusicBrowseResponse>(endpoints.creator.music, { params }).then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: response.data.data.map(normalizeTrack),
      },
    })),
  getTrack: (track: string) =>
    api.get<MusicTrackResponse>(endpoints.creator.musicTrack(track)).then((response) => ({
      ...response,
      data: {
        ...response.data,
        data: normalizeTrack(response.data.data),
      },
    })),
};
