import { useQuery } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { SubscriptionPlanIdentifier } from '../../types/subscription.types';

export const usePublicCreatorSubscriptionPlans = (creator?: SubscriptionPlanIdentifier) =>
  useQuery({
    queryKey: ['creator-fan', 'creators', creator, 'subscription-plans'],
    queryFn: async () => {
      if (creator == null) {
        throw new Error('Creator is required.');
      }

      const response = await subscriptionApi.getPublicCreatorPlans(creator);
      return response.data;
    },
    enabled: creator != null,
  });
