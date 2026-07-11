import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { CreatorVideosParams } from '../../types/video.types';

export const CREATOR_VIDEOS_QUERY_KEY = ['creator', 'videos'] as const;

export const useCreatorVideos = (params?: CreatorVideosParams, enabled = true) =>
  useQuery({
    queryKey: [...CREATOR_VIDEOS_QUERY_KEY, params],
    queryFn: async () => {
      const response = await videoApi.getCreatorVideos(params);
      return response.data;
    },
    enabled,
  });
