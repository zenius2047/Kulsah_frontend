import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList, Image, Modal, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share, StatusBar, StyleSheet, Text, useWindowDimensions, View, ViewToken } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import KulsahInputBar from '../components/KulsahInputBar';
import DotTrioLoader from '../components/DotTrioLoader';
import { fontSize } from './typography';
import { useCreatorVideo } from '../src';
import type { CreatorVideoDetailItem, CreatorVideoListItem } from '../src/types/video.types';
import CommentIcon from '../assets/icons/comment-svg.svg';
import { VideoFeedItem, type FeedItem } from './Feed';
import { getVideoPlaybackUrl, getVideoPoster } from '../src/utils/video';

const SPEEDS = [0.5, 1, 1.5, 2] as const;
const VIDEO_PAUSE_OUT_OF_VIEW_RATIO = 0.6;
const PLAYBACK_UPDATE_INTERVAL_SECONDS = 0.5;
const SCROLL_VISIBILITY_CHECK_INTERVAL_MS = 200;
const VIDEO_EXPANDED_HEIGHT = 600;
const VIDEO_COLLAPSED_HEIGHT = 250;
const VIDEO_COLLAPSE_DISTANCE = 360;
const VIDEO_COLLAPSE_UPDATE_THRESHOLD = 0.005;

type VideoItem = {
  id: string;
  title: string;
  artist: string;
  handle: string;
  views: string;
  duration: string;
  img: string;
  url: string;
  date: string;
  description: string;
  avatar?: string;
  likes?: string;
  comments?: string;
};
type CommentItem = { id: string; user: string; avatar: string; text: string; time: string };
type FeedRouteItem = {
  id?: string;
  artist?: string;
  handle?: string;
  avatar?: string;
  caption?: string;
  background?: string;
  video?: string;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
  poster_url?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  likes?: string;
  comments?: string;
};
type FullscreenOrientationMode = 'portrait' | 'landscape';
type CreatorVideoPreview = Partial<CreatorVideoDetailItem> & Partial<CreatorVideoListItem> & {
  id?: string | number;
  title?: string | null;
  creator?: string | null;
  duration?: string | number | null;
  views?: string | number | null;
  likes?: string | number | null;
  comments_count?: string | number | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  poster_url?: string | null;
  streaming_url?: string | null;
  stream_url?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
};

const emptyVideo: VideoItem = {
  id: '',
  title: '',
  artist: '',
  handle: '',
  views: '',
  duration: '',
  img: '',
  url: '',
  date: '',
  description: '',
};

const seedComments: CommentItem[] = [];

