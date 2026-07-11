import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { FeedVideosParams } from '../../types/video.types';

export const feedVideosQueryKey = (params?: FeedVideosParams) => ['feedVideos', params] as const;

export const useFeedVideos = (params?: FeedVideosParams) =>
  useQuery({
    queryKey: feedVideosQueryKey(params),
    queryFn: async () => {
      const response = await videoApi.getFeedVideos(params);
      return response.data;
    },
  });

