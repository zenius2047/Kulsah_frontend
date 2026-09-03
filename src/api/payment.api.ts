import api from './client';
import { endpoints } from './endpoints';
import type { InitializePaymentPayload, PaymentResponse } from '../types/payment.types';

export const paymentApi = {
  initialize: (payload: InitializePaymentPayload) =>
    api.post<PaymentResponse>(endpoints.general.paymentInitialize, payload),
  get: (payment: string | number) =>
    api.get<PaymentResponse>(endpoints.general.payment(payment)),
  verify: (payment: string | number) =>
    api.post<PaymentResponse>(endpoints.general.paymentVerify(payment)),
};
