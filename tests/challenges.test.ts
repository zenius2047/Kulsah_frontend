import { describe, expect, it } from 'vitest';
import {
  buildChallengeCreatePayload,
  challengeListResourceToCard,
  challengeRuleResourceToDisplay,
  challengeResourceToFeedItems,
  combineChallengeDateAndTime,
  creatorBattleChallengesFromPages,
  creatorBattleVideoParticipants,
} from '../src/utils/challenges';
import { endpoints } from '../src/api/endpoints';
import { unwrapChallengeShowResponse } from '../src/api/challenges.api';
import type { ChallengeResource, ChallengeWizardPayloadInput } from '../src/types/challenge.types';

const input = (overrides: Partial<ChallengeWizardPayloadInput> = {}): ChallengeWizardPayloadInput => ({
  title: 'Glow Up Dance Challenge',
  description: 'Show us your best glow-up dance transformation.',
  instructions: 'Post a before and after clip.',
  category: 'Dance',
  hashtag: 'GlowUpChallenge',
  videoLength: '15s - 60s',
  aspectRatio: '9:16',
  allowedFormat: 'MP4 / MOV',
  startDate: new Date('2026-09-15T00:00:00.000Z'),
  startTime: new Date('2026-01-01T12:30:00.000Z'),
  endDate: new Date('2026-10-15T00:00:00.000Z'),
  endTime: new Date('2026-01-01T23:00:00.000Z'),
  votingStartDate: new Date('2026-09-20T00:00:00.000Z'),
  votingStartTime: new Date('2026-01-01T09:00:00.000Z'),
  votingEndDate: new Date('2026-10-10T00:00:00.000Z'),
  votingEndTime: new Date('2026-01-01T18:00:00.000Z'),
  inviteOnly: false,
  limitEntries: true,
  showLeaderboard: true,
  judgeByVotes: true,
  judgeByReactions: true,
  primaryPrize: '500',
  winnerCount: 3,
  secondaryReward: 'Feature on Kulsah',
  ...overrides,
});

