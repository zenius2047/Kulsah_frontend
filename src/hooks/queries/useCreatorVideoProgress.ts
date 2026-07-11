import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';

export const useCreatorVideoProgress = (video?: string | number, enabled = true) =>
  useQuery({
    queryKey: ['creator', 'videos', video, 'progress'],
    queryFn: async () => {
      if (video == null) {
        throw new Error('Video is required.');
      }

      const response = await videoApi.getCreatorVideoProgress(video);
      return response.data.data;
    },
    enabled: enabled && video != null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const progressPercentage = query.state.data?.progress_percentage ?? 0;
      return status === 'ready' || status === 'failed' || progressPercentage >= 100 ? false : 3000;
    },
  });
