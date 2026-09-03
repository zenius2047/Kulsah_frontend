import { useMutation, useQueryClient } from '@tanstack/react-query';
import { challengesApi } from '../../api/challenges.api';
import type {
  ChallengeBallotPayload,
  CreateChallengePayload,
  InviteChallengeJuryPayload,
  InviteChallengeParticipantPayload,
  ResolveChallengeIntegrityFlagPayload,
  SelectChallengeWinnerPayload,
  SubmitChallengeEntryPayload,
  SubmitChallengeJuryScorePayload,
  TransitionChallengePayload,
} from '../../types/challenge.types';
import { challengeLeaderboardQueryKey, challengeQueryKey } from './useChallenges';

export const useCreateChallenge = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => challengesApi.createChallenge(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ['challenges'] }),
  });
};

export const useCreateChallengeDraft = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChallengePayload) => challengesApi.createChallengeDraft(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: ['challenges'] }),
  });
};

export const useUpdateChallenge = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: Partial<CreateChallengePayload> }) =>
      challengesApi.updateChallenge(challenge, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useTransitionChallenge = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: TransitionChallengePayload }) =>
      challengesApi.transitionChallenge(challenge, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useSubmitChallengeEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: SubmitChallengeEntryPayload }) =>
      challengesApi.submitChallengeEntry(challenge, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useCastChallengeBallot = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: ChallengeBallotPayload }) =>
      challengesApi.castChallengeBallot(challenge, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] });
    },
  });
};

export const useWithdrawChallengeEntry = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, entry }: { challenge: string | number; entry: string | number }) =>
      challengesApi.withdrawChallengeEntry(challenge, entry),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(variables.challenge) });
    },
  });
};

export const useSubmitChallengeJuryScore = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, entry, payload }: {
      challenge: string | number;
      entry: string | number;
      payload: SubmitChallengeJuryScorePayload;
    }) => challengesApi.submitChallengeJuryScore(challenge, entry, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(variables.challenge) });
    },
  });
};

export const useSelectChallengeWinner = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, entry, payload }: {
      challenge: string | number;
      entry: string | number;
      payload: SelectChallengeWinnerPayload;
    }) => challengesApi.selectChallengeWinner(challenge, entry, payload),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(variables.challenge) });
    },
  });
};

export const useFinalizeChallenge = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (challenge: string | number) => challengesApi.finalizeChallenge(challenge),
    onSuccess: (_, challenge) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useSettleCreatorBattle = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (challenge: string | number) => challengesApi.settleCreatorBattle(challenge),
    onSuccess: (_, challenge) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(challenge) });
      client.invalidateQueries({ queryKey: challengeLeaderboardQueryKey(challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
      client.invalidateQueries({ queryKey: ['general', 'wallet'] });
    },
  });
};

export const useInviteChallengeParticipant = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: InviteChallengeParticipantPayload }) =>
      challengesApi.inviteChallengeParticipant(challenge, payload),
    onSuccess: (_, variables) => client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) }),
  });
};

export const useAcceptChallengeInvite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, invite }: { challenge: string | number; invite: string | number }) =>
      challengesApi.acceptChallengeInvite(challenge, invite),
    onSuccess: (_, variables) => {
      client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) });
      client.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useInviteChallengeJury = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, payload }: { challenge: string | number; payload: InviteChallengeJuryPayload }) =>
      challengesApi.inviteChallengeJury(challenge, payload),
    onSuccess: (_, variables) => client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) }),
  });
};

export const useResolveChallengeIntegrityFlag = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, integrityFlag, payload }: {
      challenge: string | number;
      integrityFlag: string | number;
      payload: ResolveChallengeIntegrityFlagPayload;
    }) => challengesApi.resolveChallengeIntegrityFlag(challenge, integrityFlag, payload),
    onSuccess: (_, variables) => client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) }),
  });
};

export const useProcessChallengeRewardAllocation = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ challenge, allocation }: { challenge: string | number; allocation: string | number }) =>
      challengesApi.processChallengeRewardAllocation(challenge, allocation),
    onSuccess: (_, variables) => client.invalidateQueries({ queryKey: challengeQueryKey(variables.challenge) }),
  });
};
