import { describe, expect, it } from 'vitest';
import {
  getCommunityPostFormEntries,
  formatCommunityDateTime,
  formatCommunityRelativeTime,
  isSubscriberOnlyForbidden,
  optimisticCommunityLike,
  validateCommunityPost,
} from '../src/utils/community';
import type { CommunityPost } from '../src/types/community.types';
import { communityPostEndpointId } from '../src/api/community.api';
import { endpoints } from '../src/api/endpoints';

const post = {
  id: 'post_opaque', type: 'text', content: 'Hello', audience: 'public', status: 'published',
  author: { id: 1, name: 'Creator', handle: 'creator', avatar_url: null, is_verified: false, is_following: false },
  media: [], poll: null,
  community_count: 0,
  stats: { likes_count: 2, comments_count: 0, shares_count: 0, gifts_count: 0, views_count: 0 },
  viewer: { is_liked: false, is_shared: false, is_following: false, can_view: true },
  created_at: '2026-08-06T00:00:00Z', updated_at: '2026-08-06T00:00:00Z',
} satisfies CommunityPost;

describe('community composer validation', () => {
  it('accepts text and rejects an empty post', () => {
    expect(validateCommunityPost({ type: 'text', audience: 'public', content: 'Hello' })).toEqual([]);
    expect(validateCommunityPost({ type: 'text', audience: 'public' })).toContain('Add text or media.');
  });

  it('requires two poll options', () => {
    expect(validateCommunityPost({ type: 'poll', audience: 'public', poll: { options: ['One'] } })).toContain('A poll requires at least two options.');
  });

  it('requires a poll question', () => {
    expect(validateCommunityPost({ type: 'poll', audience: 'public', poll: { options: ['One', 'Two'] } }))
      .toContain('A poll question is required.');
    expect(validateCommunityPost({ type: 'poll', audience: 'public', poll: { question: 'Pick one', options: ['One', 'Two'] } }))
      .toEqual([]);
  });

  it('allows unlimited images but limits video and mixed-media posts to four items', () => {
    const images = Array.from({ length: 8 }, (_, index) => ({ uri: `file:///image-${index}.jpg`, type: 'image/jpeg' }));
    const videos = Array.from({ length: 5 }, (_, index) => ({ uri: `file:///video-${index}.mp4`, type: 'video/mp4' }));

    expect(validateCommunityPost({ type: 'image', audience: 'public', media: images })).toEqual([]);
    expect(validateCommunityPost({ type: 'video', audience: 'public', media: videos })).toContain('A post supports at most four videos.');
    expect(validateCommunityPost({ type: 'video', audience: 'public', media: [videos[0], ...images.slice(0, 4)] }))
      .toContain('A post containing videos supports at most four media items.');
    expect(validateCommunityPost({ type: 'video', audience: 'public', media: [videos[0], ...images.slice(0, 3)] })).toEqual([]);
  });
});

describe('community multipart payload', () => {
  it('uses Laravel nested poll and media keys', () => {
    const entries = getCommunityPostFormEntries({
      type: 'poll', audience: 'subscribers', content: 'Vote',
      media: [{ uri: 'file:///image.jpg', name: 'image.jpg', type: 'image/jpeg' }],
      poll: {
        question: 'Which one?',
        options: ['One', 'Two'],
        closes_at: '2026-08-12T00:00:00Z',
        allow_multiple: true,
        show_results_after_voting: false,
      },
    });
    expect(entries.map(([key]) => key)).toEqual([
      'type', 'audience', 'content', 'media[]', 'poll[question]', 'poll[options][0]', 'poll[options][1]',
      'poll[closes_at]', 'poll[allow_multiple]', 'poll[show_results_after_voting]',
    ]);
    expect(entries).toContainEqual(['poll[allow_multiple]', '1']);
    expect(entries).toContainEqual(['poll[show_results_after_voting]', '0']);
  });
});

describe('community engagement and authorization', () => {
  it('updates like state without allowing a negative count', () => {
    expect(optimisticCommunityLike(post, true).stats.likes_count).toBe(3);
    expect(optimisticCommunityLike({ ...post, stats: { ...post.stats, likes_count: 0 } }, false).stats.likes_count).toBe(0);
  });

  it('recognizes subscriber-only 403 responses', () => {
    expect(isSubscriberOnlyForbidden({ response: { status: 403 } })).toBe(true);
    expect(isSubscriberOnlyForbidden({ response: { status: 500 } })).toBe(false);
  });
});

describe('community endpoint IDs', () => {
  it('converts a post-prefixed ID to its integer backend ID', () => {
    expect(communityPostEndpointId('post_2')).toBe(2);
    expect(communityPostEndpointId(2)).toBe(2);
  });

  it('uses separate general read and creator write collections', () => {
    expect(endpoints.general.communityPosts).toBe('general/community/posts');
    expect(endpoints.creator.communityPosts).toBe('creator/community/posts');
  });

  it('targets the persistent community poll vote endpoint', () => {
    expect(endpoints.general.communityPostPollVote(9)).toBe('general/community/posts/9/poll/vote');
  });
});

describe('community viewed-state endpoint', () => {
  it('uses the backend view route for a normalized post id', () => {
    expect(endpoints.general.communityPostView(9)).toBe('general/community/posts/9/view');
  });
});

describe('community timestamps', () => {
  it('formats ISO timestamps as readable date and time values', () => {
    const formatted = formatCommunityDateTime('2026-08-06T16:46:28+00:00');
    expect(formatted).toContain('2026');
    expect(formatted).not.toContain('T16:46:28');
  });

  it('normalizes relative timestamps across supported units', () => {
    const now = Date.parse('2026-08-06T16:46:28Z');
    expect(formatCommunityRelativeTime('2026-08-06T16:46:26Z', now)).toBe('Now');
    expect(formatCommunityRelativeTime('2026-08-06T16:46:23Z', now)).toBe('5s');
    expect(formatCommunityRelativeTime('2026-08-05T16:46:28Z', now)).toBe('1d');
    expect(formatCommunityRelativeTime('2026-07-30T16:46:28Z', now)).toBe('1w');
    expect(formatCommunityRelativeTime('2026-07-06T16:46:28Z', now)).toBe('1m');
    expect(formatCommunityRelativeTime('2023-08-06T16:46:28Z', now)).toBe('3y');
  });

  it('preserves unrecognized timestamp labels', () => {
    expect(formatCommunityDateTime('live now')).toBe('live now');
  });
});
