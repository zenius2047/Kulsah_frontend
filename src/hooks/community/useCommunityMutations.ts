import { type InfiniteData, type Query, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '../../api/community.api';
import type {
  CommunityGiftPayload,
  CommunityPage,
  CommunityPost,
  CreateCommunityCommentPayload,
  CreateCommunityPostPayload,
} from '../../types/community.types';
import { communityCommentsQueryKey, communityPostQueryKey } from './useCommunityPosts';
import { optimisticCommunityLike } from '../../utils/community';

type CommunityFeedCache = InfiniteData<CommunityPage<CommunityPost>, number>;

const isCommunityFeedQuery = (query: Query) => {
  const key = query.queryKey;
  return key[0] === 'community'
    && key[1] === 'posts'
    && typeof key[2] === 'object'
    && key[2] !== null
    && 'perPage' in key[2];
};

const replacePostInFeed = (cache: CommunityFeedCache | undefined, post: CommunityPost) => cache ? ({
  ...cache,
  pages: cache.pages.map((page) => ({
    ...page,
    data: page.data.map((item) => String(item.id) === String(post.id) ? post : item),
  })),
}) : cache;

const updatePostInFeed = (
  cache: CommunityFeedCache | undefined,
  postId: string | number,
  update: (post: CommunityPost) => CommunityPost,
) => cache ? ({
  ...cache,
  pages: cache.pages.map((page) => ({
    ...page,
    data: page.data.map((item) => String(item.id) === String(postId) ? update(item) : item),
  })),
}) : cache;

const setPostAcrossCommunityFeeds = (
  queryClient: ReturnType<typeof useQueryClient>,
  post: CommunityPost,
) => queryClient.setQueriesData<CommunityFeedCache>(
  { predicate: isCommunityFeedQuery },
  (cache) => replacePostInFeed(cache, post),
);

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
      await Promise.all([
        queryClient.cancelQueries({ queryKey: communityPostQueryKey(post) }),
        queryClient.cancelQueries({ predicate: isCommunityFeedQuery }),
      ]);
      const previous = queryClient.getQueryData<CommunityPost>(communityPostQueryKey(post));
      const previousFeeds = queryClient.getQueriesData<CommunityFeedCache>({ predicate: isCommunityFeedQuery });
      if (previous) {
        queryClient.setQueryData<CommunityPost>(communityPostQueryKey(post), optimisticCommunityLike(previous, liked));
      }
      queryClient.setQueriesData<CommunityFeedCache>(
        { predicate: isCommunityFeedQuery },
        (cache) => updatePostInFeed(cache, post, (item) => optimisticCommunityLike(item, liked)),
      );
      return { previous, previousFeeds };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) queryClient.setQueryData(communityPostQueryKey(variables.post), context.previous);
      context?.previousFeeds.forEach(([key, cache]) => queryClient.setQueryData(key, cache));
    },
    onSuccess: (updatedPost, variables) => {
      queryClient.setQueryData(communityPostQueryKey(variables.post), updatedPost);
      queryClient.setQueryData(communityPostQueryKey(updatedPost.id), updatedPost);
      setPostAcrossCommunityFeeds(queryClient, updatedPost);
    },
  });
};

export const useAddCommunityComment = (post: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommunityCommentPayload) =>
      communityApi.addComment(post, payload).then((response) => response.data.data),
    onSuccess: async () => {
      const incrementComments = (item: CommunityPost): CommunityPost => ({
        ...item,
        stats: { ...item.stats, comments_count: item.stats.comments_count + 1 },
      });
      queryClient.setQueryData<CommunityPost>(communityPostQueryKey(post), (current) => current ? incrementComments(current) : current);
      queryClient.setQueriesData<CommunityFeedCache>(
        { predicate: isCommunityFeedQuery },
        (cache) => updatePostInFeed(cache, post, incrementComments),
      );
      await queryClient.invalidateQueries({ queryKey: communityCommentsQueryKey(post) });
    },
  });
};

export const useShareCommunityPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (post: string | number) => communityApi.sharePost(post).then((response) => response.data.data),
    onSuccess: (updatedPost, requestedPost) => {
      queryClient.setQueryData(communityPostQueryKey(requestedPost), updatedPost);
      queryClient.setQueryData(communityPostQueryKey(updatedPost.id), updatedPost);
      setPostAcrossCommunityFeeds(queryClient, updatedPost);
    },
  });
};

export const useGiftCommunityPost = (post: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommunityGiftPayload) => communityApi.giftPost(post, payload).then((response) => response.data),
    onSuccess: async (response) => {
      queryClient.setQueryData(communityPostQueryKey(post), response.data.post);
      queryClient.setQueryData(communityPostQueryKey(response.data.post.id), response.data.post);
      setPostAcrossCommunityFeeds(queryClient, response.data.post);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] }),
      ]);
    },
  });
};
