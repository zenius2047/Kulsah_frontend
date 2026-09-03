import type { CreatorVideo } from './video.types';

export type ChallengeHostType = 'creator' | 'brand' | 'platform';
export type ChallengeMode = 'open' | 'invite_only' | 'creator_battle';
export type ChallengeVisibility = 'public' | 'unlisted' | 'invite_only';
export type ChallengeJudgingStrategy = 'points' | 'weighted_normalized';
export type ChallengeStatus =
  | 'draft'
  | 'awaiting_participants'
  | 'pending_review'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'submissions_closed'
  | 'voting_closed'
  | 'judging'
  | 'integrity_review'
  | 'results_pending'
  | 'finalized'
  | 'rewards_processing'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'voided'
  | 'archived';

export type ChallengeRewardType =
  | 'cash'
  | 'wallet_credit'
  | 'physical_product'
  | 'feature'
  | 'badge'
  | 'subscription'
  | 'voucher'
  | 'experience'
  | 'custom';

export type ChallengeScoringType =
  | 'public_votes'
  | 'reactions'
  | 'views'
  | 'shares'
  | 'jury_score'
  | 'host_score'
  | 'completion_rate'
  | 'engagement'
  | 'custom_metric';

export type ChallengeRulePayload = {
  scope: 'eligibility' | 'submission' | 'voting' | 'judging' | 'content' | 'location' | 'audience';
  rule_type: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'NOT_IN' | 'BETWEEN';
  value: unknown;
  is_required?: boolean;
};

export type ChallengeMediaPayload = {
  video_id: string | number;
  role: 'cover' | 'challenge_video' | 'instruction_video' | 'sponsor_asset' | 'banner' | 'reference';
  sort_order?: number;
  metadata?: Record<string, unknown>;
};

export type ChallengePrizePayload = {
  rank_from: number;
  rank_to: number;
  reward_type: ChallengeRewardType;
  title: string;
  description?: string | null;
  currency?: string | null;
  amount?: string | number | null;
  quantity?: number | null;
  metadata?: Record<string, unknown>;
};

export type ChallengeScoringComponentPayload = {
  type: ChallengeScoringType;
  weight_bps?: number;
  point_value?: string | number | null;
  normalization_method?: 'max_ratio' | 'fixed_100' | null;
  configuration?: Record<string, unknown>;
};

export type ChallengeJuryCriterionPayload = {
  name: string;
  min_score?: number;
  max_score: number;
  weight_bps: number;
  sort_order?: number;
};

export type ChallengeJudgingStagePayload = {
  sequence: number;
  name: string;
  stage_type: 'submission' | 'public_voting' | 'jury' | 'host_selection' | 'integrity_review' | 'final';
  starts_at?: string | null;
  ends_at?: string | null;
  configuration?: Record<string, unknown>;
};

export type CreateChallengePayload = {
  title: string;
  slug?: string;
  description: string;
  instructions?: string | null;
  host_type?: ChallengeHostType;
  host_user_id?: string | number | null;
  host_organization_id?: string | number | null;
  mode?: ChallengeMode;
  visibility: ChallengeVisibility;
  judging_strategy: ChallengeJudgingStrategy;
  winner_selection_method: 'automatic_score' | 'jury_score' | 'host_selection' | 'hybrid' | 'manual_admin';
  submission_starts_at: string;
  submission_ends_at: string;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  voting_starts_at?: string | null;
  voting_ends_at?: string | null;
  judging_starts_at?: string | null;
  judging_ends_at?: string | null;
  results_publish_at?: string | null;
  show_leaderboard?: boolean;
  leaderboard_mode?: 'live' | 'delayed' | 'hidden' | 'final_only';
  max_participants?: number | null;
  battle_participant_ids?: Array<string | number>;
  max_entries_per_creator: number;
  hashtag?: string | null;
  official_sound_id?: string | number | null;
  voting_configuration?: {
    mode: 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'points_allocation';
    allow_self_voting?: boolean;
    allow_vote_changes?: boolean;
    maximum_choices?: number;
    rank_points?: number[];
  } | null;
  integrity_configuration?: Record<string, unknown> | null;
  rules?: ChallengeRulePayload[];
  media?: ChallengeMediaPayload[];
  prizes: ChallengePrizePayload[];
  scoring_components: ChallengeScoringComponentPayload[];
  jury_criteria?: ChallengeJuryCriterionPayload[];
  judging_stages?: ChallengeJudgingStagePayload[];
};

export type ChallengePrizeResource = ChallengePrizePayload & {
  id: string | number;
};

export type ChallengeRewardPoolResource = {
  id: string | number;
  sponsor_id?: string | number | null;
  funding_source_type?: string | null;
  funding_source_id?: string | number | null;
  currency?: string | null;
  committed_amount?: string | number | null;
  funded_amount?: string | number | null;
  reserved_amount?: string | number | null;
  distributed_amount?: string | number | null;
  status?: string | null;
  funded_at?: string | null;
};

