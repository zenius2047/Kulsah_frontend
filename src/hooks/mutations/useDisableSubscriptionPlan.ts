import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { SubscriptionPlanIdentifier } from '../../types/subscription.types';
import { CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY } from '../queries/useCreatorSubscriptionPlans';

export const useDisableSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subscriptionPlan: SubscriptionPlanIdentifier) => {
      const response = await subscriptionApi.disablePlan(subscriptionPlan);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY });
    },
  });
};
