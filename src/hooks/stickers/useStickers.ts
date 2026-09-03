import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { stickerApi } from '../../api/sticker.api';
import type { CreateStickerPayload, Sticker, StickerPack } from '../../types/sticker.types';
import { normalizeStickerCollection } from '../../utils/stickers';

const STICKER_PAGE_SIZE = 50;

export const stickerPacksQueryKey = ['stickers', 'packs'] as const;
export const stickerPackQueryKey = (pack?: string | number | null) => ['stickers', 'packs', pack] as const;
export const stickerSearchQueryKey = (query: string) => ['stickers', 'search', query] as const;
export const recentStickersQueryKey = ['stickers', 'recent'] as const;
export const favoriteStickersQueryKey = ['stickers', 'favorites'] as const;

export const useStickerPacks = (enabled = true) => useQuery({
  queryKey: stickerPacksQueryKey,
  queryFn: () => stickerApi.getPacks({ per_page: 30 }).then((response) => (
    normalizeStickerCollection<StickerPack>(response.data)
  )),
  enabled,
  staleTime: 5 * 60_000,
});

export const useStickerPack = (pack?: string | number | null, enabled = true) => useQuery({
  queryKey: stickerPackQueryKey(pack),
  queryFn: () => stickerApi.getPack(pack!, { per_page: STICKER_PAGE_SIZE }).then((response) => (
    normalizeStickerCollection<Sticker>(response.data)
  )),
  enabled: enabled && pack !== undefined && pack !== null && pack !== '',
  staleTime: 5 * 60_000,
});

export const useStickerSearch = (query: string, enabled = true) => {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: stickerSearchQueryKey(normalizedQuery),
    queryFn: () => stickerApi.search({ q: normalizedQuery, per_page: STICKER_PAGE_SIZE }).then((response) => (
      normalizeStickerCollection<Sticker>(response.data)
    )),
    enabled: enabled && normalizedQuery.length > 0,
    staleTime: 60_000,
  });
};

export const useRecentStickers = (enabled = true) => useQuery({
  queryKey: recentStickersQueryKey,
  queryFn: () => stickerApi.getRecent({ per_page: STICKER_PAGE_SIZE }).then((response) => (
    normalizeStickerCollection<Sticker>(response.data)
  )),
  enabled,
  staleTime: 30_000,
});

export const useFavoriteStickers = (enabled = true) => useQuery({
  queryKey: favoriteStickersQueryKey,
  queryFn: () => stickerApi.getFavorites({ per_page: STICKER_PAGE_SIZE }).then((response) => (
    normalizeStickerCollection<Sticker>(response.data)
  )),
  enabled,
  staleTime: 30_000,
});

export const useToggleStickerFavorite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sticker: string | number) => stickerApi.toggleFavorite(sticker).then((response) => response.data),
    onSuccess: () => void client.invalidateQueries({ queryKey: favoriteStickersQueryKey }),
  });
};

export const useRecordStickerUse = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sticker: string | number) => stickerApi.recordUse(sticker).then((response) => response.data.data),
    onSuccess: () => void client.invalidateQueries({ queryKey: recentStickersQueryKey }),
  });
};

export const useCreateSticker = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStickerPayload) => stickerApi.create(payload).then((response) => response.data.data),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['stickers'] }),
  });
};

export const useDeleteSticker = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (sticker: string | number) => stickerApi.remove(sticker),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['stickers'] }),
  });
};
