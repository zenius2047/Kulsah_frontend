import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import type { RegisterPayload } from '../../types/auth.types';

export const useRegister = () =>
  useMutation({
    mutationFn: async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      return response.data;
    },
  });

