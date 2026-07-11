export type SubscriptionBillingInterval = 'monthly';

export type SubscriptionPlanPayload = {
  name?: string;
  description?: string | null;
  price?: number | string;
  currency?: string;
  billing_interval?: SubscriptionBillingInterval;
};

export type SubscriptionPlanIdentifier = string | number;

export type CreatorSubscriptionPlan = {
  id: SubscriptionPlanIdentifier;
  creator_id: string | number;
  name: string;
  description?: string | null;
  price: string;
  currency: string;
  billing_interval: SubscriptionBillingInterval;
  is_active: boolean;
  creator?: {
    id: string | number;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
  };
  created_at?: string;
  updated_at?: string;
};

export type CreatorSubscriptionPlansResponse = {
  data: CreatorSubscriptionPlan[];
  meta?: {
    cache_hit?: boolean;
    cache_key?: string;
  };
};

export type BlockSubscriptionPayload = {
  reason: string;
  requires_admin_review: boolean;
};
