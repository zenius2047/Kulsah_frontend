import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  type GestureResponderEvent,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useVideoPlayer, VideoView } from 'expo-video';
import { mediumScreen, user } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontSize } from '../typography';
import Reactions from './Reactions';
import { communityApi, formatCommunityRelativeTime, parseApiError, useCommunityPosts, type CommunityComment as ApiCommunityComment, type CommunityPage, type CommunityPost as ApiCommunityPost } from '../src';

interface Comment {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
}

interface PollOption {
  id: string | number;
  text: string;
  votes: number;
  isSelected?: boolean;
}

interface CommunityPost {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  videoPoster?: string;
  isLive?: boolean;
  viewerCount?: number;
  likes: number;
  comments: number;
  shares?: number;
  gifts?: number;
  views?: number;
  audience?: 'public' | 'subscribers';
  status?: string;
  commentList?: Comment[];
  apiComments?: ApiCommunityComment[];
  time: string;
  isLiked: boolean;
  type: 'text' | 'image' | 'poll' | 'live';
  pollOptions?: PollOption[];
  isFollowing: boolean;
  isVerified: boolean;
  communityCount?: number;
}

interface CurrentUser {
  name?: string;
  handle?: string;
  avatar?: string;
  role?: 'creator' | 'fan';
}

const STORAGE_KEY = 'pulsar_community_posts';
const USER_KEY = 'pulsar_user';

const FEED_VIDEO_LINKS = {
  liveStudio: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790256/K53234_snaapi.mp4',
};

const ARTIST_PROFILE_IMAGE_LINKS = {
  profile: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792408/profile_image_001_utl9qa.jpg',
  banner: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792408/banner_image_001_ewjudx.jpg',
  concert: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
  studio: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
  stage: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
  session: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
};

const seedPosts: CommunityPost[] = [
  {
    id: 'live-1',
    artist: 'Mila Ray',
    handle: 'milaray',
    avatar: ARTIST_PROFILE_IMAGE_LINKS.profile,
    content: 'Live Studio Session! Come hang out while I work on some new tracks. 🎹✨',
    videoUrl: FEED_VIDEO_LINKS.liveStudio,
    isLive: true,
    viewerCount: 1240,
    likes: 3200,
    comments: 45,
    time: 'live now',
    isLiked: false,
    type: 'live',
    isFollowing: false,
    isVerified: true,
  },
  {
    id: '1',
    artist: 'Elena Rose',
    handle: 'elena_rose',
    avatar: ARTIST_PROFILE_IMAGE_LINKS.profile,
    content: "Just finished the final mix for 'Nebula'. Can't wait for you all to hear it! Which version should I drop first? 🌌✨",
    likes: 1240,
    comments: 2,
    commentList: [
      { id: 'c1', user: 'Alex Rivera', handle: 'alexvibes', avatar: ARTIST_PROFILE_IMAGE_LINKS.studio, text: "Can't wait for Nebula! 🔥", time: '1h ago' },
      { id: 'c2', user: 'Sarah J', handle: 'sarah_j', avatar: ARTIST_PROFILE_IMAGE_LINKS.stage, text: 'Acoustic version please! ✨', time: '30m ago' },
    ],
    time: '2h ago',
    isLiked: false,
    type: 'poll',
    pollOptions: [
      { id: 1, text: 'Original Mix', votes: 450, isSelected: true },
      { id: 2, text: 'Acoustic Version', votes: 320 },
      { id: 3, text: 'Extended Club Edit', votes: 120 },
    ],
    isFollowing: true,
    isVerified: false,
  },
  {
    id: '2',
    artist: 'Zion King',
    handle: 'zionking_afro',
    avatar: ARTIST_PROFILE_IMAGE_LINKS.banner,
    content: 'Behind the scenes at the O2 Arena. The energy is already building up! See you tonight. 🔥🌍',
    images: [ARTIST_PROFILE_IMAGE_LINKS.concert],
    likes: 8500,
    comments: 1,
    commentList: [
      { id: 'c3', user: 'Mike D', handle: 'miked_beats', avatar: ARTIST_PROFILE_IMAGE_LINKS.session, text: 'See you there Zion! 🌍🔥', time: '2h ago' },
    ],
    time: '5h ago',
    isLiked: true,
    type: 'image',
    isFollowing: false,
    isVerified: true,
  },
  {
    id: '3',
    artist: 'Amara',
    handle: 'amara_official',
    avatar: ARTIST_PROFILE_IMAGE_LINKS.stage,
    content: 'New merch drop coming this Friday. Galaxy hoodies are back in stock! 💃✨',
    likes: 3200,
    comments: 0,
    commentList: [],
    time: '8h ago',
    isLiked: false,
    type: 'text',
    isFollowing: false,
    isVerified: true,
  },

];

export const COMMUNITY_UPDATE_COUNT = seedPosts.length;

const stickers = [
  { id: 'st1', img: ARTIST_PROFILE_IMAGE_LINKS.profile },
  { id: 'st2', img: ARTIST_PROFILE_IMAGE_LINKS.banner },
  { id: 'st3', img: ARTIST_PROFILE_IMAGE_LINKS.studio },
  { id: 'st4', img: ARTIST_PROFILE_IMAGE_LINKS.stage },
];

const normalizeCommunityMedia = (posts: CommunityPost[]) =>
  posts.map((post) => {
    if (post.id === 'live-1') {
      return {
        ...post,
        avatar: ARTIST_PROFILE_IMAGE_LINKS.profile,
        videoUrl: FEED_VIDEO_LINKS.liveStudio,
      };
    }

    if (post.id === '1') {
      return {
        ...post,
        avatar: ARTIST_PROFILE_IMAGE_LINKS.profile,
        commentList: post.commentList?.map((comment, index) => ({
          ...comment,
          avatar: index === 0 ? ARTIST_PROFILE_IMAGE_LINKS.studio : ARTIST_PROFILE_IMAGE_LINKS.stage,
        })),
      };
    }

    if (post.id === '2') {
      return {
        ...post,
        avatar: ARTIST_PROFILE_IMAGE_LINKS.banner,
        images: [ARTIST_PROFILE_IMAGE_LINKS.concert],
        commentList: post.commentList?.map((comment) => ({
          ...comment,
          avatar: ARTIST_PROFILE_IMAGE_LINKS.session,
        })),
      };
    }

    if (post.id === '3') {
      return {
        ...post,
        avatar: ARTIST_PROFILE_IMAGE_LINKS.stage,
      };
    }

    return post;
  });

