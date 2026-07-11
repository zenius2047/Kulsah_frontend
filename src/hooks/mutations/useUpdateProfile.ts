import { useMutation } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { UpdateProfilePayload } from '../../types/user.types';

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const response = await generalApi.updateProfile(payload);
      return response.data;
    },
  });
