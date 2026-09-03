import type {
  DiscoveryCreator,
  DiscoveryEvent,
  DiscoveryResponse,
  DiscoveryVideo,
} from '../types/discovery.types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const finiteNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * The discovery endpoint has used both a direct payload and a Laravel-style
 * `data` resource envelope. Callers always receive one stable shape.
 */
export const normalizeDiscoveryResponse = (value: unknown): DiscoveryResponse => {
  let current = value;
  let rawMeta: Record<string, unknown> | undefined;
  let payload: Record<string, unknown> | undefined;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!isRecord(current)) break;
    if (!rawMeta && isRecord(current.meta)) rawMeta = current.meta;

    if (Array.isArray(current.creators) || Array.isArray(current.events) || Array.isArray(current.videos)) {
      payload = current;
      break;
    }

    current = current.data;
  }

  if (!payload) {
    throw new Error('The server returned an invalid discovery response.');
  }

  const creators = Array.isArray(payload.creators) ? payload.creators as DiscoveryCreator[] : [];
  const events = Array.isArray(payload.events) ? payload.events as DiscoveryEvent[] : [];
  const videos = Array.isArray(payload.videos) ? payload.videos as DiscoveryVideo[] : [];
  const counts = isRecord(rawMeta?.counts) ? rawMeta.counts : {};
  const pagination = isRecord(rawMeta?.pagination) ? rawMeta.pagination : {};

  return {
    data: { creators, events, videos },
    meta: {
      generated_at: typeof rawMeta?.generated_at === 'string' ? rawMeta.generated_at : '',
      discovery_count: finiteNumber(rawMeta?.discovery_count),
      counts: {
        creators: finiteNumber(counts.creators, creators.length),
        events: finiteNumber(counts.events, events.length),
        videos: finiteNumber(counts.videos, videos.length),
      },
      pagination: {
        current_page: finiteNumber(pagination.current_page, 1),
        per_page: finiteNumber(pagination.per_page, Math.max(creators.length, events.length, videos.length)),
        has_more: pagination.has_more === true,
      },
    },
  };
};
