import { useQuery } from '@tanstack/react-query';
import { generalApi } from '../../api/general.api';

export const useWallet = () =>
  useQuery({
    queryKey: ['general', 'wallet'],
    queryFn: async () => {
      const response = await generalApi.getWallet();
      return response.data;
    },
  });

export const useWalletTransactions = (page = 1) =>
  useQuery({
    queryKey: ['general', 'wallet', 'transactions', page],
    queryFn: async () => {
      const response = await generalApi.getWalletTransactions(page);
      return response.data;
    },
  });

export const useWalletLedger = (page = 1) =>
  useQuery({
    queryKey: ['general', 'wallet', 'ledger', page],
    queryFn: async () => {
      const response = await generalApi.getWalletLedger(page);
      return response.data;
    },
  });

