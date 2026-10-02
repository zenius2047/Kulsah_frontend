import type { UserRole } from './auth.types';

export interface User {
  id: number | string;
  name: string;
  role: UserRole;
  activated? : string | boolean;
  activated_at? : string;
  avatar? : string | null;
  banner?: string | null;
  bio?: string | null;
  created_at?: string;
  email: string;
  handle: string;
  location?: string | null;
  country_code?: string | null;
  country?: string | null;
  currency?: string | null;
  phone?: string | null;
  total_followers?: number;
  total_subscribers?: number;
  total_likes?: number;
  vibes?: string[];
  updated_at?: string;
  verified?: boolean;
  verified_at?: string;
}

export type Gender = 'male' | 'female';

export type UpdateProfilePayload = {
  name?: string;
  username?: string;
  bio?: string | null;
  phone?: string | null;
  dob?: string | null;
  gender?: Gender | null;
  location?: string | null;
  country_code?: string | null;
};

export type AvatarUploadSource = {
  uri: string;
  name?: string;
  type?: string;
};

export type RouteId = string | number;
type MainTabName = 'Galaxy' | 'Arena' | 'Discover' | 'Community' | 'Signal' | 'Profile';
type DuetRouteLayout = 'side_by_side' | 'stacked' | 'picture_in_picture';

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: { screen?: MainTabName; params?: { videoId?: RouteId } } | undefined;
  GetStarted: undefined;
  Login: undefined;
  EmailPhone: { isCreateAccount?: boolean } | undefined;
  EmailVerification: { email: string };
  VerifyOtp: { email?: string; phone?: string; id?: RouteId; flow?: 'default' | 'resetPassword' };
  ForgotPassword: undefined;
  ResetPassword: { email?: string; phone?: string; otp?: string };
  TermsPolicies: { onboarding?: boolean; nextRoute?: 'VibePicker' } | undefined;
  PrivacyCentre: undefined;
  VibePicker: { firstSignIn?: boolean } | undefined;
  Chat: {
    conversationId?: RouteId;
    senderId?: RouteId;
    id?: RouteId;
    name?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeenAt?: string;
    callId?: string | number;
  };
  Settings: { view?: 'main' | 'tags' | 'identity' | 'avatar' | 'banner' | 'switch-fan' | 'signal-encryption' } | undefined;
  MembershipTiers: undefined;
  ArtistProfile: { creatorId?: RouteId; id?: RouteId; isOwner?: boolean; name?: string; handle?: string; avatar?: string; banner?: string } | undefined;
  UploadContent: { sound?: object } | undefined;
  FanSettings: { view?: 'main' | 'profile' | 'identity' | 'gifts' | 'payments' | 'notifications'; fromProfile?: boolean } | undefined;
  GoLive: undefined;
  CreatorEvents: { openComposer?: boolean } | undefined;
  CreatorAnalytics: { event?: RouteId } | undefined;
  CreatorRevenue: { openWithdraw?: boolean } | undefined;
  FanSubscriptions: undefined;
  Subscribers: undefined;
  Challenges: undefined;
  RecordContent: { sound?: object; duetDraftId?: RouteId; duetSourceVideoId?: RouteId; duetSourceVideoUrl?: string; duetLayout?: DuetRouteLayout; challengeId?: RouteId; purpose?: import('./video.types').VideoPurpose; officialSoundId?: RouteId | null } | undefined;
  CreateContent: undefined;
  CreatorLiveStream: { liveSessionId?: RouteId; initialLive?: object; quality?: string; liveType?: 'regular' | 'battle' };
  CreatorBattleScreen: { liveSessionId?: RouteId; initialLive?: object; quality?: string; battleId?: RouteId; participantRole?: 'host' | 'opponent' };
  CreatorBattleParticipantScreen: { liveSessionId?: RouteId; initialLive?: object; quality?: string; battleId?: RouteId; participantRole?: 'host' | 'opponent' };
  LiveStream: { liveSessionId?: RouteId; initialLive?: object; openGuests?: boolean; openGift?: boolean };
  StreamEnded: { liveSessionId?: RouteId; endedLive?: object };
  CreateChallenge: { draft?: object } | undefined;
  ChallengeDrafts: { draft?: object } | undefined;
  ChallengeFeed: { challengeId: RouteId };
  Vote: undefined;
  Video: { id: RouteId };
  EventDetail: { id?: RouteId; eventId?: RouteId; isOwner?: boolean };
  SelectTickets: { id?: RouteId; eventId?: RouteId; showLiveSeatingMap?: boolean };
  TicketVerification: { eventId?: RouteId } | undefined;
  ChallengeEntry: { challengeId: RouteId; inviteId?: RouteId };
  Library: undefined;
  EditSubmission: { video?: object; uploadedVideoId?: RouteId; uploadToExistingDraft?: boolean; duetSourceVideoId?: RouteId; duetSourceVideoUrl?: string; duetLayout?: DuetRouteLayout; sound?: object | null; challengeId?: RouteId; purpose?: import('./video.types').VideoPurpose; officialSoundId?: RouteId | null };
  SubmitEntry: { video?: object; sound?: object | null; uploadedVideoId?: RouteId; uploadToExistingDraft?: boolean; duetSourceVideoId?: RouteId; duetSourceVideoUrl?: string; duetLayout?: DuetRouteLayout; autoStartUpload?: boolean; uploadStatus?: string; uploadProgressPercentage?: number; visibility?: import('./video.types').VideoVisibility; orientation?: import('./video.types').VideoDisplayOrientation; editPayload?: object | null; challengeId?: RouteId; purpose?: import('./video.types').VideoPurpose; officialSoundId?: RouteId | null };
  Livefeed: undefined;
  ConnectHub: { tab?: 'discover' | 'incoming' | 'outgoing' | 'active' } | undefined;
  Notification: undefined;
  StreakReward: undefined;
  ClaimPrize: undefined;
  CommunityPost: undefined;
  CommunityPostDetail: { postId: RouteId };
  MarketPlace: undefined;
  UseSound: { sound?: object } | undefined;
  UseEffect: { effect?: object } | undefined;
  FanTicket: { ticket: object; event: object; purchase?: object | null };
  TopUpCoins: undefined;
  Wallet: undefined;
  ChallengeLeaderboard: { challengeId: RouteId };
  Events: undefined;
  TrendingVideos: undefined;
  Search: undefined;
  Submissions: { challengeId: RouteId };
  Premium: undefined;
  VideoPlayer: { id?: RouteId; item?: object; next_videos?: object[]; playlistId?: RouteId; playlistName?: string };
  PlaylistPlayer: { id?: RouteId; playlistId?: RouteId; videoId?: RouteId; activeVideo?: object };
  HelpCentre: undefined;
  FanProfile: undefined;
};

export type StoredUser = User | null;
