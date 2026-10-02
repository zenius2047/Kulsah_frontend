import api from './client';
import { endpoints } from './endpoints';
import type {
  BlockSubscriptionPayload,
  CreatorSubscriptionPlansResponse,
  SubscriptionPlanIdentifier,
  SubscriptionPlanPayload,
} from '../types/subscription.types';

export const subscriptionApi = {
  getCreatorAudience: () => api.get<{
    data: {
      subscribers: Array<{ id: string; user_id: string; name?: string | null; handle?: string | null; avatar?: string | null; tier?: string | null; status: string; joined_at?: string | null; value?: { amount?: string | number | null; currency?: string | null } | null }>;
      followers: Array<{ id: string; user_id: string; name?: string | null; handle?: string | null; avatar?: string | null; followed_at?: string | null }>;
      following: Array<{ id: string; user_id: string; name?: string | null; handle?: string | null; avatar?: string | null; followed_at?: string | null }>;
    };
  }>(endpoints.subscription.creatorAudience),
  subscribeToPlan: (subscriptionPlan: SubscriptionPlanIdentifier, payload: SubscriptionPlanPayload) =>
    api.post(`${endpoints.subscription.fanSubscribe}/${subscriptionPlan}/subscribe`, payload),
  getCreatorPlans: () =>
    api.get<CreatorSubscriptionPlansResponse>(endpoints.subscription.creatorPlan),
  getPublicCreatorPlans: (creator: SubscriptionPlanIdentifier) =>
    api.get<CreatorSubscriptionPlansResponse>(endpoints.subscription.publicCreatorPlans(creator)),
  createPlan: (payload: Required<Pick<SubscriptionPlanPayload, 'name' | 'price' | 'currency' | 'billing_interval'>> & Pick<SubscriptionPlanPayload, 'description'>) =>
    api.post(endpoints.subscription.creatorPlan, payload),
  updatePlan: (subscriptionPlan: SubscriptionPlanIdentifier, payload: SubscriptionPlanPayload) =>
    api.patch(endpoints.subscription.creatorPlanItem(subscriptionPlan), payload),
  disablePlan: (subscriptionPlan: SubscriptionPlanIdentifier) =>
    api.post(endpoints.subscription.creatorPlanDisable(subscriptionPlan)),
  blockSubscription: (subscription: SubscriptionPlanIdentifier, payload: BlockSubscriptionPayload) =>
    api.post(endpoints.subscription.creatorSubscriptionBlock(subscription), payload),
};

export const subscribeToPlan = subscriptionApi.subscribeToPlan;
export const createSubscriptionPlan = subscriptionApi.createPlan;
export const updateSubscriptionPlan = subscriptionApi.updatePlan;
export const disableSubscriptionPlan = subscriptionApi.disablePlan;
export const blockCreatorSubscription = subscriptionApi.blockSubscription;
