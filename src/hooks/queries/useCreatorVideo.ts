import { useQuery } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';

export const useCreatorVideo = (video?: string | number) =>
  useQuery({
    queryKey: ['creator', 'videos', video],
    queryFn: async () => {
      if (video == null) {
        throw new Error('Video is required.');
      }

      const response = await videoApi.getCreatorVideo(video);
      return response.data.item;
    },
    enabled: !!video,
  });
