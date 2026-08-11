import api from './client';
import { endpoints } from './endpoints';
import type { DiscoveryParams, DiscoveryResponse } from '../types/discovery.types';

export const discoveryApi = {
  getDiscovery: (params: DiscoveryParams = {}) =>
    api.get<DiscoveryResponse>(endpoints.general.discovery, { params }),
};
