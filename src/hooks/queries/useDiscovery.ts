import { useQuery } from '@tanstack/react-query';
import { discoveryApi } from '../../api/discovery.api';
import type { DiscoveryParams } from '../../types/discovery.types';
import { normalizeDiscoveryResponse } from '../../utils/discovery';

type UseDiscoveryOptions = {
  enabled?: boolean;
};

export const useDiscovery = (params: DiscoveryParams = {}, options: UseDiscoveryOptions = {}) =>
  useQuery({
    queryKey: ['general', 'discovery', params],
    queryFn: () => discoveryApi.getDiscovery(params)
      .then((response) => normalizeDiscoveryResponse(response.data)),
    enabled: options.enabled ?? true,
    staleTime: 60_000,
  });