const toFeedPost = (post: ApiCommunityPost): CommunityPost => ({
  id: String(post.id),
  artist: post.author.name,
  handle: post.author.handle.replace(/^@/, ''),
  avatar: post.author.avatar_url || ARTIST_PROFILE_IMAGE_LINKS.profile,
  content: post.content || '',
  images: post.media.filter((item) => item.type === 'image').map((item) => item.url),
  videoUrl: post.media.find((item) => item.type === 'video')?.streaming_url || post.media.find((item) => item.type === 'video')?.url,
  videoPoster: post.media.find((item) => item.type === 'video')?.thumbnail_url || undefined,
  isLive: post.type === 'live' || post.live?.status === 'live',
  viewerCount: post.live?.viewer_count,
  likes: post.stats.likes_count,
  comments: post.stats.comments_count,
  shares: post.stats.shares_count,
  gifts: post.stats.gifts_count,
  views: post.stats.views_count,
  audience: post.audience,
  status: post.status,
  commentList: [],
  apiComments: post.comments,
  time: post.created_at,
  isLiked: post.viewer.is_liked,
  type: post.type === 'video' ? 'image' : post.type,
  pollOptions: post.poll?.options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option.votes_count,
    isSelected: option.is_selected,
  })),
  isFollowing: post.viewer.is_following ?? post.author.is_following,
  isVerified: post.author.is_verified,
  communityCount: post.community_count ?? 0,
});

const VideoPreview = memo<{ videoUrl: string; isActive: boolean; viewerCount?: number; isLive?: boolean; onOpen: () => void }>(({ videoUrl, isActive, viewerCount, isLive = false, onOpen }) => {
  const { theme } = useThemeMode();
  const [isMuted, setIsMuted] = useState(true);
  const player = useVideoPlayer(videoUrl, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  const toggleMute = (event: GestureResponderEvent) => {
    event.stopPropagation();
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={isLive ? 'Watch live video full screen' : 'Watch video full screen'} onPress={onOpen} style={[styles.mediaWrap, { borderColor: theme.border }]}>
      <VideoView player={player} style={styles.video} nativeControls={false} allowsPictureInPicture contentFit="cover" />
      {!isActive ? <View pointerEvents="none" style={styles.videoPlayBadge}>
        <MaterialIcons name="play-arrow" size={30} color="#fff" />
      </View> : null}
      {isLive ? <View style={styles.liveBadges}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE</Text>
        </View>
        <View style={styles.viewerPill}>
          <MaterialIcons name="visibility" size={14} color="#fff" />
          <Text style={styles.viewerText}>{(viewerCount ?? 0).toLocaleString()}</Text>
        </View>
      </View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
        hitSlop={8}
        onPress={toggleMute}
        style={styles.videoMuteButton}
      >
        <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={16} color="#fff" />
      </Pressable>
    </Pressable>
  );
}, (previous, next) =>
  previous.videoUrl === next.videoUrl &&
  previous.isActive === next.isActive &&
  previous.viewerCount === next.viewerCount &&
  previous.isLive === next.isLive
);

const FullscreenVideo: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, (instance) => instance.play());
  return <VideoView player={player} style={styles.fullscreenVideo} nativeControls allowsPictureInPicture />;
};

const CommunityFeedSkeleton = memo<{ isDark: boolean }>(({ isDark }) => {
  const base = isDark ? 'rgba(255,255,255,0.055)' : 'rgba(15,23,42,0.07)';
  const strong = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.11)';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';

  return (
    <ScrollView
      accessibilityRole="progressbar"
      accessibilityLabel="Loading community posts"
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: isDark ? '#060913' : '#fff' }}
      contentContainerStyle={styles.skeletonContent}
    >
      {[0, 1, 2].map((item) => (
        <View key={item} style={[styles.skeletonCard, { borderColor: border }]}>
          <View style={styles.skeletonHeaderRow}>
            <View style={[styles.skeletonAvatar, { backgroundColor: strong }]} />
            <View style={styles.skeletonAuthorCopy}>
              <View style={[styles.skeletonLine, styles.skeletonHandle, { backgroundColor: strong }]} />
              <View style={[styles.skeletonLine, styles.skeletonMeta, { backgroundColor: base }]} />
            </View>
            <View style={[styles.skeletonPill, { backgroundColor: base }]} />
          </View>
          <View style={[styles.skeletonLine, styles.skeletonBodyLong, { backgroundColor: base }]} />
          <View style={[styles.skeletonLine, styles.skeletonBodyShort, { backgroundColor: base }]} />
          <View style={[styles.skeletonMedia, { backgroundColor: strong }]} />
          <View style={styles.skeletonActions}>
            {[0, 1, 2, 3].map((action) => <View key={action} style={[styles.skeletonAction, { backgroundColor: base }]} />)}
          </View>
        </View>
      ))}
    </ScrollView>
  );
});