describe('challenge payload mapping', () => {
  it('unwraps the latest nested challenge detail response', () => {
    const challenge = {
      id: 42,
      title: 'Nested challenge',
      pricing: { voting: { payment_method: 'kulcoin', currency_code: 'KC', vote_coin_price: 10, vote_cost_per_choice: 10 } },
    } as ChallengeResource;

    expect(unwrapChallengeShowResponse({ data: { challenge } })).toBe(challenge);
  });

  it('builds the creator challenge-entry endpoint', () => {
    expect(endpoints.creator.challengeEntries(42)).toBe('creator/challenges/42/entries');
  });

  it('treats missing challenge feed arrays as empty', () => {
    expect(challengeResourceToFeedItems(undefined)).toEqual([]);
    expect(challengeResourceToFeedItems({
      id: 1,
      title: 'Legacy challenge',
      slug: 'legacy-challenge',
      description: '',
      host_type: 'creator',
      visibility: 'public',
      mode: 'open',
      is_creator_battle: false,
      status: 'active',
      judging_strategy: 'weighted_normalized',
      winner_selection_method: 'automatic_score',
      schedule: {},
      leaderboard: { enabled: false, mode: 'hidden' },
      participant_count: 0,
      entry_count: 0,
      current_phase: 'active',
      can_join: false,
      can_vote: false,
      has_user_joined: false,
      has_user_voted: false,
      entries: undefined,
    })).toEqual([]);
  });

  it('maps the challenge detail payload into the official video and entry feed', () => {
    const items = challengeResourceToFeedItems({
      id: 15,
      title: 'Summer Dance Challenge',
      slug: 'summer-dance-challenge',
      description: 'Show us your best move.',
      host_type: 'creator',
      visibility: 'public',
      mode: 'open',
      is_creator_battle: false,
      status: 'active',
      judging_strategy: 'weighted_normalized',
      winner_selection_method: 'automatic_score',
      schedule: {},
      leaderboard: { enabled: true, mode: 'live' },
      participant_count: 1,
      entry_count: 1,
      current_phase: 'active',
      can_join: true,
      can_vote: true,
      has_user_joined: false,
      has_user_voted: false,
      official_sound_id: 90,
      official_video: {
        id: '90',
        role: 'challenge_video',
        videoUrl: 'https://cdn.example.com/official.m3u8',
        thumbnailUrl: 'https://cdn.example.com/official.jpg',
        caption: 'Official instructions',
        tag: 'ChallengeVideo',
      },
      entries: [{
        id: '108',
        userName: 'Entry Creator',
        userHandle: 'entry_creator',
        userAvatar: 'https://example.com/avatar.jpg',
        videoUrl: 'https://cdn.example.com/entry.m3u8',
        thumbnailUrl: 'https://cdn.example.com/entry.jpg',
        caption: 'My entry',
        likes: 4,
        comments: 2,
        votes: 87.5,
        isLiked: false,
        isVoted: false,
        originalSound: true,
        tag: 'ChallengeEntry',
        isVote: true,
      }],
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: '90', tag: 'officialChallengeVideo', isSeed: true, isVote: false });
    expect(items[1]).toMatchObject({ id: '108', tag: 'ChallengeEntry', votes: 87.5, isVote: true });
  });

  it('maps creator-battle participants into paid-voting feed entries', () => {
    const items = challengeResourceToFeedItems({
      id: 72,
      title: 'Creator Clash',
      description: 'Two creators enter. One wins.',
      mode: 'creator_battle',
      is_creator_battle: true,
      status: 'active',
      participants: [{
        id: 'participant_9',
        role: 'challenger',
        position: 2,
        creator: { id: 9, name: 'Nova Ray', username: 'novaray', avatar: 'https://example.com/nova.jpg', verified: true },
        invitation_status: 'accepted',
        submission_status: 'submitted',
        entry: {
          id: 202,
          caption: 'My battle entry',
          video: { id: 88, stream_url: 'https://cdn.example.com/battle.m3u8', thumbnail_url: 'https://cdn.example.com/battle.jpg' },
          audio: { title: 'Nova Original', artist: 'Nova Ray', is_original: true },
          comments_count: 7,
          engagement: { likes: 32 },
        },
        votes: { count: 14, percentage: 56 },
        likes: 32,
        comments: 7,
        is_winner: false,
      }],
      current_user: {
        is_host: false,
        is_participant: false,
        has_voted: true,
        voted_entry_id: 202,
        can_vote: true,
        can_submit: false,
        can_manage: false,
      },
      pricing: { voting: { payment_method: 'kulcoin', currency_code: 'KC', vote_coin_price: 10, vote_cost_per_choice: 10 } },
    } as ChallengeResource);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: '202',
      userName: 'Nova Ray',
      votes: 14,
      likes: 32,
      comments: 7,
      isVoted: true,
      isVote: true,
      soundTitle: 'Nova Original',
    });
  });

  it('formats normalized rules returned by the challenge detail endpoint', () => {
    expect(challengeRuleResourceToDisplay({
      id: 4,
      scope: 'submission',
      rule_type: 'video_duration',
      operator: 'BETWEEN',
      value: [15, 60],
      is_required: true,
    })).toEqual({
      id: '4',
      title: 'Video Duration',
      description: 'BETWEEN 15 - 60',
      required: true,
      scope: 'submission',
    });
  });

  it('maps the backend compact list payload into a challenge card', () => {
    const card = challengeListResourceToCard({
      id: 42,
      creatorId: 7,
      creatorName: 'Ada Creator',
      avatar: 'https://example.com/avatar.png',
      category: 'dance',
      title: 'Dance Challenge',
      description: 'Create your best dance clip.',
      reward: '250 USD',
      deadline: '2026-09-06T12:00:00.000Z',
      mode: 'open',
      is_creator_battle: false,
      participant_limit: null,
      participants: 18,
      image: 'https://example.com/cover.jpg',
      isNew: true,
    }, new Date('2026-09-01T12:00:00.000Z'));

    expect(card).toEqual({
      id: '42',
      creatorId: '7',
      creatorName: 'Ada Creator',
      avatar: 'https://example.com/avatar.png',
      category: 'dance',
      title: 'Dance Challenge',
      description: 'Create your best dance clip.',
      reward: '250 USD',
      deadline: '5 Days',
      participants: 18,
      mode: 'open',
      isCreatorBattle: false,
      participantLimit: null,
      image: 'https://example.com/cover.jpg',
      isNew: true,
    });
  });

  it('selects and de-duplicates creator battles for the feed carousel', () => {
    const openChallenge = {
      id: 1,
      creatorId: 4,
      creatorName: 'Open Host',
      title: 'Open challenge',
      description: '',
      mode: 'open' as const,
      is_creator_battle: false,
      participants: 2,
      isNew: false,
    };
    const battle = {
      ...openChallenge,
      id: 2,
      title: 'Creator clash',
      mode: 'creator_battle' as const,
      is_creator_battle: true,
    };

    expect(creatorBattleChallengesFromPages([
      { data: [openChallenge, battle] },
      { data: [{ ...battle, title: 'Creator clash updated' }] },
    ])).toEqual([{ ...battle, title: 'Creator clash updated' }]);
  });

  it('orders battle participants with videos for horizontal feed paging', () => {
    const participants = creatorBattleVideoParticipants({
      id: 72,
      mode: 'creator_battle',
      is_creator_battle: true,
      participants: [
        {
          id: 'second',
          role: 'challenger',
          position: 2,
          creator: { id: 2, name: 'Second creator' },
          invitation_status: 'accepted',
          submission_status: 'submitted',
          entry: { id: 22, video: { id: 202, stream_url: 'https://cdn.example.com/second.mp4' } },
        },
        {
          id: 'waiting',
          role: 'challenger',
          position: 3,
          creator: { id: 3, name: 'Waiting creator' },
          invitation_status: 'accepted',
          submission_status: 'pending',
          entry: null,
        },
        {
          id: 'first',
          role: 'host',
          position: 1,
          creator: { id: 1, name: 'First creator' },
          invitation_status: 'accepted',
          submission_status: 'submitted',
          entry: { id: 11, video: { id: 101, stream_url: 'https://cdn.example.com/first.mp4' } },
        },
      ],
    } as ChallengeResource);

    expect(participants.map((participant) => participant.id)).toEqual(['first', 'second']);
  });

  it('maps the wizard into the backend create contract', () => {
    const payload = buildChallengeCreatePayload(input({
      video: {
        id: 91,
        coverSource: 'video',
        coverFrameTimeMs: 2400,
      },
    }));

    expect(payload).toMatchObject({
      title: 'Glow Up Dance Challenge',
      mode: 'open',
      visibility: 'public',
      judging_strategy: 'weighted_normalized',
      winner_selection_method: 'automatic_score',
      max_entries_per_creator: 1,
      hashtag: '#GlowUpChallenge',
      leaderboard_mode: 'live',
      voting_configuration: {
        mode: 'single_choice',
        allow_self_voting: false,
        allow_vote_changes: true,
        maximum_choices: 1,
      },
    });
    expect(payload.scoring_components).toEqual([
      { type: 'public_votes', weight_bps: 5000, normalization_method: 'max_ratio' },
      { type: 'reactions', weight_bps: 5000, normalization_method: 'max_ratio' },
    ]);
    expect(payload.media).toEqual([{
      video_id: 91,
      role: 'challenge_video',
      sort_order: 0,
      metadata: { cover_source: 'video', cover_frame_time_ms: 2400 },
    }]);
    expect(payload.voting_starts_at).toBe(combineChallengeDateAndTime(
      input().votingStartDate!,
      input().votingStartTime!,
    ).toISOString());
    expect(payload.voting_ends_at).toBe(combineChallengeDateAndTime(
      input().votingEndDate!,
      input().votingEndTime!,
    ).toISOString());
    expect(payload.prizes).toHaveLength(2);
    expect(payload.prizes[0]).toMatchObject({ reward_type: 'cash', amount: '500.00', rank_to: 3 });
    expect(JSON.stringify(payload)).not.toContain('file:///');
  });

  it('supports an optional video and assigns all weight to one enabled criterion', () => {
    const payload = buildChallengeCreatePayload(input({
      video: null,
      judgeByVotes: false,
      judgeByReactions: true,
      inviteOnly: true,
      showLeaderboard: false,
      secondaryReward: '',
    }));

    expect(payload.media).toEqual([]);
    expect(payload.visibility).toBe('invite_only');
    expect(payload.leaderboard_mode).toBe('hidden');
    expect(payload.voting_configuration).toBeUndefined();
    expect(payload.scoring_components).toEqual([
      { type: 'reactions', weight_bps: 10000, normalization_method: 'max_ratio' },
    ]);
  });

  it('builds a creator battle with invitees and a fixed participant limit', () => {
    const value = input({
      mode: 'creator_battle',
      battleParticipantIds: [12, 34],
      inviteOnly: false,
      judgeByVotes: true,
      judgeByReactions: true,
      votingStartDate: new Date('2026-10-15T00:00:00.000Z'),
      votingStartTime: new Date('2026-01-01T23:00:00.000Z'),
      votingEndDate: new Date('2026-10-20T00:00:00.000Z'),
    });
    const payload = buildChallengeCreatePayload(value);

    expect(payload).toMatchObject({
      mode: 'creator_battle',
      visibility: 'public',
      max_participants: 3,
      battle_participant_ids: [12, 34],
      max_entries_per_creator: 1,
    });
  });

  it('exposes the new creator challenge action routes', () => {
    expect(endpoints.creator.challengeFinalize(42)).toBe('creator/challenges/42/finalize');
    expect(endpoints.creator.challengeCreatorBattleSettlement(42)).toBe('creator/challenges/42/settle-creator-battle');
    expect(endpoints.creator.challengeEntryJuryScores(42, 9)).toBe('creator/challenges/42/entries/9/jury-scores');
    expect(endpoints.creator.challengeInviteAccept(42, 3)).toBe('creator/challenges/42/invites/3/accept');
    expect(endpoints.creator.challengeRewardAllocationProcess(42, 8))
      .toBe('creator/challenges/42/reward-allocations/8/process');
  });

  it('combines the selected dates and times and rejects invalid schedules', () => {
    const value = input();
    const expectedStart = combineChallengeDateAndTime(value.startDate, value.startTime).toISOString();
    expect(buildChallengeCreatePayload(value).submission_starts_at).toBe(expectedStart);

    expect(() => buildChallengeCreatePayload(input({
      startDate: new Date('2026-10-16T00:00:00.000Z'),
      endDate: new Date('2026-10-15T00:00:00.000Z'),
    }))).toThrow(/end date and time/i);
  });
});
