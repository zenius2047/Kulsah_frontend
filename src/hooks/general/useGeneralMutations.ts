import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { generalApi } from '../../api/general.api';
import type {
  AddCommentPayload,
  UpdateGeneralProfilePayload,
  UploadAvatarPayload,
  WalletTopUpPayload,
  WalletTransferPayload,
} from '../../types/general.types';
import { parseApiError } from '../../utils/apiError';

const showError = (error: unknown) => {
  const parsed = parseApiError(error);
  Alert.alert(parsed.title, parsed.message);
};

export const useRecordVideoViewMutation = () =>
  useMutation({
    mutationFn: (video: string | number) => generalApi.recordVideoView(video).then((response) => response.data),
  });

export const useLikeVideoMutation = () =>
  useMutation({
    mutationFn: ({ video, liked }: { video: string | number; liked: boolean }) =>
      (liked ? generalApi.likeVideo(video) : generalApi.unlikeVideo(video)).then((response) => response.data),
    onError: showError,
  });

export const useBookmarkVideoMutation = () =>
  useMutation({
    mutationFn: ({ video, bookmarked }: { video: string | number; bookmarked: boolean }) =>
      (bookmarked ? generalApi.bookmarkVideo(video) : generalApi.removeBookmark(video)).then((response) => response.data),
    onError: showError,
  });

export const useAddCommentMutation = () =>
  useMutation({
    mutationFn: ({ video, payload }: { video: string | number; payload: AddCommentPayload }) =>
      generalApi.addComment(video, payload).then((response) => response.data),
  });

export const useReplyToCommentMutation = () =>
  useMutation({
    mutationFn: ({
      video,
      comment,
      payload,
    }: {
      video: string | number;
      comment: string | number;
      payload: AddCommentPayload;
    }) => generalApi.replyToComment(video, comment, payload).then((response) => response.data),
  });

export const useLikeCommentMutation = () =>
  useMutation({
    mutationFn: ({
      video,
      comment,
      liked,
    }: {
      video: string | number;
      comment: string | number;
      liked: boolean;
    }) =>
      (liked ? generalApi.likeComment(video, comment) : generalApi.unlikeComment(video, comment)).then(
        (response) => response.data
      ),
  });

export const useFollowCreatorMutation = () =>
  useMutation({
    mutationFn: ({ creator, following }: { creator: string | number; following: boolean }) =>
      (following ? generalApi.followCreator(creator) : generalApi.unfollowCreator(creator)).then((response) => response.data),
    onError: showError,
  });

export const useUploadGeneralAvatarMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (avatar?: UploadAvatarPayload) =>
      generalApi.uploadAvatar(avatar).then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: showError,
  });
};

export const useUpdateGeneralProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGeneralProfilePayload) =>
      generalApi.updateProfile(payload).then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: showError,
  });
};

export const useWalletTransferMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WalletTransferPayload) =>
      generalApi.transferWallet(payload).then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['general', 'wallet'] });
    },
    onError: showError,
  });
};

export const useWalletTopUpMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: WalletTopUpPayload) =>
      generalApi.topUpWallet(payload).then((response) => response.data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['general', 'wallet'] });
    },
    onError: showError,
  });
};
