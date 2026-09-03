import api from './client';
import { endpoints } from './endpoints';
import type {
  ChallengeItemResponse,
  ChallengeShowResponse,
  CreatorBattleSettlementResponse,
  ChallengeActionResponse,
  ChallengeBallotPayload,
  ChallengeEntryPage,
  ChallengeListParams,
  ChallengePage,
  CreateChallengePayload,
  ChallengeEntryResponse,
  SubmitChallengeEntryPayload,
  SubmitChallengeJuryScorePayload,
  InviteChallengeParticipantPayload,
  InviteChallengeJuryPayload,
  SelectChallengeWinnerPayload,
  ResolveChallengeIntegrityFlagPayload,
  TransitionChallengePayload,
} from '../types/challenge.types';

export const unwrapChallengeShowResponse = (response: ChallengeShowResponse) => response.data.challenge;

export const challengesApi = {
  getChallenges: (params: ChallengeListParams = {}) =>
    api.get<ChallengePage>(endpoints.challenges.list, {
      params,
      paramsSerializer: { indexes: false },
    }),
  getChallenge: (challenge: string | number) =>
    api.get<ChallengeShowResponse>(endpoints.challenges.item(challenge)),
  getChallengeLeaderboard: (challenge: string | number, page = 1, perPage = 25) =>
    api.get<ChallengeEntryPage>(endpoints.challenges.leaderboard(challenge), {
      params: { page, per_page: perPage },
    }),
  castChallengeBallot: (challenge: string | number, payload: ChallengeBallotPayload) =>
    api.put<{ data: unknown }>(endpoints.challenges.ballot(challenge), payload),
  createChallenge: (payload: CreateChallengePayload) =>
    api.post<ChallengeItemResponse>(endpoints.creator.challenges, payload),
  createChallengeDraft: (payload: CreateChallengePayload) =>
    api.post<ChallengeItemResponse>(endpoints.creator.challengeDrafts, payload),
  updateChallenge: (challenge: string | number, payload: Partial<CreateChallengePayload>) =>
    api.patch<ChallengeItemResponse>(endpoints.creator.challenge(challenge), payload),
  transitionChallenge: (challenge: string | number, payload: TransitionChallengePayload) =>
    api.post<ChallengeItemResponse>(endpoints.creator.challengeTransition(challenge), payload),
  submitChallengeEntry: (challenge: string | number, payload: SubmitChallengeEntryPayload) =>
    api.post<ChallengeEntryResponse>(endpoints.creator.challengeEntries(challenge), payload),
  withdrawChallengeEntry: (challenge: string | number, entry: string | number) =>
    api.delete<ChallengeEntryResponse>(endpoints.creator.challengeEntry(challenge, entry)),
  submitChallengeJuryScore: (
    challenge: string | number,
    entry: string | number,
    payload: SubmitChallengeJuryScorePayload,
  ) => api.put<ChallengeActionResponse>(endpoints.creator.challengeEntryJuryScores(challenge, entry), payload),
  selectChallengeWinner: (
    challenge: string | number,
    entry: string | number,
    payload: SelectChallengeWinnerPayload,
  ) => api.post<ChallengeActionResponse>(endpoints.creator.challengeEntryWinner(challenge, entry), payload),
  finalizeChallenge: (challenge: string | number) =>
    api.post<ChallengeItemResponse>(endpoints.creator.challengeFinalize(challenge)),
  settleCreatorBattle: (challenge: string | number) =>
    api.post<CreatorBattleSettlementResponse>(endpoints.creator.challengeCreatorBattleSettlement(challenge)),
  inviteChallengeParticipant: (challenge: string | number, payload: InviteChallengeParticipantPayload) =>
    api.post<ChallengeActionResponse>(endpoints.creator.challengeInvites(challenge), payload),
  acceptChallengeInvite: (challenge: string | number, invite: string | number) =>
    api.post<ChallengeActionResponse>(endpoints.creator.challengeInviteAccept(challenge, invite)),
  inviteChallengeJury: (challenge: string | number, payload: InviteChallengeJuryPayload) =>
    api.post<ChallengeActionResponse>(endpoints.creator.challengeJury(challenge), payload),
  resolveChallengeIntegrityFlag: (
    challenge: string | number,
    integrityFlag: string | number,
    payload: ResolveChallengeIntegrityFlagPayload,
  ) => api.post<ChallengeActionResponse>(
    endpoints.creator.challengeIntegrityFlagResolve(challenge, integrityFlag),
    payload,
  ),
  processChallengeRewardAllocation: (challenge: string | number, allocation: string | number) =>
    api.post<ChallengeActionResponse>(endpoints.creator.challengeRewardAllocationProcess(challenge, allocation)),
};
