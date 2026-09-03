import type {
  ChallengeRulePayload,
  ChallengeScoringComponentPayload,
  ChallengeWizardPayloadInput,
  ChallengeListResource,
  ChallengeFeedItem,
  ChallengeEntryResource,
  ChallengeRuleResource,
  ChallengeResource,
  ChallengePage,
  CreatorBattleParticipantResource,
  CreateChallengePayload,
} from '../types/challenge.types';
import { getVideoPlaybackUrl, getVideoPoster } from './video';

export type ChallengeCardItem = {
  id: string;
  creatorId: string;
  creatorName: string;
  avatar?: string;
  category: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  participants: number;
  mode?: ChallengeListResource['mode'];
  isCreatorBattle?: boolean;
  participantLimit?: number | null;
  image: string;
  isNew?: boolean;
};

export const DEFAULT_CHALLENGE_CARD_IMAGE = 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&q=80&w=800';

export const challengeDeadlineLabel = (deadline?: string | null, now = new Date()) => {
  if (!deadline) return 'Open';
  const deadlineMs = new Date(deadline).getTime();
  if (Number.isNaN(deadlineMs)) return 'Open';

  const remainingMs = deadlineMs - now.getTime();
  if (remainingMs <= 0) return 'Ended';
  const days = Math.max(1, Math.ceil(remainingMs / 86_400_000));
  return `${days} ${days === 1 ? 'Day' : 'Days'}`;
};

export const challengeListResourceToCard = (
  challenge: ChallengeListResource,
  now = new Date(),
): ChallengeCardItem => ({
  id: String(challenge?.id ?? ''),
  creatorId: String(challenge?.creatorId ?? ''),
  creatorName: challenge?.creatorName || 'Unknown Creator',
  avatar: challenge?.avatar || undefined,
  category: challenge?.category == null || String(challenge.category).trim() === ''
    ? 'Challenge'
    : String(challenge.category),
  title: challenge?.title || 'Untitled Challenge',
  description: challenge?.description || '',
  reward: challenge?.reward || 'Recognition prize',
  deadline: challengeDeadlineLabel(challenge?.deadline, now),
  participants: Number(challenge?.participants) || 0,
  mode: challenge?.mode || 'open',
  isCreatorBattle: Boolean(challenge?.is_creator_battle),
  participantLimit: challenge?.participant_limit ?? null,
  image: challenge?.image || DEFAULT_CHALLENGE_CARD_IMAGE,
  isNew: Boolean(challenge?.isNew),
});

export const creatorBattleChallengesFromPages = (
  pages: ChallengePage[] | undefined,
): ChallengeListResource[] => {
  const battles = new Map<string, ChallengeListResource>();

  (pages || []).forEach((page) => {
    (page?.data || []).forEach((challenge) => {
      if (!challenge || (challenge.mode !== 'creator_battle' && !challenge.is_creator_battle)) return;
      battles.set(String(challenge.id), challenge);
    });
  });

  return Array.from(battles.values());
};

export const creatorBattleVideoParticipants = (
  challenge?: ChallengeResource | null,
): CreatorBattleParticipantResource[] => {
  if (!challenge || (challenge.mode !== 'creator_battle' && !challenge.is_creator_battle)) return [];

  return (challenge.participants || [])
    .filter((participant) => Boolean(participant?.entry?.video?.stream_url))
    .slice()
    .sort((left, right) => left.position - right.position);
};

export const challengeRuleResourceToDisplay = (rule: ChallengeRuleResource) => {
  const title = rule.rule_type
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
  const value = Array.isArray(rule.value)
    ? rule.value.join(' - ')
    : rule.value !== null && typeof rule.value === 'object'
      ? JSON.stringify(rule.value)
      : String(rule.value ?? '');

  return {
    id: String(rule.id ?? `${rule.scope}-${rule.rule_type}`),
    title,
    description: `${rule.operator} ${value}`.trim(),
    required: rule.is_required,
    scope: rule.scope,
  };
};