export type ChallengePricing = {
  reward_summary?: string | null;
  currency?: string | null;
  amount?: string | number | null;
  reward_type?: string | null;
  title?: string | null;
  reward_pools?: ChallengeRewardPoolResource[];
  voting?: {
    payment_method: string;
    currency_code: string;
    vote_coin_price: number;
    vote_cost_per_choice: number;
  };
};

export type CreatorBattleEntryResource = {
  id: string | number;
  caption?: string | null;
  hashtags?: string[];
  video?: {
    id: string | number;
    status?: string | null;
    stream_url?: string | null;
    thumbnail_url?: string | null;
    duration?: number | null;
    width?: number | null;
    height?: number | null;
    processing_status?: string | null;
  } | null;
  audio?: {
    id?: string | number | null;
    title?: string | null;
    artist?: string | null;
    is_original?: boolean;
  } | null;
  comments_count?: number;
  engagement?: { likes?: number; comments?: number; shares?: number };
};

export type CreatorBattleParticipantResource = {
  id: string;
  role: 'host' | 'challenger' | string;
  position: number;
  creator: {
    id: string | number;
    name?: string | null;
    username?: string | null;
    avatar?: string | null;
    verified?: boolean;
  };
  invitation_status: string;
  submission_status: string;
  entry?: CreatorBattleEntryResource | null;
  likes?: number;
  comments?: number;
  votes?: { count: number; percentage: number };
  is_winner?: boolean;
};

