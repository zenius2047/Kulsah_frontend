import api from './client';
import { endpoints } from './endpoints';
import type {
  CreateStickerPayload,
  StickerCollectionEnvelope,
  StickerCollectionParams,
  StickerFavoriteResponse,
  StickerItemEnvelope,
  StickerPack,
  StickerSearchParams,
} from '../types/sticker.types';

export const stickerApi = {
  getPacks: (params: StickerCollectionParams = {}) =>
    api.get<StickerCollectionEnvelope<StickerPack>>(endpoints.general.stickers, { params }),

  getPack: (pack: string | number, params: StickerCollectionParams = {}) =>
    api.get<StickerCollectionEnvelope<unknown>>(endpoints.general.stickerPack(pack), { params }),

  search: (params: StickerSearchParams) =>
    api.get<StickerCollectionEnvelope<unknown>>(endpoints.general.stickerSearch, { params }),

  getRecent: (params: StickerCollectionParams = {}) =>
    api.get<StickerCollectionEnvelope<unknown>>(endpoints.general.stickerRecent, { params }),

  getFavorites: (params: StickerCollectionParams = {}) =>
    api.get<StickerCollectionEnvelope<unknown>>(endpoints.general.stickerFavorites, { params }),

  toggleFavorite: (sticker: string | number) =>
    api.post<StickerFavoriteResponse>(endpoints.general.stickerFavorite(sticker)),

  recordUse: (sticker: string | number) =>
    api.post<StickerItemEnvelope>(endpoints.general.stickerUse(sticker)),

  create: (payload: CreateStickerPayload) =>
    api.post<StickerItemEnvelope>(endpoints.general.stickers, payload),

  remove: (sticker: string | number) =>
    api.delete<void>(endpoints.general.sticker(sticker)),
};
