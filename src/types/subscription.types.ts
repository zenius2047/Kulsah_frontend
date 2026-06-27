export type SubscriptionBillingInterval = 'monthly';

export type SubscriptionPlanPayload = {
  name?: string;
  description?: string | null;
  price?: number | string;
  currency?: string;
  billing_interval?: SubscriptionBillingInterval;
};

export type SubscriptionPlanIdentifier = string | number;
