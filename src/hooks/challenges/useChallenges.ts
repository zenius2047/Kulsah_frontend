import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { challengesApi, unwrapChallengeShowResponse } from '../../api/challenges.api';
import type { ChallengeEntryPage, ChallengePage } from '../../types/challenge.types';

const CHALLENGE_PAGE_SIZE = 100;

export const challengesQueryKey = ['challenges', { per_page: CHALLENGE_PAGE_SIZE }] as const;
export const challengeQueryKey = (challenge?: string | number) => ['challenge', challenge] as const;
export const challengeLeaderboardQueryKey = (challenge?: string | number) => ['challenge', challenge, 'leaderboard'] as const;

const nextChallengePage = (page: ChallengePage) => {
  const current = Number(page.meta?.current_page ?? 1);
  if (page.meta?.last_page && current < page.meta.last_page) return current + 1;
  if (page.links?.next) return current + 1;
  return undefined;
};

export const useChallenges = () => useInfiniteQuery({
  queryKey: challengesQueryKey,
  initialPageParam: 1,
  queryFn: ({ pageParam }) => challengesApi.getChallenges({
    page: Number(pageParam),
    per_page: CHALLENGE_PAGE_SIZE,
  }).then((response) => response.data),
  getNextPageParam: nextChallengePage,
});

export const useChallenge = (challenge?: string | number, enabled = true) => useQuery({
  queryKey: challengeQueryKey(challenge),
  queryFn: () => challengesApi.getChallenge(challenge!).then((response) => unwrapChallengeShowResponse(response.data)),
  enabled: enabled && challenge !== undefined && challenge !== null && challenge !== '',
});

const nextLeaderboardPage = (page: ChallengeEntryPage) => {
  const current = Number(page.meta?.current_page ?? 1);
  if (page.meta?.last_page && current < page.meta.last_page) return current + 1;
  if (page.links?.next) return current + 1;
  return undefined;
};

export const useChallengeLeaderboard = (challenge?: string | number, perPage = 25) => useInfiniteQuery({
  queryKey: [...challengeLeaderboardQueryKey(challenge), { perPage }],
  initialPageParam: 1,
  queryFn: ({ pageParam }) => challengesApi
    .getChallengeLeaderboard(challenge!, Number(pageParam), perPage)
    .then((response) => response.data),
  getNextPageParam: nextLeaderboardPage,
  enabled: challenge !== undefined && challenge !== null && challenge !== '',
});
