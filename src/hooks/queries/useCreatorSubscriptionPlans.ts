import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';

export const CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY = ['creator', 'subscription-plans'] as const;

export const useCreatorSubscriptionPlans = () =>
  useQuery({
    queryKey: CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY,
    queryFn: async () => {
      const response = await subscriptionApi.getCreatorPlans();
      return response.data;
    },
  });
