export type MusicArtwork = Record<string, string | null | undefined>;

export type MusicTrack = {
  id: string;
  provider: string;
  external_id: string | null;
  title: string | null;
  artist: string | null;
  artist_id: string | null;
  artist_username: string | null;
  artist_verified: boolean;
  artwork: MusicArtwork;
  thumbnail_artwork: string | null;
  large_artwork: string | null;
  duration: number | null;
  genre: string | null;
  mood: string | null;
  tags: string[];
  release_date: string | null;
  play_count: number;
  favorite_count: number;
  repost_count: number;
  streamable: boolean;
  downloadable: boolean;
  permalink: string | null;
  stream_url: string | null;
  stream_endpoint: string | null;
  source_attribution: Record<string, unknown>;
  is_saved: boolean;
  usage_count: number;
  license: string | null;
  rights_status: string | null;
};

export type MusicBrowseParams = {
  search?: string;
  genre?: string | string[];
  mood?: string | string[];
  trending?: boolean;
  time?: 'week' | 'month' | 'year' | 'all_time';
  page?: number;
  limit?: number;
  sort?: 'relevant' | 'popular' | 'recent';
};

export type MusicBrowseResponse = {
  data: MusicTrack[];
  meta: {
    mode?: 'trending' | 'search';
    pagination?: {
      current_page: number;
      per_page: number;
      has_more_pages: boolean;
    };
    [key: string]: unknown;
  };
};

export type MusicTrackResponse = {
  data: MusicTrack;
  meta: Record<string, unknown>;
};

/** The provider-aware sound snapshot accepted by PATCH creator/videos/{video}. */
export type MusicSelectionPayload = Pick<
  MusicTrack,
  | 'id'
  | 'provider'
  | 'external_id'
  | 'title'
  | 'artist'
  | 'artist_id'
  | 'artist_username'
  | 'artwork'
  | 'duration'
  | 'genre'
  | 'permalink'
  | 'streamable'
  | 'rights_status'
>;

export const toMusicSelectionPayload = (track: MusicTrack): MusicSelectionPayload | null => {
  if (!track.provider || !track.external_id) return null;

  return {
    id: track.id,
    provider: track.provider,
    external_id: track.external_id,
    title: track.title,
    artist: track.artist,
    artist_id: track.artist_id,
    artist_username: track.artist_username,
    artwork: track.artwork,
    duration: track.duration,
    genre: track.genre,
    permalink: track.permalink,
    streamable: track.streamable,
    rights_status: track.rights_status,
  };
};
