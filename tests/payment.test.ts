import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';
import { createPaymentIdempotencyKey, isPaymentFulfilled } from '../src/utils/payment';
import type { Payment } from '../src/types/payment.types';

const payment = (overrides: Partial<Payment> = {}): Payment => ({
  id: 4,
  reference: 'KUL-TEST',
  purpose: 'kulcoin',
  amount: 20,
  amount_minor: 2000,
  currency: 'GHS',
  status: 'pending',
  channel: 'card',
  ...overrides,
});

describe('payment frontend contract', () => {
  it('matches the backend initialize, show, and verify routes', () => {
    expect(endpoints.general.paymentInitialize).toBe('general/payments/paystack/initialize');
    expect(endpoints.general.payment(14)).toBe('general/payments/14');
    expect(endpoints.general.paymentVerify(14)).toBe('general/payments/14/verify');
  });

  it('creates deterministic attempt keys when its inputs are stable', () => {
    const purchase = { purpose: 'subscription' as const, subscription_plan_id: 9 };
    expect(createPaymentIdempotencyKey(purchase, 'card', 1000, 0.25))
      .toBe(createPaymentIdempotencyKey(purchase, 'card', 1000, 0.25));
    expect(createPaymentIdempotencyKey(purchase, 'card', 1000, 0.25))
      .not.toBe(createPaymentIdempotencyKey(purchase, 'mobile_money', 1000, 0.25));
  });

  it('only completes after backend fulfillment', () => {
    expect(isPaymentFulfilled(payment({ status: 'successful', fulfilled_at: null }))).toBe(false);
    expect(isPaymentFulfilled(payment({ status: 'successful', fulfilled_at: '2026-08-27T10:00:00Z' }))).toBe(true);
  });
});
