import { useMutation } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type { UploadCreatorVideoPayload } from '../../types/video.types';

export const useUploadCreatorVideo = () =>
  useMutation({
    mutationFn: async (payload: UploadCreatorVideoPayload) => {
      const response = await videoApi.uploadCreatorVideo(payload);
      return response.data;
    },
  });

