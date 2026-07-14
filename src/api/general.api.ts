import api from './client';
import { endpoints } from './endpoints';
import type {
  AddCommentPayload,
  GeneralCommentLikeResponse,
  FollowCreatorResponse,
  GeneralCommentResponse,
  GeneralCommentsParams,
  GeneralCommentsResponse,
  GeneralFeedParams,
  GeneralFeedResponse,
  GeneralVideoResponse,
  WatchedVideosParams,
  WatchedVideosResponse,
  PaginatedWalletResponse,
  UpdateGeneralProfilePayload,
  UpdateGeneralProfileResponse,
  UploadAvatarPayload,
  UploadAvatarResponse,
  UploadBannerPayload,
  UploadBannerResponse,
  VideoActionResponse,
  WalletLedgerEntry,
  WalletMutationResponse,
  WalletResponse,
  WalletTopUpPayload,
  WalletTransaction,
  WalletTransferPayload,
} from '../types/general.types';
import type { AvatarUploadSource } from '../types/user.types';

const createImageFormData = (
  fieldName: 'avatar' | 'banner',
  image?: UploadAvatarPayload | UploadBannerPayload,
) => {
  const formData = new FormData();

  if (image instanceof FormData) {
    return image;
  }

  if (image) {
    const source = image as AvatarUploadSource;
    formData.append(fieldName, {
      uri: source.uri,
      name: source.name ?? `${fieldName}.jpg`,
      type: source.type ?? 'image/jpeg',
    } as any);
  }

  return formData;
};

export const generalApi = {
  getFeed: (params?: GeneralFeedParams) =>
    api.get<GeneralFeedResponse>(endpoints.general.feed, { params }),
  getVideo: (video: string | number) =>
    api.get<GeneralVideoResponse>(endpoints.general.video(video)),
  recordVideoView: (video: string | number) =>
    api.post<GeneralVideoResponse>(endpoints.general.videoView(video)),
  getWatchedVideos: (params?: WatchedVideosParams) =>
    api.get<WatchedVideosResponse>(endpoints.general.videoWatched, { params }),
  likeVideo: (video: string | number) =>
    api.post<VideoActionResponse>(endpoints.general.videoLike(video)),
  unlikeVideo: (video: string | number) =>
    api.delete<VideoActionResponse>(endpoints.general.videoLike(video)),
  bookmarkVideo: (video: string | number) =>
    api.post<VideoActionResponse>(endpoints.general.videoBookmark(video)),
  removeBookmark: (video: string | number) =>
    api.delete<VideoActionResponse>(endpoints.general.videoBookmark(video)),
  getVideoComments: (video: string | number, params?: GeneralCommentsParams) =>
    api.get<GeneralCommentsResponse>(endpoints.general.videoComments(video), { params }),
  addComment: (video: string | number, payload: AddCommentPayload) =>
    api.post<GeneralCommentResponse>(endpoints.general.videoComments(video), payload),
  replyToComment: (video: string | number, comment: string | number, payload: AddCommentPayload) =>
    api.post<GeneralCommentResponse>(endpoints.general.commentReply(video, comment), payload),
  likeComment: (video: string | number, comment: string | number) =>
    api.post<GeneralCommentLikeResponse>(endpoints.general.commentLike(video, comment)),
  unlikeComment: (video: string | number, comment: string | number) =>
    api.delete<GeneralCommentLikeResponse>(endpoints.general.commentLike(video, comment)),
  followCreator: (creator: string | number) =>
    api.post<FollowCreatorResponse>(endpoints.general.creatorFollow(creator)),
  unfollowCreator: (creator: string | number) =>
    api.delete<FollowCreatorResponse>(endpoints.general.creatorFollow(creator)),
  uploadAvatar: (avatar?: UploadAvatarPayload) =>
    api.post<UploadAvatarResponse>(endpoints.general.uploadAvatar, createImageFormData('avatar', avatar), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  uploadBanner: (banner?: UploadBannerPayload) =>
    api.post<UploadBannerResponse>(endpoints.general.uploadBanner, createImageFormData('banner', banner), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  updateProfile: (payload: UpdateGeneralProfilePayload) =>
    api.post<UpdateGeneralProfileResponse>(endpoints.general.updateProfile, payload),
  getWallet: () =>
    api.get<WalletResponse>(endpoints.general.wallet),
  getWalletTransactions: (page?: number) =>
    api.get<PaginatedWalletResponse<WalletTransaction>>(endpoints.general.walletTransactions, {
      params: page ? { page } : undefined,
    }),
  getWalletLedger: (page?: number) =>
    api.get<PaginatedWalletResponse<WalletLedgerEntry>>(endpoints.general.walletLedger, {
      params: page ? { page } : undefined,
    }),
  transferWallet: (payload: WalletTransferPayload) =>
    api.post<WalletMutationResponse>(endpoints.general.walletTransfer, payload),
  topUpWallet: (payload: WalletTopUpPayload) =>
    api.post<WalletMutationResponse>(endpoints.general.walletTopUp, payload),
};
