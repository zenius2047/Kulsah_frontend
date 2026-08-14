const DEFAULT_API_BASE_URL = 'https://unamended-monkishly-gaylord.ngrok-free.dev/api/v1/';

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/?$/, '/');

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
    updateVibe: 'auth/update-vibe',
    switchRole: 'auth/switch-role',
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
    communityPost: (post: string | number) => `general/community/posts/${post}`,
    communityPostView: (post: string | number) => `general/community/posts/${post}/view`,
    communityPostComments: (post: string | number) => `general/community/posts/${post}/comments`,
    communityPostLike: (post: string | number) => `general/community/posts/${post}/like`,
    communityPostShare: (post: string | number) => `general/community/posts/${post}/share`,
    communityPostGift: (post: string | number) => `general/community/posts/${post}/gift`,
    communityPostPollVote: (post: string | number) => `general/community/posts/${post}/poll/vote`,
  },
  creator: {
    events: 'creator/events',
    event: (event: string | number) => `creator/events/${event}`,
    communityPosts: 'creator/community/posts',
    videos: 'creator/videos',
    videoDrafts: 'creator/videos/drafts',
    videoAnalytics: 'creator/videos/analytics',
    video: (video: string | number) => `creator/videos/${video}`,
    videoUpload: (video: string | number) => `creator/videos/${video}/upload`,
    videoUploadInit: 'creator/videos/uploads/init',
    videoUploadComplete: (video: string | number) => `creator/videos/${video}/upload/complete`,
    videoEdits: (video: string | number) => `creator/videos/${video}/edits`,
    videoProgress: (video: string | number) => `creator/videos/${video}/progress`,
    videoPlaylists: 'creator/video-playlists',
    videoPlaylist: (playlist: string | number) => `creator/video-playlists/${playlist}`,
    videoPlaylistVideos: (playlist: string | number) => `creator/video-playlists/${playlist}/videos`,
    videoPlaylistVideo: (playlist: string | number, video: string | number) =>
      `creator/video-playlists/${playlist}/videos/${video}`,
    videoPlaylistBulkVideos: (playlist: string | number) => `creator/video-playlists/${playlist}/videos/bulk`,
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
  socialLogin: {
    social: 'auth/',
  }
} as const;
