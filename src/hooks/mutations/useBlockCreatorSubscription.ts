import { useMutation } from '@tanstack/react-query';
import { subscriptionApi } from '../../api/subscription.api';
import type { BlockSubscriptionPayload, SubscriptionPlanIdentifier } from '../../types/subscription.types';

export const useBlockCreatorSubscription = () =>
  useMutation({
    mutationFn: async ({
      subscription,
      payload,
    }: {
      subscription: SubscriptionPlanIdentifier;
      payload: BlockSubscriptionPayload;
    }) => {
      const response = await subscriptionApi.blockSubscription(subscription, payload);
      return response.data;
    },
  });
