import { useInfiniteQuery } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { GeneralCommentsParams, GeneralCommentsResponse, PaginationMeta } from '../../types/general.types';

export const videoCommentsQueryKey = (video?: string | number, perPage = 20) =>
  ['general', 'videos', video, 'comments', { perPage }] as const;

const getPagination = (page: GeneralCommentsResponse): PaginationMeta | undefined => {
  const meta = page.meta;
  if (!meta) return undefined;

  if ('pagination' in meta && meta.pagination) {
    return meta.pagination;
  }

  return meta as PaginationMeta;
};

const getCurrentPage = (page: GeneralCommentsResponse) =>
  getPagination(page)?.current_page ?? getPagination(page)?.page ?? 1;

export const useVideoComments = (
  video?: string | number,
  params?: Omit<GeneralCommentsParams, 'page'>,
  enabled = true,
) => {
  const perPage = params?.per_page ?? 20;

  return useInfiniteQuery({
    queryKey: videoCommentsQueryKey(video, perPage),
    enabled: enabled && video != null,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      if (video == null) {
        throw new Error('Video is required.');
      }

      const response = await generalApi.getVideoComments(video, {
        ...params,
        per_page: perPage,
        page: Number(pageParam),
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = getPagination(lastPage);
      const currentPage = getCurrentPage(lastPage);
      const explicitNextPage = pagination?.next_page;

      if (typeof explicitNextPage === 'number') return explicitNextPage;
      if (pagination?.has_more === true) return currentPage + 1;
      if (lastPage.links?.next) return currentPage + 1;

      const lastPageNumber = pagination?.last_page;
      if (typeof lastPageNumber === 'number' && currentPage < lastPageNumber) {
        return currentPage + 1;
      }

      return undefined;
    },
  });
};
