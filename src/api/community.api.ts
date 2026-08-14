import api from './client';
import { endpoints } from './endpoints';
import type {
  CommunityComment,
  CommunityGiftPayload,
  CommunityGiftResponse,
  CommunityItemResponse,
  CommunityPage,
  CommunityPost,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
} from '../types/community.types';
import { getCommunityPostFormEntries } from '../utils/community';

const communityPostEndpointId = (post: string | number) => {
  if (typeof post === 'number') return post;
  const match = /^post_(\d+)$/.exec(post);
  return match ? Number(match[1]) : post;
};

export const createCommunityPostFormData = (payload: CreateCommunityPostPayload) => {
  const formData = new FormData();
  getCommunityPostFormEntries(payload).forEach(([key, value]) => formData.append(key, value as any));
  return formData;
};

export const communityApi = {
  getPosts: (page = 1, perPage = 20) =>
    api.get<CommunityPage<CommunityPost>>(endpoints.general.communityPosts, {
      params: { page, per_page: perPage },
    }),
  createPost: (payload: CreateCommunityPostPayload, onUploadProgress?: (percentage: number) => void) => {
    const hasMultipartData = Boolean(payload.media?.length || payload.poll);
    const body = hasMultipartData ? createCommunityPostFormData(payload) : {
      type: payload.type,
      audience: payload.audience,
      ...(payload.content?.trim() ? { content: payload.content.trim() } : {}),
    };
    return api.post<CommunityItemResponse<CommunityPost>>(endpoints.creator.communityPosts, body, {
      onUploadProgress: (event) => {
        if (event.total && onUploadProgress) onUploadProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
  },
  getPost: (post: string | number) =>
    api.get<CommunityItemResponse<CommunityPost>>(endpoints.general.communityPost(communityPostEndpointId(post))),
  recordView: (post: string | number) =>
    api.post<{ message: string; meta: { community_post_id: number } }>(endpoints.general.communityPostView(communityPostEndpointId(post))),
  getComments: (post: string | number, page = 1, perPage = 20) =>
    api.get<CommunityPage<CommunityComment>>(endpoints.general.communityPostComments(communityPostEndpointId(post)), {
      params: { page, per_page: perPage },
    }),
  addComment: (post: string | number, payload: CreateCommunityCommentPayload) =>
    api.post<CommunityItemResponse<CommunityComment>>(endpoints.general.communityPostComments(communityPostEndpointId(post)), payload),
  likePost: (post: string | number) =>
    api.post<CommunityItemResponse<CommunityPost>>(endpoints.general.communityPostLike(communityPostEndpointId(post))),
  unlikePost: (post: string | number) =>
    api.delete<CommunityItemResponse<CommunityPost>>(endpoints.general.communityPostLike(communityPostEndpointId(post))),
  sharePost: (post: string | number) =>
    api.post<CommunityItemResponse<CommunityPost>>(endpoints.general.communityPostShare(communityPostEndpointId(post))),
  voteOnPoll: (post: string | number, optionId: string | number) =>
    api.post<CommunityItemResponse<CommunityPost>>(endpoints.general.communityPostPollVote(communityPostEndpointId(post)), {
      option_id: Number(optionId),
    }),
  giftPost: (post: string | number, payload: CommunityGiftPayload) =>
    api.post<CommunityGiftResponse>(endpoints.general.communityPostGift(communityPostEndpointId(post)), payload),
};

export { communityPostEndpointId };
