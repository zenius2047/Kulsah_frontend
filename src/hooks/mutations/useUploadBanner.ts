import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { AvatarUploadSource } from '../../types/user.types';

export const useUploadBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (banner: AvatarUploadSource | FormData) => {
      const response = await generalApi.uploadBanner(banner);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
