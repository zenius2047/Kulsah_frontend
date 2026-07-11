import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { UpdateCreatorVideoPayload } from '../../types/video.types';
import { CREATOR_VIDEO_ANALYTICS_QUERY_KEY } from '../queries/useCreatorVideoAnalytics';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';

export const useUpdateCreatorVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      video,
      payload,
    }: {
      video: string | number;
      payload: UpdateCreatorVideoPayload;
    }) => {
      const response = await videoApi.updateCreatorVideo(video, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['creator', 'videos', variables.video] });
    },
  });
};
