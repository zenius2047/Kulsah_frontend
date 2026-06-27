import { useMutation } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import type { AvatarUploadSource } from '../../types/user.types';

export const useUploadAvatar = () =>
  useMutation({
    mutationFn: async (avatar: AvatarUploadSource | FormData) => {
      const response = await profileApi.uploadAvatar(avatar);
      return response.data;
    },
  });
