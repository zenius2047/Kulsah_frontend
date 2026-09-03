import type { PaginationMeta } from './general.types';

export type KulCoinWallet = {
  id: string | number;
  user_id: string | number;
  account_key: string;
  account_name: string;
  currency_code: string;
  available_kc: number;
  bonus_kc: number;
  total_kc: number;
  status: string;
  last_ledger_at?: string | null;
  created_at?: string | null;
};

export type KulCoinGift = {
  id: string | number;
  code: string;
  name: string;
  category: string;
  coin_cost: number;
  sort_order: number;
  is_active: boolean;
  icon_url?: string | null;
  animation_url?: string | null;
  metadata: Record<string, unknown>;
};

export type KulCoinPackage = {
  id: string | number;
  code: string;
  name: string;
  coin_amount: number;
  bonus_coin_amount: number;
  usd_price: string;
  currency_code: string;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
};

export type KulCoinLedgerEntry = {
  id: string | number;
  kulcoin_transaction_id: string | number;
  kulcoin_wallet_id: string | number;
  entry_type: string;
  balance_bucket: string;
  amount_kc: number;
  running_balance_kc: number;
  narration?: string | null;
  metadata: Record<string, unknown>;
  settlement_available_at?: string | null;
  settled_at?: string | null;
  created_at?: string | null;
};

export type KulCoinTransaction = {
  id: string | number;
  reference: string;
  idempotency_key?: string | null;
  type: string;
  status: string;
  user_id: string | number;
  counterparty_wallet_id?: string | number | null;
  package_id?: string | number | null;
  gift_id?: string | number | null;
  local_currency?: string | null;
  local_amount?: string | number | null;
  usd_amount?: string | number | null;
  coin_amount: number;
  bonus_coin_amount: number;
  net_coin_amount: number;
  description?: string | null;
  metadata: Record<string, unknown>;
  processed_at?: string | null;
  created_at?: string | null;
  wallet?: KulCoinWallet;
  counterparty_wallet?: KulCoinWallet;
  package?: KulCoinPackage;
  gift?: KulCoinGift;
  entries?: KulCoinLedgerEntry[];
};

export type KulCoinWalletResponse = { data: KulCoinWallet };
export type KulCoinGiftListResponse = { data: KulCoinGift[] };
export type KulCoinPackageListResponse = { data: KulCoinPackage[] };
export type KulCoinLedgerResponse = { data: KulCoinLedgerEntry[]; meta?: PaginationMeta };
export type KulCoinTransactionResponse = { message: string; data: KulCoinTransaction };

export type SendKulCoinGiftPayload = {
  gift_id: string | number;
  creator_id: string | number;
  quantity?: number;
  message?: string;
  idempotency_key?: string;
  device_info?: Record<string, unknown>;
};

export type PurchaseKulCoinPayload = {
  package_id: string | number;
  payment_reference?: string;
  local_currency?: string;
  local_amount?: number;
  usd_amount?: number;
  idempotency_key?: string;
  device_info?: Record<string, unknown>;
};

export type CastKulCoinVotePayload = {
  contest_type: string;
  contest_id?: string;
  target_id?: string | number;
  vote_count?: number;
  idempotency_key?: string;
  device_info?: Record<string, unknown>;
};

export type IssueKulCoinBonusPayload = {
  user_id: string | number;
  coins: number;
  reason?: string;
};
