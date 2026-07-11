import { useInfiniteQuery } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { GeneralFeedParams, GeneralFeedResponse } from '../../types/general.types';

export const generalFeedQueryKey = (limit = 20) => ['general', 'feed', { limit }] as const;

const getCurrentPage = (page: GeneralFeedResponse) =>
  page.meta?.pagination?.current_page ?? page.meta?.pagination?.page ?? 1;

const getLastPage = (page: GeneralFeedResponse) =>
  page.meta?.pagination?.last_page;

export const useGeneralFeed = (params?: Omit<GeneralFeedParams, 'page'>) => {
  const limit = params?.limit ?? 20;

  return useInfiniteQuery({
    queryKey: generalFeedQueryKey(limit),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await generalApi.getFeed({ ...params, limit, page: pageParam });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const pagination = lastPage.meta?.pagination;
      const currentPage = getCurrentPage(lastPage);
      const explicitNextPage = pagination?.next_page;

      if (typeof explicitNextPage === 'number') return explicitNextPage;
      if (pagination?.has_more === true) return currentPage + 1;

      const last = getLastPage(lastPage);
      if (typeof last === 'number' && currentPage < last) return currentPage + 1;

      return undefined;
    },
  });
};

