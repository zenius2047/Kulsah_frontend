import api from './client';
import { endpoints } from './endpoints';
import type {
  SubscriptionPlanIdentifier,
  SubscriptionPlanPayload,
} from '../types/subscription.types';

export const subscriptionApi = {
  subscribeToPlan: (subscriptionPlan: SubscriptionPlanIdentifier, payload: SubscriptionPlanPayload) =>
    api.post(`${endpoints.subscription.fanSubscribe}/${subscriptionPlan}/subscribe`, payload),
  updatePlan: (subscriptionPlan: SubscriptionPlanIdentifier, payload: SubscriptionPlanPayload) =>
    api.post(`${endpoints.subscription.creatorPlan}/${subscriptionPlan}`, payload),
};

export const subscribeToPlan = subscriptionApi.subscribeToPlan;
export const updateSubscriptionPlan = subscriptionApi.updatePlan;
