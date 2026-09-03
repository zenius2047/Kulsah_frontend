import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { communityApi } from '../../api/community.api';
import type { CommunityPage } from '../../types/community.types';
import type { PaginationMeta } from '../../types/general.types';

export const communityPostsQueryKey = (perPage = 20) => ['community', 'posts', { perPage }] as const;
export const communityPostQueryKey = (post?: string | number) => ['community', 'posts', post] as const;
export const communityCommentsQueryKey = (post?: string | number, perPage = 20) =>
  ['community', 'posts', post, 'comments', { perPage }] as const;
export const communityHistoryQueryKey = (perPage = 20, type = 'all') =>
  ['community', 'history', { perPage, type }] as const;

const paginationOf = <T,>(page: CommunityPage<T>) =>
  (page.meta && 'pagination' in page.meta && page.meta.pagination ? page.meta.pagination : page.meta) as PaginationMeta | undefined;

const nextPage = <T,>(page: CommunityPage<T>) => {
  const pagination = paginationOf(page);
  const current = Number(pagination?.current_page ?? pagination?.page ?? 1);
  if (pagination?.next_page != null) return pagination.next_page;
  if (pagination?.has_more) return current + 1;
  if (pagination?.last_page && current < pagination.last_page) return current + 1;
  if (page.links?.next) return current + 1;
  return undefined;
};

export const useCommunityPosts = (perPage = 20) =>
  useInfiniteQuery({
    queryKey: communityPostsQueryKey(perPage),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityApi.getPosts(pageParam, perPage).then((response) => response.data),
    getNextPageParam: nextPage,
  });

export const useCommunityPost = (post?: string | number) =>
  useQuery({
    queryKey: communityPostQueryKey(post),
    queryFn: () => communityApi.getPost(post!).then((response) => response.data.data),
    enabled: post !== undefined && post !== null && post !== '',
    retry: (count, error: any) => error?.response?.status !== 403 && count < 2,
  });

export const useCommunityHistory = (
  perPage = 20,
  type: 'all' | Exclude<import('../../types/community.types').CommunityPost['type'], 'live'> = 'all',
) => useInfiniteQuery({
  queryKey: communityHistoryQueryKey(perPage, type),
  initialPageParam: 1,
  queryFn: ({ pageParam }) => communityApi.getHistory(pageParam, perPage, type).then((response) => response.data),
  getNextPageParam: nextPage,
});

export const useCommunityComments = (post?: string | number, perPage = 20) =>
  useInfiniteQuery({
    queryKey: communityCommentsQueryKey(post, perPage),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => communityApi.getComments(post!, pageParam, perPage).then((response) => response.data),
    getNextPageParam: nextPage,
    enabled: post !== undefined && post !== null && post !== '',
  });
