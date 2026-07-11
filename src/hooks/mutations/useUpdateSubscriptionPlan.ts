import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { SubscriptionPlanIdentifier, SubscriptionPlanPayload } from '../../types/subscription.types';
import { CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY } from '../queries/useCreatorSubscriptionPlans';

export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subscriptionPlan,
      payload,
    }: {
      subscriptionPlan: SubscriptionPlanIdentifier;
      payload: SubscriptionPlanPayload;
    }) => {
      const response = await subscriptionApi.updatePlan(subscriptionPlan, payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY });
    },
  });
};
