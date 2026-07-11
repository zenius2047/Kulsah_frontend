import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { SubscriptionPlanPayload } from '../../types/subscription.types';
import { CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY } from '../queries/useCreatorSubscriptionPlans';

type CreateSubscriptionPlanPayload = Required<
  Pick<SubscriptionPlanPayload, 'name' | 'price' | 'currency' | 'billing_interval'>
> &
  Pick<SubscriptionPlanPayload, 'description'>;

export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSubscriptionPlanPayload) => {
      const response = await subscriptionApi.createPlan(payload);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CREATOR_SUBSCRIPTION_PLANS_QUERY_KEY });
    },
  });
};
