import { describe, expect, it } from 'vitest';
import { buildBattleTiles } from '../src/utils/liveBattle';
import type { LiveCredentials, LiveParticipants } from '../src/types/live.types';

const stage: NonNullable<LiveParticipants['battle_stage']> = {
  all_accepted: true,
  participants: [
    { user_id: 1, rtc_uid: 101, name: 'Host', accepted: true },
    { user_id: 2, rtc_uid: 202, name: 'Guest', accepted: true },
    { user_id: 3, rtc_uid: 303, name: 'Guest two', accepted: true },
  ],
};
const credentials = (uid: number, role: LiveCredentials['role'] = 'broadcaster'): LiveCredentials => ({
  uid, role, channel: 'shared-stage', app_id: 'app', token: 'token', expires_at: '2030-01-01', provider: 'agora',
});

describe('battle video tiles', () => {
  it('shows host preview and every connected remote participant in roster order', () => {
    const tiles = buildBattleTiles(stage, credentials(101), [303, 202], true);
    expect(tiles.map((tile) => [tile.rtc_uid, tile.local, tile.connected])).toEqual([
      [101, true, true], [202, false, true], [303, false, true],
    ]);
  });

  it('shows a participant their own camera alongside the host and other participants', () => {
    const tiles = buildBattleTiles(stage, credentials(202), [101, 303], true);
    expect(tiles.map((tile) => tile.local)).toEqual([false, true, false]);
    expect(tiles.every((tile) => tile.connected)).toBe(true);
  });

  it('does not create a camera preview for an audience member', () => {
    const tiles = buildBattleTiles(stage, credentials(999, 'audience'), [101, 202, 303], false);
    expect(tiles.every((tile) => tile.connected && !tile.local)).toBe(true);
  });

  it('keeps disconnected and unaccepted participants as placeholders', () => {
    const pending = { ...stage, all_accepted: false, participants: stage.participants.map((p) => ({ ...p, accepted: p.user_id !== 3 })) };
    const tiles = buildBattleTiles(pending, credentials(101), [303], true);
    expect(tiles.map((tile) => tile.connected)).toEqual([true, false, false]);
    expect(tiles.map((tile) => tile.user_id)).toEqual([1, 2, 3]);
  });
});
