import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { CreatorVideoPlaylistsParams } from '../../types/video.types';

export const CREATOR_VIDEO_PLAYLISTS_QUERY_KEY = ['creator', 'video-playlists'] as const;
export const CREATOR_VIDEO_PLAYLIST_QUERY_KEY = ['creator', 'video-playlist'] as const;
export const CREATOR_VIDEO_PLAYLIST_PLAYBACK_QUERY_KEY = ['creator', 'video-playlist-playback'] as const;

export const useCreatorVideoPlaylists = (params?: CreatorVideoPlaylistsParams, enabled = true) =>
  useQuery({
    queryKey: [...CREATOR_VIDEO_PLAYLISTS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await videoApi.getCreatorVideoPlaylists(params);
      console.log('this is the data return from getting playlists:', response.data);
      console.log('this is the payload of a video in pl:', response.data.data[0].videos);
      return response.data;
    },
    enabled,
  });

export const useCreatorVideoPlaylist = (playlist?: string | number, enabled = true) =>
  useQuery({
    queryKey: [...CREATOR_VIDEO_PLAYLIST_QUERY_KEY, playlist],
    queryFn: async () => {
      if (playlist == null) {
        throw new Error('Playlist is required.');
      }

      const response = await videoApi.getCreatorVideoPlaylist(playlist);
      return response.data.data;
    },
    enabled: enabled && playlist != null,
  });

export const useCreatorVideoPlaylistPlayback = (playlist?: string | number, enabled = true) =>
  useQuery({
    queryKey: [...CREATOR_VIDEO_PLAYLIST_PLAYBACK_QUERY_KEY, playlist],
    queryFn: async () => {
      if (playlist == null) {
        throw new Error('Playlist is required.');
      }

      const response = await videoApi.getCreatorVideoPlaylistPlayback(playlist);
      return response.data;
    },
    enabled: enabled && playlist != null,
  });
