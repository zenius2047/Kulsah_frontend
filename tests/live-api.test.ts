import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('../src/api/client', () => ({ default: client }));
import { liveApi } from '../src/api/live.api';

describe('Live participant API contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retrieves a server-backed inbox and stage roster', () => {
    liveApi.participants('live-id');
    expect(client.get).toHaveBeenCalledWith('general/live/live-id/participants');
  });

  it('searches the host battle creator directory instead of discovery or live streams', () => {
    liveApi.battleCreators('host-id', { search_query: 'jane music', page: 2, limit: 30 });
    expect(client.get).toHaveBeenCalledWith('creator/live/host-id/battle-creators', {
      params: { search_query: 'jane music', page: 2, limit: 30 },
    });
  });

  it('sends viewer requests and creator invitations to their respective routes', () => {
    liveApi.requestCohost('live-id', 'Can I join?');
    liveApi.inviteCohost('live-id', { invitee_id: 42, message: 'Join us' });
    expect(client.post).toHaveBeenCalledWith('general/live/live-id/cohost-requests', { message: 'Can I join?' });
    expect(client.post).toHaveBeenCalledWith('creator/live/live-id/cohosts/invite', { invitee_id: 42, message: 'Join us' });
  });

  it('addresses acceptance and decline using the request ID, not the live ID', () => {
    liveApi.acceptCohost(123);
    liveApi.declineCohost(123);
    expect(client.post).toHaveBeenCalledWith('general/live/cohost-requests/123/accept');
    expect(client.post).toHaveBeenCalledWith('general/live/cohost-requests/123/decline');
  });

  it('preserves approval without credentials and guest acceptance with credentials', async () => {
    const approved = { data: { data: { request: { status: 'accepted' }, credentials: null, cohost: null } } };
    client.post.mockResolvedValueOnce(approved);
    expect(await liveApi.acceptCohost(12)).toBe(approved);
    const joined = { data: { data: { credentials: { role: 'broadcaster', uid: 42 } } } };
    client.post.mockResolvedValueOnce(joined);
    expect(await liveApi.acceptCohost(12)).toBe(joined);
  });

  it('renews publishing through the authorized co-host endpoint and supports leaving just the stage', () => {
    liveApi.cohostCredentials('live-id');
    liveApi.leaveCohost('live-id');
    expect(client.post).toHaveBeenCalledWith('general/live/live-id/cohosts/credentials');
    expect(client.post).toHaveBeenCalledWith('general/live/live-id/cohosts/leave');
  });

  it('sends removal reasons in the DELETE body', () => {
    liveApi.removeCohost('live-id', 42, 'Finished');
    expect(client.delete).toHaveBeenCalledWith('creator/live/live-id/cohosts/42', { data: { reason: 'Finished' } });
  });

  it('supports the complete battle lifecycle without client-supplied scores', () => {
    liveApi.inviteBattle('live-id', 42);
    liveApi.acceptBattle(12);
    liveApi.scoreBattle(12);
    liveApi.endBattle(12);
    expect(client.post.mock.calls).toEqual([
      ['creator/live/live-id/battles/invite', { opponent_id: 42 }],
      ['general/live/battles/12/accept'], ['general/live/battles/12/score'], ['general/live/battles/12/end'],
    ]);
  });

  it('casts a battle vote for a specific participant', () => {
    const payload = { target_user_id: 42, vote_count: 10, idempotency_key: 'vote-key' };
    liveApi.voteBattle(12, payload);
    expect(client.post).toHaveBeenCalledWith('general/live/battles/12/votes', payload);
  });
});
