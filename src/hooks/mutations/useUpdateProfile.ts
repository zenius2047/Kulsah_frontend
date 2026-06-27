import { useMutation } from '@tanstack/react-query';
import { profileApi } from '../../api/profile.api';
import type { UpdateProfilePayload } from '../../types/user.types';

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await profileApi.updateProfile(payload);
      return response.data;
    },
  });
