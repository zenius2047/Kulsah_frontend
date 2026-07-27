import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import { getVideoProcessingState } from '../../utils/video';

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
      const processing = query.state.data;
      if (!processing) return 3000;

      const { isReady, hasFailed } = getVideoProcessingState(processing);
      return isReady || hasFailed ? false : 3000;
    },
  });
