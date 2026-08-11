import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../../api/discovery.api';
import type { DiscoveryParams } from '../../types/discovery.types';

export const useDiscovery = (params: DiscoveryParams = {}) =>
  useQuery({
    queryKey: ['general', 'discovery', params],
    queryFn: () => discoveryApi.getDiscovery(params).then((response) => response.data),
    staleTime: 60_000,
  });
