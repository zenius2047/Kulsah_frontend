import type { Payment, PaymentMethod, PaymentPurchase } from '../types/payment.types';

const purchaseIdentifier = (purchase: PaymentPurchase) => {
  switch (purchase.purpose) {
    case 'kulcoin':
      return purchase.package_id;
    case 'subscription':
      return purchase.subscription_plan_id;
    case 'event_ticket':
      return `${purchase.event_id}-${purchase.ticket_type_code}-${purchase.quantity ?? 1}`;
  }
};

export const createPaymentIdempotencyKey = (
  purchase: PaymentPurchase,
  method: PaymentMethod,
  now = Date.now(),
  random = Math.random(),
) => {
  const nonce = Math.floor(Math.max(0, random) * 1_000_000_000).toString(36);
  return `mobile-${purchase.purpose}-${purchaseIdentifier(purchase)}-${method}-${now}-${nonce}`.slice(0, 120);
};

export const isPaymentFulfilled = (payment: Payment) => (
  payment.status === 'successful' && Boolean(payment.fulfilled_at)
);
