import api from './client';
import { endpoints } from './endpoints';
import type { CreatorDashboardResponse } from '../types/creatorDashboard.types';

export const creatorDashboardApi = {
  getDashboard: () => api.get<CreatorDashboardResponse>(endpoints.creator.dashboard),
  getKulscanDashboard: () => api.get<CreatorDashboardResponse>(endpoints.creator.kulscanDashboard),
};