const getTitleFromCaption = (caption?: string) => {
  const trimmed = caption?.trim();
  if (!trimmed) return 'Kulsah Video';
  const withoutTags = trimmed.replace(/\s+#\S+/g, '').trim();
  return (withoutTags || trimmed).slice(0, 72);
};

const normalizeFeedVideo = (item?: FeedRouteItem | null): VideoItem | null => {
  const playbackUrl = item ? getVideoPlaybackUrl(item) : null;
  if (!item || !playbackUrl) return null;

  return {
    id: item.id ?? playbackUrl,
    title: getTitleFromCaption(item.caption),
    artist: item.artist ?? 'Kulsah Creator',
    handle: item.handle ?? '@kulsah',
    views: item.likes ? `${item.likes} likes` : 'Now playing',
    duration: '',
    img: getVideoPoster(item) ?? item.avatar ?? '',
    url: playbackUrl,
    date: '',
    description: item.caption ?? 'Opened from your feed.',
    avatar: item.avatar,
    likes: item.likes,
    comments: item.comments,
  };
};

const formatDuration = (duration?: string | number | null) => {
  if (typeof duration === 'string') return duration;
  if (!Number.isFinite(duration)) return '';

  const totalSeconds = Math.max(0, Math.floor(Number(duration)));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const normalizeCreatorVideo = (item?: CreatorVideoPreview | null): VideoItem | null => {
  if (!item?.id && !item?.video) return null;

  const id = item.id ?? item.video;
  const artist = item.creator ?? item.category ?? '';
  const likes = item.likes != null ? String(item.likes) : undefined;
  const comments = item.comments_count != null ? String(item.comments_count) : undefined;

  return {
    id: String(id),
    title: item.title?.trim() || getTitleFromCaption(item.caption),
    artist: String(artist),
    handle: item.handle ?? '',
    views: item.views != null ? `${item.views} Views` : `0 Views`,
    duration: formatDuration(item.duration),
    img: getVideoPoster(item) ?? item.avatar ?? '',
    url: getVideoPlaybackUrl(item) ?? '',
    date: item.date ?? '',
    description: item.caption ?? item.category ?? '',
    avatar: item.avatar,
    likes,
    comments,
  };
};

const normalizeCreatorVideoList = (items?: unknown[]) =>
  (items ?? [])
    .map((item) => normalizeCreatorVideo(item as CreatorVideoPreview))
    .filter((item): item is VideoItem => Boolean(item));

const withoutVideoIds = (items: VideoItem[], ids: Array<string | undefined>) => {
  const idSet = new Set(ids.filter((id): id is string => Boolean(id)));
  return items.filter((item) => !idSet.has(item.id));
};

const toFeedItem = (item: VideoItem): FeedItem => ({
  id: item.id,
  artist: item.artist || 'Kulsah Creator',
  handle: (item.handle || item.artist || 'kulsah').replace(/^@/, ''),
  avatar: item.avatar || item.img,
  caption: item.description || item.title,
  background: item.img,
  video: item.url,
  likes: item.likes || '0',
  comments: item.comments || '0',
  isLiked: false,
  isSubscribed: false,
  isPremium: false,
  ticketsAvailable: false,
  originalSound: false,
  following: false,
  isBookmarked: false,
  bookmarks: '0',
  saves: '0',
});

const VideoPlayer: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const videoViewRef = useRef<VideoView>(null);
  const videoLayoutRef = useRef({ y: 0, height: 0 });
  const scrollViewportRef = useRef({ y: 0, height: 0 });
  const lastVisibilityCheckRef = useRef(0);
  const routeFeedVideo = useMemo(() => normalizeFeedVideo(route.params?.item), [route.params?.item]);
  const routePlaylistVideos = useMemo(
    () => normalizeCreatorVideoList(route.params?.next_videos),
    [route.params?.next_videos],
  );
  const [activeId, setActiveId] = useState(routeFeedVideo?.id ?? route.params?.id ?? '');
  const [directActiveVideo, setDirectActiveVideo] = useState<VideoItem | null>(routeFeedVideo);
  const [role, setRole] = useState<'fan' | 'creator'>('fan');
  const [studioMode, setStudioMode] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [videoCollapseProgress, setVideoCollapseProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useFullscreenNativeControls, setUseFullscreenNativeControls] = useState(false);
  const [fullscreenOrientationMode, setFullscreenOrientationMode] = useState<FullscreenOrientationMode | null>(null);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [protocol, setProtocol] = useState<'public' | 'premium'>('public');
  const [audit, setAudit] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(seedComments);
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [descriptionLineNumber, setDescriptionLineNumber] = useState(1);
  const [showDescriptionMore, setShowDescriptionMore] = useState(true);
  const [verticalVideos, setVerticalVideos] = useState<VideoItem[]>([]);
  const [stageHeight, setStageHeight] = useState(0);
  const [showVideoPoster, setShowVideoPoster] = useState(true);
  const swipeStartYRef = useRef<number | null>(null);

  const {
    data: creatorVideoResponse,
    isLoading: creatorVideosLoading,
    error: creatorVideoError,
  } = useCreatorVideo(directActiveVideo ? undefined : activeId);

  const apiActiveVideo = useMemo(() => normalizeCreatorVideo(creatorVideoResponse), [creatorVideoResponse]);
  const video = directActiveVideo ?? apiActiveVideo ?? routeFeedVideo ?? emptyVideo;
  const hasVideoDetails = Boolean(directActiveVideo ?? apiActiveVideo ?? routeFeedVideo);
  const showContentSkeleton = !hasVideoDetails;
  const activeSourceUrl = video.url;
  const sourceUpNextVideos = useMemo(() => {
    if (routePlaylistVideos.length > 0) return routePlaylistVideos;
    return normalizeCreatorVideoList(creatorVideoResponse?.otherVideos);
  }, [creatorVideoResponse?.otherVideos, routePlaylistVideos]);
  const [orderedUpNextVideos, setOrderedUpNextVideos] = useState<VideoItem[]>(sourceUpNextVideos);
  const upNextVideos = orderedUpNextVideos;
  const heatmap = useMemo(() => Array.from({ length: 24 }, (_, i) => 25 + ((i * 13) % 52)), []);

  const accent = PRIMARY_COLOR;
  const pageBackground = isDark ? '#000000' : '#ffffff';
  const primaryText = isDark ? '#ffffff' : '#0f0f0f';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const card = isDark ? '#202020' : '#f2f2f2';
  const soft = isDark ? '#2a2a2a' : '#eeeeee';
  const skeleton = isDark ? '#242424' : '#ececec';
  const skeletonStrong = isDark ? '#303030' : '#e1e1e1';
  const subtle = isDark ? '#b8b8b8' : '#606060';
  const faint = isDark ? '#8b8b8b' : '#777777';
  const subscribeBackground = PRIMARY_COLOR;
  const subscribeForeground = isDark ? '#111111' : '#ffffff';
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;
  const isPortraitVideo = videoDimensions.height > videoDimensions.width && videoDimensions.width > 0;
  const isLandscapeVideo = videoDimensions.width > videoDimensions.height && videoDimensions.height > 0;
  const isVideoHeightChanging = videoCollapseProgress > 0 && videoCollapseProgress < 1;
  const isVideoCollapsed = videoCollapseProgress >= 0.99;
  const videoContentFit = isPortraitVideo && !isVideoHeightChanging && videoCollapseProgress === 0 ? 'cover' : 'contain';
  const easedVideoCollapseProgress = 1 - Math.pow(1 - videoCollapseProgress, 2);
  const videoPlayerHeight = Math.round(
    VIDEO_EXPANDED_HEIGHT - ((VIDEO_EXPANDED_HEIGHT - VIDEO_COLLAPSED_HEIGHT) * easedVideoCollapseProgress),
  );
  const contentLockTranslateY = Math.round(videoCollapseProgress * VIDEO_COLLAPSE_DISTANCE);
  const naturalFullscreenOrientation = isLandscapeVideo ? 'landscape' : isPortraitVideo ? 'portrait' : 'default';
  const fullscreenOrientation = fullscreenOrientationMode ?? naturalFullscreenOrientation;
  const nextFullscreenOrientationLabel = fullscreenOrientation === 'landscape' ? 'Portrait' : 'Landscape';
  const overflowMenuId = video.id || activeSourceUrl || 'active-video';
  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.timeUpdateEventInterval = PLAYBACK_UPDATE_INTERVAL_SECONDS;
  });
  const loadedMetadata = useEvent(player, 'sourceLoad');
  const playbackTime = useEvent(player, 'timeUpdate', {
    currentTime: player.currentTime,
    currentLiveTimestamp: player.currentLiveTimestamp,
    currentOffsetFromLive: player.currentOffsetFromLive,
    bufferedPosition: player.bufferedPosition,
  });
  const playbackState = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const playerStatus = useEvent(player, 'statusChange', { status: player.status });
  const isFetchingVideoDetails = !directActiveVideo && creatorVideosLoading;
  const isVideoLoading = !activeSourceUrl || isFetchingVideoDetails || (playerStatus.status !== 'readyToPlay' && playerStatus.status !== 'error');
  useEffect(() => {
    player.pause();
    setCurrent(0);
    setDuration(0);
    setShowVideoPoster(true);
    setVideoDimensions({ width: 0, height: 0 });
    setFullscreenOrientationMode(null);
  }, [activeSourceUrl, player]);

  useEffect(() => {
    setOrderedUpNextVideos(sourceUpNextVideos);
  }, [sourceUpNextVideos]);

  useEffect(() => {
    if (!video.id) return;
    const candidates = [video, ...sourceUpNextVideos];
    setVerticalVideos((currentVideos) => {
      const merged = [...currentVideos];
      candidates.forEach((candidate) => {
        if (candidate.id && !merged.some((item) => item.id === candidate.id)) merged.push(candidate);
      });
      return merged.length === currentVideos.length ? currentVideos : merged;
    });
  }, [sourceUpNextVideos, video]);

  useEffect(() => {
    const nextId = routeFeedVideo?.id ?? route.params?.id;
    setDirectActiveVideo(routeFeedVideo ?? null);
    if (nextId) {
      setActiveId(nextId);
    }
  }, [route.params?.id, routeFeedVideo?.id]);

  useEffect(() => {
    setDescriptionLineNumber(1);
    setShowDescriptionMore(true);
    setActiveMenuId(null);
  }, [video.id]);

  useEffect(() => {
    AsyncStorage.getItem('pulsar_user').then((saved: string | null) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as { role?: string };
        const nextRole = parsed?.role === 'creator' ? 'creator' : 'fan';
        setRole(nextRole);
        setStudioMode(nextRole === 'creator');
      } catch {}
    });
  }, []);

  useEffect(() => {
    player.playbackRate = speed;
  }, [player, speed]);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);

  useEffect(() => {
    if (!isFocused) {
      player.pause();
      setShowControls(true);
    }
  }, [isFocused, player]);

  useEffect(() => {
    const loadedTrack = loadedMetadata?.availableVideoTracks?.[0];
    const nextWidth = loadedTrack?.size?.width ?? 0;
    const nextHeight = loadedTrack?.size?.height ?? 0;
    const nextDuration = Number(loadedMetadata?.duration ?? 0);

    if (nextDuration > 0) {
      setDuration(nextDuration);
    }

    if (nextWidth > 0 && nextHeight > 0) {
      setVideoDimensions((currentDimensions) => (
        currentDimensions.width === nextWidth && currentDimensions.height === nextHeight
          ? currentDimensions
          : { width: nextWidth, height: nextHeight }
      ));
    }
  }, [loadedMetadata]);

  useEffect(() => {
    const nextCurrent = Number(playbackTime?.currentTime ?? player.currentTime ?? 0);
    const nextDuration = Number(player.duration ?? 0);

    setCurrent((currentValue) => (Math.abs(currentValue - nextCurrent) < 0.05 ? currentValue : nextCurrent));
    if (nextDuration > 0) {
      setDuration((currentValue) => (Math.abs(currentValue - nextDuration) < 0.05 ? currentValue : nextDuration));
    }
  }, [playbackTime, player]);

  useEffect(() => {
    setPlaying(Boolean(playbackState?.isPlaying ?? player.playing));
  }, [playbackState, player]);

  useEffect(() => {
    if (playerStatus.status !== 'readyToPlay' || !playing || current <= 0.02) return;
    const timeout = setTimeout(() => setShowVideoPoster(false), 80);
    return () => clearTimeout(timeout);
  }, [activeSourceUrl, current, playerStatus.status, playing]);

  useEffect(() => {
    if (!showControls || !playing || isVideoCollapsed) return;
    const timeout = setTimeout(() => setShowControls(false), 3500);
    return () => clearTimeout(timeout);
  }, [isVideoCollapsed, showControls, playing]);

  useEffect(() => {
    if (isVideoCollapsed) {
      setShowControls(true);
    }
  }, [isVideoCollapsed]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    setToast(`Playback ${next}x`);
  };

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else {
      player.play();
      setPlaying(true);
    }
    setShowControls(true);
  };

  const pauseIfVideoMostlyOutOfView = useCallback((scrollY: number, viewportHeight: number) => {
    const { y: videoY, height: videoHeight } = videoLayoutRef.current;
    if (isFullscreen || videoCollapseProgress > 0 || videoHeight <= 0 || viewportHeight <= 0) return;

    const viewportTop = scrollY;
    const viewportBottom = scrollY + viewportHeight;
    const videoTop = videoY;
    const videoBottom = videoY + videoHeight;
    const visibleHeight = Math.max(0, Math.min(videoBottom, viewportBottom) - Math.max(videoTop, viewportTop));
    const outOfViewRatio = 1 - visibleHeight / videoHeight;

    if (outOfViewRatio >= VIDEO_PAUSE_OUT_OF_VIEW_RATIO && player.playing) {
      player.pause();
      setShowControls(true);
    }
  }, [isFullscreen, player, videoCollapseProgress]);

  const handleMainScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    scrollViewportRef.current = { y: contentOffset.y, height: layoutMeasurement.height };
    const scrollY = Math.max(0, contentOffset.y);
    const nextCollapseProgress = Math.max(0, Math.min(scrollY / VIDEO_COLLAPSE_DISTANCE, 1));

    setVideoCollapseProgress((currentProgress) => (
      Math.abs(currentProgress - nextCollapseProgress) < VIDEO_COLLAPSE_UPDATE_THRESHOLD
        ? currentProgress
        : nextCollapseProgress
    ));

    const now = Date.now();
    if (now - lastVisibilityCheckRef.current < SCROLL_VISIBILITY_CHECK_INTERVAL_MS) return;

    lastVisibilityCheckRef.current = now;
    pauseIfVideoMostlyOutOfView(contentOffset.y, layoutMeasurement.height);
  }, [pauseIfVideoMostlyOutOfView]);

  const jumpBy = (seconds: number) => {
    player.seekBy(seconds);
    setShowControls(true);
  };

  const seekFromProgress = (locationX: number) => {
    const total = Number(player.duration ?? 0);
    if (progressWidth <= 0 || total <= 0) return;
    const nextTime = Math.max(0, Math.min((locationX / progressWidth) * total, total));
    player.currentTime = nextTime;
    setCurrent(nextTime);
    setShowControls(true);
  };

  const enterFullscreen = async () => {
    try {
      setUseFullscreenNativeControls(true);
      await videoViewRef.current?.enterFullscreen();
      setShowControls(true);
    } catch {
      setUseFullscreenNativeControls(false);
      setToast('Fullscreen unavailable');
    }
  };

  const exitFullscreen = async () => {
    try {
      await videoViewRef.current?.exitFullscreen();
      setShowControls(true);
    } catch {
      setToast('Could not exit fullscreen');
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      void exitFullscreen();
      return;
    }

    void enterFullscreen();
  };

  const toggleFullscreenOrientation = () => {
    const nextMode: FullscreenOrientationMode = fullscreenOrientation === 'landscape' ? 'portrait' : 'landscape';
    setFullscreenOrientationMode(nextMode);
    setShowControls(true);
    setToast(`${nextMode === 'landscape' ? 'Landscape' : 'Portrait'} fullscreen`);
  };

  const postComment = () => {
    if (!commentText.trim()) return;
    setComments((currentComments) => [{ id: Date.now().toString(), user: 'Me', avatar: video.avatar ?? '', text: commentText.trim(), time: 'Just now' }, ...currentComments]);
    setCommentText('');
  };

  const addToQueue = (item: VideoItem) => {
    if (queue.some((entry) => entry.id === item.id)) return setToast('Already in queue');
    setQueue((currentQueue) => [...currentQueue, item]);
    setToast('Added to queue');
  };

  const playById = useCallback((id: string) => {
    setDirectActiveVideo(null);
    setActiveId(id);
    setQueueOpen(false);
    setShowControls(true);
  }, []);

  const playVideoItem = useCallback((item: VideoItem) => {
    if (!item.url) {
      playById(item.id);
      return;
    }

    setDirectActiveVideo(item);
    setActiveId(item.id);
    setQueueOpen(false);
    setShowControls(true);
  }, [playById]);

  const playUpNextVideo = useCallback((item: VideoItem) => {
    const previousVideo = video;

    setOrderedUpNextVideos((currentVideos) => {
      const nextVideos = withoutVideoIds(currentVideos, [item.id, previousVideo.id]);
      if (previousVideo.id && previousVideo.id !== item.id) {
        return [...nextVideos, previousVideo];
      }

      return nextVideos;
    });

    playVideoItem(item);
  }, [playVideoItem, video]);

  const playNextOrReplay = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playVideoItem(next);
      setToast(`Playing next: ${next.title}`);
      return;
    }

    const next = upNextVideos[0];
    if (next) {
      playVideoItem(next);
      setToast(`Playing next: ${next.title}`);
      return;
    }

    player.replay();
  }, [playVideoItem, player, queue, upNextVideos]);

  useEventListener(player, 'playToEnd', playNextOrReplay);

  const shareVideo = async () => {
    await Share.share({
      message: `${video.title} by ${video.artist}\n${video.url}`,
    });
    setToast('Share sheet opened');
  };

  const saveToLibrary = () => {
    setToast('Saved to library');
  };

  const openBroadcastQueue = () => {
    setActiveMenuId(null);
    setQueueOpen(true);
  };

  const addActiveVideoToQueue = () => {
    if (!video.id) return;
    addToQueue(video);
    setActiveMenuId(null);
  };

  const toggleOverflowMenu = () => {
    setActiveMenuId((currentId) => (currentId === overflowMenuId ? null : overflowMenuId));
  };

  const runAudit = () => {
    setLoadingAudit(true);
    setTimeout(() => {
      setAudit('Lead the next upload with the bridge visual motif to turn replay spikes into stronger completion.');
      setLoadingAudit(false);
    }, 1200);
  };

  const syncProtocol = (nextProtocol: 'public' | 'premium') => {
    setSyncing(true);
    setTimeout(() => {
      setProtocol(nextProtocol);
      setSyncing(false);
      setToast(`Protocol set to ${nextProtocol}`);
    }, 900);
  };

  const episodeIndex = routePlaylistVideos.findIndex((item) => item.id === video.id);
  const episodeNumber = episodeIndex >= 0 ? episodeIndex + 1 : 1;
  const episodeTotal = Math.max(routePlaylistVideos.length, upNextVideos.length + 1, 1);
  const likeCount = video.likes || '0';
  const commentCount = video.comments || String(comments.length);
  const saveCount = route.params?.item?.saves || route.params?.item?.bookmarks || '0';
  const shareCount = route.params?.item?.shares || '0';
  const isPlaylist = Boolean(route.params?.playlistId);
  const feedContentFit = videoDimensions.width === 0 || videoDimensions.height === 0 || isPortraitVideo ? 'cover' : 'contain';
  const overlayBottom = isPlaylist ? 14 : Math.max(insets.bottom, 8) + 14;
  const activeVideoIdRef = useRef(video.id);
  const playVideoItemRef = useRef(playVideoItem);
  activeVideoIdRef.current = video.id;
  playVideoItemRef.current = playVideoItem;
  const handleViewableVideos = useRef(({ viewableItems }: { viewableItems: ViewToken<VideoItem>[] }) => {
    const nextVideo = viewableItems.find((entry) => entry.isViewable)?.item;
    if (nextVideo && nextVideo.id !== activeVideoIdRef.current) playVideoItemRef.current(nextVideo);
  });
  const videoViewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 });

  const verticalKeyExtractor = useCallback((item: VideoItem, index: number) => item.id || `video-${index}`, []);
  const getVerticalItemLayout = useCallback((_: ArrayLike<VideoItem> | null | undefined, index: number) => ({
    length: stageHeight,
    offset: stageHeight * index,
    index,
  }), [stageHeight]);
  const showSubscriptions = useCallback(() => setToast('Subscriptions'), []);
  const toggleFollowed = useCallback(() => setFollowed((value) => !value), []);
  const updateLiked = useCallback((_: FeedItem, nextLiked: boolean) => setLiked(nextLiked), []);
  const saveVerticalVideo = useCallback(() => setToast('Saved to library'), []);
  const ignoreRecordView = useCallback(() => undefined, []);
  const toggleMuted = useCallback(() => setMuted((value) => !value), []);
  const ignoreBalanceChange = useCallback(() => undefined, []);
  const renderVerticalVideo = useCallback(({ item }: { item: VideoItem }) => (
    <View style={[styles.shortVideoPage, { height: stageHeight }]}>
      <VideoFeedItem
        item={toFeedItem(item)}
        isPlaying={item.id === video.id}
        onSubscribe={showSubscriptions}
        onFollow={toggleFollowed}
        onToggleLike={updateLiked}
        onToggleBookmark={saveVerticalVideo}
        onRecordView={ignoreRecordView}
        isGlobalMuted={muted}
        onToggleMute={toggleMuted}
        coinBalance={0}
        onBalanceChange={ignoreBalanceChange}
        isCreatorViewer={false}
      />
    </View>
  ), [ignoreBalanceChange, ignoreRecordView, muted, saveVerticalVideo, showSubscriptions, stageHeight, toggleFollowed, toggleMuted, updateLiked, video.id]);

  return (
    <SafeAreaView style={styles.shortPlayerRoot} edges={[]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {toast ? <View style={[styles.toast, { top: insets.top + 12 }]}><Text style={styles.toastText}>{toast}</Text></View> : null}
      <View
        style={styles.shortVideoStage}
        onLayout={(event) => setStageHeight(event.nativeEvent.layout.height)}
      >
        {stageHeight > 0 ? <FlatList
          data={verticalVideos.length ? verticalVideos : [video]}
          keyExtractor={verticalKeyExtractor}
          renderItem={renderVerticalVideo}
          showsVerticalScrollIndicator={false}
          snapToInterval={stageHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={getVerticalItemLayout}
          onViewableItemsChanged={handleViewableVideos.current}
          viewabilityConfig={videoViewabilityConfig.current}
          removeClippedSubviews
          initialNumToRender={2}
          windowSize={3}
          maxToRenderPerBatch={2}
          updateCellsBatchingPeriod={75}
        /> : null}
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={[styles.shortBackButton, { top: insets.top + 12 }]}>
          <MaterialIcons name="chevron-left" size={42} color="#fff" />
        </Pressable>

        <View style={{ display: 'none' }} pointerEvents="none">
          <Text numberOfLines={2} style={styles.shortTitle}>{video.title || 'Kulsah Video'}</Text>
          <Text numberOfLines={2} style={styles.shortDescription}>{video.description || `${video.artist}${video.handle ? ` · ${video.handle}` : ''}`}</Text>
        </View>

        <Pressable pointerEvents="none" style={{ display: 'none' }}>
          <View style={[styles.shortTrackFill, { width: `${progress * 100}%` }]} />
          <View style={[styles.shortTrackThumb, { left: `${progress * 100}%` }]} />
        </Pressable>
      </View>

      {isPlaylist ? <View style={[styles.playerDock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <Pressable onPress={openBroadcastQueue} style={styles.episodePill}>
          <MaterialIcons name="video-library" size={20} color="#d7d7d7" />
          <Text style={styles.episodeText}>Episode {episodeNumber}/{episodeTotal}</Text>
          <MaterialIcons name="keyboard-arrow-up" size={27} color="#d7d7d7" style={styles.episodeChevron} />
        </Pressable>
      </View> : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shortPlayerRoot: { flex: 1, backgroundColor: '#000' },
  shortVideoStage: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  shortVideoPage: { width: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  activeVideoPoster: { backgroundColor: '#000' },
  transparentVideoLoader: { backgroundColor: 'transparent' },
  stageTapTarget: { ...StyleSheet.absoluteFillObject, zIndex: 2, alignItems: 'center', justifyContent: 'center' },
  shortPlayButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
  shortBackButton: { position: 'absolute', left: 8, zIndex: 10, width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  topMoreWrap: { position: 'absolute', right: 10, zIndex: 20, alignItems: 'flex-end' },
  topMoreButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.34)', alignItems: 'center', justifyContent: 'center' },
  shortOverflowMenu: { marginTop: 6, width: 224, borderRadius: 16, paddingVertical: 7, backgroundColor: 'rgba(22,22,22,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  shortOverflowItem: { minHeight: 50, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  shortOverflowText: { flex: 1, color: '#fff', ...fontSize.b3 },
  shortOverflowValue: { color: '#bdbdbd', ...fontSize.b4, fontFamily: 'Inter_600SemiBold' },
  actionRail: { position: 'absolute', right: 10, bottom: 14, zIndex: 8, alignItems: 'center', gap: 17 },
  avatarAction: { width: 52, height: 58, alignItems: 'center' },
  railAvatar: { width: 49, height: 49, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  avatarFallback: { backgroundColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' },
  followBadge: { position: 'absolute', bottom: 0, width: 25, height: 25, borderRadius: 13, backgroundColor: '#ff2d66', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ff2d66' },
  followBadgeActive: { backgroundColor: PRIMARY_COLOR },
  railAction: { minWidth: 52, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.75, shadowRadius: 4, elevation: 6 },
  railCount: { color: '#fff', ...fontSize.b2, textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  railMore: { width: 52, height: 42, borderRadius: 22, backgroundColor: 'rgba(30,30,30,0.5)', alignItems: 'center', justifyContent: 'center' },
  shortMetadata: { position: 'absolute', left: 16, right: 82, bottom: 26, zIndex: 7, gap: 7 },
  shortTitle: { color: '#fff', ...fontSize.h1, textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  shortDescription: { color: '#f1f1f1', ...fontSize.h2, fontFamily: 'Inter_400Regular', textShadowColor: 'rgba(0,0,0,0.85)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  shortTrack: { position: 'absolute', left: 0, right: 0, bottom: -8, height: 16, zIndex: 10, justifyContent: 'center' },
  shortTrackFill: { height: 3, backgroundColor: '#e6e6e6' },
  shortTrackThumb: { position: 'absolute', width: 7, height: 7, marginLeft: -3.5, borderRadius: 4, backgroundColor: '#fff' },
  playerDock: { minHeight: 84, backgroundColor: '#050505', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  episodePill: { flex: 1, height: 56, borderRadius: 29, backgroundColor: '#202020', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 22, gap: 8 },
  episodeText: { color: '#d7d7d7', ...fontSize.h2, fontFamily: 'Inter_500Medium' },
  episodeChevron: { marginLeft: 'auto' },
  dockCircle: { width: 57, height: 57, borderRadius: 29, backgroundColor: '#202020', alignItems: 'center', justifyContent: 'center' },
  speedText: { color: '#d7d7d7', ...fontSize.h2, fontFamily: 'Inter_500Medium' },
  safeArea: { flex: 1 }, toast: { position: 'absolute', left: 24, right: 24, zIndex: 40, alignItems: 'center' }, toastText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.6, backgroundColor: PRIMARY_COLOR, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  header: { minHeight: 56, paddingHorizontal: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 }, headerTitle: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight }, headerIconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 }, pillSmall: { height: 36, minWidth: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, pillText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  videoTopOverlay: { position: 'absolute', left: 12, right: 12, top: 0, zIndex: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, videoOverlayButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' }, videoOverlayPill: { height: 34, minWidth: 54, borderRadius: 17, paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.34)', alignItems: 'center', justifyContent: 'center' }, videoOverlayText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  videoShell: { overflow: 'hidden', borderWidth: 0, backgroundColor: '#000', height: 250}, video: { ...StyleSheet.absoluteFillObject }, videoLoaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', zIndex: 4 }, heatmap: { position: 'absolute', bottom: 60, left: 16, right: 16, height: 52, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }, heatBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, controls: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }, controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 }, ghostBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.48)', alignItems: 'center', justifyContent: 'center' }, playBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.58)', alignItems: 'center', justifyContent: 'center' }, muteBtn: { position: 'absolute', right: 14, top: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }, fullscreenBtn: { position: 'absolute', right: 14, bottom: 58, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }, orientationToggleBtn: { position: 'absolute', right: 56, bottom: 58, height: 36, borderRadius: 18, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, orientationToggleText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, landscapeBadge: { position: 'absolute', left: 14, top: 14, height: 28, borderRadius: 14, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.55)', flexDirection: 'row', alignItems: 'center', gap: 5 }, landscapeBadgeText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, videoFooter: { position: 'absolute', left: 12, right: 12, bottom: 10 }, track: { height: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.34)', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 999, backgroundColor: PRIMARY_COLOR }, metaRow: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }, metaText: { color: 'rgba(255,255,255,0.88)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  sectionStack: { paddingHorizontal: 16, paddingTop: 16, gap: 14, backgroundColor: '#000' }, statGrid: { flexDirection: 'row', gap: 10 }, statCard: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 16, alignItems: 'center', gap: 6 }, statValue: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, statLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, panel: { borderRadius: 0, borderWidth: 0, paddingVertical: 4, gap: 0 }, eyebrow: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, syncDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, protocolRow: { flexDirection: 'row', gap: 12 }, protocolCard: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 }, protocolTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, protocolCopy: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  auditPanel: { borderRadius: 30, borderWidth: 1, padding: 18, gap: 14 }, auditHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, auditIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColorAlpha(0.10) }, auditTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.3 }, auditSub: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' }, auditButton: { height: 46, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, auditButtonText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  titleBlock: { gap: 8 }, title: { color: '#fff', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight }, titleHeart: { color: '#ff3b6b' }, descriptionRow: { width: '95%', flexDirection: 'row', gap: 5 }, descriptionCopy: { flex: 1 }, descriptionText: { marginTop: 2, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, titleMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 3 }, smallMeta: { color: '#aaa', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, moreText: { color: '#fff', marginTop: 2, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, dot: { width: 3, height: 3, borderRadius: 1.5 }, actionRow: { gap: 8, paddingRight: 12 }, actionChip: { flexDirection: 'row', alignItems: 'center', gap: 7, height: 36, paddingHorizontal: 14, borderRadius: 18 }, actionText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  creatorActionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2, paddingBottom: 2, zIndex: 20 }, creatorMini: { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' }, iconAction: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }, subscribeButton: { height: 38, borderRadius: 19, paddingHorizontal: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, subscribeText: { color: '#111', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, artistMain: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }, artistAvatar: { width: 38, height: 38, borderRadius: 19 }, artistRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, artistName: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, artistHandle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, followButton: { height: 36, borderRadius: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }, followText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  videoMoreMenuWrap: { position: 'relative', zIndex: 30 },
  videoMoreMenu: { position: 'absolute', top: 42, right: 0, width: 184, borderRadius: 18, borderWidth: 1, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 18, elevation: 12, zIndex: 40 },
  videoMoreMenuItem: { minHeight: 38, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  videoMoreMenuText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 1 },
  videoMoreMenuDivider: { height: 1, marginVertical: 4 },
  copyBlock: { borderRadius: 12, padding: 12, gap: 6 }, body: { ...fontSize.b5, lineHeight: 20 }, commentsBlock: { gap: 12, borderTopWidth: 1, paddingTop: 14 }, commentsPreview: { backgroundColor: '#202020', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 12 }, commentsPreviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, commentsPreviewTitle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }, commentsPreviewCount: { color: '#aaa' }, sectionTitle: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight }, commentComposer: { borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 4 }, commentInput: { flex: 1, minHeight: 40, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, commentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, commentAvatar: { width: 34, height: 34, borderRadius: 17 }, commentInitial: { backgroundColor: '#42a847', alignItems: 'center', justifyContent: 'center' }, commentInitialText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, commentUser: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, commentBody: { color: '#fff', ...fontSize.b5, lineHeight: 18 },
  queueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, queueBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, queueBadgeText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, manageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }, upNextLoader: { minHeight: 96, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, upNextSkeletonStack: { gap: 12 }, upNextRow: { flexDirection: 'row', gap: 10 }, thumbWrap: { width: 156, aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#000' }, thumb: { width: '100%', height: '100%' }, nextBadge: { position: 'absolute', top: 6, left: 6, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }, nextBadgeText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, durationBadge: { position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.82)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }, durationText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, upNextCopy: { flex: 1, justifyContent: 'space-between', paddingVertical: 1 }, upNextTitle: { ...fontSize.b5, lineHeight: 18 }, queueButton: { height: 30, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 10, alignSelf: 'flex-start' },
  videoDetailSkeleton: { gap: 14 }, skeletonBlock: { borderRadius: 8, overflow: 'hidden' }, skeletonFull: { width: '100%', height: 12 }, skeletonTiny: { width: 72, height: 10 }, skeletonTitle: { width: '82%', height: 24 }, skeletonDescription: { width: '96%', height: 14 }, skeletonDescriptionShort: { width: '68%', height: 14 }, skeletonMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, skeletonMetaPill: { width: 76, height: 12 }, skeletonActionRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2, paddingBottom: 2 }, skeletonAvatar: { width: 38, height: 38, borderRadius: 19 }, skeletonButton: { width: 82, height: 38, borderRadius: 19 }, skeletonIcon: { width: 38, height: 38, borderRadius: 19 }, skeletonCommentTitle: { width: 124, height: 18 }, skeletonCommentLine: { width: '72%', height: 12 }, skeletonSectionTitle: { width: 96, height: 22 }, skeletonQueueButton: { width: 88, height: 36, borderRadius: 18 }, skeletonUpNextMeta: { width: '52%', height: 12 }, skeletonQueueChip: { width: 112, height: 30, borderRadius: 15 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }, queueSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, paddingTop: 10, paddingHorizontal: 18, maxHeight: '82%' }, sheetHandle: { width: 44, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 18 }, queueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, borderWidth: 1 }, queueThumb: { width: 58, height: 58, borderRadius: 16 }, queueTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }, emptyQueue: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 10 }, queueFooter: { flexDirection: 'row', gap: 10 }, clearButton: { flex: 1, height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, playNextButton: { flex: 1.5, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

export default VideoPlayer;
