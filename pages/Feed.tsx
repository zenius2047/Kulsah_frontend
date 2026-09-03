import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Accelerometer } from 'expo-sensors';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  ViewToken,
  Animated,
  ActivityIndicator,
  Platform,
  PanResponder,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { ResizeMode, Video } from 'expo-video';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { VideoPlayer } from 'expo-video';
import { getVideoPlaybackUrl, getVideoPoster, getVideoSource } from '../src/utils/video';
import { TurnCoverage } from '@google/genai/web';
import { useEvent } from 'expo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { mediumScreen, RootStackParamList, smallWidth } from '../types';
import { subscribeUser, user } from '../types';
import TickIcon from '../assets/icons/ticket-svg.svg';
import FireIcon from '../assets/icons/fireIcon-svg.svg';
import BookMarkIcon from '../assets/icons/bookmark-svg.svg';
import LiveLogo from '../assets/icons/live-svg.svg';
import Reactions from './Reactions';
import ErrorBoundary from '../components/ErrorBoundary';
import SparkleIcon from '../assets/icons/sparkle-style.svg';
import CommentIcon from '../assets/icons/comment-svg.svg';
import KulCoinPrompt from '../components/KulCoinPrompt';
import CreatorShareSheet from './CreatorShareSheet';
import { VoteModalContent } from './Vote';
import Premium from '../assets/icons/kulsah_premium_icon.svg';
import DotTrioLoader from '../components/DotTrioLoader';
import { fontSize } from '../typography';
import {
  creatorBattleVideoParticipants,
  getApiErrorMessage,
  parseApiError,
  useChallenge,
  usePublicCreatorSubscriptionPlans,
  useBookmarkVideoMutation,
  useFollowCreatorMutation,
  useGeneralFeed,
  useLikeVideoMutation,
  useRecordVideoViewMutation,
  useSubscribeToPlan,
  useCreateCreatorVideoDuetDraft,
  useCastChallengeBallot,
  useKulCoinWallet,
} from '../src';
import type { ChallengeListResource, CreatorSubscriptionPlan } from '../src';
import { challengesApi, unwrapChallengeShowResponse } from '../src/api/challenges.api';
import { challengeQueryKey } from '../src/hooks/challenges/useChallenges';

const KULCOIN_ICON = require('../assets/coin.png');
const CAPTION_MORE_THRESHOLD = 50;

export interface FeedItem {
  id: string;
  creatorId?: string;
  artist: string;
  handle: string;
  avatar: string;
  caption: string;
  background: string;
  video: string;
  likes: string;
  comments: string;
  isLiked: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  isChallenge?: boolean;
  isCreatorBattle?: boolean;
  creatorBattle?: ChallengeListResource | null;
  allowDuet?: boolean;
  isDuet?: boolean;
  duetSourceVideoId?: string | number | null;
  canDuet?: boolean;
  ticketsAvailable: boolean;
  ticketLocation?: string;
  isLive?: boolean;
  originalSound: boolean;
  soundArtist?: string;
  soundTitle?: string;
  following: boolean;
  isBookmarked: boolean;
  bookmarks: string;
  saves: string;
}

type FeedRow =
  | { kind: 'battle-loading'; id: string }
  | { kind: 'battle'; id: string; battle: ChallengeListResource; battleIndex: number }
  | { kind: 'video'; id: string; item: FeedItem };

interface FeedSubscriptionSelection {
  itemId: string;
  creatorId?: string;
  creatorHandle: string;
  creatorName: string;
}

