import { useQuery } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { WatchedVideosParams } from '../../types/general.types';

export const WATCHED_VIDEOS_QUERY_KEY = ['general', 'videos', 'watched'] as const;

export const useWatchedVideos = (params?: WatchedVideosParams, enabled = true) =>
  useQuery({
    queryKey: [...WATCHED_VIDEOS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await generalApi.getWatchedVideos(params);
      return response.data;
    },
    enabled,
  });
