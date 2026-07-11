import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { setUser, useAuthStore } from '../../store/auth.store';
import type { SwitchRolePayload } from '../../types/auth.types';
import type { User } from '../../types/user.types';

type SwitchRoleResponse = {
  user?: User;
  data?: User;
  message?: string;
};

export const useSwitchRole = () =>
  useMutation({
    mutationFn: async (payload: SwitchRolePayload) => {
      const response = await authApi.switchRole(payload);
      return response.data as SwitchRoleResponse;
    },
    onSuccess: (data, payload) => {
      const backendUser = data.user ?? data.data;
      const currentUser = useAuthStore.getState().user;

      setUser({
        ...(currentUser ?? {}),
        ...(backendUser ?? {}),
        role: payload.role,
      } as User);
    },
  });
