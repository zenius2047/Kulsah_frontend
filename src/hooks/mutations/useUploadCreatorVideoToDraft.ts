import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { UploadCreatorVideoToDraftPayload } from '../../types/video.types';
import { CREATOR_VIDEO_ANALYTICS_QUERY_KEY } from '../queries/useCreatorVideoAnalytics';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';

export const useUploadCreatorVideoToDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      video,
      payload,
      onUploadProgress,
    }: {
      video: string | number;
      payload: UploadCreatorVideoToDraftPayload;
      onUploadProgress?: (percent: number) => void;
    }) => {
      return videoApi.uploadCreatorVideoToDraft(video, payload, onUploadProgress);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ['creator', 'videos', variables.video] });
    },
  });
};
