export type PaymentMethod = 'card' | 'mobile_money';

export type MobileMoneyProvider = 'mtn' | 'vod' | 'tgo';

export type PaymentPurchase =
  | { purpose: 'kulcoin'; package_id: string | number }
  | { purpose: 'subscription'; subscription_plan_id: string | number }
  | {
      purpose: 'event_ticket';
      event_id: string | number;
      ticket_type_code: string;
      quantity?: number;
    };

export type InitializePaymentPayload = PaymentPurchase & {
  method: PaymentMethod;
  provider?: MobileMoneyProvider;
  phone?: string;
  idempotency_key?: string;
};

export type PaymentStatus = 'pending' | 'processing' | 'successful' | 'failed';

export type Payment = {
  id: string | number;
  reference: string;
  purpose: PaymentPurchase['purpose'];
  amount: number;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  provider_status?: string | null;
  channel: PaymentMethod;
  authorization_url?: string | null;
  access_code?: string | null;
  paid_at?: string | null;
  fulfilled_at?: string | null;
};

export type PaymentResponse = { data: Payment };
