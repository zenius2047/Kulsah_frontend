import { useMutation } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { AvatarUploadSource } from '../../types/user.types';

export const useUploadAvatar = () =>
  useMutation({
    mutationFn: async (avatar: AvatarUploadSource | FormData) => {
      const response = await generalApi.uploadAvatar(avatar);
      return response.data;
    },
  });
