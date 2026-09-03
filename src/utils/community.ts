import type { CommunityPost, CreateCommunityPostPayload } from '../types/community.types';

export type CommunityPostFormEntry = [string, string | { uri: string; name: string; type: string }];

export const isCommunityVideo = (asset: { type?: string | null }): boolean =>
  Boolean(asset.type && (asset.type === 'video' || asset.type.startsWith('video/')));

export const validateCommunityPost = (payload: CreateCommunityPostPayload): string[] => {
  const errors: string[] = [];
  const options = payload.poll?.options.map((option) => option.trim()).filter(Boolean) ?? [];
  if (!['public', 'subscribers'].includes(payload.audience)) errors.push('Choose a valid audience.');
  if (!payload.content?.trim() && !payload.media?.length && payload.type !== 'poll') errors.push('Add text or media.');
  if (payload.type === 'poll' && !payload.poll?.question?.trim()) errors.push('A poll question is required.');
  if (payload.type === 'poll' && options.length < 2) errors.push('A poll requires at least two options.');
  if (options.length > 4) errors.push('A poll supports at most four options.');
  const videoCount = payload.media?.filter(isCommunityVideo).length ?? 0;
  if (videoCount > 4) errors.push('A post supports at most four videos.');
  if (videoCount > 0 && (payload.media?.length ?? 0) > 4) {
    errors.push('A post containing videos supports at most four media items.');
  }
  return errors;
};

export const getCommunityPostFormEntries = (payload: CreateCommunityPostPayload): CommunityPostFormEntry[] => {
  const entries: CommunityPostFormEntry[] = [['type', payload.type], ['audience', payload.audience]];
  if (payload.content?.trim()) entries.push(['content', payload.content.trim()]);
  payload.media?.forEach((asset, index) => {
    const extension = asset.type?.includes('video') ? 'mp4' : 'jpg';
    entries.push(['media[]', {
      uri: asset.uri,
      name: asset.name || `community-media-${index}.${extension}`,
      type: asset.type || (extension === 'mp4' ? 'video/mp4' : 'image/jpeg'),
    }]);
  });
  if (payload.poll?.question?.trim()) entries.push(['poll[question]', payload.poll.question.trim()]);
  payload.poll?.options.forEach((option, index) => entries.push([`poll[options][${index}]`, option.trim()]));
  if (payload.poll?.closes_at) entries.push(['poll[closes_at]', payload.poll.closes_at]);
  if (typeof payload.poll?.allow_multiple === 'boolean') {
    entries.push(['poll[allow_multiple]', payload.poll.allow_multiple ? '1' : '0']);
  }
  if (typeof payload.poll?.show_results_after_voting === 'boolean') {
    entries.push(['poll[show_results_after_voting]', payload.poll.show_results_after_voting ? '1' : '0']);
  }
  return entries;
};

export const optimisticCommunityLike = (post: CommunityPost, liked: boolean): CommunityPost => ({
  ...post,
  stats: { ...post.stats, likes_count: Math.max(0, post.stats.likes_count + (liked ? 1 : -1)) },
  viewer: { ...post.viewer, is_liked: liked },
});

export const isSubscriberOnlyForbidden = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status === 403;


export const formatCommunityDateTime = (value?: string | null) => {
  if (!value) return '';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
};


export const formatCommunityRelativeTime = (value?: string | null, now = Date.now()) => {
  if (!value) return '';
  if (value.trim().toLowerCase() === 'now' || value.trim().toLowerCase() === 'just now') return 'Now';
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value;
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 5) return 'Now';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (days < 30) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months}m`;
  return `${Math.floor(days / 365)}y`;
};
