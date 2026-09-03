import { describe, expect, it } from 'vitest';
import { endpoints } from '../src/api/endpoints';
import { normalizeDiscoveryResponse } from '../src/utils/discovery';

const payload = {
  creators: [{ id: 1, name: 'Creator' }],
  events: [{ id: 2, title: 'Event' }],
  videos: [{ id: 3, title: 'Video' }],
};

const meta = {
  generated_at: '2026-08-31T00:00:00.000Z',
  discovery_count: 3,
  counts: { creators: 1, events: 1, videos: 1 },
  pagination: { current_page: 1, per_page: 20, has_more: false },
};

describe('discovery API contract', () => {
  it('uses the authenticated general discovery endpoint', () => {
    expect(endpoints.general.discovery).toBe('general/discovery');
    expect(endpoints.general.discoveryView).toBe('general/discovery/view');
  });

  it('normalizes direct and resource-wrapped discovery payloads', () => {
    expect(normalizeDiscoveryResponse({ ...payload, meta }).data.creators).toHaveLength(1);
    expect(normalizeDiscoveryResponse({ data: payload, meta }).data.events).toHaveLength(1);
    expect(normalizeDiscoveryResponse({ data: { data: payload }, meta }).data.videos).toHaveLength(1);
  });

  it('rejects responses that do not contain discovery collections', () => {
    expect(() => normalizeDiscoveryResponse({ message: 'ok' })).toThrow('invalid discovery response');
  });
});
