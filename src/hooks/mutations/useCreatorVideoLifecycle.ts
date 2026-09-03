import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { CreateCreatorVideoDuetDraftPayload } from '../../types/video.types';
import { CREATOR_VIDEO_ANALYTICS_QUERY_KEY } from '../queries/useCreatorVideoAnalytics';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';

const invalidateCreatorVideos = (queryClient: ReturnType<typeof useQueryClient>, video?: string | number) => {
  void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY });
  if (video != null) void queryClient.invalidateQueries({ queryKey: ['creator', 'videos', video] });
};

export const useCreateCreatorVideoDuetDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceVideo, payload = {} }: {
      sourceVideo: string | number;
      payload?: CreateCreatorVideoDuetDraftPayload;
    }) => videoApi.createCreatorVideoDuetDraft(sourceVideo, payload).then((response) => response.data.data),
    onSuccess: () => invalidateCreatorVideos(queryClient),
  });
};

export const useRetryCreatorVideoProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (video: string | number) =>
      videoApi.retryCreatorVideoProcessing(video).then((response) => response.data.data),
    onSuccess: (_video, videoId) => invalidateCreatorVideos(queryClient, videoId),
  });
};
