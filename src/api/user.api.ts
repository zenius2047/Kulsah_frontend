import api from './client';
import { endpoints } from './endpoints';

export const userApi = {
  me: () => api.get(endpoints.user.me),
  profile: () => api.get(endpoints.user.profile),
};

export const getMe = userApi.me;
export const getUserProfile = userApi.profile;

