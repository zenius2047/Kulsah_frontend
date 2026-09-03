import { useQuery } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';
import type { GeneralFeedParams } from '../../types/general.types';

export const recommendationsQueryKey = (params: GeneralFeedParams = {}) =>
  ['general', 'recommendations', params] as const;

export const useRecommendations = (params: GeneralFeedParams = {}, enabled = true) => useQuery({
  queryKey: recommendationsQueryKey(params),
  queryFn: () => generalApi.getRecommendations(params).then((response) => response.data),
  enabled,
});
