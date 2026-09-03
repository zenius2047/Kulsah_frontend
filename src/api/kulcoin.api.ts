import api from './client';
import { endpoints } from './endpoints';
import type {
  CastKulCoinVotePayload,
  KulCoinGiftListResponse,
  KulCoinLedgerResponse,
  KulCoinPackageListResponse,
  KulCoinTransactionResponse,
  KulCoinWalletResponse,
  IssueKulCoinBonusPayload,
  PurchaseKulCoinPayload,
  SendKulCoinGiftPayload,
} from '../types/kulcoin.types';

export const kulCoinApi = {
  getWallet: () => api.get<KulCoinWalletResponse>(endpoints.general.kulCoinWallet),
  getLedger: (page?: number) => api.get<KulCoinLedgerResponse>(endpoints.general.kulCoinLedger, {
    params: page ? { page } : undefined,
  }),
  getPackages: () => api.get<KulCoinPackageListResponse>(endpoints.general.kulCoinPackages),
  getGifts: () => api.get<KulCoinGiftListResponse>(endpoints.general.kulCoinGifts),
  purchase: (payload: PurchaseKulCoinPayload) =>
    api.post<KulCoinTransactionResponse>(endpoints.general.kulCoinPurchase, payload),
  sendGift: (payload: SendKulCoinGiftPayload) =>
    api.post<KulCoinTransactionResponse>(endpoints.general.kulCoinGiftSend, payload),
  castVote: (payload: CastKulCoinVotePayload) =>
    api.post<KulCoinTransactionResponse>(endpoints.general.kulCoinVotes, payload),
  issueBonus: (payload: IssueKulCoinBonusPayload) =>
    api.post<KulCoinTransactionResponse>(endpoints.general.kulCoinBonus, payload),
};
