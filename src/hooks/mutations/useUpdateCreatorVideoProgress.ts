import { useMutation } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { UpdateCreatorVideoProgressPayload } from '../../types/video.types';

export const useUpdateCreatorVideoProgress = () =>
  useMutation({
    mutationFn: async ({
      video,
      payload,
    }: {
      video: string | number;
      payload: UpdateCreatorVideoProgressPayload;
    }) => {
      const response = await videoApi.updateCreatorVideoProgress(video, payload);
      return response.data;
    },
  });
