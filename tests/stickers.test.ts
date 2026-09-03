import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';
import { normalizeStickerCollection } from '../src/utils/stickers';

describe('sticker API contract', () => {
  it('matches the backend sticker routes', () => {
    expect(endpoints.general.stickers).toBe('general/stickers');
    expect(endpoints.general.stickerSearch).toBe('general/stickers/search');
    expect(endpoints.general.stickerRecent).toBe('general/stickers/recent');
    expect(endpoints.general.stickerFavorites).toBe('general/stickers/favorites');
    expect(endpoints.general.stickerPack(4)).toBe('general/stickers/packs/4');
    expect(endpoints.general.stickerFavorite(9)).toBe('general/stickers/9/favorite');
    expect(endpoints.general.stickerUse(9)).toBe('general/stickers/9/use');
    expect(endpoints.general.sticker(9)).toBe('general/stickers/9');
  });

  it('normalizes the pack paginator returned inside the data envelope', () => {
    expect(normalizeStickerCollection<{ id: number }>({
      data: {
        current_page: 1,
        last_page: 2,
        per_page: 30,
        total: 31,
        data: [{ id: 7 }],
      },
    })).toEqual({
      items: [{ id: 7 }],
      pagination: { current_page: 1, last_page: 2, per_page: 30, total: 31 },
    });
  });

  it('normalizes the nested resource collection used by sticker lists', () => {
    expect(normalizeStickerCollection<{ id: number }>({
      data: {
        data: [{ id: 12 }],
        meta: { current_page: 2, last_page: 3, per_page: 50, total: 120 },
      },
    })).toEqual({
      items: [{ id: 12 }],
      pagination: { current_page: 2, last_page: 3, per_page: 50, total: 120 },
    });
  });
});
