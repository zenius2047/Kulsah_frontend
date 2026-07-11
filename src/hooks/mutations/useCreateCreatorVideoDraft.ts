import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { CreateCreatorVideoDraftPayload } from '../../types/video.types';
import { CREATOR_VIDEO_ANALYTICS_QUERY_KEY } from '../queries/useCreatorVideoAnalytics';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';

export const useCreateCreatorVideoDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCreatorVideoDraftPayload) => {
      const response = await videoApi.createCreatorVideoDraft(payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY });
    },
  });
};
