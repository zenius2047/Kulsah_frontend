import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kulCoinApi } from '../../api/kulcoin.api';
import type { IssueKulCoinBonusPayload, SendKulCoinGiftPayload } from '../../types/kulcoin.types';

export const kulCoinWalletQueryKey = ['kulcoin', 'wallet'] as const;
export const kulCoinGiftsQueryKey = ['kulcoin', 'gifts'] as const;
export const kulCoinPackagesQueryKey = ['kulcoin', 'packages'] as const;

export const useKulCoinWallet = (enabled = true) => useQuery({
  queryKey: kulCoinWalletQueryKey,
  queryFn: () => kulCoinApi.getWallet().then((response) => response.data.data),
  enabled,
});

export const useKulCoinGifts = (enabled = true) => useQuery({
  queryKey: kulCoinGiftsQueryKey,
  queryFn: () => kulCoinApi.getGifts().then((response) => response.data.data),
  enabled,
  staleTime: 5 * 60 * 1000,
});

export const useKulCoinPackages = (enabled = true) => useQuery({
  queryKey: kulCoinPackagesQueryKey,
  queryFn: () => kulCoinApi.getPackages().then((response) => response.data.data),
  enabled,
  staleTime: 5 * 60 * 1000,
});

export const useSendKulCoinGift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendKulCoinGiftPayload) =>
      kulCoinApi.sendGift(payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kulCoinWalletQueryKey }),
  });
};

export const useIssueKulCoinBonus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IssueKulCoinBonusPayload) =>
      kulCoinApi.issueBonus(payload).then((response) => response.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: kulCoinWalletQueryKey }),
  });
};
