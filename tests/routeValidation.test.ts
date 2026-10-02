import { describe, expect, it } from 'vitest';

import { validateRouteParams } from '../src/utils/routeValidation';

describe('route parameter validation', () => {
  it('requires a destination identifier for entity screens', () => {
    expect(validateRouteParams('EventDetail', undefined).valid).toBe(false);
    expect(validateRouteParams('EventDetail', { id: 'event-12' }).valid).toBe(true);
    expect(validateRouteParams('ChallengeFeed', {}).valid).toBe(false);
    expect(validateRouteParams('ChallengeFeed', { challengeId: 12 }).valid).toBe(true);
  });

  it('requires a conversation or recipient before opening chat', () => {
    expect(validateRouteParams('Chat', undefined).valid).toBe(false);
    expect(validateRouteParams('Chat', { name: 'Creator' }).valid).toBe(false);
    expect(validateRouteParams('Chat', { senderId: 'creator-4', name: 'Creator' }).valid).toBe(true);
  });

  it('accepts supported optional values and rejects invalid enums', () => {
    expect(validateRouteParams('Settings', { view: 'tags' }).valid).toBe(true);
    expect(validateRouteParams('Settings', { view: 'legacy-profile' }).valid).toBe(false);
    expect(validateRouteParams('RecordContent', { duetLayout: 'stacked' }).valid).toBe(true);
    expect(validateRouteParams('RecordContent', { duetLayout: 'split' }).valid).toBe(false);
    expect(validateRouteParams('MainTabs', { screen: 'Signal' }).valid).toBe(true);
    expect(validateRouteParams('MainTabs', { screen: 'Inbox' }).valid).toBe(false);
  });

  it('rejects obsolete or misspelled parameters', () => {
    expect(validateRouteParams('ArtistProfile', { userId: 4 }).valid).toBe(false);
    expect(validateRouteParams('SubmitEntry', { video: {}, visibility: 'friends' }).valid).toBe(false);
  });

  it('accepts either supported video-player boundary shape', () => {
    expect(validateRouteParams('VideoPlayer', { id: 'video-2' }).valid).toBe(true);
    expect(validateRouteParams('VideoPlayer', { item: { id: 'video-2' } }).valid).toBe(true);
    expect(validateRouteParams('VideoPlayer', { next_videos: [] }).valid).toBe(false);
  });
});
