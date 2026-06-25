import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { setAuthToken } from '../../services/token.service';
import { setUser } from '../../store/auth.store';
import type { LoginPayload } from '../../types/auth.types';
import type { User } from '../../types/user.types';

type LoginResponse = {
  token?: string;
  user?: User;
};

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      return response.data as LoginResponse;
    },
    onSuccess: async (data) => {
      if (data.token) {
        await setAuthToken(data.token);
      }

      if (data.user) {
        setUser(data.user);
      }
    },
  });
