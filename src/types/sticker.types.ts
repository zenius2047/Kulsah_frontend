export type StickerType = 'static' | 'animated_webp' | 'gif';

export type StickerVisibility = 'private' | 'public' | 'official';

export type StickerPackSummary = {
  id: number;
  name: string;
  slug: string;
};

export type Sticker = {
  id: number;
  name: string;
  type: StickerType;
  media_url: string;
  thumbnail_url: string;
  width: number | null;
  height: number | null;
  is_animated: boolean;
  duration_ms: number | null;
  visibility: StickerVisibility;
  pack: StickerPackSummary | null;
  tags: string[];
  usage_count: number;
  favorite_count: number;
};

export type StickerPack = StickerPackSummary & {
  owner_id?: number | null;
  description?: string | null;
  cover_url?: string | null;
  category?: string | null;
  language?: string | null;
  country_code?: string | null;
  is_public?: boolean;
  is_official?: boolean;
  is_active?: boolean;
  is_featured?: boolean;
  sort_order?: number;
  stickers_count: number;
};

export type StickerCollectionParams = {
  page?: number;
  per_page?: number;
};

export type StickerSearchParams = StickerCollectionParams & {
  q: string;
};

export type CreateStickerPayload = {
  name: string;
  media_url: string;
  thumbnail_url?: string | null;
  type: StickerType;
  visibility: 'private' | 'public';
  tags?: string[];
  width?: number | null;
  height?: number | null;
};

export type StickerPagination = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

export type StickerCollection<T> = {
  items: T[];
  pagination: StickerPagination;
};

export type StickerCollectionEnvelope<T> = {
  data: unknown;
};

export type StickerItemEnvelope = { data: Sticker };
export type StickerFavoriteResponse = { favorited: boolean };
