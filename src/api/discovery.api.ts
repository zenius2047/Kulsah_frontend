import api from './client';
import { endpoints } from './endpoints';
import type { DiscoveryHashtag, DiscoveryParams, DiscoveryResponse } from '../types/discovery.types';

export const discoveryApi = {
  getDiscovery: (params: DiscoveryParams = {}) =>
    api.get<DiscoveryResponse>(endpoints.general.discovery, { params }),
  recordView: (type: 'creator' | 'event' | 'video', itemId: string | number) =>
    api.post<{ message: string; meta: { type: string; item_id: number } }>(endpoints.general.discoveryView, {
      type,
      item_id: Number(itemId),
    }),
  searchHashtags: (query = '', limit = 30) =>
    api.get<{ data: DiscoveryHashtag[] }>(endpoints.general.discoveryHashtags, {
      params: { query: query.replace(/^#/, ''), limit },
    }),
};
