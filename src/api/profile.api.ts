import api from './client';
import { endpoints } from './endpoints';
import type { AvatarUploadSource, UpdateProfilePayload } from '../types/user.types';

const createAvatarFormData = (avatar: AvatarUploadSource) => {
  const formData = new FormData();
  formData.append('avatar', {
    uri: avatar.uri,
    name: avatar.name ?? 'avatar.jpg',
    type: avatar.type ?? 'image/jpeg',
  } as any);

  return formData;
};

export const profileApi = {
  updateProfile: (payload: UpdateProfilePayload) =>
    api.post(endpoints.general.updateProfile, payload),
  uploadAvatar: (avatar: AvatarUploadSource | FormData) => {
    const data = avatar instanceof FormData ? avatar : createAvatarFormData(avatar);

    return api.post(endpoints.general.uploadAvatar, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const updateProfile = profileApi.updateProfile;
export const uploadAvatar = profileApi.uploadAvatar;
