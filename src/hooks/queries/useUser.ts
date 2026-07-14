import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/user.api';
import type { User } from '../../types/user.types';

export const useUser = (enabled = true) =>
  useQuery<User | null>({
    queryKey: ['user', 'me'],
    enabled,
    queryFn: async () => {
      const response = await userApi.me();
      console.log('this is the response of me:', response.data?.data);
      return (response.data?.data ?? response.data) as User;
    },
  });
