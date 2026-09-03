import { useQuery } from '@tanstack/react-query';
import { creatorDashboardApi } from '../../api/creatorDashboard.api';

export const creatorDashboardQueryKey = ['creator', 'dashboard'] as const;
export const creatorKulscanDashboardQueryKey = ['creator', 'kulscan', 'dashboard'] as const;

export const useCreatorDashboard = (enabled = true) => useQuery({
  queryKey: creatorDashboardQueryKey,
  queryFn: () => creatorDashboardApi.getDashboard().then((response) => response.data.data),
  enabled,
});

export const useCreatorKulscanDashboard = (enabled = true) => useQuery({
  queryKey: creatorKulscanDashboardQueryKey,
  queryFn: () => creatorDashboardApi.getKulscanDashboard().then((response) => response.data.data),
  enabled,
});