const Community: React.FC<{ embedded?: boolean; onCountChange?: (count: number) => void }> = ({ embedded = false, onCountChange }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { width: viewportWidth } = useWindowDimensions();
  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set());
  const [pendingShareIds, setPendingShareIds] = useState<Set<string>>(new Set());
  const [pendingPollIds, setPendingPollIds] = useState<Set<string>>(new Set());
  const [expandedPostIds, setExpandedPostIds] = useState<Set<string>>(new Set());
  const [overflowingPostIds, setOverflowingPostIds] = useState<Set<string>>(new Set());
  const [activeVideoPostId, setActiveVideoPostId] = useState<string | null>(null);
  const videoLayouts = useRef(new Map<string, { y: number; height: number }>());
  const postLayouts = useRef(new Map<string, { y: number; height: number }>());
  const highestViewedPostIndex = useRef(-1);
  const recordedViewPostIds = useRef(new Set<string>());
  const scrollMetrics = useRef({ offsetY: 0, viewportHeight: 0 });
  const visibilityFrame = useRef<number | null>(null);
  const [mediaViewer, setMediaViewer] = useState<
    | { kind: 'images'; images: string[]; index: number }
    | { kind: 'video'; videoUrl: string }
    | null
  >(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showOptionsPostId, setShowOptionsPostId] = useState<string | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const panelSurface = isDark ? '#121219' : theme.card;
  const panelElevated = isDark ? '#1d1d27' : theme.surface;
  const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const faintSurfaceStrong = isDark ? 'rgba(255,255,255,0.07)' : theme.surface;
  const softBorder = theme.border;
  const mutedText = theme.textSecondary;
  const dimIcon = isDark ? '#9ca3af' : theme.textSecondary;
  const postsQuery = useCommunityPosts();
  const hasEmptyPostsResponse = postsQuery.isSuccess
    && postsQuery.data !== undefined
    && postsQuery.data.pages.every((page) => page.data.length === 0);

  const isCreator = currentUser.role === 'creator';
  const normalizedHandle = (currentUser.handle ?? '').replace('@', '');
  const insets = useSafeAreaInsets();
  const activeCommentTarget = useMemo(
    () => activeCommentPost ? posts.find((post) => post.id === activeCommentPost) ?? null : null,
    [activeCommentPost, posts],
  );

  const updateActiveVideo = useCallback(() => {
    if (mediaViewer) {
      setActiveVideoPostId(null);
      return;
    }
    const { offsetY, viewportHeight } = scrollMetrics.current;
    const viewportBottom = offsetY + viewportHeight;
    let bestId: string | null = null;
    let bestVisibleHeight = 0;
    videoLayouts.current.forEach((layout, id) => {
      const visibleHeight = Math.max(0, Math.min(layout.y + layout.height, viewportBottom) - Math.max(layout.y, offsetY));
      if (visibleHeight > bestVisibleHeight) {
        bestVisibleHeight = visibleHeight;
        bestId = id;
      }
    });
    setActiveVideoPostId(bestVisibleHeight >= 80 ? bestId : null);
  }, [mediaViewer]);

  const recordPostView = useCallback((post: CommunityPost) => {
    if (recordedViewPostIds.current.has(post.id)) return;
    recordedViewPostIds.current.add(post.id);
    onCountChange?.(post.communityCount ?? 0);
    void communityApi.recordView(post.id).catch(() => {
      recordedViewPostIds.current.delete(post.id);
    });
  }, [onCountChange]);

  const fetchMoreWhenUnviewedPostsRunLow = useCallback(() => {
    const { offsetY, viewportHeight } = scrollMetrics.current;
    if (!viewportHeight) return;

    const viewportBottom = offsetY + viewportHeight;
    posts.forEach((post, index) => {
      const layout = postLayouts.current.get(post.id);
      if (layout && layout.y < viewportBottom && layout.y + layout.height > offsetY) {
        highestViewedPostIndex.current = Math.max(highestViewedPostIndex.current, index);
        const visibleHeight = Math.max(0, Math.min(layout.y + layout.height, viewportBottom) - Math.max(layout.y, offsetY));
        if (visibleHeight >= Math.min(80, layout.height * 0.35)) recordPostView(post);
      }
    });

    const unviewedPostCount = posts.length - highestViewedPostIndex.current - 1;
    if (unviewedPostCount < 10 && postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      void postsQuery.fetchNextPage();
    }
  }, [posts, postsQuery.fetchNextPage, postsQuery.hasNextPage, postsQuery.isFetchingNextPage, recordPostView]);

  useEffect(() => {
    updateActiveVideo();
  }, [posts, updateActiveVideo]);

  useEffect(() => () => {
    if (visibilityFrame.current !== null) cancelAnimationFrame(visibilityFrame.current);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_KEY);
        if (savedUser) setCurrentUser(JSON.parse(savedUser) as CurrentUser);
      } catch {}
    };

    void load();
  }, []);

  useEffect(() => {
    const pages = postsQuery.data?.pages as CommunityPage<ApiCommunityPost>[] | undefined;
    const apiPosts = pages?.flatMap((page) => page.data) ?? [];
    setPosts(apiPosts.map(toFeedPost));
    const firstPost = apiPosts[0];
    if (firstPost) onCountChange?.((firstPost.community_count ?? 0) + 1);
    else if (postsQuery.isSuccess) onCountChange?.(0);
  }, [onCountChange, postsQuery.data, postsQuery.isSuccess]);

  const savePosts = async (nextPosts: CommunityPost[]) => {
    setPosts(nextPosts);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
  };

  const toggleLike = async (id: string) => {
    if (pendingLikeIds.has(id)) return;
    const target = posts.find((post) => post.id === id);
    if (!target) return;
    const previous = posts;
    setPendingLikeIds((current) => new Set(current).add(id));
    setPosts(posts.map((post) =>
      post.id === id
        ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          }
        : post,
    ));
    try {
      const response = target.isLiked ? await communityApi.unlikePost(id) : await communityApi.likePost(id);
      const serverPost = toFeedPost(response.data.data);
      setPosts((current) => current.map((post) => post.id === id ? serverPost : post));
    } catch (error) {
      setPosts(previous);
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setPendingLikeIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const sharePost = async (id: string) => {
    if (pendingShareIds.has(id)) return;
    setPendingShareIds((current) => new Set(current).add(id));
    try {
      await communityApi.sharePost(id);
      await Share.share({ message: `https://kulsah.com/community/posts/${encodeURIComponent(id)}` });
      void postsQuery.refetch();
    } catch (error: any) {
      const message = String(error?.response?.data?.message ?? '').toLowerCase();
      if (!message.includes('already shared')) {
        const parsed = parseApiError(error);
        Alert.alert(parsed.title, parsed.message);
      }
    } finally {
      setPendingShareIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const voteOnPoll = async (postId: string, optionIndex: number) => {
    if (pendingPollIds.has(postId)) return;
    const target = posts.find((post) => post.id === postId);
    const selectedOption = target?.pollOptions?.[optionIndex];
    if (!target?.pollOptions || !selectedOption || target.pollOptions.some((option) => option.isSelected)) return;
    const previous = posts;
    const updated = posts.map((post) => {
      if (post.id === postId && post.pollOptions) {
        const newOptions = post.pollOptions.map((opt, i) => ({
          ...opt,
          isSelected: i === optionIndex,
          votes: i === optionIndex ? opt.votes + 1 : opt.isSelected ? opt.votes - 1 : opt.votes,
        }));
        return { ...post, pollOptions: newOptions };
      }
      return post;
    });
    setPosts(updated);
    setPendingPollIds((current) => new Set(current).add(postId));
    try {
      const response = await communityApi.voteOnPoll(postId, selectedOption.id);
      const serverPost = toFeedPost(response.data.data);
      setPosts((current) => current.map((post) => post.id === postId ? serverPost : post));
    } catch (error) {
      setPosts(previous);
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setPendingPollIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };

  const toggleFollow = async (id: string) => {
    const updated = posts.map((post) =>
      post.id === id
        ? {
            ...post,
            isFollowing: !post.isFollowing,
          }
        : post,
    );
    await savePosts(updated);
  };

  const handleAddComment = async (inputText?: string) => {
    const finalText = (inputText ?? commentText).trim();
    if (!finalText || !activeCommentPost) return;

    const newComment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      user: currentUser.name || 'Anonymous',
      handle: normalizedHandle || 'user',
      avatar: currentUser.avatar || ARTIST_PROFILE_IMAGE_LINKS.profile,
      text: finalText,
      time: 'Just now',
    };

    const updated = posts.map((post) =>
      post.id === activeCommentPost
        ? {
            ...post,
            comments: post.comments + 1,
            commentList: [newComment, ...(post.commentList || [])],
          }
        : post,
    );

    await savePosts(updated);
    setCommentText('');
  };

  const openCommentModal = (postId: string) => {
    setActiveCommentPost(postId);
    setCommentText('');
  };

  const handleDeletePost = async (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    await savePosts(updated);
    setShowOptionsPostId(null);
  };

  const startEditing = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setShowOptionsPostId(null);
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim() || !editingPostId) return;
    const updated = posts.map((p) => (p.id === editingPostId ? { ...p, content: editContent.trim() } : p));
    await savePosts(updated);
    setEditingPostId(null);
    setEditContent('');
  };

  const openPostDetail = (postId: string) => {
    navigation.navigate('CommunityPostDetail', { postId });
  };

  if (postsQuery.isLoading) {
    return <CommunityFeedSkeleton isDark={isDark} />;
  }

  if (postsQuery.isError) {
    const parsed = parseApiError(postsQuery.error);
    return (
      <View style={[styles.loader, { backgroundColor: theme.background, paddingHorizontal: 24, gap: 12 }]}>
        <MaterialIcons name="cloud-off" size={36} color={theme.textMuted} />
        <Text style={{ color: theme.text, textAlign: 'center' }}>{parsed.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry loading community posts" onPress={() => void postsQuery.refetch()}>
          <Text style={{ color: PRIMARY_COLOR }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {user!.role === 'fan' && !embedded && <View style={[styles.header, {marginTop: Platform.OS == 'ios' ? 54 : insets.top} ]}>
        {/* <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
          <MaterialIcons name="chevron-left" size={22} color={theme.text} />
        </Pressable> */}

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Community</Text>
          <Text style={styles.headerSubtitle}>Galaxy Universe</Text>
        </View>

        {/* <View style={styles.headerSpacer} /> */}
        {/* <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
          <MaterialIcons name="notifications-none" size={22} color={theme.text} />
        </Pressable> */}
      </View> }

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={({ nativeEvent }) => {
          scrollMetrics.current.viewportHeight = nativeEvent.layout.height;
          updateActiveVideo();
          fetchMoreWhenUnviewedPostsRunLow();
        }}
        onScroll={({ nativeEvent }) => {
          scrollMetrics.current = {
            offsetY: nativeEvent.contentOffset.y,
            viewportHeight: nativeEvent.layoutMeasurement.height,
          };
          if (visibilityFrame.current === null) {
            visibilityFrame.current = requestAnimationFrame(() => {
              visibilityFrame.current = null;
              updateActiveVideo();
              fetchMoreWhenUnviewedPostsRunLow();
            });
          }
          const distance = nativeEvent.contentSize.height - (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
          if (distance < 300 && postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) void postsQuery.fetchNextPage();
        }}
        scrollEventThrottle={200}
      >
        {hasEmptyPostsResponse ? (
          <View style={styles.footerLoader}>
            <MaterialIcons name="forum" size={36} color={theme.textMuted} />
            <Text style={[styles.footerText, { color: mutedText }]}>NO COMMUNITY POSTS YET</Text>
          </View>
        ) : null}
        {posts.map((post) => {
          const ownPost = post.handle === normalizedHandle || post.artist === currentUser.name;
          const totalVotes = post.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) ?? 0;

          return (
            <View
              key={post.id}
              onLayout={({ nativeEvent }) => {
                postLayouts.current.set(post.id, nativeEvent.layout);
                if (post.videoUrl) videoLayouts.current.set(post.id, nativeEvent.layout);
                updateActiveVideo();
                fetchMoreWhenUnviewedPostsRunLow();
              }}
              style={[styles.postCard, { backgroundColor: panelSurface, borderBottomColor: softBorder, borderBottomWidth: 1 }]}
            >
              <Pressable onPress={() => openPostDetail(post.id)}>
              <View style={styles.postHeader}>
                <Pressable style={styles.authorRow} onPress={() => navigation.navigate('ArtistProfile', { isOwner: false, id: post.artist })}>
                  <View style={styles.avatarRing}>
                    <Image source={{ uri: post.avatar }} style={styles.avatar} />
                  </View>
                  <View>
                    <View style={styles.handleMetaRow}>
                      <Text style={[styles.handleText, { color: theme.text, marginBottom: 2}]}>@{post.handle}</Text>
                      {!post.isVerified ? (
                          <MaterialIcons name="verified" size={16} color='#33aae4'/>
                        ) : null}
                    </View>
                    <Text style={[styles.timeText, { color: mutedText }]}>{formatCommunityRelativeTime(post.time)}</Text>
                    {/* <Text style={[styles.timeText, { color: mutedText }]}>{post.audience === 'subscribers' ? 'SUBSCRIBERS' : 'PUBLIC'} · {(post.status || 'published').toUpperCase()}</Text> */}
                  </View>
                </Pressable>

              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 15,
                // backgroundColor: 'red'
              }}>
                
                <Pressable style={styles.followMetaAction} onPress={() => void toggleFollow(post.id)} hitSlop={8}>
                        <Text style={[styles.followStateText, { color: post.isFollowing ? mutedText : '#1877f2', fontFamily: 'Inter_500Medium', fontSize: fontSize.b3.fontSize }]}>
                          {post.isFollowing ? 'Following' : 'Follow'}
                        </Text>
                      </Pressable>

                <View style={styles.optionsWrap}>
                  <Pressable onPress={() => setShowOptionsPostId(showOptionsPostId === post.id ? null : post.id)}>
                    <MaterialIcons name="more-horiz" size={24} color={dimIcon} />
                  </Pressable>
                  {showOptionsPostId === post.id && (
                    <BlurView
                      intensity={Platform.OS === 'android' ? 100 : 28}
                      tint={isDark ? 'dark' : 'light'}
                      style={[
                        styles.optionsMenu,
                        {
                          backgroundColor: isDark ? 'rgba(29,29,39,0.78)' : 'rgba(255,255,255,0.78)',
                          borderColor: softBorder,
                        },
                      ]}
                    >
                      {ownPost ? (
                        <>
                          <Pressable style={styles.optionItem} onPress={() => startEditing(post)}>
                            <MaterialIcons name="edit" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Edit Post</Text>
                          </Pressable>
                          <Pressable style={styles.optionItem} onPress={() => handleDeletePost(post.id)}>
                            <MaterialIcons name="delete" size={16} color="#ef4444" />
                            <Text style={styles.deleteText}>Delete Post</Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable style={styles.optionItem}>
                            <MaterialIcons name="report" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Report</Text>
                          </Pressable>
                          <Pressable style={styles.optionItem}>
                            <MaterialIcons name="notifications-off" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Mute</Text>
                          </Pressable>
                        </>
                      )}
                    </BlurView>
                  )}
                </View>
              </View>
              </View>

              <View style={styles.postContentWrap}>
                {editingPostId === post.id ? (
                  <View style={{ gap: 10 }}>
                    <TextInput includeFontPadding={false}
                      value={editContent}
                      onChangeText={setEditContent}
                      multiline
                      style={[styles.editInput, { backgroundColor: faintSurface, color: theme.text }]}
                    />
                    <View style={styles.editActions}>
                      <Pressable style={[styles.editCancel, { borderColor: softBorder, backgroundColor: isDark ? 'transparent' : theme.surface }]} onPress={() => setEditingPostId(null)}>
                        <Text style={[styles.editCancelText, { color: theme.text }]}>CANCEL</Text>
                      </Pressable>
                      <Pressable style={styles.editSave} onPress={handleUpdatePost}>
                        <Text style={styles.editSaveText}>SAVE CHANGES</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <>
                    {!overflowingPostIds.has(post.id) ? (
                      <Text
                        accessible={false}
                        pointerEvents="none"
                        onTextLayout={({ nativeEvent }) => {
                          if (nativeEvent.lines.length <= 3) return;
                          setOverflowingPostIds((current) => new Set(current).add(post.id));
                        }}
                        style={[styles.postContent, styles.contentMeasure, { color: theme.textSecondary }]}
                      >
                        {post.content}
                      </Text>
                    ) : null}
                    <Text
                      numberOfLines={expandedPostIds.has(post.id) ? undefined : 3}
                      ellipsizeMode="tail"
                      style={[styles.postContent, { color: theme.textSecondary }]}
                    >
                      {post.content}
                    </Text>
                    {overflowingPostIds.has(post.id) && !expandedPostIds.has(post.id) ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Show more post content"
                        hitSlop={8}
                        onPress={(event) => {
                          event.stopPropagation();
                          setExpandedPostIds((current) => {
                          const next = new Set(current);
                          next.add(post.id);
                          return next;
                          });
                        }}
                        style={styles.contentToggle}
                      >
                        <Text style={styles.contentToggleText}>Show more</Text>
                      </Pressable>
                    ) : null}
                  </>
                )}
              </View>

              {post.videoUrl ? (
                <View>
                  <VideoPreview
                    videoUrl={post.videoUrl}
                    isActive={activeVideoPostId === post.id && !mediaViewer}
                    viewerCount={post.viewerCount}
                    isLive={post.isLive}
                    onOpen={() => {
                      setActiveVideoPostId(null);
                      setMediaViewer({ kind: 'video', videoUrl: post.videoUrl! });
                    }}
                  />
                </View>
              ) : null}

              {post.images && post.images.length > 0 && (
                <View style={styles.mediaOuter}>
                  <View style={styles.imageGrid}>
                    {post.images.slice(0, post.images.length > 4 ? 4 : post.images.length).map((img, idx) => (
                      <Pressable
                        key={`${post.id}-${idx}`}
                        accessibilityRole="imagebutton"
                        accessibilityLabel={`Open image ${idx + 1} of ${post.images!.length}`}
                        onPress={() => setMediaViewer({ kind: 'images', images: post.images!, index: idx })}
                        style={[
                          post.images!.length === 1 ? styles.imageFrame : styles.imageGridFrame,
                          { borderColor: softBorder },
                        ]}
                      >
                        <Image source={{ uri: img }} style={styles.postImage} resizeMode="cover" />
                        {post.images!.length > 4 && idx === 3 ? (
                          <View style={styles.remainingImagesOverlay} pointerEvents="none">
                            <Text style={styles.remainingImagesText}>+{post.images!.length - 4}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {post.pollOptions && post.pollOptions.length > 0 && (
                <View style={styles.pollWrap}>
                  {post.pollOptions.map((option, idx) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    return (
                      <Pressable
                        key={`${post.id}-poll-${idx}`}
                        disabled={pendingPollIds.has(post.id) || post.pollOptions!.some((item) => item.isSelected)}
                        style={[styles.pollOption, { borderColor: softBorder, backgroundColor: faintSurface }, option.isSelected && styles.pollOptionSelected]}
                        onPress={() => voteOnPoll(post.id, idx)}
                      >
                        <View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }, option.isSelected && styles.pollFillSelected]} />
                        <View style={styles.pollContent}>
                          <Text style={[styles.pollText, { color: option.isSelected ? PRIMARY_COLOR : theme.textSecondary }]}>{option.text}</Text>
                          <Text style={[styles.pollPercent, { color: option.isSelected ? PRIMARY_COLOR : mutedText }]}>{percentage}%</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  <Text style={[styles.pollFoot, { color: mutedText }]}>
                    {totalVotes.toLocaleString()} votes • {post.pollOptions.some((o) => o.isSelected) ? 'Voted' : 'Final results'}
                  </Text>
                </View>
              )}
              </Pressable>

              <View style={[styles.actionBar, ]}>
                <Pressable accessibilityRole="button" accessibilityLabel={post.isLiked ? 'Unlike post' : 'Like post'} disabled={pendingLikeIds.has(post.id)} style={styles.actionItem} onPress={() => void toggleLike(post.id)}>
                  <MaterialIcons name={post.isLiked ? 'favorite' : 'favorite-border'} size={23} color={post.isLiked ? '#f43f5e' : dimIcon} />
                  <Text style={[styles.actionText, { color: post.isLiked ? '#f43f5e' : mutedText }]}>{post.likes.toLocaleString()}</Text>
                </Pressable>
                <Pressable style={styles.actionItem} onPress={() => openCommentModal(post.id)}>
                  <MaterialIcons name="chat-bubble-outline" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>{post.comments.toLocaleString()}</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel="Share post" disabled={pendingShareIds.has(post.id)} style={styles.actionItem} onPress={() => void sharePost(post.id)}>
                  <MaterialIcons name="share" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>{(post.shares ?? 0).toLocaleString()}</Text>
                </Pressable>
                {/* <View style={styles.actionItem} accessibilityLabel={`${post.gifts ?? 0} gifts`}>
                  <MaterialIcons name="redeem" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>{(post.gifts ?? 0).toLocaleString()}</Text>
                </View>
                <View style={styles.actionItem} accessibilityLabel={`${post.views ?? 0} views`}>
                  <MaterialIcons name="visibility" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>{(post.views ?? 0).toLocaleString()}</Text>
                </View> */}
              </View>

            </View>
          );
        })}

        <View style={styles.footerLoader}>
          {postsQuery.isFetchingNextPage ? <ActivityIndicator color={PRIMARY_COLOR} /> : null}
          <Text style={[styles.footerText, { color: mutedText }]}>SYNCING MORE GALAXY UPDATES...</Text>
        </View>
      </ScrollView>

      <Modal visible={!!activeCommentPost} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setActiveCommentPost(null)}>
        <Reactions
          onClose={() => setActiveCommentPost(null)}
          postId={activeCommentPost ?? undefined}
          communityComments={activeCommentTarget?.apiComments}
          title={`${activeCommentTarget?.comments.toLocaleString() ?? 0} Reactions`}
        />
      </Modal>

      <Modal visible={!!mediaViewer} animationType="fade" statusBarTranslucent onRequestClose={() => setMediaViewer(null)}>
        <View style={styles.fullscreenMediaRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen media" onPress={() => setMediaViewer(null)} style={[styles.fullscreenClose, { top: Math.max(insets.top, 16) }]}>
            <MaterialIcons name="close" size={26} color="#fff" />
          </Pressable>
          {mediaViewer?.kind === 'video' ? (
            <FullscreenVideo uri={mediaViewer.videoUrl} />
          ) : mediaViewer?.kind === 'images' ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: mediaViewer.index * viewportWidth, y: 0 }}
                onMomentumScrollEnd={({ nativeEvent }) => {
                  const index = Math.round(nativeEvent.contentOffset.x / viewportWidth);
                  setMediaViewer((current) => current?.kind === 'images' ? { ...current, index } : current);
                }}
              >
                {mediaViewer.images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={[styles.fullscreenImagePage, { width: viewportWidth }]}>
                    <Image accessibilityLabel={`Image ${index + 1} of ${mediaViewer.images.length}`} source={{ uri }} style={styles.fullscreenImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
              {mediaViewer.images.length > 1 ? (
                <View style={[styles.fullscreenCounter, { bottom: Math.max(insets.bottom, 20) }]}>
                  <Text style={styles.fullscreenCounterText}>{mediaViewer.index + 1} / {mediaViewer.images.length}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </Modal>

      <Modal visible={false} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setActiveCommentPost(null)}>
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveCommentPost(null)} />
          <View style={[styles.modalCard, { backgroundColor: panelSurface, borderColor: softBorder }]}>
            <View style={[styles.modalGrabber, { backgroundColor: isDark ? '#374151' : '#cbd5e1' }]} />
            <View style={styles.modalHeaderRow}>
              {/* <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Comments</Text>
                <Text style={[styles.modalSubtitle, { color: mutedText }]}>
                  {activeCommentTarget?.comments.toLocaleString() ?? 0} thoughts in the room
                </Text>
              </View> */}
              {/* <Pressable style={[styles.modalCloseBtn, { backgroundColor: faintSurface, borderColor: softBorder }]} onPress={() => setActiveCommentPost(null)}>
                <MaterialIcons name="close" size={18} color={theme.text} />
              </Pressable> */}
            </View>

            {/* {activeCommentTarget ? (
              <View style={[styles.modalPostPreview, { backgroundColor: faintSurface, borderColor: softBorder }]}>
                <Image source={{ uri: activeCommentTarget.avatar }} style={styles.modalPostAvatar} />
                <View style={styles.modalPostCopy}>
                  <Text style={[styles.modalPostArtist, { color: theme.text }]}>{activeCommentTarget.artist}</Text>
                  <Text style={[styles.modalPostSnippet, { color: mutedText }]} numberOfLines={2}>
                    {activeCommentTarget.content}
                  </Text>
                </View>
              </View>
            ) : null} */}

            {/* <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.modalCommentsScroll}
              contentContainerStyle={styles.modalCommentsContent}
              keyboardShouldPersistTaps="handled"
            >
              {activeCommentTarget?.commentList && activeCommentTarget.commentList.length > 0 ? (
                activeCommentTarget.commentList.map((comment) => (
                  <View key={comment.id} style={styles.modalCommentRow}>
                    <Image source={{ uri: comment.avatar }} style={styles.modalCommentAvatar} />
                    <View style={styles.modalCommentBody}>
                      <View style={[styles.modalCommentBubble, { backgroundColor: panelElevated, borderColor: softBorder }]}>
                        <View style={styles.modalCommentTopline}>
                          <Text style={[styles.modalCommentAuthor, { color: theme.text }]}>{comment.user}</Text>
                          <Text style={[styles.modalCommentHandle, { color: mutedText }]}>@{comment.handle}</Text>
                        </View>
                        <Text style={[styles.modalCommentText, { color: theme.text }]}>{comment.text}</Text>
                      </View>
                      <Text style={[styles.modalCommentTime, { color: mutedText }]}>{comment.time}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.modalEmptyState, { borderColor: softBorder, backgroundColor: faintSurface }]}>
                  <MaterialIcons name="forum" size={26} color={dimIcon} />
                  <Text style={[styles.modalEmptyTitle, { color: theme.text }]}>Start the conversation</Text>
                  <Text style={[styles.modalEmptyText, { color: mutedText }]}>Drop the first comment and get the thread moving.</Text>
                </View>
              )}
            </ScrollView> */}

                        <View style={[styles.modalComposer, { borderColor: softBorder, backgroundColor: panelElevated }]}>
              <View style={styles.modalComposerHeader}>
                <Text style={[styles.modalComposerTitle, { color: theme.text }]}>Say something</Text>
                <Text style={[styles.modalComposerHint, { color: mutedText }]}>Fresh takes only</Text>
              </View>

              <TextInput includeFontPadding={false}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write a comment..."
                placeholderTextColor={theme.textSecondary}
                multiline
                style={[styles.modalInput, { borderColor: softBorder, backgroundColor: faintSurface, color: theme.text }]}
              />

              <View style={styles.emojiRow}>
                {['🔥', '🙌', '❤️', '✨', '🌌', '🌍', '🚀', '💯'].map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => setCommentText((prev) => `${prev}${emoji}`)}
                    style={[styles.emojiBtn, { borderColor: softBorder, backgroundColor: faintSurface }]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.stickerTitle, { color: mutedText }]}>KULSAH STICKERS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
                {stickers.map((sticker) => (
                  <Pressable
                    key={sticker.id}
                    onPress={async () => {
                      const withSticker = `${commentText} [Sticker:${sticker.id}] `.trim();
                      await handleAddComment(withSticker);
                    }}
                    style={[styles.stickerBtn, { borderColor: softBorder }]}
                  >
                    <Image source={{ uri: sticker.img }} style={styles.stickerImage} />
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalCancel, { borderColor: softBorder, backgroundColor: isDark ? 'transparent' : theme.surface }]}
                  onPress={() => setActiveCommentPost(null)}
                >
                  <Text style={[styles.modalCancelText, { color: theme.text }]}>CLOSE</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalPost, !commentText.trim() && styles.modalPostDisabled]}
                  onPress={() => void handleAddComment()}
                  disabled={!commentText.trim()}
                >
                  <Text style={styles.modalPostText}>POST COMMENT</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isCreator && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('CommunityPost')}>
          <MaterialIcons name="add" size={32} color="#fff" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050507' },
  skeletonContent: { paddingTop: 16, paddingBottom: 32 },
  skeletonCard: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, gap: 12 },
  skeletonHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skeletonAvatar: { width: 46, height: 46, borderRadius: 23 },
  skeletonAuthorCopy: { flex: 1, gap: 8 },
  skeletonLine: { borderRadius: 999 },
  skeletonHandle: { width: '48%', height: 13 },
  skeletonMeta: { width: '30%', height: 9 },
  skeletonPill: { width: 56, height: 24, borderRadius: 999 },
  skeletonBodyLong: { width: '92%', height: 12 },
  skeletonBodyShort: { width: '64%', height: 12 },
  skeletonMedia: { width: '100%', height: 190, borderRadius: 22 },
  skeletonActions: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: 2 },
  skeletonAction: { width: 46, height: 12, borderRadius: 999 },
  header: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRoundBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    ...fontSize.h1, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: PRIMARY_COLOR,
    marginTop: 4,
    ...fontSize.h2, lineHeight: fontSize.h2.lineHeight,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headerSpacer: {
    width: 40,
  },
  scrollBody: { paddingBottom: 130, gap: 14, },
  postCard: {
    backgroundColor: '#121219',
    // borderColor: 'rgba(255,255,255,0.08)',
    // borderWidth: 1,
    // borderRadius: 8,
    overflow: 'hidden',
  },
  postHeader: { paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    height: 46,
    width: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    padding: 2,
  },
  avatar: { height: '100%', width: '100%', borderRadius: 20 },
  handleMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6,},
  followMetaAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  handleText: {
    ...fontSize.handleTextMedium,
    lineHeight: fontSize.handleTextMedium.lineHeight + 2,
    color: '#fff',
    letterSpacing: 0.25
    // // ...fontSize.b3, lineHeight: fontSize.b3.lineHeight
   },
  followStateText: { 
    // ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    // ...fontSize.b2,
    lineHeight: fontSize.b3.lineHeight,
   },
  timeText: { 
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight + 2,
    color: '#94a3b8', letterSpacing: 0.4 },
  optionsWrap: { position: 'relative',},
  optionsMenu: {
    position: 'absolute',
    top: 26,
    right: 0,
    width: 145,
    borderRadius: 16,
    backgroundColor: '#1d1d27',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 30,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 12 },
  optionText: { color: '#cbd5e1', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  deleteText: { color: '#ef4444', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  postContentWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  postContent: { 
    ...fontSize.b3,
    color: '#e2e8f0', 
    // ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    // lineHeight: fontSize.b2.fontSize + (Platform.OS === 'ios' ? 8: 4), 
   },
  editInput: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.4),
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    textAlignVertical: 'top',
    padding: 12,
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  editActions: { flexDirection: 'row', gap: 8 },
  editCancel: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSave: { flex: 1, height: 42, borderRadius: 12, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  editCancelText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  editSaveText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  contentToggle: { alignSelf: 'flex-start', marginTop: 4, paddingVertical: 2 },
  contentToggleText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  contentMeasure: { position: 'absolute', left: 0, right: 0, opacity: 0 },
  mediaWrap: {
    // marginHorizontal: 12,
    marginBottom: 12,
    height: 410,
    // borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  video: { width: '100%', height: '100%' },
  videoPlayBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -25,
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoMuteButton: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 25,
    height: 25,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  liveBadges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 8 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: {
    ...fontSize.b3,
    color: '#fff',
    letterSpacing: 0.4 },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  viewerText: { 
    ...fontSize.b3,
    color: '#fff',
    
   },
  liveActions: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row' },
  iconGlassBtn: {
    height: 42,
    width: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mediaOuter: { paddingHorizontal: 0, paddingBottom: 12 },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 1,
  },
  imageFrame: {
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 210,
  },
  imageGridFrame: {
    width: '49.8%',
    height: 150,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  postImage: { height: '100%', width: '100%' },
  remainingImagesOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  remainingImagesText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
  },
  fullscreenMediaRoot: { flex: 1, backgroundColor: '#000' },
  fullscreenVideo: { flex: 1, width: '100%', backgroundColor: '#000' },
  fullscreenImagePage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullscreenImage: { width: '100%', height: '100%' },
  fullscreenClose: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenCounter: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  fullscreenCounterText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  pollWrap: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  pollOption: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  pollOptionSelected: { borderColor: primaryColorAlpha(0.55) },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.08)' },
  pollFillSelected: { backgroundColor: primaryColorAlpha(0.3) },
  pollContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  pollText: {
    ...fontSize.b3, 
    color: '#cbd5e1',
   },
  pollTextSelected: { color: PRIMARY_COLOR },
  pollPercent: {
    ...fontSize.b3,
    color: '#94a3b8',
  },
  pollFoot: { 
    ...fontSize.b3,
    color: '#94a3b8', 
    textAlign: 'center', 
    marginTop: 4, 
    letterSpacing: 1 },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 18,
  },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { 
    ...fontSize.b3,
    color: '#9ca3af',  
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 12,
  },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { height: 30, width: 30, borderRadius: 15, marginTop: 2 },
  commentBubble: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  commentHandle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginBottom: 3 },
  commentText: { color: '#e2e8f0', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 8, marginTop: 4 },
  commentMetaBtn: { color: '#94a3b8', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  commentTime: { color: '#64748b', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  moreComments: { paddingLeft: 38 },
  moreCommentsText: { color: '#94a3b8', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  footerLoader: { alignItems: 'center', gap: 8, opacity: 0.6, paddingVertical: 18 },
  footerText: { color: '#cbd5e1', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: {
    backgroundColor: '#13131a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalGrabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 4, backgroundColor: '#374151', marginBottom: 16 },
  modalTitle: { color: '#fff', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, marginBottom: 12 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalSubtitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 0.6 },
  modalCloseBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPostPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  modalPostAvatar: { height: 44, width: 44, borderRadius: 22 },
  modalPostCopy: { flex: 1, gap: 3 },
  modalPostArtist: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  modalPostSnippet: { ...fontSize.b4,lineHeight: 18 },
  modalCommentsScroll: { maxHeight: 280, marginBottom: 14 },
  modalCommentsContent: { gap: 12, paddingBottom: 6 },
  modalCommentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  modalCommentAvatar: { height: 38, width: 38, borderRadius: 19, marginTop: 2 },
  modalCommentBody: { flex: 1, gap: 6 },
  modalCommentBubble: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  modalCommentTopline: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
  modalCommentAuthor: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  modalCommentHandle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  modalCommentText: { ...fontSize.b4,lineHeight: 20 },
  modalCommentTime: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, paddingLeft: 8 },
  modalEmptyState: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 8,
  },
  modalEmptyTitle: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  modalEmptyText: { ...fontSize.b4,textAlign: 'center', lineHeight: 18 },
  modalComposer: { borderWidth: 1, borderRadius: 22, padding: 14 },
  modalComposerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  modalComposerTitle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  modalComposerHint: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.2, textTransform: 'uppercase' },
  modalInput: {
    borderRadius: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    padding: 12,
    textAlignVertical: 'top',
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  emojiBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emojiText: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  stickerTitle: { marginTop: 14, color: '#94a3b8', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  stickerRow: { gap: 10, paddingVertical: 10 },
  stickerBtn: {
    height: 56,
    width: 56,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  stickerImage: { height: '100%', width: '100%' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPost: { flex: 1, height: 50, borderRadius: 14, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  modalPostDisabled: { opacity: 0.45 },
  modalCancelText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  modalPostText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1.4 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default Community;
