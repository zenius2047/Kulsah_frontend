import { useMutation } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { SubscriptionPlanIdentifier, SubscriptionPlanPayload } from '../../types/subscription.types';

export const useSubscribeToPlan = () =>
  useMutation({
    mutationFn: async ({
      subscriptionPlan,
      payload,
    }: {
      subscriptionPlan: SubscriptionPlanIdentifier;
      payload: SubscriptionPlanPayload;
    }) => {
      const response = await subscriptionApi.subscribeToPlan(subscriptionPlan, payload);
      return response.data;
    },
  });
