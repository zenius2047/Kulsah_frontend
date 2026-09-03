import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { liveApi } from '../../api/live.api';
import type {
  CreateLivePayload,
  LiveHeartbeatPayload,
  LivePage,
  LiveSession,
  SendLiveGiftPayload,
} from '../../types/live.types';
import { nextLivePage, normalizeLiveSessionResponse } from '../../utils/live';

export const liveQueryKeys = {
  all: ['live'] as const,
  discovery: () => ['live', 'discovery'] as const,
  session: (liveSession: string | number) => ['live', 'session', String(liveSession)] as const,
  analytics: (liveSession: string | number) => ['live', 'analytics', String(liveSession)] as const,
};

export const setCachedLiveSession = (client: QueryClient, live: LiveSession) => {
  client.setQueryData(liveQueryKeys.session(live.id), live);
  client.setQueriesData<InfiniteData<LivePage>>(
    { queryKey: liveQueryKeys.discovery() },
    (current) => current ? {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        data: page.data.map((item) => item.id === live.id ? live : item),
      })),
    } : current,
  );
};

export const patchCachedLiveSession = (
  client: QueryClient,
  liveSession: string | number,
  patch: Partial<LiveSession>,
) => {
  const id = String(liveSession);
  client.setQueryData<LiveSession>(liveQueryKeys.session(id), (current) => (
    current ? { ...current, ...patch } : current
  ));
  client.setQueriesData<InfiniteData<LivePage>>(
    { queryKey: liveQueryKeys.discovery() },
    (current) => current ? {
      ...current,
      pages: current.pages.map((page) => ({
        ...page,
        data: page.data.map((item) => item.id === id ? { ...item, ...patch } : item),
      })),
    } : current,
  );
};

const invalidateLive = (client: QueryClient, liveSession?: string | number) => {
  void client.invalidateQueries({ queryKey: liveQueryKeys.discovery() });
  if (liveSession != null) {
    void client.invalidateQueries({ queryKey: liveQueryKeys.session(liveSession) });
  }
};

export const useLiveDiscovery = (enabled = true) => useInfiniteQuery({
  queryKey: liveQueryKeys.discovery(),
  queryFn: ({ pageParam }) => liveApi.discover({ page: pageParam, per_page: 20 }).then((response) => response.data),
  initialPageParam: 1,
  getNextPageParam: nextLivePage,
  enabled,
  staleTime: 15_000,
});

export const useLiveSession = (liveSession?: string | number, enabled = true) => useQuery({
  queryKey: liveQueryKeys.session(liveSession ?? ''),
  queryFn: () => liveApi.get(liveSession!).then((response) => response.data.data),
  enabled: enabled && liveSession != null && String(liveSession).trim() !== '',
  refetchInterval: 20_000,
});

export const useCreateLive = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLivePayload) => liveApi.create(payload)
      .then((response) => normalizeLiveSessionResponse(response.data)),
    onSuccess: (live) => {
      setCachedLiveSession(client, live);
      invalidateLive(client);
    },
  });
};

export const useStartLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => liveApi.start(liveSession).then((response) => response.data),
    onSuccess: ({ data }) => setCachedLiveSession(client, data),
  });
};

export const useConfirmLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => liveApi.confirm(liveSession).then((response) => response.data.data),
    onSuccess: (live) => {
      setCachedLiveSession(client, live);
      invalidateLive(client);
    },
  });
};

export const useReconnectLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => liveApi.reconnect(liveSession).then((response) => response.data.data),
    onSuccess: (live) => setCachedLiveSession(client, live),
  });
};

export const useLiveHeartbeat = (liveSession: string | number) => useMutation({
  mutationFn: (payload: LiveHeartbeatPayload) => liveApi.heartbeat(liveSession, payload),
});

export const useEndLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (reason?: 'creator_ended' | 'provider_failure' | 'network_timeout') =>
      liveApi.end(liveSession, reason).then((response) => response.data.data),
    onSuccess: (live) => {
      setCachedLiveSession(client, live);
      invalidateLive(client);
    },
  });
};

export const useJoinLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => liveApi.join(liveSession).then((response) => response.data),
    onSuccess: ({ data }) => setCachedLiveSession(client, data),
  });
};

export const useLeaveLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => liveApi.leave(liveSession),
    onSettled: () => invalidateLive(client, liveSession),
  });
};

export const useCommentOnLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => liveApi.comment(liveSession, body).then((response) => response.data.data),
    onSuccess: () => {
      const current = client.getQueryData<LiveSession>(liveQueryKeys.session(liveSession));
      patchCachedLiveSession(client, liveSession, {
        comments_count: (current?.comments_count ?? 0) + 1,
      });
    },
  });
};

export const useLikeLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (count: number) => liveApi.like(liveSession, count).then((response) => response.data.data),
    onSuccess: ({ likes_count }) => patchCachedLiveSession(client, liveSession, { likes_count }),
  });
};

export const useGiftLive = (liveSession: string | number) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendLiveGiftPayload) => liveApi.gift(liveSession, payload).then((response) => response.data.data),
    onSuccess: () => {
      invalidateLive(client, liveSession);
      void client.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] });
      void client.invalidateQueries({ queryKey: ['kulcoin', 'ledger'] });
    },
  });
};

export const useLiveAnalytics = (liveSession?: string | number, enabled = true) => useQuery({
  queryKey: liveQueryKeys.analytics(liveSession ?? ''),
  queryFn: () => liveApi.analytics(liveSession!).then((response) => response.data.data),
  enabled: enabled && liveSession != null && String(liveSession).trim() !== '',
});
