import type { StickerCollection, StickerPagination } from '../types/sticker.types';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

const paginationFrom = (value: Record<string, unknown>): StickerPagination => {
  const nestedMeta = isRecord(value.meta) ? value.meta : {};
  const source = { ...value, ...nestedMeta };
  const readNumber = (key: keyof StickerPagination) => (
    typeof source[key] === 'number' ? source[key] as number : undefined
  );

  return {
    current_page: readNumber('current_page'),
    last_page: readNumber('last_page'),
    per_page: readNumber('per_page'),
    total: readNumber('total'),
  };
};

/**
 * Sticker collection endpoints currently wrap Laravel paginators at different
 * depths. This keeps callers independent of whether the response is
 * `{data: {data: []}}`, `{data: []}`, or a resource collection with `meta`.
 */
export const normalizeStickerCollection = <T>(value: unknown): StickerCollection<T> => {
  let current = value;
  let pagination: StickerPagination = {};

  for (let depth = 0; depth < 4; depth += 1) {
    if (Array.isArray(current)) {
      return { items: current as T[], pagination };
    }

    if (!isRecord(current)) break;
    pagination = { ...pagination, ...paginationFrom(current) };
    current = current.data;
  }

  return { items: [], pagination };
};
