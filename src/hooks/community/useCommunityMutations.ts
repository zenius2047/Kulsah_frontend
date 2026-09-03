import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../../api/community.api';
import type {
  CommunityGiftPayload,
  CommunityPost,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
} from '../../types/community.types';
import { communityCommentsQueryKey, communityPostQueryKey } from './useCommunityPosts';
import { optimisticCommunityLike } from '../../utils/community';

export const useCreateCommunityPost = (onUploadProgress?: (percentage: number) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityPostPayload) =>
      communityApi.createPost(payload, onUploadProgress).then((response) => response.data.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
};

export const useCommunityLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ post, liked }: { post: string | number; liked: boolean }) =>
      (liked ? communityApi.likePost(post) : communityApi.unlikePost(post)).then((response) => response.data.data),
    onMutate: async ({ post, liked }) => {
      await queryClient.cancelQueries({ queryKey: communityPostQueryKey(post) });
      const previous = queryClient.getQueryData<CommunityPost>(communityPostQueryKey(post));
      if (previous) {
        queryClient.setQueryData<CommunityPost>(communityPostQueryKey(post), optimisticCommunityLike(previous, liked));
      }
      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) queryClient.setQueryData(communityPostQueryKey(variables.post), context.previous);
    },
    onSuccess: (post) => queryClient.setQueryData(communityPostQueryKey(post.id), post),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
  });
};

export const useAddCommunityComment = (post: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityCommentPayload) =>
      communityApi.addComment(post, payload).then((response) => response.data.data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: communityCommentsQueryKey(post) }),
        queryClient.invalidateQueries({ queryKey: communityPostQueryKey(post) }),
        queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
      ]);
    },
  });
};

export const useShareCommunityPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: string | number) => communityApi.sharePost(post).then((response) => response.data.data),
    onSuccess: (post) => {
      queryClient.setQueryData(communityPostQueryKey(post.id), post);
      void queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};

export const useGiftCommunityPost = (post: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommunityGiftPayload) => communityApi.giftPost(post, payload).then((response) => response.data),
    onSuccess: async (response) => {
      queryClient.setQueryData(communityPostQueryKey(response.data.post.id), response.data.post);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['community', 'posts'] }),
        queryClient.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] }),
      ]);
    },
  });
};
