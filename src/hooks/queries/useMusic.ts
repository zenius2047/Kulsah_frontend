import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../../api/music.api';
import type { MusicBrowseParams } from '../../types/music.types';

const MUSIC_STALE_TIME = 60_000;

export const musicQueryKey = (params: MusicBrowseParams) => ['creator', 'music', params] as const;

export const useMusic = (params: MusicBrowseParams = {}, enabled = true) =>
  useQuery({
    queryKey: musicQueryKey(params),
    queryFn: () => musicApi.browse(params).then((response) => response.data),
    enabled,
    staleTime: MUSIC_STALE_TIME,
  });
