export type DiscoveryTab = 'all' | 'creators' | 'events' | 'videos';

export type DiscoveryCreator = {
  id: number;
  name: string;
  handle: string;
  avatar_url: string | null;
  is_verified: boolean;
  is_live: boolean;
  is_following: boolean;
  is_premium: boolean;
  followers_count: number;
  discovery_count: number;
  style: string | null;
  tools: string[];
};

export type DiscoveryEvent = {
  id: number;
  title: string;
  creator: { id: number; name: string; handle: string; avatar_url: string | null };
  starts_at: string | null;
  ends_at: string | null;
  venue: string | null;
  location_type: string | null;
  cover_url: string | null;
  duration_minutes: number | null;
  tickets_available: boolean;
  minimum_ticket_price: number | null;
  currency: string | null;
  discovery_count: number;
};

export type DiscoveryVideo = {
  id: number;
  title: string | null;
  caption: string | null;
  creator: { id: number; name: string; handle: string; avatar_url: string | null };
  thumbnail_url: string | null;
  playback_url: string | null;
  content_type: 'video';
  category: string | null;
  duration_seconds: number | null;
  stats: { views_count: number; likes_count: number; comments_count: number };
  discovery_count: number;
  viewer: { is_liked: boolean; is_bookmarked: boolean; is_following_creator: boolean };
};

export type DiscoveryParams = {
  tab?: DiscoveryTab;
  page?: number;
  limit?: number;
  search_query?: string;
};

export type DiscoveryResponse = {
  data: { creators: DiscoveryCreator[]; events: DiscoveryEvent[]; videos: DiscoveryVideo[] };
  meta: {
    generated_at: string;
    discovery_count: number;
    counts: { creators: number; events: number; videos: number };
    pagination: { current_page: number; per_page: number; has_more: boolean };
  };
};
