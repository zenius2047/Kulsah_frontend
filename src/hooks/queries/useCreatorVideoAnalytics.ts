import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';

export const CREATOR_VIDEO_ANALYTICS_QUERY_KEY = ['creator', 'videos', 'analytics'] as const;

export const useCreatorVideoAnalytics = () =>
  useQuery({
    queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY,
    queryFn: async () => {
      const response = await videoApi.getCreatorVideoAnalytics();
      return response.data.data;
    },
  });