export type CreatorBattleSettlementResource = {
  id: string | number;
  challenge_id: string | number;
  challenge_winner_id: string | number;
  challenge_entry_id: string | number;
  recipient_user_id: string | number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  vote_count: number;
  vote_coin_amount: number;
  conversion_rate: string;
  usd_amount: string;
  wallet_transaction_id?: string | number | null;
  attempts: number;
  failure_reason?: string | null;
  metadata: Record<string, unknown>;
  processed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreatorBattleSettlementResponse = {
  data: CreatorBattleSettlementResource;
};

export type ChallengeMediaResource = {
  id: string | number;
  role: ChallengeMediaPayload['role'];
  sort_order: number;
  video?: CreatorVideo | null;
  cover_url?: string | null;
  cover_frame_time_ms?: number | null;
};

export type ChallengeResource = {
  id: string | number;
  title: string;
  slug: string;
  description: string;
  instructions?: string | null;
  host_type: ChallengeHostType;
  host_user_id?: string | number | null;
  host_organization_id?: string | number | null;
  visibility: ChallengeVisibility;
  mode: ChallengeMode;
  is_creator_battle: boolean;
  status: ChallengeStatus;
  judging_strategy: ChallengeJudgingStrategy;
  winner_selection_method: CreateChallengePayload['winner_selection_method'];
  schedule: Record<string, string | null>;
  leaderboard: { enabled: boolean; mode: string };
  participant_count: number;
  participant_limit?: number | null;
  entry_count: number;
  current_phase: ChallengeStatus;
  time_remaining_seconds?: number | null;
  can_join: boolean;
  can_vote: boolean;
  has_user_joined: boolean;
  has_user_voted: boolean;
  eligibility?: { eligible: boolean; failures?: unknown[] } | null;
  official_sound_id?: string | number | null;
  official_video?: ChallengeOfficialVideoResource | null;
  entries?: ChallengeFeedEntryResource[];
  reward?: string | null;
  reward_summary?: string | null;
  awards?: ChallengePrizeResource[];
  prizes?: ChallengePrizeResource[];
  rules?: ChallengeRuleResource[];
  reward_pools?: ChallengeRewardPoolResource[];
  pricing?: ChallengePricing;
  creator_id?: string | number;
  category?: { id?: string | number | null; name?: string | null } | string | null;
  hashtag?: string | null;
  cover_image?: string | null;
  submission?: { starts_at?: string | null; ends_at?: string | null; is_open: boolean };
  voting?: {
    enabled: boolean;
    status: 'upcoming' | 'open' | 'closed' | string;
    starts_at?: string | null;
    ends_at?: string | null;
    total_votes: number;
    visibility: string;
    allow_vote_change: boolean;
    current_user_has_voted: boolean;
    current_user_voted_entry_id?: string | number | null;
  };
  viewVote?: Array<{ creator: string; avatar?: string | null; votes: number; percentage: number }>;
  participants?: CreatorBattleParticipantResource[];
  current_user?: {
    is_host: boolean;
    is_participant: boolean;
    has_voted: boolean;
    voted_entry_id?: string | number | null;
    can_vote: boolean;
    can_submit: boolean;
    can_manage: boolean;
  };
  result?: {
    winner_entry_id: string | number;
    rank: number;
    final_score?: string | number | null;
    confirmed_at?: string | null;
    entry?: CreatorBattleEntryResource | null;
    creator?: CreatorBattleParticipantResource['creator'] | null;
  } | null;
  media?: ChallengeMediaResource[];
  scoring_components?: Array<Record<string, unknown>>;
  jury_criteria?: Array<Record<string, unknown>>;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ChallengeRuleResource = {
  id?: string | number;
  scope: ChallengeRulePayload['scope'];
  rule_type: string;
  operator: ChallengeRulePayload['operator'];
  value: unknown;
  is_required: boolean;
  rules_version?: string | number | null;
};

export type ChallengeOfficialVideoResource = {
  id: string;
  role?: ChallengeMediaPayload['role'] | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  caption: string;
  tag: 'ChallengeVideo';
};

export type ChallengeFeedEntryResource = {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  caption: string;
  likes: number;
  comments: number;
  votes: number;
  isLiked: boolean;
  isVoted: boolean;
  originalSound: boolean;
  tag: 'ChallengeEntry';
  isVote: boolean;
};

export type ChallengeFeedItem = {
  id: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  likes: number;
  comments: number;
  votes: number;
  isLiked: boolean;
  isVoted: boolean;
  originalSound: boolean;
  soundArtist?: string;
  soundTitle?: string;
  isSeed?: boolean;
  tag?: 'officialChallengeVideo' | 'ChallengeEntry';
  isVote?: boolean;
};

export type ChallengeListResource = {
  id: string | number;
  creatorId: string | number;
  creatorName: string;
  avatar?: string | null;
  category?: string | number | null;
  title: string;
  description: string;
  reward?: string | null;
  deadline?: string | null;
  mode: ChallengeMode;
  is_creator_battle: boolean;
  participant_limit?: number | null;
  participants: number;
  image?: string | null;
  isNew: boolean;
};

export type ChallengeItemResponse = { data: ChallengeResource; message?: string };
export type ChallengeShowResponse = { data: { challenge: ChallengeResource }; message?: string };
export type ChallengePage = {
  data: ChallengeListResource[];
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
  };
  links?: { next?: string | null; prev?: string | null };
};

export type ChallengeListParams = {
  status?: ChallengeStatus;
  page?: number;
  per_page?: number;
};

export type TransitionChallengePayload = {
  status: ChallengeStatus;
  reason?: string | null;
};

export type ChallengeBallotPayload = {
  choices: Array<{
    challenge_entry_id: string | number;
    rank?: number | null;
    points?: number | null;
  }>;
  idempotency_key?: string;
};

export type SubmitChallengeEntryPayload = {
  video_id: string | number;
  caption?: string | null;
};

export type SubmitChallengeJuryScorePayload = {
  scores: Array<{
    criterion_id: string | number;
    score: number;
    comment?: string | null;
  }>;
};

export type InviteChallengeParticipantPayload = {
  user_id: string | number;
  expires_at?: string | null;
};

export type InviteChallengeJuryPayload = {
  user_id: string | number;
  role: 'judge' | 'head_judge' | 'observer';
  weight_bps?: number;
};

export type SelectChallengeWinnerPayload = {
  rank: number;
  reason: string;
};

export type ResolveChallengeIntegrityFlagPayload = {
  status: 'resolved_valid' | 'resolved_invalid' | 'dismissed';
  resolution: string;
};

export type ChallengeActionResponse<T = Record<string, unknown>> = {
  data: T;
  message?: string;
};

export type ChallengeEntryResource = {
  id: string | number;
  challenge_id: string | number;
  creator_id: string | number;
  video_id: string | number;
  submission_number: number;
  caption?: string | null;
  status: string;
  current_score?: string | number | null;
  current_rank?: number | null;
  submitted_at?: string | null;
  creator?: {
    id: string | number;
    name: string;
    handle?: string | null;
    avatar?: string | null;
    verified?: boolean;
  } | null;
  video?: CreatorVideo | null;
};

export type ChallengeEntryResponse = {
  data: ChallengeEntryResource;
};

export type ChallengeEntryPage = {
  data: ChallengeEntryResource[];
  meta?: ChallengePage['meta'];
  links?: ChallengePage['links'];
};

export type ChallengeWizardPayloadInput = {
  title: string;
  description: string;
  instructions: string;
  category: string;
  hashtag: string;
  videoLength: string;
  aspectRatio: string;
  allowedFormat: string;
  startDate: Date;
  startTime: Date;
  endDate: Date;
  endTime: Date;
  votingStartDate?: Date;
  votingStartTime?: Date;
  votingEndDate?: Date;
  votingEndTime?: Date;
  mode?: ChallengeMode;
  battleParticipantIds?: Array<string | number>;
  inviteOnly: boolean;
  limitEntries: boolean;
  showLeaderboard: boolean;
  judgeByVotes: boolean;
  judgeByReactions: boolean;
  primaryPrize: string;
  winnerCount: number;
  secondaryReward?: string;
  officialSoundId?: string | number | null;
  video?: {
    id: string | number;
    coverSource?: 'video' | 'library' | null;
    coverFrameTimeMs?: number | null;
    coverUrl?: string | null;
  } | null;
};