export const challengeResourceToFeedItems = (challenge?: ChallengeResource | null): ChallengeFeedItem[] => {
  if (!challenge || typeof challenge !== 'object') return [];

  const items: ChallengeFeedItem[] = [];
  const official = challenge.official_video;

  if (official?.videoUrl) {
    items.push({
      id: String(official.id || `official-${challenge.id}`),
      userName: challenge.title || 'Official Challenge',
      userHandle: challenge.slug || 'official_challenge',
      userAvatar: official.thumbnailUrl || '',
      videoUrl: official.videoUrl,
      thumbnailUrl: official.thumbnailUrl || '',
      caption: official.caption || challenge.description || '',
      likes: 0,
      comments: 0,
      votes: 0,
      isLiked: false,
      isVoted: false,
      originalSound: Boolean(challenge.official_sound_id),
      soundArtist: challenge.title || 'Official Challenge',
      soundTitle: 'Official Challenge Video',
      isSeed: true,
      tag: 'officialChallengeVideo',
      isVote: false,
    });
  }

  const isCreatorBattle = challenge.mode === 'creator_battle' || challenge.is_creator_battle;
  const battleParticipants = isCreatorBattle && Array.isArray(challenge.participants)
    ? challenge.participants
    : [];
  battleParticipants.forEach((participant) => {
    const entry = participant?.entry;
    const videoUrl = entry?.video?.stream_url;
    if (!entry || !videoUrl) return;
    const creatorName = participant.creator?.name || participant.creator?.username || 'Challenge Creator';
    const handle = participant.creator?.username || creatorName.toLowerCase().replace(/\s+/g, '.');
    items.push({
      id: String(entry.id),
      userName: creatorName,
      userHandle: handle,
      userAvatar: participant.creator?.avatar || entry.video?.thumbnail_url || '',
      videoUrl,
      thumbnailUrl: entry.video?.thumbnail_url || '',
      caption: entry.caption || '',
      likes: Number(participant.likes ?? entry.engagement?.likes) || 0,
      comments: Number(participant.comments ?? entry.comments_count ?? entry.engagement?.comments) || 0,
      votes: Number(participant.votes?.count) || 0,
      isLiked: false,
      isVoted: String(challenge.current_user?.voted_entry_id ?? '') === String(entry.id),
      originalSound: Boolean(entry.audio?.is_original),
      soundArtist: entry.audio?.artist || creatorName,
      soundTitle: entry.audio?.title || (entry.audio?.is_original ? 'Original Sound' : challenge.title || 'Challenge'),
      isSeed: false,
      tag: 'ChallengeEntry',
      isVote: Boolean(challenge.current_user?.can_vote),
    });
  });

  const entries = Array.isArray(challenge.entries) ? challenge.entries : [];
  entries.forEach((entry) => {
    if (!entry || typeof entry !== 'object' || !entry.videoUrl) return;
    items.push({
      id: String(entry.id || `entry-${items.length}`),
      userName: entry.userName || 'Challenge Creator',
      userHandle: entry.userHandle || 'creator',
      userAvatar: entry.userAvatar || entry.thumbnailUrl || '',
      videoUrl: entry.videoUrl,
      thumbnailUrl: entry.thumbnailUrl || '',
      caption: entry.caption || '',
      likes: Number(entry.likes) || 0,
      comments: Number(entry.comments) || 0,
      votes: Number(entry.votes) || 0,
      isLiked: Boolean(entry.isLiked),
      isVoted: Boolean(entry.isVoted),
      originalSound: Boolean(entry.originalSound),
      soundArtist: entry.userName || 'Challenge Creator',
      soundTitle: entry.originalSound ? 'Original Sound' : challenge.title || 'Challenge',
      isSeed: false,
      tag: 'ChallengeEntry',
      isVote: Boolean(entry.isVote),
    });
  });

  return items;
};

export const challengeEntriesToFeedItems = (
  entries: ChallengeEntryResource[],
  challenge?: ChallengeResource | null,
): ChallengeFeedItem[] => entries.flatMap((entry) => {
  const video = entry.video;
  const videoUrl = video ? getVideoPlaybackUrl(video) : null;
  if (!videoUrl) return [];

  const creatorName = entry.creator?.name || entry.creator?.handle || 'Challenge Creator';
  return [{
    id: String(entry.id),
    userName: creatorName,
    userHandle: entry.creator?.handle || 'creator',
    userAvatar: entry.creator?.avatar || '',
    videoUrl,
    thumbnailUrl: video ? (getVideoPoster(video) || '') : '',
    caption: entry.caption || video?.caption || '',
    likes: 0,
    comments: 0,
    votes: Number(entry.current_score) || 0,
    isLiked: false,
    isVoted: Boolean(challenge?.current_user?.has_voted ?? challenge?.has_user_voted),
    originalSound: Boolean(challenge?.official_sound_id),
    soundArtist: creatorName,
    soundTitle: video?.title || challenge?.title || 'Challenge',
    isSeed: false,
    tag: 'ChallengeEntry' as const,
    isVote: Boolean(challenge?.current_user?.can_vote ?? challenge?.can_vote),
  }];
});

export const combineChallengeDateAndTime = (date: Date, time: Date) => {
  const value = new Date(date);
  value.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return value;
};

const normalizedHashtag = (hashtag: string) => {
  const value = hashtag.trim();
  if (!value) return '';
  return value.startsWith('#') ? value : `#${value}`;
};

const videoDurationRule = (value: string): ChallengeRulePayload => {
  if (value === '15s - 30s') {
    return { scope: 'submission', rule_type: 'video_duration', operator: 'BETWEEN', value: [15, 30], is_required: true };
  }
  if (value === 'Up to 3 min') {
    return { scope: 'submission', rule_type: 'video_duration', operator: '<=', value: 180, is_required: true };
  }
  return { scope: 'submission', rule_type: 'video_duration', operator: 'BETWEEN', value: [15, 60], is_required: true };
};

const allowedMimeTypes = (value: string) => {
  if (value === 'MP4 only') return ['video/mp4'];
  if (value === 'Any video') return ['video/mp4', 'video/quicktime', 'video/webm'];
  return ['video/mp4', 'video/quicktime'];
};

