import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';
import type { LivePage, LiveSession } from '../src/types/live.types';
import {
  createLiveIdempotencyKey,
  flattenLivePages,
  formatLiveCount,
  isLiveTerminal,
  nextLivePage,
  normalizeLiveSessionResponse,
} from '../src/utils/live';

const live = (id: string): LiveSession => ({
  id,
  creator: { id: 8, name: 'Mila', handle: 'mila' },
  title: `Live ${id}`,
  description: null,
  category: null,
  cover_url: null,
  visibility: 'public',
  status: 'live',
  scheduled_at: null,
  started_at: '2026-08-31T08:00:00.000Z',
  ended_at: null,
  chat_enabled: true,
  gifts_enabled: true,
  recording_enabled: false,
  current_viewers: 4,
  unique_viewers: 7,
  peak_viewers: 5,
  average_viewers: 3,
  watch_seconds_total: 120,
  likes_count: 9,
  comments_count: 2,
  gifts_count: 1,
  gift_value_kc: 25,
  earnings_kc: 20,
  termination_reason: null,
  recording_state: null,
  replay_state: null,
  created_at: '2026-08-31T07:59:00.000Z',
  updated_at: '2026-08-31T08:00:00.000Z',
});

describe('Live backend routes', () => {
  it('matches the public discovery and viewer lifecycle routes', () => {
    expect(endpoints.general.live).toBe('general/live');
    expect(endpoints.general.liveSession('live-1')).toBe('general/live/live-1');
    expect(endpoints.general.liveJoin('live-1')).toBe('general/live/live-1/join');
    expect(endpoints.general.liveLeave('live-1')).toBe('general/live/live-1/leave');
    expect(endpoints.general.liveComments('live-1')).toBe('general/live/live-1/comments');
    expect(endpoints.general.liveLikes('live-1')).toBe('general/live/live-1/likes');
    expect(endpoints.general.liveGifts('live-1')).toBe('general/live/live-1/gifts');
  });

  it('matches the creator lifecycle and management routes', () => {
    expect(endpoints.creator.live).toBe('creator/live');
    expect(endpoints.creator.liveStart('live-1')).toBe('creator/live/live-1/start');
    expect(endpoints.creator.liveConfirm('live-1')).toBe('creator/live/live-1/confirm');
    expect(endpoints.creator.liveReconnect('live-1')).toBe('creator/live/live-1/reconnect');
    expect(endpoints.creator.liveHeartbeat('live-1')).toBe('creator/live/live-1/heartbeat');
    expect(endpoints.creator.liveEnd('live-1')).toBe('creator/live/live-1/end');
    expect(endpoints.creator.liveCohostRemove('live-1', 7)).toBe('creator/live/live-1/cohosts/7');
    expect(endpoints.creator.liveAnalytics('live-1')).toBe('creator/live/live-1/analytics');
  });

  it('matches co-host and Battle action routes', () => {
    expect(endpoints.general.liveCohostRequestAccept(4)).toBe('general/live/cohost-requests/4/accept');
    expect(endpoints.general.liveCohostRequestDecline(4)).toBe('general/live/cohost-requests/4/decline');
    expect(endpoints.general.liveBattleAccept(5)).toBe('general/live/battles/5/accept');
    expect(endpoints.general.liveBattleScore(5)).toBe('general/live/battles/5/score');
    expect(endpoints.general.liveBattleEnd(5)).toBe('general/live/battles/5/end');
  });
});

describe('Live pagination and presentation helpers', () => {
  it('normalizes created sessions from direct and wrapped API responses', () => {
    expect(normalizeLiveSessionResponse(live('direct')).id).toBe('direct');
    expect(normalizeLiveSessionResponse({ data: live('resource') }).id).toBe('resource');
    expect(normalizeLiveSessionResponse({ data: { live: live('wrapped') } }).id).toBe('wrapped');
    expect(normalizeLiveSessionResponse({ session: { ...live('numeric'), id: 42 } }).id).toBe('42');
  });

  it('rejects a successful response that is missing the created session', () => {
    expect(() => normalizeLiveSessionResponse({ message: 'created' }))
      .toThrow('did not return the created Live session');
  });

  it('deduplicates paginated sessions while preserving server order', () => {
    const pages: LivePage[] = [
      { data: [live('one'), live('two')] },
      { data: [live('two'), live('three')] },
    ];
    expect(flattenLivePages(pages).map((item) => item.id)).toEqual(['one', 'two', 'three']);
  });

  it('uses Laravel pagination metadata for the next page', () => {
    expect(nextLivePage({ data: [], meta: { current_page: 1, last_page: 3 } })).toBe(2);
    expect(nextLivePage({ data: [], meta: { current_page: 3, last_page: 3 } })).toBeUndefined();
  });

  it('identifies terminal states and formats server counters', () => {
    expect(isLiveTerminal('live')).toBe(false);
    expect(isLiveTerminal('ended')).toBe(true);
    expect(isLiveTerminal('terminated')).toBe(true);
    expect(formatLiveCount(999)).toBe('999');
    expect(formatLiveCount(1_250)).toBe('1.3K');
    expect(formatLiveCount(1_200_000)).toBe('1.2M');
  });

  it('creates bounded, action-specific idempotency keys', () => {
    const key = createLiveIdempotencyKey('abc', 'gift', 1000, 0.5);
    expect(key).toContain('live-abc-gift-1000-');
    expect(key.length).toBeLessThanOrEqual(120);
  });
});
