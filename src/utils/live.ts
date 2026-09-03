import type { LivePage, LiveSession } from '../types/live.types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const hasLiveSessionId = (value: Record<string, unknown>) => (
  (typeof value.id === 'string' && value.id.trim() !== '')
  || (typeof value.id === 'number' && Number.isFinite(value.id))
);

/**
 * Live endpoints have returned both resource envelopes and the resource itself.
 * Keep that transport detail out of screens and fail clearly if no session was
 * returned instead of letting an `undefined.id` error escape from the cache.
 */
export const normalizeLiveSessionResponse = (value: unknown): LiveSession => {
  let current = value;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isRecord(current)) break;

    if (hasLiveSessionId(current)) {
      return { ...current, id: String(current.id) } as unknown as LiveSession;
    }

    current = current.data
      ?? current.live
      ?? current.live_session
      ?? current.session;
  }

  throw new Error('The server did not return the created Live session. Please try again.');
};

export const isLiveTerminal = (status?: string | null) => (
  status === 'ended'
  || status === 'terminated'
  || status === 'cancelled'
  || status === 'failed'
);

export const flattenLivePages = (pages?: LivePage[]) => {
  const seen = new Set<string>();
  return (pages ?? []).flatMap((page) => page.data ?? []).filter((live) => {
    if (!live?.id || seen.has(live.id)) return false;
    seen.add(live.id);
    return true;
  });
};

export const nextLivePage = (page: LivePage) => {
  const currentPage = Number(page.meta?.current_page ?? 1);
  const lastPage = Number(page.meta?.last_page ?? currentPage);
  return currentPage < lastPage ? currentPage + 1 : undefined;
};

export const formatLiveCount = (value: number) => {
  const safeValue = Math.max(0, Number(value) || 0);
  if (safeValue >= 1_000_000) return `${(safeValue / 1_000_000).toFixed(safeValue >= 10_000_000 ? 0 : 1).replace('.0', '')}M`;
  if (safeValue >= 1_000) return `${(safeValue / 1_000).toFixed(safeValue >= 100_000 ? 0 : 1).replace('.0', '')}K`;
  return String(Math.floor(safeValue));
};

export const createLiveIdempotencyKey = (live: string | number, action: string, now = Date.now(), random = Math.random()) => (
  `live-${live}-${action}-${now}-${Math.floor(Math.max(0, random) * 1_000_000_000).toString(36)}`.slice(0, 120)
);

export const mergeLiveUpdate = (live: LiveSession, update: Partial<LiveSession>) => ({
  ...live,
  ...update,
});