const scoringComponents = (votes: boolean, reactions: boolean): ChallengeScoringComponentPayload[] => {
  const types: ChallengeScoringComponentPayload['type'][] = [];
  if (votes) types.push('public_votes');
  if (reactions) types.push('reactions');

  return types.map((type, index) => ({
    type,
    weight_bps: index === types.length - 1 ? 10000 - Math.floor(10000 / types.length) * index : Math.floor(10000 / types.length),
    normalization_method: 'max_ratio',
  }));
};

export const buildChallengeCreatePayload = (input: ChallengeWizardPayloadInput): CreateChallengePayload => {
  const startsAt = combineChallengeDateAndTime(input.startDate, input.startTime);
  const endsAt = combineChallengeDateAndTime(input.endDate, input.endTime);
  const votingStartsAt = combineChallengeDateAndTime(
    input.votingStartDate ?? input.startDate,
    input.votingStartTime ?? input.startTime,
  );
  const votingEndsAt = combineChallengeDateAndTime(
    input.votingEndDate ?? input.endDate,
    input.votingEndTime ?? input.endTime,
  );
  const hashtag = normalizedHashtag(input.hashtag);
  const components = scoringComponents(input.judgeByVotes, input.judgeByReactions);
  const amount = Number(input.primaryPrize);
  const mode = input.mode ?? (input.inviteOnly ? 'invite_only' : 'open');
  const battleParticipantIds = Array.from(new Set(
    (input.battleParticipantIds ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  ));

  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new Error('The challenge end date and time must be after its start.');
  }
  if (input.judgeByVotes && votingEndsAt.getTime() <= votingStartsAt.getTime()) {
    throw new Error('The voting end date and time must be after voting starts.');
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Enter a cash prize greater than zero.');
  }
  if (components.length === 0) {
    throw new Error('Enable Vote, Reactions, or both for judging.');
  }
  if (mode === 'creator_battle' && (battleParticipantIds.length < 1 || battleParticipantIds.length > 3)) {
    throw new Error('Choose between 1 and 3 creators for the battle.');
  }
  if (mode === 'creator_battle' && input.judgeByVotes && votingStartsAt.getTime() < endsAt.getTime()) {
    throw new Error('Voting must start after submissions close for creator battles.');
  }

  const rules: ChallengeRulePayload[] = [
    videoDurationRule(input.videoLength),
    { scope: 'submission', rule_type: 'aspect_ratio', operator: '=', value: input.aspectRatio, is_required: true },
    { scope: 'submission', rule_type: 'allowed_format', operator: 'IN', value: allowedMimeTypes(input.allowedFormat), is_required: true },
    { scope: 'content', rule_type: 'category', operator: '=', value: input.category, is_required: true },
  ];
  if (hashtag) {
    rules.push({ scope: 'submission', rule_type: 'required_hashtag', operator: '=', value: hashtag, is_required: true });
  }

  const prizes: CreateChallengePayload['prizes'] = [{
    rank_from: 1,
    rank_to: input.winnerCount,
    reward_type: 'cash',
    title: 'Cash Prize',
    currency: 'USD',
    amount: amount.toFixed(2),
    quantity: input.winnerCount,
  }];
  if (input.secondaryReward?.trim()) {
    prizes.push({
      rank_from: 1,
      rank_to: input.winnerCount,
      reward_type: 'custom',
      title: input.secondaryReward.trim(),
      quantity: input.winnerCount,
    });
  }

  const media: CreateChallengePayload['media'] = input.video ? [{
    video_id: input.video.id,
    role: 'challenge_video',
    sort_order: 0,
    metadata: {
      ...(input.video.coverSource ? { cover_source: input.video.coverSource } : {}),
      ...(input.video.coverFrameTimeMs != null ? { cover_frame_time_ms: input.video.coverFrameTimeMs } : {}),
      ...(input.video.coverUrl ? { cover_url: input.video.coverUrl } : {}),
    },
  }] : [];

  return {
    title: input.title.trim(),
    description: input.description.trim(),
    instructions: input.instructions.trim() || null,
    host_type: 'creator',
    mode,
    visibility: mode === 'invite_only' ? 'invite_only' : 'public',
    judging_strategy: 'weighted_normalized',
    winner_selection_method: 'automatic_score',
    submission_starts_at: startsAt.toISOString(),
    submission_ends_at: endsAt.toISOString(),
    ...(input.judgeByVotes ? {
      voting_starts_at: votingStartsAt.toISOString(),
      voting_ends_at: votingEndsAt.toISOString(),
      voting_configuration: {
        mode: 'single_choice' as const,
        allow_self_voting: false,
        allow_vote_changes: true,
        maximum_choices: 1,
      },
    } : {}),
    show_leaderboard: input.showLeaderboard,
    leaderboard_mode: input.showLeaderboard ? 'live' : 'hidden',
    ...(mode === 'creator_battle' ? {
      max_participants: battleParticipantIds.length + 1,
      battle_participant_ids: battleParticipantIds,
    } : {}),
    max_entries_per_creator: input.limitEntries ? 1 : 100,
    hashtag: hashtag || null,
    official_sound_id: input.officialSoundId ?? null,
    rules,
    media,
    prizes,
    scoring_components: components,
  };
};
