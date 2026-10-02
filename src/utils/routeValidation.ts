import type { RootStackParamList } from '../types/user.types';

type RouteName = keyof RootStackParamList;
type FieldKind = 'id' | 'string' | 'boolean' | 'number' | 'object' | 'array';
type FieldRule = FieldKind | { oneOf: readonly string[] };
type RouteSchema = {
  fields: Record<string, FieldRule>;
  required?: readonly string[];
  requiredAny?: readonly string[];
};

const isObject = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = (value: unknown) => (
  (typeof value === 'string' && value.trim().length > 0)
  || (typeof value === 'number' && Number.isFinite(value) && value > 0)
);

const fieldIsValid = (value: unknown, rule: FieldRule) => {
  if (value === undefined || value === null) return true;
  if (typeof rule === 'object') return typeof value === 'string' && rule.oneOf.includes(value);
  if (rule === 'id') return isId(value);
  if (rule === 'string') return typeof value === 'string';
  if (rule === 'boolean') return typeof value === 'boolean';
  if (rule === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (rule === 'array') return Array.isArray(value);
  return isObject(value);
};

const schemas: Partial<Record<RouteName, RouteSchema>> = {
  MainTabs: { fields: { screen: { oneOf: ['Galaxy', 'Arena', 'Discover', 'Community', 'Signal', 'Profile'] }, params: 'object' } },
  EmailPhone: { fields: { isCreateAccount: 'boolean' } },
  EmailVerification: { fields: { email: 'string' }, required: ['email'] },
  VerifyOtp: {
    fields: { email: 'string', phone: 'string', id: 'id', flow: { oneOf: ['default', 'resetPassword'] } },
    requiredAny: ['email', 'phone', 'id'],
  },
  ResetPassword: { fields: { email: 'string', phone: 'string', otp: 'string' }, requiredAny: ['email', 'phone'] },
  TermsPolicies: { fields: { onboarding: 'boolean', nextRoute: { oneOf: ['VibePicker'] } } },
  VibePicker: { fields: { firstSignIn: 'boolean' } },
  Chat: {
    fields: {
      conversationId: 'id', senderId: 'id', id: 'id', name: 'string', avatar: 'string',
      isOnline: 'boolean', lastSeenAt: 'string', callId: 'id',
    },
    requiredAny: ['conversationId', 'senderId', 'id'],
  },
  Settings: { fields: { view: { oneOf: ['main', 'tags', 'identity', 'avatar', 'banner', 'switch-fan', 'signal-encryption'] } } },
  FanSettings: { fields: { view: { oneOf: ['main', 'profile', 'identity', 'gifts', 'payments', 'notifications'] }, fromProfile: 'boolean' } },
  ArtistProfile: { fields: { creatorId: 'id', id: 'id', isOwner: 'boolean', name: 'string', handle: 'string', avatar: 'string', banner: 'string' } },
  UploadContent: { fields: { sound: 'object' } },
  CreatorEvents: { fields: { openComposer: 'boolean' } },
  CreatorAnalytics: { fields: { event: 'id' } },
  CreatorRevenue: { fields: { openWithdraw: 'boolean' } },
  RecordContent: {
    fields: {
      sound: 'object', duetDraftId: 'id', duetSourceVideoId: 'id', duetSourceVideoUrl: 'string',
      duetLayout: { oneOf: ['side_by_side', 'stacked', 'picture_in_picture'] }, challengeId: 'id',
      purpose: { oneOf: ['post_video', 'challenge_video', 'challenge_instruction_video', 'challenge_entry', 'message_video', 'other'] }, officialSoundId: 'id',
    },
  },
  CreatorLiveStream: { fields: { liveSessionId: 'id', initialLive: 'object', quality: 'string', liveType: { oneOf: ['regular', 'battle'] } }, requiredAny: ['liveSessionId', 'initialLive'] },
  CreatorBattleScreen: { fields: { liveSessionId: 'id', initialLive: 'object', quality: 'string', battleId: 'id', participantRole: { oneOf: ['host', 'opponent'] } }, requiredAny: ['liveSessionId', 'initialLive'] },
  CreatorBattleParticipantScreen: { fields: { liveSessionId: 'id', initialLive: 'object', quality: 'string', battleId: 'id', participantRole: { oneOf: ['host', 'opponent'] } }, requiredAny: ['liveSessionId', 'initialLive'] },
  LiveStream: { fields: { liveSessionId: 'id', initialLive: 'object', openGuests: 'boolean', openGift: 'boolean' }, requiredAny: ['liveSessionId', 'initialLive'] },
  StreamEnded: { fields: { liveSessionId: 'id', endedLive: 'object' }, requiredAny: ['liveSessionId', 'endedLive'] },
  CreateChallenge: { fields: { draft: 'object' } },
  ChallengeDrafts: { fields: { draft: 'object' } },
  ChallengeFeed: { fields: { challengeId: 'id' }, required: ['challengeId'] },
  Video: { fields: { id: 'id' }, required: ['id'] },
  EventDetail: { fields: { id: 'id', eventId: 'id', isOwner: 'boolean' }, requiredAny: ['id', 'eventId'] },
  SelectTickets: { fields: { id: 'id', eventId: 'id', showLiveSeatingMap: 'boolean' }, requiredAny: ['id', 'eventId'] },
  TicketVerification: { fields: { eventId: 'id' } },
  ChallengeEntry: { fields: { challengeId: 'id', inviteId: 'id' }, required: ['challengeId'] },
  EditSubmission: { fields: { video: 'object', uploadedVideoId: 'id', uploadToExistingDraft: 'boolean', duetSourceVideoId: 'id', duetSourceVideoUrl: 'string', duetLayout: { oneOf: ['side_by_side', 'stacked', 'picture_in_picture'] }, sound: 'object', challengeId: 'id', purpose: { oneOf: ['post_video', 'challenge_video', 'challenge_instruction_video', 'challenge_entry', 'message_video', 'other'] }, officialSoundId: 'id' }, requiredAny: ['video', 'uploadedVideoId'] },
  SubmitEntry: { fields: { video: 'object', sound: 'object', uploadedVideoId: 'id', uploadToExistingDraft: 'boolean', duetSourceVideoId: 'id', duetSourceVideoUrl: 'string', duetLayout: { oneOf: ['side_by_side', 'stacked', 'picture_in_picture'] }, autoStartUpload: 'boolean', uploadStatus: 'string', uploadProgressPercentage: 'number', visibility: { oneOf: ['public', 'premium'] }, orientation: { oneOf: ['portrait', 'landscape'] }, editPayload: 'object', challengeId: 'id', purpose: { oneOf: ['post_video', 'challenge_video', 'challenge_instruction_video', 'challenge_entry', 'message_video', 'other'] }, officialSoundId: 'id' }, requiredAny: ['video', 'uploadedVideoId'] },
  ConnectHub: { fields: { tab: { oneOf: ['discover', 'incoming', 'outgoing', 'active'] } } },
  CommunityPostDetail: { fields: { postId: 'id' }, required: ['postId'] },
  UseSound: { fields: { sound: 'object' } },
  UseEffect: { fields: { effect: 'object' } },
  FanTicket: { fields: { ticket: 'object', event: 'object', purchase: 'object' }, required: ['ticket', 'event'] },
  ChallengeLeaderboard: { fields: { challengeId: 'id' }, required: ['challengeId'] },
  Submissions: { fields: { challengeId: 'id' }, required: ['challengeId'] },
  VideoPlayer: { fields: { id: 'id', item: 'object', next_videos: 'array', playlistId: 'id', playlistName: 'string' }, requiredAny: ['id', 'item'] },
  PlaylistPlayer: { fields: { id: 'id', playlistId: 'id', videoId: 'id', activeVideo: 'object' }, requiredAny: ['id', 'playlistId'] },
};

export type RouteValidationResult = { valid: true } | { valid: false; message: string };

export const validateRouteParams = (routeName: RouteName, input: unknown): RouteValidationResult => {
  const schema = schemas[routeName];
  if (!schema) return { valid: true };
  if (input == null) {
    return schema.required?.length || schema.requiredAny?.length
      ? { valid: false, message: `Missing parameters for ${routeName}.` }
      : { valid: true };
  }
  if (!isObject(input)) return { valid: false, message: `Invalid parameters for ${routeName}.` };
  const params = input as Record<string, unknown>;
  const unknownField = Object.keys(params).find((field) => !(field in schema.fields));
  if (unknownField) return { valid: false, message: `Unsupported ${routeName} parameter: ${unknownField}.` };
  const invalidField = Object.entries(schema.fields).find(([field, rule]) => !fieldIsValid(params[field], rule));
  if (invalidField) return { valid: false, message: `Invalid ${routeName} parameter: ${invalidField[0]}.` };
  const missingRequired = schema.required?.find((field) => params[field] == null);
  if (missingRequired) return { valid: false, message: `Missing ${routeName} parameter: ${missingRequired}.` };
  if (schema.requiredAny?.length && !schema.requiredAny.some((field) => params[field] != null && fieldIsValid(params[field], schema.fields[field]))) {
    return { valid: false, message: `Missing a required destination identifier for ${routeName}.` };
  }
  return { valid: true };
};