const LiveFeedCreatorAvatar: React.FC<{
  avatar: string;
  isLive: boolean;
  showLiveBadge: boolean;
  showFollowBadge: boolean;
  onFollow: () => void;
}> = ({ avatar, isLive, showLiveBadge, showFollowBadge, onFollow }) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLive) {
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isLive, pulse]);

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.75],
  });

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });

  return (
    <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      {isLive ? (
        <>
          <Animated.View
            style={{
              position: 'absolute',
              width: 52,
              height: 52,
              borderRadius: 31,
              backgroundColor: 'rgba(239,68,68,0.28)',
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 33,
              backgroundColor: 'rgba(239,68,68,0.12)',
            }}
          />
        </>
      ) : null}
      <View
        style={{
          borderRadius: 24,
          height: 48,
          width: 48,
          padding: 2,
          borderWidth: 2,
          borderColor: isLive ? 'red' : 'white',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
        {showLiveBadge && (
          <View
            style={{
              borderRadius: 6,
              paddingHorizontal: 6,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 3,
              backgroundColor: 'red',
              bottom: -6,
              position: 'absolute',
              height: 15,
            }}
          >
            <Text
              style={{
                ...fontSize.b5,
                lineHeight: fontSize.b5.lineHeight,
                color: 'white',
              }}
            >
              LIVE
            </Text>
          </View>
        )}
        {showFollowBadge && (
          <Pressable
            onPress={onFollow}
            hitSlop={8}
            style={{
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: PRIMARY_COLOR,
              bottom: -8,
              position: 'absolute',
              height: 20,
              width: 20,
            }}
          >
            <MaterialIcons name="add" size={15} color="white" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const FEED_ITEM_HEIGHT = SCREEN_HEIGHT * (Platform.OS === 'ios'? 0.92: 0.93);
const MONTHLY_KULCOINS = 100;
const YEARLY_KULCOINS = 1000;
const INITIAL_TIME_UPDATE = { currentTime: 0 } as const;
const SHAKE_TO_REFRESH_STORAGE_KEY = 'pulsar_shake_to_refresh';
const CREATOR_BATTLE_RAIL_INSET = 8;
const SHAKE_FORCE_THRESHOLD = 2.05;
const SHAKE_DELTA_THRESHOLD = 1.15;
const SHAKE_REFRESH_COOLDOWN_MS = 1400;

const formatBattleCountdown = (seconds: number | null) => {
  if (seconds == null) return null;
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const clock = [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');

  return days > 0 ? `${days}d ${clock}` : clock;
};
const FALLBACK_FEED_AVATAR = 'https://picsum.photos/seed/kulsah-feed-avatar/150/150';
const FALLBACK_FEED_BACKGROUND =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800';

const firstString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }

  return '';
};

const formatFeedCount = (value: unknown, fallback = '0') => {
  if (typeof value === 'number') return value > 999 ? `${(value / 1000).toFixed(1)}K` : String(value);
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

const parseFeedCount = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.trim().toLowerCase();
  const numeric = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric)) return 0;
  if (normalized.includes('m')) return Math.round(numeric * 1000000);
  if (normalized.includes('k')) return Math.round(numeric * 1000);

  return Math.round(numeric);
};

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? (value as Record<string, any>) : {};

const extractFeedRows = (payload: unknown): Record<string, any>[] => {
  if (Array.isArray(payload)) return payload.map(asRecord);

  const record = asRecord(payload);
  const nested = record.data ?? record.videos ?? record.items ?? record.results ?? record.feed ?? record.docs;

  if (nested && nested !== payload) return extractFeedRows(nested);

  return Object.keys(record).length > 0 ? [record] : [];
};

const mapFeedVideoToItem = (rawValue: unknown, index: number): FeedItem | null => {
  const raw = asRecord(rawValue);
  const creator = asRecord(raw.creator ?? raw.user ?? raw.owner ?? raw.author ?? raw.artist);
  const videoValue = asRecord(raw.video);
  const video = getVideoPlaybackUrl({
    streaming_url: firstString(raw.streaming_url, videoValue.streaming_url) || null,
    stream_url: firstString(raw.stream_url, videoValue.stream_url) || null,
    video: firstString(raw.video, raw.videoUrl, raw.video_url, raw.videoURL) || null,
    cdn_url: firstString(raw.cdn_url, videoValue.cdn_url) || null,
    rendered_url: firstString(raw.rendered_url, videoValue.rendered_url) || null,
  }) ?? firstString(
    raw.videoPath,
    raw.video_path,
    raw.mediaUrl,
    raw.media_url,
    raw.fileUrl,
    raw.file_url,
    raw.url,
    raw.path,
    asRecord(raw.videoFile).url,
    videoValue.url,
    videoValue.secure_url,
  );

  if (!video) return null;

  const handle = firstString(
    raw.handle,
    raw.username,
    raw.creatorHandle,
    raw.creator_handle,
    creator.handle,
    creator.username
  ).replace(/^@/, '');

  const visibility = firstString(raw.visibility, raw.type).toLowerCase();

  return {
    id: firstString(raw.id, raw._id, raw.uuid, raw.slug, `${video}-${index}`),
    creatorId: firstString(raw.creator_id, raw.creatorId, raw.user_id, raw.userId, creator.id, creator.user_id) || undefined,
    artist: firstString(
      raw.artist,
      raw.creatorName,
      raw.creator_name,
      raw.name,
      creator.name,
      creator.fullName,
      creator.full_name,
      handle,
      'Kulsah Creator'
    ),
    handle: handle || 'kulsah_creator',
    avatar: firstString(raw.avatar, raw.avatarUrl, raw.avatar_url, creator.avatar, creator.avatarUrl, creator.avatar_url, FALLBACK_FEED_AVATAR),
    caption: firstString(raw.caption, raw.description, raw.title, 'New video from Kulsah'),
    background: getVideoPoster({
      poster_url: firstString(raw.poster_url, videoValue.poster_url) || null,
      thumbnail: firstString(raw.thumbnail, raw.thumbnailUrl) || null,
      background: firstString(raw.background) || null,
      thumbnail_url: firstString(raw.thumbnail_url, videoValue.thumbnail_url) || null,
    }) ?? firstString(raw.cover, raw.coverUrl, raw.cover_url, FALLBACK_FEED_BACKGROUND),
    video,
    likes: formatFeedCount(raw.likes ?? raw.likesCount ?? raw.like_count),
    comments: formatFeedCount(raw.comments ?? raw.commentsCount ?? raw.comment_count),
    isLiked: Boolean(raw.isLiked ?? raw.liked),
    isSubscribed: Boolean(raw.isSubscribed ?? raw.subscribed ?? raw.creatorSubscribed),
    isPremium: Boolean(raw.isPremium ?? raw.premium ?? visibility === 'premium'),
    isChallenge: Boolean(raw.isChallenge ?? raw.is_challenge),
    isCreatorBattle: Boolean(raw.isCreatorBattle ?? raw.is_creator_battle ?? raw.creatorBattle ?? raw.creator_battle),
    creatorBattle: (raw.creatorBattle ?? raw.creator_battle ?? null) as ChallengeListResource | null,
    allowDuet: Boolean(raw.allowDuet ?? raw.allow_duet),
    isDuet: Boolean(raw.isDuet ?? raw.is_duet),
    duetSourceVideoId: raw.duetSourceVideoId ?? raw.duet_source_video_id ?? null,
    canDuet: Boolean(raw.canDuet ?? raw.can_duet),
    ticketsAvailable: Boolean(raw.ticketsAvailable ?? raw.tickets_available ?? raw.hasTickets),
    ticketLocation: firstString(raw.ticketLocation, raw.ticket_location, raw.location) || undefined,
    isLive: Boolean(raw.isLive ?? raw.live),
    originalSound: raw.originalSound == null ? true : Boolean(raw.originalSound),
    soundArtist: firstString(raw.soundArtist, raw.sound_artist, raw.audioArtist, raw.audio_artist) || undefined,
    soundTitle: firstString(raw.soundTitle, raw.sound_title, raw.audioTitle, raw.audio_title, raw.title) || undefined,
    following: Boolean(raw.following ?? raw.isFollowing),
    isBookmarked: Boolean(raw.isBookmarked ?? raw.bookmarked ?? raw.isSaved ?? raw.saved),
    bookmarks: formatFeedCount(raw.bookmarks ?? raw.bookmarksCount ?? raw.bookmark_count),
    saves: formatFeedCount(raw.saves ?? raw.savesCount ?? raw.save_count),
  };
};

const FeedQuickMenuModal: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { isDark, theme } = useThemeMode();
  const panelBg = isDark ? 'rgba(10,5,13,0.92)' : 'rgba(255,255,255,0.96)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const tileBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)';
  const tileBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
  const rowBg = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.03)';
  const textPrimary = isDark ? '#e2e8f0' : theme.text;
  const iconTone = isDark ? '#94a3b8' : theme.textSecondary;
  const divider = isDark ? 'rgba(255,255,255,0.08)' : theme.border;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            maxHeight: SCREEN_HEIGHT * 0.78,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderColor: panelBorder,
            backgroundColor: panelBg,
            paddingBottom: 26,
            overflow: 'hidden',
          }}
        >
          <View style={{ alignItems: 'center', paddingVertical: 12 }}>
            <View style={{ width: 48, height: 6, borderRadius: 99, backgroundColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.2)' }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }} keyboardShouldPersistTaps="handled">
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {[
                { icon: 'bookmark', label: 'Save' },
                { icon: 'sync', label: 'Remix' },
                { icon: 'auto-awesome', label: 'Orbit' },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  style={{
                    flex: 1,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: tileBorder,
                    backgroundColor: tileBg,
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <MaterialIcons name={action.icon as any} size={30} color={PRIMARY_COLOR} />
                  <Text
                    style={{
                      color: textPrimary,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                    }}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ gap: 4 }}>
              {[
                { icon: 'closed-caption', label: 'Closed captions' },
                { icon: 'fullscreen', label: 'View full-screen' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                style={{
                  minHeight: 52,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: rowBg,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <MaterialIcons name={'auto-graph' as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
                    Auto-scroll
                  </Text>
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: primaryColorAlpha(0.4),
                      backgroundColor: primaryColorAlpha(0.2),
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }}>NEW</Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 42,
                    height: 25,
                    borderRadius: 999,
                    backgroundColor: '#6a00b1',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                    alignItems: 'flex-end',
                  }}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' }} />
                </View>
              </Pressable>

              <Pressable
                style={{
                  height: 52,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: rowBg,
                }}
              >
                <MaterialIcons name={'qr-code' as any} size={22} color={iconTone} />
                <Text style={{ color: textPrimary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
                  QR code
                </Text>
              </Pressable>

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 8, marginHorizontal: 4 }} />

              {[
                { icon: 'sentiment-satisfied', label: 'Interested' },
                { icon: 'sentiment-dissatisfied', label: 'Not interested' },
                { icon: 'report', label: 'Report', tint: '#ef4444' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={row.tint ?? iconTone} />
                  <Text style={{ color: textPrimary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}

              <View style={{ height: 1, backgroundColor: divider, marginVertical: 8, marginHorizontal: 4 }} />

              {[
                { icon: 'settings', label: 'Manage content preferences' },
                { icon: 'psychology', label: 'See your algorithm' },
              ].map((row) => (
                <Pressable
                  key={row.label}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    backgroundColor: rowBg,
                  }}
                >
                  <MaterialIcons name={row.icon as any} size={22} color={iconTone} />
                  <Text style={{ color: textPrimary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
                    {row.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const FeedSubscriptionModal: React.FC<{
  visible: boolean;
  selection: FeedSubscriptionSelection | null;
  billingCycle: 'monthly' | 'annually';
  coinBalance: number;
  isProcessing: boolean;
  showSuccess: boolean;
  onClose: () => void;
  onPurchase: (plan: CreatorSubscriptionPlan) => void;
}> = ({
  visible,
  selection,
  billingCycle,
  coinBalance,
  isProcessing,
  showSuccess,
  onClose,
  onPurchase,
}) => {
  const { isDark, theme } = useThemeMode();
  const subscriptionCost = billingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS;
  const subscriptionLabel = billingCycle === 'monthly' ? 'Monthly' : 'Annual';
  const creatorIdentifier = selection?.creatorId ?? selection?.creatorHandle;
  const {
    data: plansData,
    isLoading: isLoadingPlans,
    isRefetching: isRefetchingPlans,
    error: plansError,
    refetch: refetchPlans,
  } = usePublicCreatorSubscriptionPlans(visible ? creatorIdentifier : undefined);
  const plan = plansData?.data?.find((item) => item.is_active) ?? plansData?.data?.[0] ?? null;
  const parsedPlansError = plansError ? parseApiError(plansError) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      {selection ? (
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View
            style={{
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              borderTopWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : theme.border,
              backgroundColor: isDark ? '#08111f' : theme.card,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 28,
              maxHeight: SCREEN_HEIGHT * 0.92,
            }}
          >
            <View
              style={{
                width: 48,
                height: 6,
                borderRadius: 999,
                alignSelf: 'center',
                marginBottom: 12,
                backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.12)',
              }}
            />
            {showSuccess ? (
              <View style={{ paddingVertical: 28, rowGap: 28, alignItems: 'center' }}>
                <View
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: 38,
                    backgroundColor: primaryColorAlpha(0.18),
                    borderWidth: 2,
                    borderColor: primaryColorAlpha(0.35),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="verified" size={54} color={PRIMARY_COLOR} />
                </View>
                <Text
                  style={{
                    textAlign: 'center',
                    color: theme.text,
                    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
                    textTransform: 'uppercase',
                  }}
                >
                  Identity{'\n'}Verified
                </Text>
                <Pressable
                  onPress={onClose}
                  style={{
                    minHeight: 72,
                    borderRadius: 30,
                    backgroundColor: PRIMARY_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                    alignSelf: 'stretch',
                  }}
                >
                  <Text
                    style={{
                      color: '#fff',
                      ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                    }}
                  >
                    Start Watching
                  </Text>
                </Pressable>
              </View>
            ) : isLoadingPlans ? (
              <View style={{ paddingVertical: 36, rowGap: 12, alignItems: 'center' }}>
                <ActivityIndicator color={PRIMARY_COLOR} />
                <Text style={{ color: theme.text, ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, textAlign: 'center' }}>
                  Loading Subscription
                </Text>
                <Text style={{ color: theme.textSecondary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' }}>
                  Checking this creator's active plan.
                </Text>
              </View>
            ) : parsedPlansError ? (
              <View style={{ paddingVertical: 34, rowGap: 12, alignItems: 'center' }}>
                <MaterialIcons name="error-outline" size={42} color="#ef4444" />
                <Text style={{ color: theme.text, ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, textAlign: 'center' }}>
                  {parsedPlansError.title}
                </Text>
                <Text style={{ color: theme.textSecondary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' }}>
                  {parsedPlansError.message}
                </Text>
                <Pressable
                  onPress={() => void refetchPlans()}
                  disabled={isRefetchingPlans}
                  style={{
                    minHeight: 52,
                    borderRadius: 26,
                    backgroundColor: PRIMARY_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    minWidth: 140,
                  }}
                >
                  {isRefetchingPlans ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={{ color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>Retry</Text>
                  )}
                </Pressable>
              </View>
            ) : !plan ? (
              <View style={{ paddingVertical: 34, rowGap: 12, alignItems: 'center' }}>
                <MaterialIcons name="workspace-premium" size={42} color={PRIMARY_COLOR} />
                <Text style={{ color: theme.text, ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, textAlign: 'center' }}>
                  No Subscription Plan
                </Text>
                <Text style={{ color: theme.textSecondary, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' }}>
                  {selection.creatorName} has not published a subscription plan yet.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, rowGap: 24 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 16 }}>
                  <View
                    style={{
                      width: 78,
                      height: 78,
                      // borderRadius: 28,
                      // backgroundColor: 'rgba(245,158,11,0.18)',
                      // borderWidth: 1,
                      // borderColor: 'rgba(245,158,11,0.35)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Image source={KULCOIN_ICON} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: theme.text,
                        ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
                        textTransform: 'uppercase',
                      }}
                    >
                      {plan.name}
                    </Text>
                    <Text
                      style={{
                        marginTop: 6,
                        color: theme.textSecondary,
                        ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                        textTransform: 'uppercase',
                        letterSpacing: 2,
                      }}
                    >
                      {selection.creatorName} • {subscriptionLabel} • {subscriptionCost} KulCoins
                    </Text>
                  </View>
                </View>

                <View style={{ rowGap: 14 }}>
                  <Text
                    style={{
                      marginLeft: 4,
                      color: theme.textSecondary,
                      ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                      textTransform: 'uppercase',
                      letterSpacing: 3,
                    }}
                  >
                    Description
                  </Text>
                  <View
                    style={{
                      borderRadius: 24,
                      borderWidth: 1,
                      paddingHorizontal: 16,
                      paddingVertical: 15,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#fff',
                      borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                    }}
                  >
                    <Text
                      style={{
                        color: theme.text,
                        ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
                      }}
                    >
                      {plan.description || 'No description added yet.'}
                    </Text>
                  </View>

                  <View
                    style={{
                      marginTop: 4,
                      borderRadius: 28,
                      borderWidth: 1,
                      borderColor: 'rgba(245,158,11,0.2)',
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      paddingHorizontal: 18,
                      paddingVertical: 16,
                      rowGap: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 12 }}>
                      <Text
                        style={{
                          color: '#d97706',
                          ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                          textTransform: 'uppercase',
                          letterSpacing: 2,
                        }}
                      >
                        Your Balance
                      </Text>
                      <Text
                        style={{
                          color: theme.text,
                          ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
                        }}
                      >
                        {coinBalance} KC
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', columnGap: 12 }}>
                      <Text
                        style={{
                          color: theme.textSecondary,
                          ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
                          textTransform: 'uppercase',
                          letterSpacing: 1.5,
                        }}
                      >
                        Subscription Cost
                      </Text>
                      <Text
                        style={{
                          color: PRIMARY_COLOR,
                          ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
                        }}
                      >
                        -{plan.price} KC
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => onPurchase(plan)}
                  disabled={isProcessing}
                  style={{
                    minHeight: 72,
                    borderRadius: 30,
                    backgroundColor: PRIMARY_COLOR,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 18,
                  }}
                >
                  {isProcessing ? (
                    <MaterialIcons name="autorenew" size={24} color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 10 }}>
                      <Text
                        style={{
                          color: '#fff',
                          ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
                          textTransform: 'uppercase',
                          letterSpacing: 2,
                        }}
                      >
                        Subscribe Now
                      </Text>
                      <MaterialIcons name="bolt" size={20} color="#fff" />
                    </View>
                  )}
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}
    </Modal>
  );
};


type VideoProgressBarProps = {
  player: VideoPlayer;
  duration: number;
  isActive: boolean;
  overlayBottomInset: number;
};

const VideoProgressBar = React.memo<VideoProgressBarProps>(({
  player,
  duration,
  isActive,
  overlayBottomInset,
}) => {
  const timeUpdate: any = useEvent(player as any, 'timeUpdate', INITIAL_TIME_UPDATE);
  const [currentTime, setCurrentTime] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    player.timeUpdateEventInterval = isActive ? 0.5 : 0;
  }, [isActive, player]);

  useEffect(() => {
    if (isScrubbing) return;
    const nextTime = timeUpdate?.currentTime;
    if (typeof nextTime === 'number') {
      const normalizedTime = Math.max(0, nextTime);
      setCurrentTime((previousTime) => (
        previousTime === normalizedTime ? previousTime : normalizedTime
      ));
    }
  }, [isScrubbing, timeUpdate?.currentTime]);

  const clamp = useCallback((value: number, min: number, max: number) => (
    Math.min(Math.max(value, min), max)
  ), []);
  const effectiveDuration = duration > 0 ? duration : 1;
  const effectiveCurrentTime = isScrubbing ? scrubTime : currentTime;
  const progressRatio = clamp(effectiveCurrentTime / effectiveDuration, 0, 1);

  const updateScrubFromX = useCallback((x: number) => {
    if (sliderWidth <= 0) return 0;
    const ratio = clamp(x / sliderWidth, 0, 1);
    const nextTime = ratio * (duration > 0 ? duration : 0);
    setScrubTime(nextTime);
    return nextTime;
  }, [clamp, duration, sliderWidth]);

  const seekTo = useCallback((seconds: number) => {
    const target = clamp(seconds, 0, duration > 0 ? duration : 0);
    player.currentTime = target;
    setCurrentTime(target);
  }, [clamp, duration, player]);

  return (
    <View style={{
      width: SCREEN_WIDTH,
      position: 'absolute',
      bottom: -10 - overlayBottomInset,
      left: -10,
      right: -10,
    }}>
      <View
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          setSliderWidth((previousWidth) => (
            previousWidth === nextWidth ? previousWidth : nextWidth
          ));
        }}
        style={{ height: 24, justifyContent: 'center' }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          setIsScrubbing(true);
          updateScrubFromX(event.nativeEvent.locationX);
        }}
        onResponderMove={(event) => {
          updateScrubFromX(event.nativeEvent.locationX);
        }}
        onResponderRelease={(event) => {
          const target = updateScrubFromX(event.nativeEvent.locationX);
          seekTo(target);
          setIsScrubbing(false);
        }}
        onResponderTerminate={() => {
          setIsScrubbing(false);
        }}
      >
        <View style={{
          height: 2,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.28)',
          overflow: 'hidden',
        }}>
          <View style={{
            height: '100%',
            width: `${progressRatio * 100}%`,
            backgroundColor: '#ffffff40',
          }} />
        </View>
        <View style={{
          position: 'absolute',
          left: `${progressRatio * 100}%`,
          marginLeft: -4,
          width: 2,
          height: 2,
          borderRadius: 7,
          backgroundColor: '#ffffff40',
          borderWidth: 2,
          borderColor: '#ffffff40',
        }} />
      </View>
    </View>
  );
});

type VideoFeedItemProps = {
  item: FeedItem;
  isPlaying: boolean;
  onSubscribe: (item: FeedItem) => void;
  onFollow: (item: FeedItem) => void;
  onToggleLike: (item: FeedItem, liked: boolean) => void;
  onToggleBookmark: (item: FeedItem, bookmarked: boolean) => void;
  onRecordView: (item: FeedItem) => void;
  isGlobalMuted: boolean;
  isLive?: boolean;
  onToggleMute: () => void;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
  isCreatorViewer: boolean;
  overlayBottomInset?: number;
  railBottomInset?: number;
  onCaptionExpandedChange?: (expanded: boolean) => void;
  battleVoteAction?: {
    votes: string;
    voteCost: number;
    isVoted: boolean;
    isPending: boolean;
    onPress: () => void;
  };
};

const VideoFeedItemComponent: React.FC<VideoFeedItemProps> = ({
  item,
  onSubscribe,
  onFollow,
  onToggleLike,
  onToggleBookmark,
  onRecordView,
  isGlobalMuted,
  onToggleMute,
  isPlaying,
  isLive,
  coinBalance,
  onBalanceChange,
  isCreatorViewer,
  overlayBottomInset = 0,
  railBottomInset = 0,
  onCaptionExpandedChange,
  battleVoteAction,
}) => {
  // console.log("Viewport Height:", SCREEN_HEIGHT);
  // console.log("Viewport Width:", SCREEN_WIDTH);
  const navigation = useNavigation<any>();
  const createDuetDraft = useCreateCreatorVideoDuetDraft();
  const isFocused = useIsFocused();
  const [showComments, setShowComments] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [playVideo, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const { height: vh } = useWindowDimensions();
  const rotateValue = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playbackStateRef = useRef<boolean | null>(null);
  const muteStateRef = useRef<boolean | null>(null);
  const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lineNumber, setLineNumber] = useState(1);
  const [more, setMore] = useState(true);
  const captionExceedsThreshold = item.caption.trim().length > CAPTION_MORE_THRESHOLD;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    onCaptionExpandedChange?.(captionExceedsThreshold && !more);
  }, [captionExceedsThreshold, more, onCaptionExpandedChange]);

  const handleCreatorShareAction = async (actionId: string) => {
    if (actionId !== 'duet') return;
    if (!item.canDuet) {
      Alert.alert('Duet unavailable', 'This creator has not enabled duets for this video.');
      return;
    }

    try {
      const draft = await createDuetDraft.mutateAsync({ sourceVideo: item.id });
      setShowMoreMenu(false);
      navigation.navigate('RecordContent', {
        duetDraftId: draft.id,
        duetSourceVideoId: item.id,
        purpose: 'post_video',
      });
    } catch (error) {
      Alert.alert('Could not start duet', getApiErrorMessage(error));
    }
  };
  // const [videoSize, setVideoSize] = useState({ width: 0, height: 0 });

  const rotation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });




  

  const togglePlayPause = () => {
    // console.log("Video is tapped");
    // console.log("The value of more:", more);
    if(captionExceedsThreshold && !more){
      setMore(true);
      setLineNumber(1);
    }else{
      setIsPlaying((v) => !v)
    }
  };

  const handleVideoTap = () => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 250;

    if (isDoubleTap) {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      onToggleLike(item, nextLiked);
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
    singleTapTimeoutRef.current = setTimeout(() => {
      togglePlayPause();
      singleTapTimeoutRef.current = null;
    }, 250);
  };
  // const videoRef = React.useRef<VideoRef>(null);
  const configurePlayer = useCallback((p: any) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0;
  }, []);

  const player = useVideoPlayer(getVideoSource(item.video), configurePlayer);

  // const [currentPlayer, setCurrentPlayer] = useState(player);
  // const [videoDimensions, setVideoDimensions] = useState({
  //   width: 0,
  //   height: 0,
  // });

  const loadedMetadata = useEvent(player, 'sourceLoad');
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setIsLiked(item.isLiked);
  }, [item.isLiked]);


  // Extract dimensions once the video source loads
  const loadedTrack = loadedMetadata?.availableVideoTracks?.[0];
  const loadedWidth = loadedTrack?.size?.width ?? 0;
  const loadedHeight = loadedTrack?.size?.height ?? 0;
  const loadedDuration = typeof (loadedMetadata as any)?.duration === 'number'
    ? (loadedMetadata as any).duration
    : 0;

  React.useEffect(() => {
    if (loadedMetadata) {
      // console.log('sourceLoad payload:', JSON.stringify(loadedMetadata, null, 2));
      // console.log('video track:', JSON.stringify(loadedTrack, null, 2));
      // console.log('track size:', loadedTrack?.size);
      // console.log('possible rotation:', (loadedTrack as any)?.rotation);
      // console.log('possible orientation:', (loadedTrack as any)?.orientation);
    }

    if (loadedWidth > 0 && loadedHeight > 0) {
      const width = loadedWidth;
      const height = loadedHeight;
      setDimensions((prev) => (
        prev.width === width && prev.height === height ? prev : { width, height }
      ));
      // console.log(`This is the height : ${height} for the user ${item.handle} video with caption ${item.caption} and the video is portrait? ${isPortraitVideo}` )
      // console.log(`This is the width : ${width} for the user ${item.handle} video`)
    }

    if (typeof loadedDuration === 'number' && loadedDuration > 0) {
      setDuration((prev) => (prev === loadedDuration ? prev : loadedDuration));
    }
  }, [item.handle, loadedDuration, loadedMetadata, loadedTrack, loadedWidth, loadedHeight]);

    const isPortraitVideo =
    dimensions.width === 0 ||
    dimensions.height === 0 ||
    dimensions.height >= dimensions.width;

  useEffect(() => {
    if (!isPlaying) {
      rotateValue.stopAnimation();
      rotateValue.setValue(0);
      return;
    }

    const spinAnimation = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    spinAnimation.start();

    return () => {
      spinAnimation.stop();
      rotateValue.setValue(0);
    };
  }, [isPlaying, rotateValue]);

  useEffect(() => {
    return () => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
      }
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
    };
  }, []);
  // const replacePlayer = useCallback(async () => {
  //   currentPlayer.pause();
  //   if (currentPlayer === player) {
  //     setCurrentPlayer(nextPlayer);
  //     player.pause();
  //     nextPlayer.play();
  //   } else {
  //     setCurrentPlayer(player);
  //     nextPlayer.pause();
  //     player.play();
  //   }
  // }, [player, nextVideo]);
  // const sourceLoad = useEvent(player, 'sourceLoad');
  // useEffect(()=>{
  //   const tracks = sourceLoad?.availableVideoTracks;
  //   if (tracks && tracks.length > 0) {
  //     const { width, height } = tracks[0].size;
  //     console.log(`This is the height : ${height}`)
  //     console.log(`This is the width : ${width}`)
  //     // setVideoDimensions({ width, height });
  //   }
  // }, [sourceLoad])
  // useEffect(player, 'sourceLoad', () => {
  //   const tracks = event?.availableVideoTracks;

  // });

   useEffect(() => {
  if (!player) return;

  const shouldPlay = isFocused && isPlaying && playVideo === true;
  if (playbackStateRef.current === shouldPlay) return;

  playbackStateRef.current = shouldPlay;

  if (shouldPlay) {
    player.play();
  } else {
    player.pause();
  }
}, [isFocused, isPlaying, playVideo, player]);

useEffect(() => {
  if (viewTimerRef.current) {
    clearTimeout(viewTimerRef.current);
    viewTimerRef.current = null;
  }

  const shouldTrackView = isFocused && isPlaying && playVideo === true;
  if (!shouldTrackView) return;

  viewTimerRef.current = setTimeout(() => {
    onRecordView(item);
    viewTimerRef.current = null;
  }, 3000);

  return () => {
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }
  };
}, [isFocused, isPlaying, item, onRecordView, playVideo]);

useEffect(() => {
  if (muteStateRef.current === isGlobalMuted) return;
  muteStateRef.current = isGlobalMuted;
  player.muted = isGlobalMuted;
}, [isGlobalMuted, player]);

// const { buffering } = useEvent(player, 'bufferingChange', { buffering: true });
  const isVideoLoading = status !== 'readyToPlay' && status !== 'error';

  const viewConfigRef = React.useRef({
    viewAreaCoveragePercentThreshold: 80,
  });

  return (
    <View style={{ height: '100%', backgroundColor: 'black' }}>
      {/* Video */}
      <View style={{
        height: '100%',
        width: '100%',
        // backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center'
      }} >
        <VideoView
          player={player}
          nativeControls={false}
          contentFit={isPortraitVideo ? 'cover' : 'contain'}
          style={[{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }]}
          allowsPictureInPicture


        />
        {isVideoLoading && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.18)',
            }}
          >
            <DotTrioLoader />
          </View>
        )}
        <Pressable
        onPress={handleVideoTap}
        style={{
          backgroundColor: 'transparent',
          height: '100%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        >
          {!playVideo && (
            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 33,
                backgroundColor: primaryColorAlpha(0.24),
                borderWidth: 1,
                borderColor: primaryColorAlpha(0.5),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
            </View>
          )}
        </Pressable>
      </View>

      {overlayBottomInset > 0 || battleVoteAction ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(6,9,19,0)', 'rgba(6,9,19,0.22)', 'rgba(6,9,19,0.96)']}
          locations={[0, 0.46, 1]}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '46%',
          }}
        />
      ) : null}

      {/* Top mute button */}
      {/* <View style={{ position: 'absolute', top: 40, right: 16 }}>
        <Pressable onPress={onToggleMute}>
          <MaterialIcons name={isGlobalMuted ? 'volume-off' : 'volume-up'} size={28} color="white" />
        </Pressable>
      </View> */}

      {/* Right-side overlay buttons */}
      <View style={{
        position: 'absolute',
        right: 5,
        bottom: railBottomInset,
        alignItems: 'center',
        gap: battleVoteAction ? (Platform.OS === 'ios' ? 16 : 10) : 20,

      }}>
        <Pressable style={{}}>
          <LiveFeedCreatorAvatar
            avatar={item.avatar}
            isLive={Boolean(isLive)}
            showLiveBadge={Boolean(isLive && !item.isSubscribed)}
            showFollowBadge={!item.following}
            onFollow={() => onFollow(item)}
          />
        </Pressable>

        {/* {!item.isSubscribed && (
          <Pressable onPress={() => onSubscribe(item.id)} style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>Add</Text>
          </Pressable>
        )} */}

        <Pressable
        onPress={() => {
          const nextLiked = !isLiked;
          setIsLiked(nextLiked);
          onToggleLike(item, nextLiked);
        }}
        style={{
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
         }}
        >
          <MaterialIcons name='favorite' size={32} color={isLiked ? '#f43f5e' : 'white'} />
          <Text style={{
            color: 'white', 
            fontSize: fontSize.b3.fontSize -2,
            fontFamily: fontSize.b3.fontFamily,
            }}>{item.likes}</Text>
        </Pressable>

        <Pressable onPress={() => setShowComments(true)} style={{
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <CommentIcon height={32} width={32} fill="white" />
          <Text style={{
            color: 'white', 
            fontSize: fontSize.b3.fontSize -2,
            fontFamily: fontSize.b3.fontFamily,
            }}>{item.comments}</Text>
        </Pressable>

        {battleVoteAction ? (
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Pressable
              disabled={battleVoteAction.isPending}
              onPress={battleVoteAction.onPress}
              style={({ pressed }) => ({
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: battleVoteAction.isPending ? 0.6 : pressed ? 0.72 : 1,
              })}
            >
              {battleVoteAction.isPending ? (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              ) : (
                <MaterialIcons
                  name={battleVoteAction.isVoted ? 'check-circle' : 'how-to-vote'}
                  size={32}
                  color={battleVoteAction.isVoted ? PRIMARY_COLOR : '#ffffff'}
                />
              )}
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ ...fontSize.b5, color: '#ffffff' }}>{battleVoteAction.votes}</Text>
              <Text style={{ ...fontSize.b6, color: PRIMARY_COLOR }}>{battleVoteAction.voteCost} KC</Text>
            </View>
          </View>
        ) : null}

        {/* <Pressable onPress={() => navigation.navigate('ArtistProfile')} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <View style={{
            // borderRadius: 20,
            // width: 40,
            // height: 40,
            // borderColor: item.isSubscribed ? PRIMARY_COLOR : 'white',
            // borderWidth: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <View style={{
              // borderWidth: 2,
              // borderColor: item.isSubscribed ? PRIMARY_COLOR : 'white',
              // height: 24,
              // width: 24,
              // borderRadius: 12,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
              elevation: 4,
            }}>
              <MaterialIcons name="star" size={36} color={item.isSubscribed ? PRIMARY_COLOR : 'white'} />
            </View>
          </View>
          <Text style={{ color: item.isSubscribed ? PRIMARY_COLOR : 'white', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
            {item.isSubscribed ? 'SUBBED' : 'Sub'}
          </Text>
        </Pressable> */}

        <Pressable onPress={() => onToggleBookmark(item, !item.isBookmarked)} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="bookmark" size={30} color={item.isBookmarked ? PRIMARY_COLOR : 'white'} />
          <Text style={{ 
            color: 'white', 
            fontSize: fontSize.b3.fontSize -2,
            fontFamily: fontSize.b3.fontFamily,
            }}>{item.saves}</Text>
        </Pressable>

        <Pressable onPress={() => {}} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="share" size={28} color="white" />
          <Text style={{ 
            color: 'white', 
            fontSize: fontSize.b3.fontSize -2,
            fontFamily: fontSize.b3.fontFamily,
            }}>{item.bookmarks}</Text>
        </Pressable>

        <Pressable onPress={() => setShowMoreMenu(true)} style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 6,
          elevation: 4,
          alignItems: 'center' }}>
          <MaterialIcons name="more-horiz" size={30} color="white" />
          {/* <Text style={{ color: 'white', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>More</Text> */}
        </Pressable>

        <View style={
          {
            height: 0,
          }
        }></View>
      </View>

      {/* Bottom overlay: captions, ticket button */}
      <View style={{ position: 'absolute', bottom: overlayBottomInset, left: 5, right: 16, paddingBottom: 16, gap: 5 }}>
         <Pressable
         onPress={()=>{
          navigation.navigate('UseEffect');
         }}
         style={{
              backgroundColor: '#00000086',
              flexDirection: 'row',
              paddingHorizontal: 5,
              borderRadius: 5,
              gap: 3,
              paddingVertical:2,
              maxWidth: '85%',
              // minWidth: '50%',
              justifyContent: 'flex-start',
              alignItems: 'center',
              alignSelf: 'baseline',
              // marginBottom:5,
            }}>
              <SparkleIcon height={20} width={20} color='green'/>
            <Text
            numberOfLines={1}
            style={{
              ...fontSize.b2,
              color: '#ffffffcc',
              lineHeight: fontSize.b2.lineHeight,
              // 
            }}>
              Style {" • "}{" Kulsah"}
            </Text>
            </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
          onPress={() => navigation.navigate('ArtistProfile', {
            isOwner: false,
            id: item.creatorId ?? item.handle,
            creatorId: item.creatorId,
            name: item.artist,
            handle: item.handle,
            avatar: item.avatar,
          })}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              // backgroundColor: 'blue',

            }}>
              <View style={{
                // backgroundColor: 'red',
                maxWidth: SCREEN_WIDTH * 0.3
              }}>
                <Text
              numberOfLines={1}
              style={{
                ...fontSize.b0,
                color: 'white',
                }}>@{item.handle}</Text>
              </View>
              <View style={{
                // backgroundColor: 'red',
                marginTop: 3
              }}>
                <MaterialIcons name="verified" size={16} color='#33aae4'/>
              </View>
            </View>
          </Pressable>
          {item.isPremium && (
            // <View style={{ borderRadius: 6,  borderWidth: 1, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 3, borderColor: 'white' }}>
            //   <Text style={{ color: '#fff', fontWeight: 'bold', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }}>Premium</Text>
            // </View>
            <Premium height={20} width={20}/>
          )}
          <Pressable
            onPress={() => {
              if (!item.isSubscribed) {
                onSubscribe(item);
              }
            }}
            style={{
              borderRadius: 6,
              borderWidth: 1,
              paddingHorizontal: 6,
              justifyContent: 'center',
              alignItems: 'center',
              borderColor: item.isSubscribed ? 'red' : PRIMARY_COLOR,
              backgroundColor: item.isSubscribed ? 'red' : PRIMARY_COLOR,
              paddingVertical: 3,
            }}
          >
            <Text style={{fontSize: fontSize.b3.fontSize - 3, fontFamily: 'Inter_600SemiBold',  color: '#fff',  }}>
              {item.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </Pressable>
        </View>

        <View style={{
          width: '95%',
          flexDirection: 'row',
          gap: 5,
        }}>
          <View style={{
            width: lineNumber > 1 ? '85%':'70%',
          }}>
            <Text
          numberOfLines={lineNumber}
          style={{
            color: 'white', 
            marginTop: 4, 
            ...(item.isCreatorBattle ? {
              ...fontSize.reactionB4,
              lineHeight: fontSize.reactionB4.lineHeight,
              textTransform: 'uppercase' as const,
              letterSpacing: 0.8,
            } : fontSize.b3),
            }}>
          {item.caption}
        </Text>
          </View>
        {captionExceedsThreshold && more && <Pressable
        onPress={()=>{
          setLineNumber(99);
          setMore(false);
        }}
        >
          <Text style={{
            color: 'white', marginTop: 4, 
          }}>
          more
          </Text></Pressable>}
        </View>

        <View
        style={{
          flexDirection: 'row',
          marginTop: 10,
          alignItems: 'center',
        }}>
          <View style={{
            height: 20,
            width: 20,
            alignItems: 'center',
            justifyContent: 'center',
            // backgroundColor: '#ffffff1a',
            backgroundColor: '#00000054',
            borderColor: '#ffffff1a',
            borderWidth: 1,
            borderRadius: 4,
          }}>
            <Animated.View style={{
              transform: [{ rotate: rotation }]
            }}>
              <MaterialIcons name="music-note" color='#ffffffcc'/>
            </Animated.View>
          </View>
          <Pressable
          onPress={()=>{
            navigation.navigate('UseSound')
          }}
           style={{
            flexDirection: 'row',
            // backgroundColor: 'red',
            width: '45%',
            marginRight: 15,
          }}>
            <Text
          numberOfLines={1}
          style={{
            color: '#ffffffcc',
            fontSize: fontSize.b3.fontSize-2,
            fontFamily: fontSize.b3.fontFamily,
           
          }}>
            {"  "}{item.originalSound ? "Original Sound" : item.soundTitle}
          </Text>
          <Text style={{
            color: '#ffffffcc',
            fontSize: fontSize.b3.fontSize-2,
            fontFamily: fontSize.b3.fontFamily,
          }}>
            {" • "}{item.originalSound ? item.artist : item.soundArtist}
          </Text>
          </Pressable>



        </View>

        {item.ticketsAvailable && (
          <Pressable
            onPress={()=>{
              navigation.navigate('EventDetail')
            }}
            style={{
              marginTop: 10,
              backgroundColor: '#22c55e',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 20,
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center'
             }}
            // onPress={() => navigation.navigate('Video')}
          >
            <TickIcon height={18} width={18}/>
            <Text style={{
              color: 'black',
              fontSize: fontSize.b3.fontSize-3, 
              fontFamily: fontSize.b3.fontFamily,
              textTransform: 'uppercase' }}>  Tickets • {item.ticketLocation}</Text>
          </Pressable>
        )}

        {item.isChallenge ? (
          <Pressable
            onPress={() => navigation.navigate('ChallengeEntry')}
            style={{
              marginTop: 10,
              width: '80%',
              minHeight: 40,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: PRIMARY_COLOR,
              borderWidth: 1,
              borderColor: primaryColorAlpha(0.32),
            }}
          >
            <Text style={{
              color: '#ffffff',
              ...fontSize.b5,
              lineHeight: fontSize.b5.lineHeight,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}>
              Join Challenge
            </Text>
          </Pressable>
        ) : null}

        <VideoProgressBar
          player={player}
          duration={duration}
          isActive={isFocused && isPlaying && playVideo}
          overlayBottomInset={overlayBottomInset}
        />

        {/* <Text style={{ color: '#cbd5e1', marginTop: 6, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight }}>{isPlaying ? 'Playing' : 'Paused'} preview</Text> */}
      </View>

      {/* Comments modal */}
      <Modal
        visible={showComments}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <Reactions
          onClose={() => setShowComments(false)}
          videoId={item.id}
          title={`${item.comments} Reactions`}
          currentBalance={coinBalance}
          onBalanceChange={onBalanceChange}
        />
      </Modal>

      {isCreatorViewer ? (
        <CreatorShareSheet
          visible={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
          onAction={handleCreatorShareAction}
          disabledActions={item.canDuet ? [] : ['duet']}
        />
      ) : (
        <FeedQuickMenuModal
          visible={showMoreMenu}
          onClose={() => setShowMoreMenu(false)}
        />
      )}
    </View>
  );
};

export const VideoFeedItem = React.memo(VideoFeedItemComponent);

const FeedVideoPoster = React.memo<{
  item: FeedItem;
  height: number;
}>(({ item, height }) => (
  <View pointerEvents="none" style={{ width: '100%', height, backgroundColor: '#000' }}>
    {item.background ? (
      <Image source={{ uri: item.background }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    ) : null}
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
  </View>
));

type FeedBattleRowProps = {
  battle: ChallengeListResource;
  height: number;
  topInset: number;
  isActive: boolean;
  onOpenBattle: (challengeId: string) => void;
  onSubscribe: VideoFeedItemProps['onSubscribe'];
  onFollow: VideoFeedItemProps['onFollow'];
  onToggleLike: VideoFeedItemProps['onToggleLike'];
  onToggleBookmark: VideoFeedItemProps['onToggleBookmark'];
  onRecordView: VideoFeedItemProps['onRecordView'];
  isGlobalMuted: boolean;
  onToggleMute: () => void;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
  isCreatorViewer: boolean;
};

const FeedBattleRow = React.memo<FeedBattleRowProps>(({
  battle,
  height,
  topInset,
  isActive,
  onOpenBattle,
  onSubscribe,
  onFollow,
  onToggleLike,
  onToggleBookmark,
  onRecordView,
  isGlobalMuted,
  onToggleMute,
  coinBalance,
  onBalanceChange,
  isCreatorViewer,
}) => (
  <View style={{ height, backgroundColor: '#000' }}>
    <CreatorBattleParticipantPager
      battle={battle}
      height={height}
      topInset={topInset}
      isActive={isActive}
      onOpenBattle={onOpenBattle}
      onSubscribe={onSubscribe}
      onFollow={onFollow}
      onToggleLike={onToggleLike}
      onToggleBookmark={onToggleBookmark}
      onRecordView={onRecordView}
      isGlobalMuted={isGlobalMuted}
      onToggleMute={onToggleMute}
      coinBalance={coinBalance}
      onBalanceChange={onBalanceChange}
      isCreatorViewer={isCreatorViewer}
    />
  </View>
), (prev, next) => (
  prev.battle === next.battle
  && prev.height === next.height
  && prev.topInset === next.topInset
  && prev.isActive === next.isActive
  && prev.isCreatorViewer === next.isCreatorViewer
  && (!next.isActive || (
    prev.isGlobalMuted === next.isGlobalMuted
    && prev.coinBalance === next.coinBalance
  ))
));

type FeedVideoRowProps = {
  item: FeedItem;
  height: number;
  isActive: boolean;
  onSubscribe: VideoFeedItemProps['onSubscribe'];
  onFollow: VideoFeedItemProps['onFollow'];
  onToggleLike: VideoFeedItemProps['onToggleLike'];
  onToggleBookmark: VideoFeedItemProps['onToggleBookmark'];
  onRecordView: VideoFeedItemProps['onRecordView'];
  isGlobalMuted: boolean;
  onToggleMute: () => void;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
  isCreatorViewer: boolean;
};

const FeedVideoRow = React.memo<FeedVideoRowProps>(({
  item,
  height,
  isActive,
  onSubscribe,
  onFollow,
  onToggleLike,
  onToggleBookmark,
  onRecordView,
  isGlobalMuted,
  onToggleMute,
  coinBalance,
  onBalanceChange,
  isCreatorViewer,
}) => (
  <View style={{ height, backgroundColor: 'black' }}>
    <ErrorBoundary
      fallback={
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'black' }}>
          <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textAlign: 'center' }}>
            This post could not be loaded
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            Swipe to continue browsing the feed.
          </Text>
        </View>
      }
    >
      {isActive ? (
        <VideoFeedItem
          item={item}
          isPlaying
          onSubscribe={onSubscribe}
          onFollow={onFollow}
          onToggleLike={onToggleLike}
          onToggleBookmark={onToggleBookmark}
          onRecordView={onRecordView}
          isGlobalMuted={isGlobalMuted}
          onToggleMute={onToggleMute}
          isLive={item.isLive}
          coinBalance={coinBalance}
          onBalanceChange={onBalanceChange}
          isCreatorViewer={isCreatorViewer}
        />
      ) : (
        <FeedVideoPoster item={item} height={height} />
      )}
    </ErrorBoundary>
  </View>
), (prev, next) => (
  prev.item === next.item
  && prev.height === next.height
  && prev.isActive === next.isActive
  && prev.isCreatorViewer === next.isCreatorViewer
  && (!next.isActive || (
    prev.isGlobalMuted === next.isGlobalMuted
    && prev.coinBalance === next.coinBalance
  ))
));

