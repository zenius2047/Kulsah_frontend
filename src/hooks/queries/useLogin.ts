import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth.api';
import { setAuthSession } from '../../services/token.service';
import { setUser } from '../../store/auth.store';
import type { LoginPayload } from '../../types/auth.types';
import type { User } from '../../types/user.types';

type LoginResponse = {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: User;
};

export const useLogin = () =>
  useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      return response.data as LoginResponse;
    },
    onSuccess: async (data) => {
      const accessToken = data.access_token || data.token;
      if (accessToken) {
        await setAuthSession({
          accessToken,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        });
      }

      if (data.user) {
        setUser(data.user);
      }
    },
  });
