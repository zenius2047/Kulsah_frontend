import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ImageBackground, Keyboard, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { fontSize } from './typography';
import { useFollowCreatorMutation } from '../src/hooks/general/useGeneralMutations';
import { useCommentOnLive, useLiveDiscovery } from '../src/hooks/live/useLive';
import { useLiveDirectoryRealtime } from '../src/hooks/live/useLiveDirectoryRealtime';
import { useLiveRealtime } from '../src/hooks/live/useLiveRealtime';
import { liveApi } from '../src/api/live.api';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import { useAuthStore } from '../src/store/auth.store';
import type { LiveComment, LiveCredentials, LiveSession } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { flattenLivePages, formatLiveCount } from '../src/utils/live';

interface LiveCard {
  id: string;
  title: string;
  subtitle: string;
  host: string;
  hostAvatar: string;
  background: string;
  video?: string;
  viewers: string;
  likes: string;
  shares: string;
  liveSession?: LiveSession;
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  avatar?: string | null;
  isTip?: boolean;
  isSystem?: boolean;
}

type LiveChatPayload = Pick<LiveComment, 'id' | 'body' | 'user'>;

const toChatMessage = (comment: LiveChatPayload): ChatMessage => ({
  id: comment.id,
  user: comment.user?.name ?? comment.user?.username ?? 'Viewer',
  text: comment.body,
  avatar: comment.user?.avatar,
});