type CreatorBattleStatusHeaderProps = {
  title: string;
  topInset: number;
  votingStatus?: string;
  votingEndsAt?: string | null;
  fallbackSeconds?: number | null;
  dataUpdatedAt: number;
  isActive: boolean;
  onOpen: () => void;
};

const CreatorBattleStatusHeader = React.memo<CreatorBattleStatusHeaderProps>(({
  title,
  topInset,
  votingStatus,
  votingEndsAt,
  fallbackSeconds,
  dataUpdatedAt,
  isActive,
  onOpen,
}) => {
  const [clockNow, setClockNow] = useState(Date.now());

  useEffect(() => {
    if (!isActive) return;
    setClockNow(Date.now());
    const timer = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  const parsedVotingEnd = votingEndsAt ? Date.parse(votingEndsAt) : Number.NaN;
  const remainingSeconds = Number.isFinite(parsedVotingEnd)
    ? Math.max(0, Math.floor((parsedVotingEnd - clockNow) / 1000))
    : fallbackSeconds == null
      ? null
      : Math.max(0, fallbackSeconds - Math.floor((clockNow - dataUpdatedAt) / 1000));
  const countdown = formatBattleCountdown(remainingSeconds);
  const votingIsOpen = votingStatus === 'open';
  const votingLabel = votingIsOpen
    ? 'Live voting'
    : votingStatus === 'upcoming'
      ? 'Voting soon'
      : 'Voting closed';

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: topInset + 18,
        left: 12,
        right: 12,
        zIndex: 45,
        alignItems: 'center',
      }}
    >
      {/* <Pressable onPress={onOpen} style={{ alignItems: 'center', maxWidth: '72%' }}>
        <Text
          numberOfLines={1}
          style={{ ...fontSize.n3, color: '#ffffff', textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 8 }}
        >
          {title}
        </Text>
      </Pressable> */}

      <View
        style={{
          minHeight: 28,
          // marginTop: 8,
          borderRadius: 999,
          paddingHorizontal: 13,
          paddingVertical: 4,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.58)',
        }}
      >
        <View style={{ width: 7, height: 7, borderRadius: 4, marginRight: 7, backgroundColor: votingIsOpen ? PRIMARY_COLOR : '#94a3b8' }} />
        <Text style={{ ...fontSize.b2, color: votingIsOpen ? PRIMARY_COLOR : '#cbd5e1' }}>{votingLabel}</Text>
        {countdown ? (
          <>
            <View style={{ width: 1, height: 18, marginHorizontal: 10, backgroundColor: 'rgba(255,255,255,0.24)' }} />
            <Text style={{ ...fontSize.b2, color: '#ffffff', fontVariant: ['tabular-nums'] }}>{countdown}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
});

type CreatorBattleParticipantPagerProps = {
  battle: ChallengeListResource;
  height: number;
  topInset: number;
  isActive: boolean;
  onOpenBattle: (challengeId: string) => void;
  onSubscribe: VideoFeedItemProps['onSubscribe'];
  onFollow: VideoFeedItemProps['onFollow'];
  onToggleLike: VideoFeedItemProps['onToggleLike'];
  onToggleBookmark: VideoFeedItemProps['onToggleBookmark'];
  onRecordView: VideoFeedItemProps['onRecordView'];
  isGlobalMuted: boolean;
  onToggleMute: () => void;
  coinBalance: number;
  onBalanceChange: (nextBalance: number) => void;
  isCreatorViewer: boolean;
};

const CreatorBattlePoster = React.memo<{
  battle: ChallengeListResource;
  height: number;
}>(({ battle, height }) => (
  <View pointerEvents="none" style={{ width: '100%', height, backgroundColor: '#060913' }}>
    {battle.image ? (
      <Image source={{ uri: battle.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
    ) : null}
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(6,9,19,0.28)' }]} />
  </View>
));

const CreatorBattleParticipantPager = React.memo<CreatorBattleParticipantPagerProps>(
  ({
  battle,
  height,
  topInset,
  isActive,
  onOpenBattle,
  onSubscribe,
  onFollow,
  onToggleLike,
  onToggleBookmark,
  onRecordView,
  isGlobalMuted,
  onToggleMute,
  coinBalance,
  onBalanceChange,
  isCreatorViewer,
}) => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const challengeQuery = useChallenge(battle.id, isActive);
  const walletQuery = useKulCoinWallet(isActive);
  const castBallot = useCastChallengeBallot();
  const [activeParticipantIndex, setActiveParticipantIndex] = useState(0);
  const [isActiveCaptionExpanded, setIsActiveCaptionExpanded] = useState(false);
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const participants = useMemo(
    () => creatorBattleVideoParticipants(challengeQuery.data),
    [challengeQuery.data],
  );
  const participantItems = useMemo<FeedItem[]>(() => participants.map((participant) => {
    const entry = participant.entry!;
    const video = entry.video!;
    const creatorName = participant.creator?.name || participant.creator?.username || 'Challenge Creator';
    const creatorHandle = participant.creator?.username
      || creatorName.toLowerCase().replace(/\s+/g, '.');
    const thumbnail = video.thumbnail_url || battle.image || '';

    return {
      id: String(video.id),
      creatorId: String(participant.creator.id),
      artist: creatorName,
      handle: creatorHandle,
      avatar: participant.creator?.avatar || thumbnail,
      caption: challengeQuery.data?.title || battle.title,
      background: thumbnail,
      video: video.stream_url!,
      likes: formatFeedCount(Number(participant.likes ?? entry.engagement?.likes) || 0),
      comments: formatFeedCount(Number(participant.comments ?? entry.comments_count ?? entry.engagement?.comments) || 0),
      isLiked: false,
      isSubscribed: false,
      isPremium: false,
      isChallenge: false,
      isCreatorBattle: true,
      allowDuet: false,
      isDuet: false,
      canDuet: false,
      ticketsAvailable: false,
      originalSound: Boolean(entry.audio?.is_original),
      soundArtist: entry.audio?.artist || creatorName,
      soundTitle: entry.audio?.title || (entry.audio?.is_original ? 'Original Sound' : battle.title),
      following: false,
      isBookmarked: false,
      bookmarks: '0',
      saves: '0',
    };
  }), [battle.image, battle.title, challengeQuery.data?.title, participants]);

  useEffect(() => {
    setActiveParticipantIndex((current) => Math.min(current, Math.max(0, participantItems.length - 1)));
  }, [participantItems.length]);

  useEffect(() => {
    setIsActiveCaptionExpanded(false);
  }, [activeParticipantIndex]);

  const currentParticipant = participants[activeParticipantIndex];
  const detail = challengeQuery.data;
  const creatorName = currentParticipant?.creator?.name
    || currentParticipant?.creator?.username
    || 'Creator';
  const voteCost = detail?.pricing?.voting?.vote_cost_per_choice ?? 10;
  const walletBalance = walletQuery.data?.total_kc ?? coinBalance;
  const votingStatus = detail?.voting?.status;
  const votingIsOpen = votingStatus === 'open';
  const canVote = votingIsOpen
    && Boolean(currentParticipant?.entry?.id)
    && (detail?.current_user?.can_vote ?? detail?.can_vote ?? true);
  const votingEndsAt = detail?.voting?.ends_at
    || detail?.schedule?.voting_ends_at
    || detail?.schedule?.submission_ends_at
    || battle.deadline;

  const handleVotePress = useCallback(() => {
    if (!votingIsOpen) {
      Alert.alert('Voting unavailable', votingStatus === 'upcoming'
        ? 'Voting for this creator battle has not started yet.'
        : 'Voting for this creator battle is closed.');
      return;
    }

    if (!canVote) {
      Alert.alert('Vote unavailable', 'You cannot vote in this creator battle right now.');
      return;
    }

    setShowVoteDialog(true);
  }, [canVote, votingIsOpen, votingStatus]);

  const handleConfirmVote = async () => {
    const entryId = currentParticipant?.entry?.id;
    if (!entryId || castBallot.isPending) return;

    if (walletBalance < voteCost) {
      setShowVoteDialog(false);
      navigation.navigate('TopUpCoins');
      return;
    }

    try {
      await castBallot.mutateAsync({
        challenge: battle.id,
        payload: {
          choices: [{ challenge_entry_id: entryId }],
          idempotency_key: `challenge-${battle.id}-entry-${entryId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      });
      setShowVoteDialog(false);
      const refreshedWallet = await walletQuery.refetch();
      if (refreshedWallet.data?.total_kc != null) {
        onBalanceChange(refreshedWallet.data.total_kc);
      }
      await challengeQuery.refetch();
    } catch (error) {
      Alert.alert('Vote not submitted', getApiErrorMessage(error));
    }
  };

  const handleOpenBattle = useCallback(() => {
    onOpenBattle(String(battle.id));
  }, [battle.id, onOpenBattle]);

  const handleViewVotes = useCallback(() => {
    navigation.navigate('ChallengeLeaderboard', { challengeId: battle.id });
  }, [battle.id, navigation]);

  const handleCaptionExpandedChange = useCallback((expanded: boolean) => {
    setIsActiveCaptionExpanded(expanded);
  }, []);

  const participantKeyExtractor = useCallback((item: FeedItem, index: number) => (
    `${battle.id}-participant-${participants[index]?.id ?? item.creatorId ?? item.id}-${index}`
  ), [battle.id, participants]);

  const participantItemLayout = useCallback((_: ArrayLike<FeedItem> | null | undefined, index: number) => ({
    length: width,
    offset: width * index,
    index,
  }), [width]);

  const handleParticipantMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveParticipantIndex(Math.max(0, Math.min(nextIndex, participantItems.length - 1)));
  }, [participantItems.length, width]);

  const renderParticipant = useCallback(({ item, index }: { item: FeedItem; index: number }) => {
    const participant = participants[index];
    const isVisibleParticipant = isActive && index === activeParticipantIndex;
    const isVoted = String(detail?.current_user?.voted_entry_id ?? '')
      === String(participant?.entry?.id ?? '');

    return (
      <View style={{ width, height }}>
        <VideoFeedItem
          item={item}
          isPlaying={isVisibleParticipant}
          onSubscribe={onSubscribe}
          onFollow={onFollow}
          onToggleLike={onToggleLike}
          onToggleBookmark={onToggleBookmark}
          onRecordView={onRecordView}
          isGlobalMuted={isGlobalMuted}
          onToggleMute={onToggleMute}
          coinBalance={coinBalance}
          onBalanceChange={onBalanceChange}
          isCreatorViewer={isCreatorViewer}
          railBottomInset={CREATOR_BATTLE_RAIL_INSET}
          onCaptionExpandedChange={index === activeParticipantIndex ? handleCaptionExpandedChange : undefined}
          battleVoteAction={{
            votes: formatFeedCount(Number(participant?.votes?.count) || 0),
            voteCost,
            isVoted,
            isPending: castBallot.isPending && index === activeParticipantIndex,
            onPress: handleVotePress,
          }}
        />
      </View>
    );
  }, [
    activeParticipantIndex,
    castBallot.isPending,
    coinBalance,
    detail?.current_user?.voted_entry_id,
    handleCaptionExpandedChange,
    handleVotePress,
    height,
    isActive,
    isCreatorViewer,
    isGlobalMuted,
    onBalanceChange,
    onFollow,
    onRecordView,
    onSubscribe,
    onToggleBookmark,
    onToggleLike,
    onToggleMute,
    participants,
    voteCost,
    width,
  ]);

  // Keep a battle's loaded players mounted while it remains in the outer
  // FlatList window. Swapping the VideoView for a poster as soon as viewability
  // changes can release Expo's native SharedObject before the native view has
  // finished detaching. Unseen battles still render a cheap poster until their
  // detail has been loaded for the first time.
  if (!isActive && !challengeQuery.data) {
    return <CreatorBattlePoster battle={battle} height={height} />;
  }

  if (challengeQuery.isLoading) {
    return (
      <View style={{ width, height, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={{ ...fontSize.b4, color: '#94a3b8', marginTop: 12 }}>Loading battle videos...</Text>
      </View>
    );
  }

  if (participantItems.length === 0) {
    return (
      <View style={{ width, height, backgroundColor: '#030712', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        {battle.image ? <Image source={{ uri: battle.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(3,7,18,0.82)' }]} />
        <MaterialIcons name="hourglass-empty" size={42} color={PRIMARY_COLOR} />
        <Text style={{ ...fontSize.n3, color: '#fff', textAlign: 'center', marginTop: 14 }}>{battle.title}</Text>
        <Text style={{ ...fontSize.b4, color: '#cbd5e1', textAlign: 'center', marginTop: 8 }}>
          Participant videos have not been submitted yet.
        </Text>
        <Pressable onPress={handleOpenBattle} style={{ marginTop: 18, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: PRIMARY_COLOR }}>
          <Text style={{ ...fontSize.b4, color: '#fff', fontFamily: 'Inter_700Bold' }}>View battle</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ width, height, backgroundColor: '#000' }}>
      <FlatList
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        data={participantItems}
        keyExtractor={participantKeyExtractor}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={participantItemLayout}
        onMomentumScrollEnd={handleParticipantMomentumEnd}
        renderItem={renderParticipant}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        updateCellsBatchingPeriod={80}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      <CreatorBattleStatusHeader
        title={detail?.title || battle.title}
        topInset={topInset}
        votingStatus={votingStatus}
        votingEndsAt={votingEndsAt}
        fallbackSeconds={detail?.time_remaining_seconds}
        dataUpdatedAt={challengeQuery.dataUpdatedAt}
        isActive={isActive}
        onOpen={handleOpenBattle}
      />

      {participantItems.length > 1 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: isActiveCaptionExpanded ? 196 : 142,
            left: 64,
            right: 64,
            zIndex: 44,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            {participantItems.map((item, index) => (
              <View
                key={`${battle.id}-swipe-position-${participants[index]?.id ?? item.creatorId ?? item.id}-${index}`}
                style={{
                  width: index === activeParticipantIndex ? 9 : 7,
                  height: index === activeParticipantIndex ? 9 : 7,
                  borderRadius: 5,
                  borderWidth: index === activeParticipantIndex ? 0 : 1.25,
                  borderColor: 'rgba(255,255,255,0.82)',
                  backgroundColor: index === activeParticipantIndex ? PRIMARY_COLOR : 'transparent',
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <MaterialIcons name="chevron-left" size={14} color="rgba(255,255,255,0.68)" />
            <Text style={{ ...fontSize.b6, color: 'rgba(255,255,255,0.72)', textShadowColor: '#000', textShadowRadius: 4 }}>
              Swipe creators
            </Text>
            <MaterialIcons name="chevron-right" size={14} color="rgba(255,255,255,0.68)" />
          </View>
        </View>
      ) : null}

      <Pressable
        onPress={handleViewVotes}
        accessibilityRole="button"
        accessibilityLabel="View battle leaderboard"
        style={({ pressed }) => ({
          position: 'absolute',
          top: topInset + 10,
          right: 14,
          zIndex: 48,
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.26)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.12)',
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <MaterialIcons name="leaderboard" size={22} color="#ffffff" />
      </Pressable>

      <Modal
        visible={showVoteDialog}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setShowVoteDialog(false)}
      >
        <VoteModalContent
          sheetMode
          onClose={() => setShowVoteDialog(false)}
          onConfirm={handleConfirmVote}
          challengeTitle={detail?.title || battle.title}
          creatorName={creatorName}
          walletBalance={walletBalance}
          voteCost={voteCost}
          isSubmitting={castBallot.isPending}
        />
      </Modal>
    </View>
  );
});

const Feed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const isFeedFocused = useIsFocused();
  const [activeTab, setActiveTab] = useState<'premium' | 'foryou' | 'following' >('foryou');
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const swipeHandledRef = useRef(false);
  const feedListRef = useRef<FlatList<FeedRow> | null>(null);
  const lastShakeRefreshRef = useRef(0);
  const lastShakeForceRef = useRef(1);
  const followToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battlePrefetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets= useSafeAreaInsets();
  const feedItemHeight = FEED_ITEM_HEIGHT - (Platform.OS === 'ios' ? 0 : insets.bottom);
  const [feedViewportHeight, setFeedViewportHeight] = useState(0);
  const [items, setItems] = useState<FeedItem[]>([
    // {
    //   id: '86',
    //   artist: 'drop',
    //   handle: 'gibson',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790948/K50526_sfmxi0.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   // ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   isLive: true,
    // },
    // {
    //   id: '83',
    //   artist: 'Kulsah Headquarters',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779794760/kulsah_sing_vgqxne.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   t  const [items, setItems] = useState<FeedItem[]>([
    // {
    //   id: '86',
    //   artist: 'drop',
    //   handle: 'gibson',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790948/K50526_sfmxi0.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   // ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   isLive: true,
    // },
    // {
    //   id: '83',
    //   artist: 'Kulsah Headquarters',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779794760/kulsah_sing_vgqxne.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Rollex Bills',
    //   soundTitle: 'Kulsah Theme',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    //  {
    //   id: '84',
    //   artist: 'Kulsah Headquarters',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779791753/0526k_293_jg9442.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Rollex Bills',
    //   soundTitle: 'Kulsah Theme',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '79',
    //   artist: 'Kulsah Landscape',
    //   handle: 'Kulsah_landscape',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790082/k434_live_qaebmy.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '78',
    //   artist: 'Kulsah Landscape',
    //   handle: 'Kulsah_landscape',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790256/K53234_snaapi.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: false,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '85',
    //   artist: 'Kulsah Landscape',
    //   handle: 'Kulsah_landscape',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790223/K12242_wmlewi.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '80',
    //   artist: 'Kulsah Alpha',
    //   handle: 'Kulsah_alpha',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779790193/K0526_ocu8xt.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '10',
    //   artist: 'Big Things',
    //   handle: 'big_t',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779791584/0526_KLIVE_hwldte.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '6',
    //   artist: 'Sarkodie',
    //   handle: 'sarkodie',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779795517/dance_cha_001_p1flkl.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '15',
    //   artist: 'Elena Rose',
    //   handle: 'elena_rose',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dh0dywpzm/video/upload/v1779795719/dance-0000_fumuie.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '1',
    //   artist: 'Okenneth',
    //   handle: 'o_kenneth',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090888/IMG_2292_quwrue.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '4',
    //   artist: 'Shatta Wale',
    //   handle: 'sm_movement',
    //   avatar: 'https://picsum.photos/seed/mthorne/150/150',
    //   caption: "SUBSCRIBER REHEARSAL: Early draft of the winter tour set. Gold Tier circle, let's vibe.",
    //   background: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090886/IMG_2290_pqm8im.mp4',
    //   likes: '450K',
    //   comments: '12.2K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   isLive: true,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '2',
    //   artist: 'Shatta Wale',
    //   handle: 'sm_movement',
    //   avatar: 'https://picsum.photos/seed/zion/150/150',
    //   caption: 'Live from the main stage! This crowd is unmatched. #Kulsah #LiveMusic #Afrobeats',
    //   background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776090870/IMG_2289_hdsiis.mp4',
    //   likes: '1.2M',
    //   comments: '45.8K',
    //   isLiked: true,
    //   isSubscribed: false,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '5',
    //   artist: 'Sarah Chen',
    //   handle: 'schen_music',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093916/IMG_2294_nu53zb.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '8',
    //   artist: 'Gabriel Music',
    //   handle: 'gabbeat',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093923/IMG_2295_lplsoq.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '20',
    //   artist: 'Kulsah',
    //   handle: 'kulsah_development',
    //   avatar: 'https://picsum.photos/seed/sarah/150/150',
    //   caption: "VIP MASTERCLASS: Layering vocal chains for the 'Galaxy' sound. #ProducerLife #PremiumContent",
    //   background: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776094013/IMG_2296_gz8efi.mp4',
    //   likes: '89K',
    //   comments: '4.5K',
    //   isLiked: true,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '3',
    //   artist: 'Amara',
    //   handle: 'amara_official',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776093939/IMG_2297_aqcyf2.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '11',
    //   artist: 'Bill',
    //   handle: 'bill_official',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/Kulsah+videos/kul+poll200.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '9',
    //   artist: 'Godfred',
    //   handle: 'Godfred_Kofi',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1776094108/kul_video_podcast_sd2qei.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '12',
    //   artist: 'Godfred',
    //   handle: 'Godfred_Kofi',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+11.10.25+AM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '97',
    //   artist: 'louis',
    //   handle: 'louis_artist',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+11.58.23+AM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '96',
    //   artist: 'prin_cella',
    //   handle: 'cella_music',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.55.09+PM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound:true,
    // },
    // {
    //   id: '13',
    //   artist: 'Gabriel',
    //   handle: 'Prince',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: true,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '14',
    //   artist: 'Prince Gabriel',
    //   handle: 'Prince_Gabriel',
    //   avatar: 'https://picsum.photos/seed/amara/150/150',
    //   caption: 'EXCLUSIVE: Late night neon dance rehearsal. The tour visuals are finally ready for my subscribers.',
    //   background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://dozi-chat-s3.s3.us-east-1.amazonaws.com/kul/WhatsApp+Video+2026-03-18+at+12.55.44+PM.mp4',
    //   likes: '890K',
    //   comments: '12.4K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: false,
    //   ticketsAvailable: false,
    //   following: false,
    // },
    // {
    //   id: '99',
    //   artist: 'shpirit',
    //   handle: 'minister_spirit',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.56.01+PM.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '95',
    //   artist: 'kulsah',
    //   handle: 'kulsah_hq',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'http://us-east-1.console.aws.amazon.com/s3/object/dozi-chat-s3?region=us-east-1&prefix=kul/WhatsApp+Video+2026-03-18+at+12.56.16+PM.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '94',
    //   artist: 'bliss',
    //   handle: 'bliss_k',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809866/IMG_2157_jhxsl5.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '93',
    //   artist: 'lynx',
    //   handle: 'lynx_music',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809856/IMG_2155_uv5gqu.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Bill',
    //   soundTitle: 'Bills Beat',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '92',
    //   artist: 'Annu',
    //   handle: 'Annu_naki',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809849/WhatsApp_Video_2026-04-09_at_5.16.37_PM_oibjkk.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   // ticketLocation: 'London, UK',
    //   // originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    //   originalSound: true,
    // },
    // {
    //   id: '91',
    //   artist: 'cypher',
    //   handle: 'cypher_t',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809848/IMG_2158_arvxda.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '90',
    //   artist: 'flatEarth',
    //   handle: 'earth_is_flat',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809831/IMG_2160_i4yqd9.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: false,
    //   soundArtist: 'Synthwave Kid',
    //   soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '89',
    //   artist: 'Gothic',
    //   handle: 'gothic_g',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809824/IMG_2161_lphffv.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '88',
    //   artist: 'bliss',
    //   handle: 'bliss_k',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809866/IMG_2157_jhxsl5.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
    // {
    //   id: '87',
    //   artist: 'burner',
    //   handle: 'mic_burner',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775809820/IMG_2159_1_lhwqgo.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: false,
    //   // ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },

    // {
    //   id: '85',
    //   artist: 'nasa',
    //   handle: 'nasa_isL',
    //   avatar: 'https://picsum.photos/seed/elena/150/150',
    //   caption: "PRIVATE DROP: Working on 'Nebula' vocal layers. This is the raw studio session for my supporters only. #BTS #KulsahExclusive",
    //   background: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    //   video: 'https://res.cloudinary.com/dmznckja5/video/upload/v1775810765/Download_49_kumjek.mp4',
    //   likes: '2.4M',
    //   comments: '88.1K',
    //   isLiked: false,
    //   isSubscribed: true,
    //   isPremium: true,
    //   ticketsAvailable: true,
    //   ticketLocation: 'London, UK',
    //   originalSound: true,
    //   // soundArtist: 'Synthwave Kid',
    //   // soundTitle: 'Neon Dreams',
    //   following: false,
    //   bookmarks: '2.5k',
    //   saves: '2.5k',
    // },
  ]);
  const displayedItems = useMemo(() => {
    if (activeTab === 'following') return items.filter((item) => item.following);
    if (activeTab === 'premium') return items.filter((item) => item.isPremium);
    return items;
  }, [activeTab, items]);

  const emptyFeedState = useMemo(() => {
    if (activeTab === 'following') {
      return {
        title: 'No Following Videos Yet',
        message: 'Follow creators to collect their latest transmissions here.',
        action: 'Discover Creators',
      };
    }

    if (activeTab === 'premium') {
      return {
        title: 'No Premium Videos Yet',
        message: 'Premium drops from creators will appear here when they are available.',
        action: 'Explore For You',
      };
    }

    return {
      title: 'Your Orbit is Empty',
      message: 'Follow creators in the galaxy to see their latest transmissions.',
      action: 'Refresh Feed',
    };
  }, [activeTab]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedSubscription, setSelectedSubscription] = useState<FeedSubscriptionSelection | null>(null);
  const [subscriptionBillingCycle] = useState<'monthly' | 'annually'>('monthly');
  const [coinBalance, setCoinBalance] = useState(1250);
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [showSubscriptionSuccess, setShowSubscriptionSuccess] = useState(false);
  const [showKulCoinPrompt, setShowKulCoinPrompt] = useState(false);
  const [isCreatorViewer, setIsCreatorViewer] = useState(user?.role === 'creator');
  const [shakeToRefreshEnabled, setShakeToRefreshEnabled] = useState(false);
  const [isShakeRefreshing, setIsShakeRefreshing] = useState(false);
  const [followToast, setFollowToast] = useState<string | null>(null);
  const { mutateAsync: subscribeToPlan } = useSubscribeToPlan();

  const feedLimit = 20;
  const {
    data: feedData,
    isLoading: isFeedLoading,
    isFetchingNextPage,
    isRefetching: isFeedRefetching,
    isError: isFeedError,
    error: feedError,
    hasNextPage,
    fetchNextPage,
    refetch: refetchFeed,
  } = useGeneralFeed({ limit: feedLimit });
  const feedRows = useMemo<FeedRow[]>(() => {
    return displayedItems.map((item, itemIndex) => {
      if (item.isCreatorBattle && item.creatorBattle) {
        return {
          kind: 'battle' as const,
          id: `battle-${item.creatorBattle.id ?? item.id}`,
          battle: item.creatorBattle,
          battleIndex: itemIndex,
        };
      }

      return {
        kind: 'video' as const,
        id: `video-${item.id}`,
        item,
      };
    });
  }, [displayedItems]);
  const queryClient = useQueryClient();
  const activeFeedRow = feedRows[activeIndex];
  const activeBattlePageIndex = activeFeedRow?.kind === 'battle'
    ? activeFeedRow.battleIndex
    : activeFeedRow?.kind === 'battle-loading'
      ? 0
      : null;
  const hideFeedHeader = activeBattlePageIndex !== null;
  const { mutate: mutateLikeVideo } = useLikeVideoMutation();
  const { mutate: mutateBookmarkVideo } = useBookmarkVideoMutation();
  const { mutate: mutateFollowCreator } = useFollowCreatorMutation();
  const { mutate: mutateRecordVideoView } = useRecordVideoViewMutation();
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const viewedVideoIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (battlePrefetchTimeoutRef.current) {
      clearTimeout(battlePrefetchTimeoutRef.current);
      battlePrefetchTimeoutRef.current = null;
    }

    const nextRow = feedRows[activeIndex + 1];
    if (nextRow?.kind !== 'battle') return;

    const battleId = nextRow.battle.id;
    if (battleId === undefined || battleId === null || battleId === '') return;

    const queryKey = challengeQueryKey(battleId);
    const queryState = queryClient.getQueryState(queryKey);
    if (queryState?.status === 'success' || queryState?.fetchStatus === 'fetching') return;

    battlePrefetchTimeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        queryClient.prefetchQuery({
          queryKey,
          queryFn: () => challengesApi
            .getChallenge(battleId)
            .then((response) => unwrapChallengeShowResponse(response.data)),
        });

        if (nextRow.battle.image) {
          Image.prefetch(nextRow.battle.image).catch(() => undefined);
        }
      });
      battlePrefetchTimeoutRef.current = null;
    }, 120);

    return () => {
      if (battlePrefetchTimeoutRef.current) {
        clearTimeout(battlePrefetchTimeoutRef.current);
        battlePrefetchTimeoutRef.current = null;
      }
    };
  }, [activeIndex, feedRows, queryClient]);

  useEffect(() => {
    const nextItems = (feedData?.pages ?? [])
      .flatMap((page) => extractFeedRows(page))
      .map(mapFeedVideoToItem)
      .filter((item): item is FeedItem => Boolean(item));

    setItems(nextItems);
  }, [feedData]);

  useEffect(() => {
    setActiveIndex(0);
    feedListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeTab]);

  useEffect(() => {
    setIsCreatorViewer(user?.role === 'creator');
    return subscribeUser((nextUser) => {
      setIsCreatorViewer(nextUser?.role === 'creator');
    });
  }, []);

  useEffect(() => {
    return () => {
      if (followToastTimeoutRef.current) {
        clearTimeout(followToastTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFeedFocused) return;

    const loadShakePreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(SHAKE_TO_REFRESH_STORAGE_KEY);
        setShakeToRefreshEnabled(saved === 'true');
      } catch {
        setShakeToRefreshEnabled(false);
      }
    };

    void loadShakePreference();
  }, [isFeedFocused]);

  const onViewRef = React.useRef(
  ({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const nextIndex = viewableItems[0].index ?? 0;
      setActiveIndex((prev) => (prev === nextIndex ? prev : nextIndex));
    }
      }
    );

  const viewConfigRef = React.useRef({
  viewAreaCoveragePercentThreshold: 80,
  });


  const handleSubscribe = useCallback((feedItem: FeedItem) => {
    setSelectedSubscription({
      itemId: feedItem.id,
      creatorId: feedItem.creatorId,
      creatorHandle: feedItem.handle,
      creatorName: feedItem.artist,
    });
    setShowSubscriptionSuccess(false);
  }, []);

  const handleFollow = useCallback((feedItem: FeedItem) => {
    const creatorId = feedItem.creatorId;
    if (!creatorId) {
      Alert.alert('Cannot follow yet', 'This feed card does not include a creator id.');
      return;
    }

    if (String(creatorId) === String(user?.id)) {
      Alert.alert('Not available', 'You cannot follow yourself.');
      return;
    }

    const nextFollowing = !feedItem.following;
    const previousItems = itemsRef.current;

    setItems((prev) =>
      prev.map((item) =>
        item.creatorId === creatorId ? { ...item, following: nextFollowing } : item
      )
    );
    setFollowToast(`${nextFollowing ? 'Following' : 'Unfollowed'} @${feedItem.handle}`);

    mutateFollowCreator(
      { creator: creatorId, following: nextFollowing },
      {
        onError: () => {
          setItems(previousItems);
        },
      },
    );

    if (followToastTimeoutRef.current) {
      clearTimeout(followToastTimeoutRef.current);
    }

    followToastTimeoutRef.current = setTimeout(() => {
      setFollowToast(null);
      followToastTimeoutRef.current = null;
    }, 1700);
  }, [mutateFollowCreator]);

  const handleToggleLike = useCallback((feedItem: FeedItem, liked: boolean) => {
    const previousItems = itemsRef.current;
    const optimisticLikes = Math.max(0, parseFeedCount(feedItem.likes) + (liked ? 1 : -1));

    setItems((prev) =>
      prev.map((item) =>
        item.id === feedItem.id
          ? { ...item, isLiked: liked, likes: formatFeedCount(optimisticLikes) }
          : item
      )
    );

    mutateLikeVideo(
      { video: feedItem.id, liked },
      {
        onSuccess: (response) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === feedItem.id
                ? {
                    ...item,
                    isLiked: response.data.isLiked,
                    isBookmarked: response.data.isBookmarked,
                    likes: formatFeedCount(response.data.likes_count),
                    comments: formatFeedCount(response.data.comments_count),
                    bookmarks: formatFeedCount(response.data.bookmarks_count),
                    saves: formatFeedCount(response.data.bookmarks_count),
                  }
                : item
            )
          );
        },
        onError: () => {
          setItems(previousItems);
        },
      },
    );
  }, [mutateLikeVideo]);

  const handleToggleBookmark = useCallback((feedItem: FeedItem, bookmarked: boolean) => {
    const previousItems = itemsRef.current;
    const optimisticBookmarks = Math.max(0, parseFeedCount(feedItem.saves) + (bookmarked ? 1 : -1));

    setItems((prev) =>
      prev.map((item) =>
        item.id === feedItem.id
          ? {
              ...item,
              isBookmarked: bookmarked,
              bookmarks: formatFeedCount(optimisticBookmarks),
              saves: formatFeedCount(optimisticBookmarks),
            }
          : item
      )
    );

    mutateBookmarkVideo(
      { video: feedItem.id, bookmarked },
      {
        onSuccess: (response) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === feedItem.id
                ? {
                    ...item,
                    isLiked: response.data.isLiked,
                    isBookmarked: response.data.isBookmarked,
                    likes: formatFeedCount(response.data.likes_count),
                    comments: formatFeedCount(response.data.comments_count),
                    bookmarks: formatFeedCount(response.data.bookmarks_count),
                    saves: formatFeedCount(response.data.bookmarks_count),
                  }
                : item
            )
          );
        },
        onError: () => {
          setItems(previousItems);
        },
      },
    );
  }, [mutateBookmarkVideo]);

  const handleRecordView = useCallback((feedItem: FeedItem) => {
    if (viewedVideoIdsRef.current.has(feedItem.id)) return;
    viewedVideoIdsRef.current.add(feedItem.id);

    mutateRecordVideoView(feedItem.id, {
      onError: () => {
        viewedVideoIdsRef.current.delete(feedItem.id);
      },
    });
  }, [mutateRecordVideoView]);

  const closeSubscriptionModal = useCallback(() => {
    if (isProcessingSubscription) return;
    setSelectedSubscription(null);
    setShowSubscriptionSuccess(false);
  }, [isProcessingSubscription]);

  const handleSubscriptionPurchase = useCallback(async (plan: CreatorSubscriptionPlan) => {
    if (!selectedSubscription) return;

    const subscriptionCost =
      subscriptionBillingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS;

    if (coinBalance < subscriptionCost) {
      setShowKulCoinPrompt(true);
      return;
    }

    try {
      setIsProcessingSubscription(true);
      await subscribeToPlan({
        subscriptionPlan: plan.id,
        payload: {
          name: plan.name.trim(),
          description: plan.description || null,
          price: Number.parseFloat(String(plan.price)),
          currency: plan.currency,
          billing_interval: plan.billing_interval,
        },
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedSubscription.itemId ? { ...item, isSubscribed: true } : item
        )
      );
      setCoinBalance((prev) => prev - subscriptionCost);
      setShowSubscriptionSuccess(true);
      setTimeout(() => {
        setSelectedSubscription(null);
        setShowSubscriptionSuccess(false);
      }, 1800);
    } catch (error: any) {
      Alert.alert(
        'Subscription failed',
        error?.response?.data?.message || error?.message || 'Please try again.'
      );
    } finally {
      setIsProcessingSubscription(false);
    }
  }, [coinBalance, selectedSubscription, subscribeToPlan, subscriptionBillingCycle]);

  const handleToggleMute = useCallback(() => {
    setIsGlobalMuted((v) => !v);
  }, []);

  const refreshFeedFromShake = useCallback(() => {
    setIsShakeRefreshing(true);
    setActiveIndex(0);
    feedListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setItems((prev) => {
      if (prev.length <= 1) return prev;
      return [...prev.slice(1), prev[0]];
    });

    setTimeout(() => {
      setIsShakeRefreshing(false);
    }, 1100);
  }, []);

  useEffect(() => {
    if (!isFeedFocused || !shakeToRefreshEnabled) return;

    Accelerometer.setUpdateInterval(120);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const force = Math.sqrt(x * x + y * y + z * z);
      const forceDelta = Math.abs(force - lastShakeForceRef.current);
      const now = Date.now();
      lastShakeForceRef.current = force;

      const hasShakeMotion = force >= SHAKE_FORCE_THRESHOLD || forceDelta >= SHAKE_DELTA_THRESHOLD;

      if (!hasShakeMotion || now - lastShakeRefreshRef.current < SHAKE_REFRESH_COOLDOWN_MS) {
        return;
      }

      lastShakeRefreshRef.current = now;
      refreshFeedFromShake();
    });

    return () => subscription.remove();
  }, [isFeedFocused, refreshFeedFromShake, shakeToRefreshEnabled]);

  const handleTabSwipe = useCallback((direction: 'left' | 'right') => {
    const tabOrder: Array<'foryou' | 'following' | 'premium'> = ['foryou', 'following', 'premium'];

    setActiveTab((currentTab) => {
      const currentIndex = tabOrder.indexOf(currentTab);
      if (currentIndex === -1) return currentTab;

      if (direction === 'left') {
        return tabOrder[Math.min(currentIndex + 1, tabOrder.length - 1)];
      }

      return tabOrder[Math.max(currentIndex - 1, 0)];
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          activeBattlePageIndex === null &&
          Math.abs(gestureState.dx) > 24 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2,
        onPanResponderGrant: () => {
          swipeHandledRef.current = false;
        },
        onPanResponderMove: (_, gestureState) => {
          if (swipeHandledRef.current || Math.abs(gestureState.dx) < 48) {
            return;
          }

          swipeHandledRef.current = true;
          handleTabSwipe(gestureState.dx < 0 ? 'left' : 'right');
        },
        onPanResponderRelease: () => {
          swipeHandledRef.current = false;
        },
        onPanResponderTerminate: () => {
          swipeHandledRef.current = false;
        },
      }),
    [activeBattlePageIndex, handleTabSwipe]
  );

  const handleOpenCreatorBattle = useCallback((challengeId: string) => {
    navigation.navigate('ChallengeFeed', { challengeId });
  }, [navigation]);

  const renderFeedItem = useCallback(({ item: row, index }: { item: FeedRow; index: number }) => {
    if (row.kind === 'battle-loading') {
      return (
        <View style={{ height: feedItemHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={{ ...fontSize.b4, color: '#94a3b8', marginTop: 12 }}>Loading creator battles...</Text>
        </View>
      );
    }

    if (row.kind === 'battle') {
      const isActiveBattle = index === activeIndex;
      return (
        <FeedBattleRow
          battle={row.battle}
          height={feedItemHeight}
          topInset={insets.top}
          isActive={isActiveBattle}
          onOpenBattle={handleOpenCreatorBattle}
          onSubscribe={handleSubscribe}
          onFollow={handleFollow}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onRecordView={handleRecordView}
          isGlobalMuted={isGlobalMuted}
          onToggleMute={handleToggleMute}
          coinBalance={coinBalance}
          onBalanceChange={setCoinBalance}
          isCreatorViewer={isCreatorViewer}
        />
      );
    }

    const videoItem = row.item;
    const isActiveVideo = index === activeIndex;

    return (
      <FeedVideoRow
        item={videoItem}
        height={feedItemHeight}
        isActive={isActiveVideo}
        onSubscribe={handleSubscribe}
        onFollow={handleFollow}
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmark}
        onRecordView={handleRecordView}
        isGlobalMuted={isGlobalMuted}
        onToggleMute={handleToggleMute}
        coinBalance={coinBalance}
        onBalanceChange={setCoinBalance}
        isCreatorViewer={isCreatorViewer}
      />
    );
  }, [activeIndex, coinBalance, feedItemHeight, handleFollow, handleOpenCreatorBattle, handleRecordView, handleSubscribe, handleToggleBookmark, handleToggleLike, handleToggleMute, insets.top, isCreatorViewer, isGlobalMuted]);

  const keyExtractor = useCallback((item: FeedRow) => item.id, []);

  const renderFeedFooter = useCallback(() => (
    <View style={{ height: SCREEN_HEIGHT * (Platform.OS === 'ios' ? 0.08 : 0.07) + (Platform.OS === 'ios' ? 0 : insets.bottom), justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
      {isFetchingNextPage ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : null}
    </View>
  ), [insets.bottom, isFetchingNextPage]);

  const refreshFeed = useCallback(() => {
    void refetchFeed();
  }, [refetchFeed]);

  const loadNextFeedPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView
    edges={['left', 'right']}
    style={{ flex: 1, backgroundColor: theme.background }}>
      <View
      {...panResponder.panHandlers}
      style={{ flex: 1, backgroundColor: 'blue', padding: 0, margin: 0 }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      {!hideFeedHeader ? (
      <View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios'? 54:insets.top,
          left: 0,
          right: 0,
          zIndex: 50,
          flexDirection: 'row',
          // gap: 15,
          justifyContent: 'space-between',
          alignItems: 'center',
          width: SCREEN_WIDTH,
          // backgroundColor: 'green',
          paddingHorizontal: 10
        }}
      >

        <View style={{
          width: "9%",
          // backgroundColor: 'blue'
        }}>
          <Pressable
        style = {{
          borderColor: '#888',
          borderWidth: 1,
          // paddingHorizontal: 8,
          borderRadius: 999,
          height: 35,
          width: 35,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.2)',
        }}
        onPress={() => navigation.navigate('Search')}>
          <MaterialIcons name="search" size={18} color="white" />
        </Pressable>
        </View>



        <View style={{
          flexDirection: "row",
              height: 44,
              width: SCREEN_WIDTH * 0.7,
              alignItems: "center",
              paddingHorizontal: 2,
              // paddingVertical: 2,
              // backgroundColor: 'red',
              justifyContent: 'center',
              gap: 10
                  }}>
              <Pressable
              onPress={()=>{
                navigation.navigate('Livefeed')
              }}
              >
                <View style={{
                  // backgroundColor: 'blue',
                  paddingBottom: 5
                }}>
                  <LiveLogo height={54} width={54}/>
                </View>
              </Pressable>
                  <Pressable onPress={() => setActiveTab("foryou")} style={{ justifyContent: 'center', alignItems: 'center',  }}>
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                      <Text style={[{ 
                        color: "#94a3b8", 
                        fontSize: fontSize.b2.fontSize,
                        fontFamily: 'Inter_600SemiBold',
                        letterSpacing: -0.2, marginBottom: 5 }, 
                        activeTab === "foryou" && {color: 'white', letterSpacing: 1, fontFamily: 'Inter_700Bold'}]}>
                        FOR YOU
                      </Text>
                      {activeTab === "foryou" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  <Pressable onPress={() => setActiveTab("following")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={[{
                        color: "#94a3b8", 
                        fontSize: fontSize.b2.fontSize,
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 5 }, 
                        activeTab === "following" && {color: 'white', letterSpacing: 1, fontFamily: 'Inter_700Bold'}]}>
                        FOLLOWING
                      </Text>
                      {activeTab === "following" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>
                  {/* <Pressable onPress={() => setActiveTab("challenges")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{ color: "#94a3b8", ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, marginBottom: 5 }, activeTab === "challenges" && {color: 'white', letterSpacing: 1, marginBottom: 5}]}>
                        CHALLENGES
                      </Text>
                      {activeTab === "challenges" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable> */}
                  <Pressable onPress={() => setActiveTab("premium")} style={{ justifyContent: 'center', alignItems: 'center',}}>
                    <View style={{ justifyContent: 'center', alignItems: 'center',}}>
                      <Text style={[{
                        color: "#94a3b8",
                        fontSize: fontSize.b2.fontSize,
                        fontFamily: 'Inter_600SemiBold',
                        marginBottom: 5 },
                        activeTab === "premium" && {color: 'white', letterSpacing: 1, fontFamily: 'Inter_700Bold', marginBottom: 5}]}>
                        PREMIUM
                      </Text>
                      {activeTab === "premium" && <View style={{
                        backgroundColor: PRIMARY_COLOR,
                        height: 2,
                        width: 20,
                        // marginTop: 5
                      }}/>}
                    </View>
                  </Pressable>


                </View>
            <Pressable
            onPress={()=>{
              navigation.navigate('StreakReward')
            }}
            style={{
              // width: SCREEN_WIDTH * 0.2,
              // backgroundColor: 'blue',
              // borderColor: '#f973164d',
              // borderWidth: 1,
              // borderRadius: 16,
              // height: 45,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              paddingHorizontal: 5,
              marginBottom: 5
              // paddingVertical: 2.5,
              // marginRight: 5,
            }}
            >
              <FireIcon fill='#f97316' height={20} width={20}/>
              <Text
              numberOfLines={1}
              style={{
                color: '#f97316',
                fontSize: smallWidth ? fontSize.b3.fontSize+2 : fontSize.b2.fontSize+2,
                fontFamily: 'Inter_600SemiBold',
              }}>
                3
              </Text>
            </Pressable>

      </View>
      ) : null}

      {isFeedLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', paddingHorizontal: 24 }}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={{ color: '#94a3b8', marginTop: 12, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
            Loading your galaxy feed...
          </Text>
        </View>
      ) : isFeedError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', paddingHorizontal: 24 }}>
          <MaterialIcons name="wifi-off" size={42} color={PRIMARY_COLOR} />
          <Text style={{ color: 'white', marginTop: 14, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textAlign: 'center' }}>
            Feed could not load
          </Text>
          <Text style={{ color: '#94a3b8', marginTop: 8, textAlign: 'center', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>
            {getApiErrorMessage(feedError)}
          </Text>
          <Pressable onPress={() => void refetchFeed()} style={{ marginTop: 18, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: PRIMARY_COLOR }}>
            <Text style={{ color: 'white', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight }}>Retry</Text>
          </Pressable>
        </View>
      ) : feedRows.length > 0 ? (
        <View
          onLayout={(event) => {
            const nextHeight = event.nativeEvent.layout.height;
            setFeedViewportHeight((current) => (
              Math.abs(current - nextHeight) < 1 ? current : nextHeight
            ));
          }}
          style={{
            flex: 1,
            backgroundColor: 'black',
          }}
        >
          <FlatList
            ref={feedListRef}
            data={feedRows}
            keyExtractor={keyExtractor}
            renderItem={renderFeedItem}
            showsVerticalScrollIndicator={false}
            snapToInterval={feedItemHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            ListFooterComponent={renderFeedFooter}
            refreshing={isFeedRefetching}
            onRefresh={refreshFeed}
            onEndReached={loadNextFeedPage}
            onEndReachedThreshold={0.6}
            getItemLayout={(_, index) => ({
              length: feedItemHeight,
              offset: feedItemHeight * index,
              index,
            })}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfigRef.current}
            removeClippedSubviews
            initialNumToRender={1}
            windowSize={3}
            maxToRenderPerBatch={1}
            updateCellsBatchingPeriod={75}
          />
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: 'black' }}>
          <Text style={{ color: 'white', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, fontWeight: '800', textAlign: 'center' }}>
            {emptyFeedState.title}
          </Text>
          <Text style={{ ...fontSize.b1, color: '#94a3b8', marginTop: 8, textAlign: 'center' }}>
            {emptyFeedState.message}
          </Text>
          <Pressable
            onPress={() => {
              if (activeTab === 'foryou') {
                void refetchFeed();
                return;
              }
              setActiveTab('foryou');
            }}
            style={{ marginTop: 18 }}
          >
            <Text style={{ ...fontSize.b2, color: PRIMARY_COLOR }}>{emptyFeedState.action}</Text>
          </Pressable>
        </View>
      )}

      {isShakeRefreshing ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 104 : insets.top + 54,
            alignSelf: 'center',
            zIndex: 90,
            minHeight: 46,
            borderRadius: 999,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: 'rgba(0,0,0,0.72)',
            borderWidth: 1,
            borderColor: primaryColorAlpha(0.45),
          }}
        >
          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          <Text
            style={{
              ...fontSize.b2,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: 1.4,
            }}
          >
            Refreshing Feed
          </Text>
        </View>
      ) : null}

      {followToast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: Math.max(insets.bottom + 88, 112),
            alignSelf: 'center',
            zIndex: 95,
            minHeight: 44,
            borderRadius: 999,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(0,0,0,0.78)',
            borderColor: primaryColorAlpha(0.45),
          }}
        >
          <MaterialIcons name="check-circle" size={18} color={PRIMARY_COLOR} />
          <Text
            style={{
              ...fontSize.b4,
              color: '#fff',
              lineHeight: fontSize.b4.lineHeight,
            }}
          >
            {followToast}
          </Text>
        </View>
      ) : null}

      <FeedSubscriptionModal
        visible={Boolean(selectedSubscription)}
        selection={selectedSubscription}
        billingCycle={subscriptionBillingCycle}
        coinBalance={coinBalance}
        isProcessing={isProcessingSubscription}
        showSuccess={showSubscriptionSuccess}
        onClose={closeSubscriptionModal}
        onPurchase={(plan) => void handleSubscriptionPurchase(plan)}
      />

      <KulCoinPrompt
        isOpen={showKulCoinPrompt}
        onClose={() => setShowKulCoinPrompt(false)}
        requiredCoins={subscriptionBillingCycle === 'monthly' ? MONTHLY_KULCOINS : YEARLY_KULCOINS}
        currentCoins={coinBalance}
        onPurchaseKulCoins={() => {
          setShowKulCoinPrompt(false);
          navigation.navigate('TopUpCoins');
        }}
      />
      </View>
    </SafeAreaView>
  );
};

const StyleSheet = {
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    margin: 0,
    padding: 0,
  },
  tabWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 999,
    borderColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    height: 44,
    width: "70%",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
};

export default Feed;
