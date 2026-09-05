const DEFAULT_API_BASE_URL = 'https://unamended-monkishly-gaylord.ngrok-free.dev/api/v1/';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/?$/, '/');

export const API_HEARTBEAT_URL = (() => {
  try {
    return new URL('../heartbeat', API_BASE_URL).toString();
  } catch {
    return '/api/heartbeat';
  }
})();

export const endpoints = {
  auth: {
    login: 'auth/login',
    register: 'auth/register',
    logout: 'auth/logout',
    verifyOtp: 'auth/activate',
    verifyResetOtp: 'auth/verify-reset-otp',
    resendOtp: 'auth/resend',
    checkUsername: 'auth/check-username',
    forgotPassword: 'auth/forgotton-password',
    resetPassword: 'auth/reset-password',
    socialLogin: 'auth/social-login',
    updateVibe: 'auth/update-vibe',
    switchRole: 'auth/switch-role',
    notificationDevices: 'auth/notification-devices',
    notificationDevice: (device: string | number) => `auth/notification-devices/${device}`,
  },
  general: {
    events: 'general/events',
    event: (event: string | number) => `general/events/${event}`,
    eventTicketPurchase: (event: string | number) => `general/events/${event}/tickets/purchase`,
    eventTicketVerify: 'general/events/tickets/verify',
    communityPosts: 'general/community/posts',
    updateProfile: 'general/update-profile',
    uploadAvatar: 'general/upload-avatar',
    uploadBanner: 'general/upload-banner',
    feed: 'general/feed',
    discovery: 'general/discovery',
    discoveryView: 'general/discovery/view',
    recommendations: 'general/recommendations',
    video: (video: string | number) => `general/videos/${video}`,
    videoView: (video: string | number) => `general/videos/${video}/view`,
    videoWatched: 'general/videos/watched',
    videoLike: (video: string | number) => `general/videos/${video}/like`,
    videoBookmark: (video: string | number) => `general/videos/${video}/bookmark`,
    videoComments: (video: string | number) => `general/videos/${video}/comments`,
    commentReply: (video: string | number, comment: string | number) =>
      `general/videos/${video}/comments/${comment}/reply`,
    commentLike: (video: string | number, comment: string | number) =>
      `general/videos/${video}/comments/${comment}/like`,
    creatorFollow: (creator: string | number) => `general/creators/${creator}/follow`,
    wallet: 'general/wallet',
    walletTransactions: 'general/wallet/transactions',
    walletLedger: 'general/wallet/ledger',
    walletTransfer: 'general/wallet/transfer',
    walletTopUp: 'general/wallet/top-up',
    paymentInitialize: 'general/payments/paystack/initialize',
    payment: (payment: string | number) => `general/payments/${payment}`,
    paymentVerify: (payment: string | number) => `general/payments/${payment}/verify`,
    kulCoinWallet: 'general/kulcoin/wallet',
    kulCoinLedger: 'general/kulcoin/ledger',
    kulCoinPackages: 'general/kulcoin/packages',
    kulCoinGifts: 'general/kulcoin/gifts',
    kulCoinPurchase: 'general/kulcoin/purchase',
    kulCoinGiftSend: 'general/kulcoin/gifts/send',
    kulCoinVotes: 'general/kulcoin/votes',
    kulCoinBonus: 'general/kulcoin/bonus',
    communityHistory: 'general/community/history',
    conversations: 'general/conversations',
    stickers: 'general/stickers',
    stickerSearch: 'general/stickers/search',
    stickerRecent: 'general/stickers/recent',
    stickerFavorites: 'general/stickers/favorites',
    stickerPack: (pack: string | number) => `general/stickers/packs/${pack}`,
    stickerFavorite: (sticker: string | number) => `general/stickers/${sticker}/favorite`,
    stickerUse: (sticker: string | number) => `general/stickers/${sticker}/use`,
    sticker: (sticker: string | number) => `general/stickers/${sticker}`,
    conversationsUnreadCount: 'general/conversations/unread-count',
    conversationRequests: 'general/conversations/requests',
    conversationSearch: 'general/conversations/search',
    conversationReports: 'general/conversations/reports',
    conversationRequestAccept: (request: string | number) =>
      `general/conversations/${request}/accept`,
    conversationRequestDecline: (request: string | number) =>
      `general/conversations/${request}/decline`,
    conversationRequestBlock: (request: string | number) =>
      `general/conversations/${request}/block`,
    conversationRequestCancel: (request: string | number) =>
      `general/conversations/${request}/cancel`,
    conversationMessages: (conversation: string | number) =>
      `general/conversations/${conversation}/messages`,
    conversationRead: (conversation: string | number) =>
      `general/conversations/${conversation}/read`,
    conversationTypingStart: (conversation: string | number) =>
      `general/conversations/${conversation}/typing/start`,
    conversationTypingStop: (conversation: string | number) =>
      `general/conversations/${conversation}/typing/stop`,
    communityPost: (post: string | number) => `general/community/posts/${post}`,
    communityPostView: (post: string | number) => `general/community/posts/${post}/view`,
    communityPostComments: (post: string | number) => `general/community/posts/${post}/comments`,
    communityPostLike: (post: string | number) => `general/community/posts/${post}/like`,
    communityPostShare: (post: string | number) => `general/community/posts/${post}/share`,
    communityPostGift: (post: string | number) => `general/community/posts/${post}/gift`,
    communityPostPollVote: (post: string | number) => `general/community/posts/${post}/poll/vote`,
    live: 'general/live',
    liveSession: (liveSession: string | number) => `general/live/${liveSession}`,
    livePreview: (liveSession: string | number) => `general/live/${liveSession}/preview`,
    liveJoin: (liveSession: string | number) => `general/live/${liveSession}/join`,
    liveLeave: (liveSession: string | number) => `general/live/${liveSession}/leave`,
    liveComments: (liveSession: string | number) => `general/live/${liveSession}/comments`,
    liveLikes: (liveSession: string | number) => `general/live/${liveSession}/likes`,
    liveGifts: (liveSession: string | number) => `general/live/${liveSession}/gifts`,
    liveReports: (liveSession: string | number) => `general/live/${liveSession}/reports`,
    liveCohostRequests: (liveSession: string | number) => `general/live/${liveSession}/cohost-requests`,
    liveCohostRequestAccept: (cohostRequest: string | number) =>
      `general/live/cohost-requests/${cohostRequest}/accept`,
    liveCohostRequestDecline: (cohostRequest: string | number) =>
      `general/live/cohost-requests/${cohostRequest}/decline`,
    liveBattleAccept: (battle: string | number) => `general/live/battles/${battle}/accept`,
    liveBattleScore: (battle: string | number) => `general/live/battles/${battle}/score`,
    liveBattleEnd: (battle: string | number) => `general/live/battles/${battle}/end`,
  },
  challenges: {
    list: 'general/challenges',
    item: (challenge: string | number) => `general/challenges/${challenge}`,
    ballot: (challenge: string | number) => `general/challenges/${challenge}/ballot`,
    leaderboard: (challenge: string | number) => `general/challenges/${challenge}/leaderboard`,
  },
  media: {
    messageUploads: 'media/message-uploads',
    messageUploadComplete: (attachment: string | number) =>
      `media/message-uploads/${attachment}/complete`,
  },
  creator: {
    music: 'creator/music',
    musicTrack: (musicTrack: string) => `creator/music/${encodeURIComponent(musicTrack)}`,
    events: 'creator/events',
    event: (event: string | number) => `creator/events/${event}`,
    communityPosts: 'creator/community/posts',
    videos: 'creator/videos',
    videoDrafts: 'creator/videos/drafts',
    videoAnalytics: 'creator/videos/analytics',
    video: (video: string | number) => `creator/videos/${video}`,
    videoUpload: (video: string | number) => `creator/videos/${video}/upload`,
    videoUploadInit: 'media/video-uploads',
    videoUploadComplete: (video: string | number) => `media/video-uploads/${video}/complete`,
    videoRetryProcessing: (video: string | number) => `media/videos/${video}/retry-processing`,
    videoDuetDraft: (video: string | number) => `creator/videos/${video}/duet-draft`,
    videoEdits: (video: string | number) => `creator/videos/${video}/edits`,
    videoProgress: (video: string | number) => `creator/videos/${video}/progress`,
    videoPlaylists: 'creator/video-playlists',
    videoPlaylist: (playlist: string | number) => `creator/video-playlists/${playlist}`,
    videoPlaylistVideos: (playlist: string | number) => `creator/video-playlists/${playlist}/videos`,
    videoPlaylistVideo: (playlist: string | number, video: string | number) =>
      `creator/video-playlists/${playlist}/videos/${video}`,
    videoPlaylistBulkVideos: (playlist: string | number) => `creator/video-playlists/${playlist}/videos/bulk`,
    challenges: 'creator/challenges',
    dashboard: 'creator/dashboard',
    kulscanDashboard: 'creator/kulscan/dashboard',
    challengeDrafts: 'creator/challenges/draft',
    challenge: (challenge: string | number) => `creator/challenges/${challenge}`,
    challengeTransition: (challenge: string | number) => `creator/challenges/${challenge}/transition`,
    challengeFinalize: (challenge: string | number) => `creator/challenges/${challenge}/finalize`,
    challengeCreatorBattleSettlement: (challenge: string | number) =>
      `creator/challenges/${challenge}/settle-creator-battle`,
    challengeEntries: (challenge: string | number) => `creator/challenges/${challenge}/entries`,
    challengeEntry: (challenge: string | number, entry: string | number) =>
      `creator/challenges/${challenge}/entries/${entry}`,
    challengeEntryJuryScores: (challenge: string | number, entry: string | number) =>
      `creator/challenges/${challenge}/entries/${entry}/jury-scores`,
    challengeEntryWinner: (challenge: string | number, entry: string | number) =>
      `creator/challenges/${challenge}/entries/${entry}/select-winner`,
    challengeInvites: (challenge: string | number) => `creator/challenges/${challenge}/invites`,
    challengeInviteAccept: (challenge: string | number, invite: string | number) =>
      `creator/challenges/${challenge}/invites/${invite}/accept`,
    challengeJury: (challenge: string | number) => `creator/challenges/${challenge}/jury`,
    challengeIntegrityFlagResolve: (challenge: string | number, integrityFlag: string | number) =>
      `creator/challenges/${challenge}/integrity-flags/${integrityFlag}/resolve`,
    challengeRewardAllocationProcess: (challenge: string | number, allocation: string | number) =>
      `creator/challenges/${challenge}/reward-allocations/${allocation}/process`,
    live: 'creator/live',
    liveStart: (liveSession: string | number) => `creator/live/${liveSession}/start`,
    liveConfirm: (liveSession: string | number) => `creator/live/${liveSession}/confirm`,
    liveReconnect: (liveSession: string | number) => `creator/live/${liveSession}/reconnect`,
    liveHeartbeat: (liveSession: string | number) => `creator/live/${liveSession}/heartbeat`,
    liveEnd: (liveSession: string | number) => `creator/live/${liveSession}/end`,
    liveModerate: (liveSession: string | number) => `creator/live/${liveSession}/moderate`,
    liveCohostInvite: (liveSession: string | number) => `creator/live/${liveSession}/cohosts/invite`,
    liveCohostRemove: (liveSession: string | number, user: string | number) =>
      `creator/live/${liveSession}/cohosts/${user}`,
    liveBattleInvite: (liveSession: string | number) => `creator/live/${liveSession}/battles/invite`,
    liveAnalytics: (liveSession: string | number) => `creator/live/${liveSession}/analytics`,
  },
  subscription: {
    fanSubscribe: 'fan/subscription-plans',
    creatorPlan: 'creator/subscription-plans',
    creatorPlanItem: (subscriptionPlan: string | number) =>
      `creator/subscription-plans/${subscriptionPlan}`,
    creatorPlanDisable: (subscriptionPlan: string | number) =>
      `creator/subscription-plans/${subscriptionPlan}/disable`,
    creatorSubscriptionBlock: (subscription: string | number) =>
      `creator/subscriptions/${subscription}/block`,
    publicCreatorPlans: (creator: string | number) =>
      `creator-fan/creators/${creator}/subscription-plans`,
  },
  user: {
    me: 'auth/me',
    profile: 'users/profile',
  },
} as const;