const LiveCardPreview: React.FC<{
  liveSession?: LiveSession;
  fallbackImage: string;
  isVisible: boolean;
}> = ({ liveSession, fallbackImage, isVisible }) => {
  const isFocused = useIsFocused();
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const shouldPreview = isFocused && isVisible && Boolean(liveSession?.id);
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;

  useEffect(() => {
    let cancelled = false;

    if (!shouldPreview || !liveSession?.id) {
      setCredentials(null);
      return () => {
        cancelled = true;
      };
    }

    setCredentials(null);
    void liveApi.preview(liveSession.id)
      .then((response) => {
        if (!cancelled) setCredentials(response.data.credentials);
      })
      .catch(() => {
        if (!cancelled) setCredentials(null);
      });

    return () => {
      cancelled = true;
    };
  }, [liveSession?.id, shouldPreview]);

  const agora = useAgoraLive({
    credentials,
    enabled: shouldPreview && Boolean(credentials),
    remoteAudioMuted: true,
  });

  useEffect(() => {
    if (shouldPreview) agora.setRemoteAudioMuted(true);
  }, [agora.setRemoteAudioMuted, shouldPreview]);

  const remoteUid = agora.remoteUids[0];

  if (remoteUid != null && shouldPreview) {
    return <RtcVideoView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />;
  }

  if (!fallbackImage) {
    return (
      <LinearGradient
        colors={['#241129', '#111827', '#050505']}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <ImageBackground
      source={{ uri: fallbackImage }}
      style={StyleSheet.absoluteFill}
      imageStyle={styles.cardImage}
    />
  );
};

const FEED_HEARTS = [
  { right: 4, bottom: 248, size: 18, color: '#7b18b4' },
  { right: 23, bottom: 278, size: 24, color: '#e13779' },
  { right: 1, bottom: 314, size: 16, color: '#961fc2' },
  { right: 26, bottom: 345, size: 14, color: '#d82e70' },
] as const;

const DOUBLE_TAP_WINDOW_MS = 300;
const AUTO_JOIN_DELAY_MS = 3_000;

const formatCategory = (category?: string | null) => (
  category
    ? category.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Live'
);

type LiveCardOverlayProps = {
  card: LiveCard;
  comments: ChatMessage[];
  commentValue: string;
  composerLift: number;
  compact: boolean;
  showViewerControls: boolean;
  canComment: boolean;
  isCommentSending: boolean;
  onCommentChange: (value: string) => void;
  onCommentFocus: () => void;
  onCommentBlur: () => void;
  onCommentSubmit: () => void;
  onJoin: () => void;
  onGift: () => void;
};

const LiveCardOverlay: React.FC<LiveCardOverlayProps> = ({
  card,
  comments,
  commentValue,
  composerLift,
  compact,
  showViewerControls,
  canComment,
  isCommentSending,
  onCommentChange,
  onCommentFocus,
  onCommentBlur,
  onCommentSubmit,
  onJoin,
  onGift,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const followCreator = useFollowCreatorMutation();
  const [isFollowing, setIsFollowing] = useState(Boolean(card.liveSession?.creator?.is_following));
  const creator = card.liveSession?.creator;
  const handle = creator?.handle ?? creator?.username ?? card.host.toLowerCase().replace(/\s+/g, '');
  const giftValue = card.liveSession?.gift_value_kc ?? 0;
  const goalProgress = `${Math.max(8, Math.min(100, (giftValue / 1000) * 100))}%` as `${number}%`;

  useEffect(() => {
    setIsFollowing(Boolean(creator?.is_following));
  }, [creator?.id, creator?.is_following]);

  const shareLive = () => {
    void Share.share({
      title: `${card.host} is live on Kulsah`,
      message: `Watch ${card.host} live on Kulsah — ${card.subtitle}`,
    });
  };

  const toggleFollow = () => {
    if (!creator?.id || String(creator.id) === String(currentUser?.id)) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    followCreator.mutate(
      { creator: creator.id, following: nextFollowing },
      { onError: () => setIsFollowing(!nextFollowing) },
    );
  };

  return (
    <View pointerEvents="box-none" style={styles.referenceOverlay}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.72)', 'transparent', 'transparent', 'rgba(0,0,0,0.94)']}
        locations={[0, 0.24, 0.54, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.previewBrandHeader}>
        {/* <Pressable accessibilityLabel="Back" hitSlop={9} style={styles.previewClearButton} onPress={onBack}>
          <MaterialIcons name="arrow-back-ios-new" size={23} color="#fff" />
        </Pressable> */}
        {/* <View pointerEvents="none" style={styles.previewLogo}>
          <KulsahWhite width={94} height={42} />
        </View> */}
        {/* <View style={styles.previewHeaderActions}>
          <Pressable accessibilityLabel="Share live" style={styles.previewClearButton} onPress={shareLive}>
            <MaterialIcons name="ios-share" size={25} color="#fff" />
          </Pressable>
          <Pressable accessibilityLabel="More" style={styles.previewClearButton} onPress={onJoin}>
            <MaterialIcons name="more-horiz" size={26} color="#fff" />
          </Pressable>
        </View> */}
      </View>

      {showViewerControls ? (
        <View style={[styles.previewCreatorPanel, { top: Platform.OS === 'ios' ? 54 : insets.top + 15 }]}>
          <View style={styles.previewAvatarColumn}>
            <LinearGradient colors={['#ff9a3d', '#f22575', '#6911b7']} style={styles.previewAvatarRing}>
              {card.hostAvatar ? (
                <Image source={{ uri: card.hostAvatar }} style={styles.previewAvatar} />
              ) : (
                <View style={[styles.previewAvatar, styles.previewAvatarFallback]}>
                  <Text style={styles.previewAvatarInitial}>{card.host.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </LinearGradient>
          </View>
          <View style={styles.previewCreatorCopy}>
            <View style={styles.previewNameRow}>
              <Text numberOfLines={1} style={styles.previewCreatorName}>{card.host}</Text>
              {creator?.verified ? <MaterialIcons name="verified" size={16} color="#fff" /> : null}
            </View>
            <View style={styles.previewLikesRow}>
              <MaterialIcons name="favorite" size={13} color="#ff4d8d" />
              <Text style={styles.previewLikesText}>{card.likes}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {showViewerControls ? (
        <View style={[styles.previewFollowPanel, { top: Platform.OS === 'ios' ? 54 : insets.top + 15 }]}>
          <View style={styles.previewViewerBadge}>
            <MaterialIcons name="visibility" size={15} color="#fff" />
            <Text style={styles.previewViewerText}>{card.viewers}</Text>
          </View>
          {String(creator?.id ?? '') !== String(currentUser?.id ?? 'viewer') ? (
            <Pressable disabled={followCreator.isPending} onPress={toggleFollow}>
              <LinearGradient
                colors={isFollowing ? ['rgba(31,25,35,0.96)', 'rgba(31,25,35,0.96)'] : ['#e32b71', '#7508a9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.previewFollowButton, isFollowing && styles.previewFollowingButton]}
              >
                {followCreator.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
                  <Text style={styles.previewFollowText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                )}
              </LinearGradient>
            </Pressable>
          ) : null}
        </View>
      ) : null}

        {/* <View style={styles.previewCreatorCopy}>
          <View style={styles.previewNameRow}>
            <Text numberOfLines={1} style={styles.previewCreatorName}>{card.host}</Text>
            {creator?.verified ? <MaterialIcons name="verified" size={16} color="#fff" /> : null}
          </View>
          <Text numberOfLines={1} style={styles.previewHandle}>@{handle.replace(/^@/, '')}</Text>
          <View style={styles.previewViewerBadge}>
            <MaterialIcons name="visibility" size={15} color="#fff" />
            <Text style={styles.previewViewerText}>{card.viewers}</Text>
          </View>
        </View> */}

      {/* <View style={styles.previewFollowPanel}>
        {String(creator?.id ?? '') !== String(currentUser?.id ?? 'viewer') ? (
          <Pressable disabled={followCreator.isPending} onPress={toggleFollow}>
            <LinearGradient
              colors={isFollowing ? ['rgba(31,25,35,0.96)', 'rgba(31,25,35,0.96)'] : ['#e32b71', '#7508a9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.previewFollowButton, isFollowing && styles.previewFollowingButton]}
            >
              {followCreator.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
                <Text style={styles.previewFollowText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              )}
            </LinearGradient>
          </Pressable>
        ) : null}
        {!compact ? (
          <View style={styles.previewFireBadge}>
            <MaterialIcons name="local-fire-department" size={18} color="#ff7628" />
            <Text style={styles.previewFireText}>{formatLiveCount(giftValue)}</Text>
          </View>
        ) : null}
      </View> */}

      {/* <View style={styles.previewCategoryRow}>
        <View style={styles.previewChip}>
          <MaterialIcons name={card.liveSession?.category === 'music' ? 'music-note' : 'live-tv'} size={17} color="#fff" />
          <Text style={styles.previewChipText}>{formatCategory(card.liveSession?.category)}</Text>
        </View>
        <View style={styles.previewChip}>
          <MaterialIcons name="local-fire-department" size={17} color="#ff7628" />
          <Text style={styles.previewChipText}>Original</Text>
        </View>
      </View> */}

      {/* {!compact ? (
        <View pointerEvents="none" style={styles.previewPromoRail}>
          <View style={styles.previewGoalCard}>
            <View style={styles.previewGoalHeader}>
              <View>
                <Text style={styles.previewGoalLabel}>Road to Star</Text>
                <Text style={styles.previewGoalLevel}>Level 3</Text>
              </View>
              <MaterialIcons name="star" size={31} color="#ffb526" />
            </View>
            <View style={styles.previewProgressTrack}>
              <LinearGradient colors={['#ff2e78', '#ff758b']} style={[styles.previewProgressFill, { width: goalProgress }]} />
            </View>
            <Text style={styles.previewGoalCount}>{formatLiveCount(giftValue)} / 1K</Text>
          </View>
          <View style={styles.previewFestCard}>
            <MaterialIcons name="redeem" size={31} color="#ff367e" />
            <Text style={styles.previewFestBrand}>kulsah</Text>
            <Text style={styles.previewFestTitle}>GIFT FEST</Text>
            <View style={styles.previewFestDivider} />
            <Text style={styles.previewFestTime}>LIVE</Text>
          </View>
        </View>
      ) : null} */}

      <View style={styles.previewActivityArea}>
        {comments.slice(-4).map((message) => (
          <View key={message.id} style={styles.previewCommentLine}>
            {message.avatar ? <Image source={{ uri: message.avatar }} style={styles.previewCommentAvatar} /> : (
              <View style={[styles.previewCommentAvatar, styles.previewCommentAvatarFallback]}>
                <Text style={styles.previewCommentInitial}>{message.user.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.previewCommentCopy}>
              <Text style={styles.previewCommentAuthor}>{message.user}</Text>
              <Text style={styles.previewCommentBody}>{message.text}</Text>
            </View>
          </View>
        ))}
        <View style={styles.previewHostMessage}>
          <View style={styles.previewHostMark}><Text style={styles.previewHostMarkText}>kulsah</Text></View>
          <View style={styles.previewCommentCopy}>
            <Text style={styles.previewCommentAuthor}>{handle} <Text style={styles.previewHostTag}> Host </Text></Text>
            <Text numberOfLines={2} style={styles.previewCommentBody}>{card.subtitle}</Text>
          </View>
        </View>
      </View>

      {!showViewerControls ? (
        <View pointerEvents="none" style={styles.previewHeartTrail}>
          {FEED_HEARTS.map((heart, index) => (
            <MaterialIcons
              key={`${heart.bottom}-${index}`}
              name="favorite"
              size={heart.size}
              color={heart.color}
              style={{ position: 'absolute', right: heart.right, bottom: heart.bottom }}
            />
          ))}
        </View>
      ) : null}

      {!showViewerControls ? (
        <View style={styles.previewActionRail}>
          <View style={styles.previewRailItem}>
            <Pressable onPress={onJoin}>
              <LinearGradient colors={['#ea377c', '#ce176b']} style={styles.previewLikeButton}>
                <MaterialIcons name="favorite" size={25} color="#fff" />
              </LinearGradient>
            </Pressable>
            <Text style={styles.previewRailCount}>{card.likes}</Text>
          </View>
          <View style={styles.previewRailItem}>
            <Pressable style={styles.previewRailButton} onPress={shareLive}><MaterialIcons name="share" size={25} color="#fff" /></Pressable>
            <Text style={styles.previewRailCount}>Share</Text>
          </View>
          {card.liveSession?.gifts_enabled ? (
            <View style={styles.previewRailItem}>
              <Pressable style={styles.previewRailButton} onPress={onGift}><MaterialIcons name="redeem" size={25} color="#fff" /></Pressable>
              <Text style={styles.previewRailCount}>{formatLiveCount(card.liveSession.gifts_count)}</Text>
            </View>
          ) : null}
          <Pressable style={styles.previewRailButton} onPress={onJoin}><MaterialIcons name="more-horiz" size={26} color="#fff" /></Pressable>
        </View>
      ) : null}

      <View style={[
        styles.previewBottomDock,
        { bottom: 6 + composerLift + (Platform.OS === 'android' ? insets.bottom : 0) },
      ]}>
        <View style={styles.previewComposer}>
          <TextInput
            includeFontPadding={false}
            value={commentValue}
            onFocus={onCommentFocus}
            onBlur={onCommentBlur}
            onChangeText={onCommentChange}
            placeholder={card.liveSession?.chat_enabled ? 'Say something...' : 'Chat is disabled'}
            placeholderTextColor="rgba(255,255,255,0.48)"
            editable={Boolean(card.liveSession?.chat_enabled) && canComment && !isCommentSending}
            style={styles.previewInput}
            returnKeyType="send"
            onSubmitEditing={onCommentSubmit}
          />
          <Pressable disabled={!commentValue.trim() || !canComment || isCommentSending} onPress={onCommentSubmit}>
            {isCommentSending ? <ActivityIndicator size="small" color="#fff" /> : (
              <MaterialIcons name={commentValue.trim() ? 'send' : 'sentiment-satisfied-alt'} size={24} color={commentValue.trim() ? PRIMARY_COLOR : '#fff'} />
            )}
          </Pressable>
        </View>
        {card.liveSession?.gifts_enabled ? (
          <Pressable style={styles.previewDockAction} onPress={onGift}>
            <MaterialIcons name="redeem" size={27} color="#ff3277" />
            <Text style={styles.previewDockLabel}>Gift</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.previewDockAction} onPress={onJoin}>
          <MaterialIcons name="group" size={26} color="#fff" />
          <Text style={styles.previewDockLabel}>Guests</Text>
        </Pressable>
        <Pressable style={styles.previewDockAction} onPress={onJoin}>
          <MaterialIcons name="more-horiz" size={27} color="#fff" />
          <Text style={styles.previewDockLabel}>More</Text>
        </Pressable>
      </View>
    </View>
  );
};

const LiveFeed: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const isFeedFocused = useIsFocused();
  const viewportHeight = Dimensions.get('screen').height;
  const creatorStripHeight = viewportHeight * 0.18;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isCreatorStripVisible, setIsCreatorStripVisible] = useState(true);
  const [joinedLiveCardId, setJoinedLiveCardId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [focusedCardId, setFocusedCardId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentsByCard, setCommentsByCard] = useState<Record<string, ChatMessage[]>>({});
  const lastCardTapRef = useRef<{ cardId: string; timestamp: number } | null>(null);
  const autoJoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoJoinCardIdRef = useRef<string | null>(null);
  const joinedLiveCardIdRef = useRef<string | null>(null);
  const joiningLiveCardIdRef = useRef<string | null>(null);
  const liveCardsRef = useRef<LiveCard[]>([]);
  const liveQuery = useLiveDiscovery();
  useLiveDirectoryRealtime(isFeedFocused);
  const discoveredLives = useMemo(() => flattenLivePages(liveQuery.data?.pages), [liveQuery.data?.pages]);
  const liveCards = useMemo<LiveCard[]>(() => discoveredLives.map((live) => ({
    id: live.id,
    title: live.creator?.name ?? 'Creator',
    subtitle: live.title,
    host: live.creator?.name ?? 'Creator',
    hostAvatar: live.creator?.avatar ?? '',
    background: live.cover_url ?? '',
    viewers: formatLiveCount(live.current_viewers),
    likes: formatLiveCount(live.likes_count),
    shares: formatLiveCount(live.comments_count),
    liveSession: live,
  })), [discoveredLives]);

  const clearAutoJoinTimer = useCallback(() => {
    if (autoJoinTimerRef.current !== null) {
      clearTimeout(autoJoinTimerRef.current);
      autoJoinTimerRef.current = null;
    }
    autoJoinCardIdRef.current = null;
  }, []);

  const appendLiveComment = useCallback((liveId: string, comment: LiveChatPayload) => {
    setCommentsByCard((current) => {
      const comments = current[liveId] ?? [];
      if (comments.some((item) => item.id === comment.id)) return current;

      return {
        ...current,
        [liveId]: [...comments, toChatMessage(comment)].slice(-50),
      };
    });
  }, []);

  const joinLiveInFeed = useCallback(async (card: LiveCard) => {
    if (!card.liveSession) return;
    const liveId = card.liveSession.id;
    if (joinedLiveCardIdRef.current === liveId || joiningLiveCardIdRef.current === liveId) return;

    clearAutoJoinTimer();
    Keyboard.dismiss();

    const previousLiveId = joinedLiveCardIdRef.current;
    joiningLiveCardIdRef.current = liveId;
    try {
      if (previousLiveId && previousLiveId !== liveId) {
        await liveApi.leave(previousLiveId).catch(() => undefined);
        joinedLiveCardIdRef.current = null;
        setJoinedLiveCardId(null);
      }

      await liveApi.join(liveId);
      joinedLiveCardIdRef.current = liveId;
      setJoinedLiveCardId(liveId);
    } catch (error) {
      Alert.alert('Unable to join Live', getApiErrorMessage(error));
    } finally {
      if (joiningLiveCardIdRef.current === liveId) {
        joiningLiveCardIdRef.current = null;
      }
    }
  }, [clearAutoJoinTimer]);

  useEffect(() => {
    liveCardsRef.current = liveCards;
  }, [liveCards]);

  const activeCardId = activeIndex === null ? null : (liveCards[activeIndex]?.id ?? null);
  const commentLive = useCommentOnLive(activeCardId ?? '');

  useLiveRealtime(activeCardId ?? undefined, Boolean(
    isFeedFocused
    && activeCardId
    && joinedLiveCardId === activeCardId,
  ), {
    onComment: (comment) => {
      if (activeCardId) appendLiveComment(activeCardId, comment);
    },
  });
  const feedSnapOffsets = useMemo(
    () => [0, ...liveCards.map((_, index) => creatorStripHeight + (index * viewportHeight))],
    [creatorStripHeight, liveCards.length, viewportHeight],
  );

  useEffect(() => {
    clearAutoJoinTimer();

    if (!isFeedFocused || !activeCardId || joinedLiveCardId === activeCardId) return;

    autoJoinCardIdRef.current = activeCardId;
    autoJoinTimerRef.current = setTimeout(() => {
      const activeCard = liveCardsRef.current.find((card) => card.id === activeCardId);
      if (autoJoinCardIdRef.current === activeCardId && activeCard) {
        joinLiveInFeed(activeCard);
      }
    }, AUTO_JOIN_DELAY_MS);

    return () => {
      if (autoJoinCardIdRef.current === activeCardId) clearAutoJoinTimer();
    };
  }, [activeCardId, clearAutoJoinTimer, isFeedFocused, joinLiveInFeed, joinedLiveCardId]);

  useEffect(() => () => {
    const liveId = joinedLiveCardIdRef.current;
    if (liveId) void liveApi.leave(liveId).catch(() => undefined);
  }, []);

  const sendLiveComment = async (card: LiveCard) => {
    const body = (commentDrafts[card.id] ?? '').trim();
    if (!body || card.id !== activeCardId || joinedLiveCardId !== card.id || commentLive.isPending) return;

    try {
      const created = await commentLive.mutateAsync(body);
      appendLiveComment(card.id, created);
      setCommentDrafts((current) => ({ ...current, [card.id]: '' }));
    } catch (error) {
      Alert.alert('Comment not sent', getApiErrorMessage(error));
    }
  };

  const handleCardTap = (card: LiveCard) => {
    const timestamp = Date.now();
    const previousTap = lastCardTapRef.current;

    if (
      previousTap?.cardId === card.id
      && timestamp - previousTap.timestamp <= DOUBLE_TAP_WINDOW_MS
    ) {
      lastCardTapRef.current = null;
      joinLiveInFeed(card);
      return;
    }

    lastCardTapRef.current = { cardId: card.id, timestamp };
  };

  const openGiftDialog = (card: LiveCard) => {
    joinLiveInFeed(card);
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setFocusedCardId(null);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    const nextIndex = viewableItems.find((entry) => entry.index !== null)?.index;
    setActiveIndex(typeof nextIndex === 'number' ? nextIndex : null);
  }).current;

  const handleFeedScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const nextVisible = event.nativeEvent.contentOffset.y < creatorStripHeight;
    setIsCreatorStripVisible((current) => current === nextVisible ? current : nextVisible);
  }, [creatorStripHeight]);

  const renderCreatorStrip = () => (
    <View style={{ height: creatorStripHeight, backgroundColor: theme.background, paddingTop: viewportHeight * 0.05}}>
      <FlatList
        data={liveCards}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.creatorRow}
        renderItem={({ item: creator }) => (
          <View style={[styles.creatorItem]}>
            <LinearGradient
              colors={['#f00', '#f00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.creatorRing}
            >
              {creator.hostAvatar ? <Image source={{ uri: creator.hostAvatar }} style={styles.creatorAvatar} /> : <View style={[styles.creatorAvatar, { backgroundColor: '#32113c' }]} />}
            </LinearGradient>
            <Text style={[styles.creatorHandle, { color: isDark ? '#cbd5e1' : theme.textSecondary }]} numberOfLines={1}>@{creator.liveSession?.creator?.handle ?? creator.liveSession?.creator?.username ?? creator.host}</Text>
          </View>
        )}
        ListHeaderComponent={<View style={styles.creatorSpacer} />}
        ListFooterComponent={<View style={styles.creatorSpacer} />}
      />
    </View>
  );

  const renderLiveCard = ({ item: card, index }: { item: LiveCard; index: number }) => {
    const cardHeight = viewportHeight;
    const cardComments = (commentsByCard[card.id] ?? []).slice(-3);
    const composerLift = focusedCardId === card.id ? Math.max(keyboardHeight - 24, 0) : 0;

    return (
      <View
        style={[
          styles.cardShell,
          {
            shadowColor: isDark ? '#000000' : '#0f172a',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
            height: cardHeight,
            backgroundColor: 'black',

          },
        ]}
      >
        <Pressable
          accessibilityHint="Double tap to open this live stream's controls"
          onPress={() => handleCardTap(card)}
          style={[styles.card, { height: '100%', paddingTop: isCreatorStripVisible && index !== 0 ? viewportHeight * 0.025 : 0 }]}
        >
          <LiveCardPreview
            liveSession={card.liveSession}
            fallbackImage={card.background}
            isVisible={index === activeIndex && isFeedFocused}
          />
          <View style={styles.cardTint} />

          <LiveCardOverlay
            card={card}
            comments={cardComments}
            commentValue={commentDrafts[card.id] ?? ''}
            composerLift={composerLift}
            compact={cardHeight < 680 || Dimensions.get('window').width < 375}
            showViewerControls={!isCreatorStripVisible}
            canComment={card.id === joinedLiveCardId}
            isCommentSending={card.id === activeCardId && commentLive.isPending}
            onCommentChange={(value) => setCommentDrafts((prev) => ({ ...prev, [card.id]: value }))}
            onCommentFocus={() => setFocusedCardId(card.id)}
            onCommentBlur={() => {
              if (keyboardHeight === 0) setFocusedCardId(null);
            }}
            onCommentSubmit={() => void sendLiveComment(card)}
            onJoin={() => joinLiveInFeed(card)}
            onGift={() => openGiftDialog(card)}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView
    style={[styles.safeArea, { backgroundColor: theme.background }]} edges={[]}>
      <View style={[styles.screen, {
        backgroundColor: theme.background,
        // paddingTop: viewportHeight * 0.05,
        height: viewportHeight


         }]}>
        <FlatList
        bounces={false}
          scrollEnabled={keyboardHeight === 0}
          data={liveCards}
          keyExtractor={(item) => item.id}
          renderItem={renderLiveCard}
          ListHeaderComponent={renderCreatorStrip}
          ListEmptyComponent={liveQuery.isLoading ? (
            <View style={styles.feedState}><ActivityIndicator size="large" color={PRIMARY_COLOR} /><Text style={styles.feedStateText}>Finding active Lives...</Text></View>
          ) : (
            <View style={styles.feedState}><MaterialIcons name="live-tv" size={46} color="#94a3b8" /><Text style={styles.feedStateText}>{liveQuery.isError ? 'Live feed unavailable. Pull down to retry.' : 'No one is live right now.'}</Text></View>
          )}
          refreshing={liveQuery.isRefetching && !liveQuery.isFetchingNextPage}
          onRefresh={() => void liveQuery.refetch()}
          onEndReached={() => {
            if (liveQuery.hasNextPage && !liveQuery.isFetchingNextPage) void liveQuery.fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScroll={handleFeedScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          snapToAlignment='start'
          decelerationRate='fast'
          snapToOffsets={feedSnapOffsets}
          style={{
            backgroundColor: 'black'
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    // flex: 1,
  },
  screen: {
    // flex: 1,
    // height: '100%',
    // backgroundColor: 'blue'
  },
  content: {
    // paddingTop: 18,
    paddingBottom: 24,
  },
  creatorRow: {
    paddingBottom: 6,
    gap: 16,
  },
  creatorSpacer: {
    width: 0,
  },
  creatorItem: {
    width: 84,
    alignItems: 'center',
  },
  creatorRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  creatorAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#120814',
  },
  creatorHandle: {
    marginTop: 10,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  cardShell: {
    // borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  card: {
    width: '100%',
    justifyContent: 'space-between',
  },
  cardImage: {
    // borderRadius: 28,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 2, 12, 0.16)',
  },
  feedState: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 30,
  },
  feedStateText: {
    color: '#cbd5e1',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  referenceOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  previewBrandHeader: {
    position: 'absolute',
    top: 5,
    left: 10,
    right: 10,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewClearButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLogo: {
    position: 'absolute',
    left: '50%',
    marginLeft: -47,
    width: 94,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeaderActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCreatorPanel: {
    position: 'absolute',
    left: 14,
    zIndex: 7,
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '50%',
    gap: 3,
  },
  previewAvatarColumn: {
    width: 38,
    alignItems: 'center',
  },
  previewAvatarRing: {
    width: 36,
    height: 36,
    borderRadius: 28,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#08050b',
  },
  previewAvatarFallback: {
    backgroundColor: '#391343',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewAvatarInitial: {
    color: '#fff',
    fontSize: 19,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  previewLivePill: {
    marginTop: -6,
    minWidth: 43,
    height: 19,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e72c73',
  },
  previewLiveText: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.5,
  },
  previewCreatorCopy: {
    marginLeft: 0,
    paddingTop: 3,
    flexShrink: 1,
  },
  previewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  previewCreatorName: {
    color: '#fff',
    ...fontSize.b2,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  previewHandle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  previewViewerBadge: {
    alignSelf: 'flex-start',
    height: 25,
    marginTop: 0,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18,21,33,0.78)',
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewViewerText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  previewLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  previewLikesText: {
    color: 'rgba(255,255,255,0.92)',
    ...fontSize.b5,
    fontFamily: 'Inter_500Medium',
  },
  previewFollowPanel: {
    position: 'absolute',
    right: 14,
    zIndex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewFollowButton: {
    minWidth: 40,
    height: 25,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderColor: 'rgba(255,93,166,0.8)',
  },
  previewFollowingButton: {
    borderColor: 'rgba(255,255,255,0.18)',
  },
  previewFollowText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  previewFireBadge: {
    height: 37,
    paddingHorizontal: 11,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(18,18,24,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewFireText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  previewCategoryRow: {
    position: 'absolute',
    top: 145,
    left: 14,
    maxWidth: '72%',
    flexDirection: 'row',
    gap: 7,
  },
  previewChip: {
    height: 31,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,22,31,0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewChipText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  previewPromoRail: {
    position: 'absolute',
    top: 188,
    right: 13,
    width: 126,
    gap: 10,
  },
  previewGoalCard: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(17,14,21,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  previewGoalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewGoalLabel: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  previewGoalLevel: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 3,
  },
  previewProgressTrack: {
    height: 5,
    marginTop: 9,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  previewGoalCount: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 6,
  },
  previewFestCard: {
    alignSelf: 'flex-end',
    width: 94,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(23,18,28,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  previewFestBrand: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  previewFestTitle: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  previewFestDivider: {
    width: '70%',
    height: 1,
    marginVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  previewFestTime: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  previewActivityArea: {
    position: 'absolute',
    zIndex: 7,
    left: 14,
    right: 82,
    bottom: 74,
  },
  previewCommentLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingRight: 4,
  },
  previewCommentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  previewCommentAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  previewCommentInitial: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  previewCommentCopy: {
    flex: 1,
    paddingTop: 1,
  },
  previewCommentAuthor: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  previewCommentBody: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'PlusJakartaSans-Regular',
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 3,
  },
  previewHostMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 2,
    paddingVertical: 5,
  },
  previewHostMark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10141c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  previewHostMarkText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  previewHostTag: {
    color: '#fff',
    backgroundColor: '#d22670',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  previewHeartTrail: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  previewActionRail: {
    position: 'absolute',
    right: 11,
    bottom: 76,
    alignItems: 'center',
    gap: 9,
  },
  previewRailItem: {
    alignItems: 'center',
    gap: 2,
  },
  previewLikeButton: {
    width: 51,
    height: 51,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  previewRailButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,18,24,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  previewRailCount: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    textShadowColor: '#000',
    textShadowRadius: 3,
  },
  previewBottomDock: {
    position: 'absolute',
    zIndex: 10,
    left: 14,
    right: 14,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewComposer: {
    flex: 1,
    minWidth: 130,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,18,23,0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  previewInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Regular',
    paddingVertical: 0,
  },
  previewDockAction: {
    width: 47,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDockLabel: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 1,
  },
});

export default LiveFeed;
