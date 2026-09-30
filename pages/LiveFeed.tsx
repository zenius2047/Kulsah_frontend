import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, ImageBackground, Keyboard, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { fontSize } from './typography';
import { useFollowCreatorMutation } from '../src/hooks/general/useGeneralMutations';
import { patchCachedLiveSession, useCommentOnLive, useLiveDiscovery, useLiveParticipants } from '../src/hooks/live/useLive';
import { useLiveDirectoryRealtime } from '../src/hooks/live/useLiveDirectoryRealtime';
import { useLiveRealtime } from '../src/hooks/live/useLiveRealtime';
import { liveApi } from '../src/api/live.api';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import { useAuthStore } from '../src/store/auth.store';
import type { LiveBattle, LiveComment, LiveCredentials, LiveParticipants, LiveSession } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { createLiveIdempotencyKey, flattenLivePages, formatLiveCount } from '../src/utils/live';
import { useKulCoinWallet } from '../src/hooks/kulcoin/useKulCoin';
import { queryClient } from '../src/lib/queryClient';
import { CreatorBattleFeedStage as CreatorBattleScreen } from './CreatorBattleScreen';

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


// type JoinLiveModalProps = {
//   visible: boolean;
//   hostName: string;
//   hostHandle: string;
//   hostAvatar?: string;
//   onRequest: () => void;
//   onClose: () => void;
//   requesting?: boolean;
// };

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

const votePackages = [
  { votes: 1, label: '1 Vote', icon: 'local-florist', color: '#ff3d83' },
  { votes: 10, label: '10 Votes', icon: 'favorite', color: '#ff2b83' },
  { votes: 50, label: '50 Votes', icon: 'emoji-events', color: '#ffc83d' },
  { votes: 100, label: '100 Votes', icon: 'rocket-launch', color: '#8b5cf6' },
] as const;

type VoteTarget = {
  key: 'left' | 'right';
  targetUserId: number;
  name: string;
  username?: string | null;
  avatar?: string | null;
  score: number;
  color: string;
};

type BattleVoteSheet = {
  card: LiveCard;
  battle?: LiveBattle | null;
  opponent?: LiveCard | null;
  opponentParticipant?: NonNullable<LiveParticipants['battle_stage']>['participants'][number] | null;
};

const battleTargets = (sheet: BattleVoteSheet): VoteTarget[] => {
  const { card, battle, opponent, opponentParticipant } = sheet;
  if (!battle) return [];
  const currentCreatorId = Number(card.liveSession?.creator?.id ?? 0);
  const currentIsCreatorSide = currentCreatorId === Number(battle.creator_id);
  const currentScore = Number(currentIsCreatorSide ? battle.creator_score : battle.opponent_score);
  const opponentScore = Number(currentIsCreatorSide ? battle.opponent_score : battle.creator_score);
  const otherUserId = Number(currentIsCreatorSide ? battle.opponent_id : battle.creator_id);
  const otherProfile = currentIsCreatorSide ? battle.opponent : battle.creator;
  return [
    {
      key: 'left', targetUserId: currentCreatorId, name: card.host,
      username: card.liveSession?.creator?.username, avatar: card.hostAvatar,
      score: currentScore, color: '#ff2b83',
    },
    {
      key: 'right', targetUserId: otherUserId,
      name: opponent?.host ?? opponentParticipant?.name ?? otherProfile?.name ?? otherProfile?.username ?? 'Opponent',
      username: opponent?.liveSession?.creator?.username ?? opponentParticipant?.username ?? otherProfile?.username,
      avatar: opponent?.hostAvatar || opponentParticipant?.avatar || otherProfile?.avatar,
      score: opponentScore, color: '#0a93ff',
    },
  ];
};

type LiveCardOverlayProps = {
  card: LiveCard;
  battle?: LiveBattle | null;
  battleMode?: boolean;
  comments: ChatMessage[];
  commentValue: string;
  composerLift: number;
  compact: boolean;
  showViewerControls: boolean;
  canComment: boolean;
  canLike: boolean;
  isCommentSending: boolean;
  isLikeSending: boolean;
  onCommentChange: (value: string) => void;
  onCommentFocus: () => void;
  onCommentBlur: () => void;
  onCommentSubmit: () => void;
  onGift: () => void;
  onLike: () => void;
  onRequest: () => void;
  onVote: () => void;
};

const LiveCardOverlay: React.FC<LiveCardOverlayProps> = ({
  card,
  battle,
  battleMode = false,
  comments,
  commentValue,
  composerLift,
  compact,
  showViewerControls,
  canComment,
  canLike,
  isCommentSending,
  isLikeSending,
  onCommentChange,
  onCommentFocus,
  onCommentBlur,
  onCommentSubmit,
  onGift,
  onLike,
  onRequest,
  onVote,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();
  const followCreator = useFollowCreatorMutation();
  const [isFollowing, setIsFollowing] = useState(Boolean(card.liveSession?.creator?.is_following));
  const creator = card.liveSession?.creator;
  const handle = creator?.handle ?? creator?.username ?? card.host.toLowerCase().replace(/\s+/g, '');
  const giftValue = card.liveSession?.gift_value_kc ?? 0;
  const goalProgress = `${Math.max(8, Math.min(100, (giftValue / 1000) * 100))}%` as `${number}%`;
  const isBattle = battleMode || Boolean(battle);

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
          <Pressable accessibilityLabel="More" style={styles.previewClearButton} onPress={(event) => event.stopPropagation()}>
            <MaterialIcons name="more-horiz" size={26} color="#fff" />
          </Pressable>
        </View> */}
      </View>

      {showViewerControls && !isBattle ? (
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

      {showViewerControls && !isBattle ? (
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
        <Pressable disabled={!canLike || isLikeSending} style={[styles.previewDockAction, (!canLike || isLikeSending) && styles.dockActionDisabled]} onPress={onLike}>
          {isLikeSending ? <ActivityIndicator size="small" color="#ff3277" /> : <MaterialIcons name="favorite" size={27} color="#ff3277" />}
          <Text style={styles.previewDockLabel}>{card.likes}</Text>
        </Pressable>
        {isBattle ? (
          <Pressable style={styles.previewDockAction} onPress={onVote}>
            <LinearGradient colors={['#ff2b83', '#9333ea']} style={styles.voteDockButton}>
              <MaterialIcons name="how-to-vote" size={20} color="#fff" />
            </LinearGradient>
            <Text style={styles.previewDockLabel}>Vote</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.previewDockAction} onPress={onRequest}>
            <MaterialIcons name="group" size={26} color="#fff" />
            <Text style={styles.previewDockLabel}>Guests</Text>
          </Pressable>
        )}
        <Pressable accessibilityLabel="More" style={styles.previewDockAction} onPress={(event) => event.stopPropagation()}>
          <MaterialIcons name="more-horiz" size={27} color="#fff" />
          <Text style={styles.previewDockLabel}>More</Text>
        </Pressable>
      </View>
    </View>

  );
};

const LiveFeed: React.FC = () => {
  const navigation = useNavigation();
  const [requestCard, setRequestCard] = useState<LiveCard | null>(null);
  const requestInFlight = useRef(false);
  const shownInvitations = useRef(new Set<string>());
  const handedOffLiveId = useRef<string | null>(null);
  const voteScale = useRef(new Animated.Value(0)).current;
  const { isDark, theme } = useThemeMode();
  const isFeedFocused = useIsFocused();
  const viewportHeight = Dimensions.get('screen').height;
  const creatorStripHeight = 0;
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
  const [hostHandle, setHostHandle] = useState<string>("");
  const [hostAvatar, setHostAvatar] = useState<string>("");
  const [hostName, setHostName] = useState<string>("");
  const [requesting, setRequesting] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [voteSheet, setVoteSheet] = useState<BattleVoteSheet | null>(null);
  const [selectedTargetKey, setSelectedTargetKey] = useState<'left' | 'right'>('left');
  const [selectedVotes, setSelectedVotes] = useState(1);
  const [confirmVoteOpen, setConfirmVoteOpen] = useState(false);
  const [voteSending, setVoteSending] = useState(false);
  const [likeSendingCardId, setLikeSendingCardId] = useState<string | null>(null);
  const [voteSuccess, setVoteSuccess] = useState<{ name: string; votes: number } | null>(null);
  const liveCardsRef = useRef<LiveCard[]>([]);
  const liveQuery = useLiveDiscovery();
  const walletQuery = useKulCoinWallet(Boolean(voteSheet || confirmVoteOpen));
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
      if (handedOffLiveId.current) {
        if (handedOffLiveId.current !== liveId) void liveApi.leave(liveId).catch(() => undefined);
        return;
      }
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
  const participantInbox = useLiveParticipants(activeCardId ?? '', isFeedFocused && joinedLiveCardId === activeCardId);
  const activeBattle = useMemo(() => (
    participantInbox.data?.battles.find((battle) => battle.status === 'active') ?? null
  ), [participantInbox.data?.battles]);
  const opponentForBattle = useCallback((card: LiveCard, battle?: LiveBattle | null) => {
    if (!battle) return null;
    const currentCreatorId = Number(card.liveSession?.creator?.id ?? 0);
    const opponentCreatorId = currentCreatorId === Number(battle.creator_id)
      ? Number(battle.opponent_id)
      : Number(battle.creator_id);
    return liveCards.find((candidate) => Number(candidate.liveSession?.creator?.id ?? 0) === opponentCreatorId) ?? null;
  }, [liveCards]);
  const openLiveScreen = useCallback((card: LiveCard, options: { openGuests?: boolean; openGift?: boolean } = {}) => {
    if (!card.liveSession) return;
    clearAutoJoinTimer();
    handedOffLiveId.current = card.liveSession.id;
    const previousId = joinedLiveCardIdRef.current;
    if (previousId && previousId !== card.liveSession.id) void liveApi.leave(previousId).catch(() => undefined);
    joinedLiveCardIdRef.current = null;
    setJoinedLiveCardId(null);
    navigation.navigate('LiveStream', { liveSessionId: card.liveSession.id, initialLive: card.liveSession, ...options });
  }, [clearAutoJoinTimer, navigation]);

  useEffect(() => {
    if (isFeedFocused) handedOffLiveId.current = null;
  }, [isFeedFocused]);

  useEffect(() => {
    if (!isFeedFocused || !activeCardId) return;
    const invitation = participantInbox.data?.requests.find((request) =>
      request.status === 'accepted' || (request.status === 'pending' && request.requested_by_id !== request.requester_id));
    if (!invitation) return;
    const key = `${activeCardId}:${invitation.id}:${invitation.status}:${invitation.expires_at}`;
    if (shownInvitations.current.has(key)) return;
    const card = liveCardsRef.current.find((item) => item.id === activeCardId);
    if (!card) return;
    shownInvitations.current.add(key);
    Alert.alert('Join as co-host', `${card.host} ${invitation.status === 'accepted' ? 'approved your request' : 'invited you to co-host'}. Review the invitation to join with your camera and microphone.`, [
      { text: 'Later', style: 'cancel' },
      { text: 'Decline', onPress: () => {
        void liveApi.declineCohost(invitation.id).then(() => participantInbox.refetch())
          .catch((error) => Alert.alert('Unable to decline', getApiErrorMessage(error)));
      } },
      { text: 'Review invitation', onPress: () => openLiveScreen(card, { openGuests: true }) },
    ]);
  }, [activeCardId, isFeedFocused, participantInbox.dataUpdatedAt, openLiveScreen]);

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
    () => liveCards.map((_, index) => index * viewportHeight),
    [liveCards.length, viewportHeight],
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

  const sendLiveLike = async (card: LiveCard) => {
    if (!card.liveSession || card.id !== joinedLiveCardId || likeSendingCardId === card.id) return;
    setLikeSendingCardId(card.id);
    try {
      const response = await liveApi.like(card.id, 1);
      patchCachedLiveSession(queryClient, card.id, { likes_count: response.data.data.likes_count });
    } catch (error) {
      Alert.alert('Like not sent', getApiErrorMessage(error));
    } finally {
      setLikeSendingCardId(null);
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
    openLiveScreen(card, { openGift: true });
  };

  const openVoteSheet = (card: LiveCard, battle?: LiveBattle | null) => {
    if (!battle || battle.status !== 'active') {
      Alert.alert('Voting unavailable', 'Voting opens when both creators have joined the battle.');
      return;
    }
    const opponent = opponentForBattle(card, battle);
    const currentCreatorId = Number(card.liveSession?.creator?.id ?? 0);
    const opponentCreatorId = battle
      ? Number(currentCreatorId === Number(battle.creator_id) ? battle.opponent_id : battle.creator_id)
      : 0;
    const opponentParticipant = participantInbox.data?.battle_stage?.participants
      .find((participant) => participant.user_id === opponentCreatorId) ?? null;
    setSelectedTargetKey('left');
    setSelectedVotes(1);
    setVoteSheet({ card, battle, opponent, opponentParticipant });
  };

  const currentVoteTargets = useMemo(() => {
    if (!voteSheet) return [];
    const latestBattle = participantInbox.data?.battles.find((battle) => battle.id === voteSheet.battle?.id);
    return battleTargets({ ...voteSheet, battle: latestBattle ?? voteSheet.battle });
  }, [participantInbox.data?.battles, voteSheet]);
  const selectedVoteTarget = currentVoteTargets.find((target) => target.key === selectedTargetKey) ?? currentVoteTargets[0];
  const selectedPackage = votePackages.find((item) => item.votes === selectedVotes) ?? votePackages[0];
  const votePrice = Math.max(1, Number(participantInbox.data?.vote_price_kc ?? 10));
  const voteCoinCost = votePrice * selectedVotes;
  const canSendVote = Boolean(
    voteSheet?.battle?.status === 'active'
    && selectedVoteTarget?.targetUserId
    && Number(walletQuery.data?.total_kc ?? 0) >= voteCoinCost,
  );

  const sendBattleVote = async () => {
    if (!voteSheet?.battle?.id || !selectedVoteTarget?.targetUserId || !canSendVote || voteSending) return;
    setVoteSending(true);
    try {
      await liveApi.voteBattle(voteSheet.battle.id, {
        target_user_id: selectedVoteTarget.targetUserId,
        vote_count: selectedVotes,
        idempotency_key: createLiveIdempotencyKey(String(voteSheet.battle.id), `battle-vote-${selectedVoteTarget.targetUserId}-${selectedVotes}`),
      });
      setConfirmVoteOpen(false);
      setVoteSheet(null);
      setVoteSuccess({ name: selectedVoteTarget.name, votes: selectedVotes });
      voteScale.setValue(0);
      Animated.sequence([
        Animated.spring(voteScale, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
        Animated.delay(1500),
        Animated.timing(voteScale, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setVoteSuccess(null);
      });
      void participantInbox.refetch();
      void walletQuery.refetch();
    } catch (error) {
      Alert.alert('Vote not sent', getApiErrorMessage(error));
    } finally {
      setVoteSending(false);
    }
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
    const cardBattle = card.id === activeCardId ? activeBattle : null;
    const isBattleLive = Boolean(cardBattle || card.liveSession?.is_battle || card.liveSession?.live_type === 'battle');
    const cardOpponent = opponentForBattle(card, cardBattle);
    const currentCreatorId = Number(card.liveSession?.creator?.id ?? 0);
    const opponentCreatorId = cardBattle
      ? Number(currentCreatorId === Number(cardBattle.creator_id) ? cardBattle.opponent_id : cardBattle.creator_id)
      : 0;
    const cardBattleStage = card.id === activeCardId ? participantInbox.data?.battle_stage : null;
    const stageOpponent = cardBattleStage?.participants.find((participant) => participant.user_id === opponentCreatorId);

    const overlay = (
      <>
        <View style={styles.cardTint} />
        <LiveCardOverlay
          card={card}
          battle={cardBattle}
          battleMode={isBattleLive}
          comments={cardComments}
          commentValue={commentDrafts[card.id] ?? ''}
          composerLift={composerLift}
          compact={cardHeight < 680 || Dimensions.get('window').width < 375}
          showViewerControls={!isCreatorStripVisible}
          canComment={card.id === joinedLiveCardId}
          canLike={card.id === joinedLiveCardId}
          isCommentSending={card.id === activeCardId && commentLive.isPending}
          isLikeSending={likeSendingCardId === card.id}
          onCommentChange={(value) => setCommentDrafts((prev) => ({ ...prev, [card.id]: value }))}
          onCommentFocus={() => setFocusedCardId(card.id)}
          onCommentBlur={() => {
            if (keyboardHeight === 0) setFocusedCardId(null);
          }}
          onCommentSubmit={() => void sendLiveComment(card)}
          onGift={() => openGiftDialog(card)}
          onLike={() => void sendLiveLike(card)}
          onRequest={() => {
            setRequestCard(card);
            setHostName(card.host);
            setHostAvatar(card.hostAvatar ?? '');
            setHostHandle(card.liveSession?.creator?.handle ?? card.liveSession?.creator?.username ?? card.host.toLowerCase().replace(/\s+/g, ''));
            setVisible(true);
          }}
          onVote={() => openVoteSheet(card, cardBattle)}
        />
      </>
    );

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
          accessibilityHint="Double tap to join this live stream here"
          onPress={() => handleCardTap(card)}
          style={[styles.card, { height: '100%', paddingTop: isCreatorStripVisible && index !== 0 ? viewportHeight * 0.025 : 0 }]}
        >
          {isBattleLive && card.liveSession ? (
            <CreatorBattleScreen
              liveSession={card.liveSession}
              battle={cardBattle}
              battleStage={cardBattleStage}
              visible={index === activeIndex && isFeedFocused}
              creator={{
                id: currentCreatorId,
                name: card.host,
                username: card.liveSession.creator?.username,
                avatar: card.hostAvatar,
                verified: card.liveSession.creator?.verified,
                fallbackImage: card.background,
              }}
              opponent={{
                id: opponentCreatorId,
                name: cardOpponent?.host ?? stageOpponent?.name ?? stageOpponent?.username ?? 'Opponent',
                username: cardOpponent?.liveSession?.creator?.username ?? stageOpponent?.username,
                avatar: cardOpponent?.hostAvatar || stageOpponent?.avatar,
                verified: cardOpponent?.liveSession?.creator?.verified ?? stageOpponent?.verified,
                fallbackImage: cardOpponent?.background,
              }}
            >
              {overlay}
            </CreatorBattleScreen>
          ) : (
            <>
              <LiveCardPreview
                liveSession={card.liveSession}
                fallbackImage={card.background}
                isVisible={index === activeIndex && isFeedFocused}
              />
              {overlay}
            </>
          )}
        </Pressable>
      </View>
    );
  };

  const onRequest = async () => {
    if (!requestCard?.liveSession || requestInFlight.current) return;
    requestInFlight.current = true;
    setRequesting(true);
    try {
      await liveApi.requestCohost(requestCard.liveSession.id);
      setVisible(false);
      openLiveScreen(requestCard, { openGuests: true });
    } catch (error) {
      Alert.alert('Request not sent', getApiErrorMessage(error));
    } finally {
      requestInFlight.current = false;
      setRequesting(false);
    }
  };
  const onClose = ()=>{ setVisible(false);};

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
        {voteSuccess ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.voteSuccessToast,
              {
                opacity: voteScale,
                transform: [
                  { translateY: voteScale.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
                  { scale: voteScale.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
                ],
              },
            ]}
          >
            <MaterialIcons name="favorite" size={19} color="#ff2b83" />
            <Text style={styles.voteSuccessText}>You sent {voteSuccess.votes} vote{voteSuccess.votes === 1 ? '' : 's'}!</Text>
            <MaterialIcons name="close" size={18} color="#fff" />
          </Animated.View>
        ) : null}
        <Modal
          visible={Boolean(voteSheet) && !confirmVoteOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setVoteSheet(null)}
        >
          <View style={styles.voteOverlay}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setVoteSheet(null)} />
            <View style={styles.voteModal}>
              <View style={styles.voteModalHeader}>
                <Text style={styles.voteTitle}>Vote for your favourite creator</Text>
                <Pressable accessibilityLabel="Close vote modal" onPress={() => setVoteSheet(null)} style={styles.voteCloseButton}>
                  <MaterialIcons name="close" size={24} color="#cbd5e1" />
                </Pressable>
              </View>

              <View style={styles.voteContestants}>
                {currentVoteTargets.map((target, index) => {
                  const selected = target.key === selectedTargetKey;
                  return (
                    <Pressable
                      key={target.key}
                      onPress={() => setSelectedTargetKey(target.key)}
                      style={[styles.voteContestant, selected && { borderColor: target.color }]}
                    >
                      <LinearGradient colors={[target.color, '#1f2937']} style={styles.voteAvatarRing}>
                        {target.avatar ? (
                          <Image source={{ uri: target.avatar }} style={styles.voteAvatar} />
                        ) : (
                          <View style={[styles.voteAvatar, styles.voteAvatarFallback]}>
                            <Text style={styles.voteAvatarInitial}>{target.name.charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                      </LinearGradient>
                      <Text numberOfLines={1} style={styles.voteContestantName}>{target.name}</Text>
                      <Text numberOfLines={1} style={styles.voteContestantHandle}>@{target.username ?? target.name}</Text>
                      <Text style={styles.voteContestantScore}>{formatLiveCount(target.score)} votes</Text>
                      {index === 0 && currentVoteTargets.length > 1 ? <Text style={styles.voteVsInline}>VS</Text> : null}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.voteHint}>Support your creator using votes. Each vote counts toward the battle.</Text>

              <View style={styles.votePackageGrid}>
                {votePackages.map((item) => {
                  const selected = item.votes === selectedVotes;
                  const price = votePrice * item.votes;
                  return (
                    <Pressable
                      key={item.votes}
                      onPress={() => setSelectedVotes(item.votes)}
                      style={[styles.votePackage, selected && styles.votePackageSelected]}
                    >
                      <MaterialIcons name={item.icon as any} size={31} color={item.color} />
                      <Text style={styles.votePackageLabel}>{item.label}</Text>
                      <View style={styles.voteCoinRow}>
                        <MaterialIcons name="monetization-on" size={13} color="#ffca45" />
                        <Text style={styles.votePackagePrice}>{price}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.voteFooter}>
                <View style={styles.voteBalance}>
                  <MaterialIcons name="monetization-on" size={18} color="#ffca45" />
                  <Text style={styles.voteBalanceText}>{formatLiveCount(walletQuery.data?.total_kc ?? 0)}</Text>
                </View>
                <Pressable onPress={() => setConfirmVoteOpen(true)} disabled={!canSendVote || walletQuery.isLoading} style={[styles.votePrimaryButton, (!canSendVote || walletQuery.isLoading) && styles.voteDisabled]}>
                  {walletQuery.isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.votePrimaryText}>{canSendVote ? 'Continue' : 'Insufficient coins'}</Text>}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={confirmVoteOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVoteOpen(false)}
        >
          <View style={styles.voteOverlay}>
            <View style={styles.confirmVoteModal}>
              <Pressable accessibilityLabel="Close confirm vote" onPress={() => setConfirmVoteOpen(false)} style={styles.confirmCloseButton}>
                <MaterialIcons name="close" size={24} color="#cbd5e1" />
              </Pressable>
              <View style={styles.confirmFlower}>
                <MaterialIcons name={selectedPackage.icon as any} size={70} color={selectedPackage.color} />
              </View>
              <Text style={styles.confirmTitle}>Send {selectedVotes} vote{selectedVotes === 1 ? '' : 's'} to {selectedVoteTarget?.name ?? 'creator'}?</Text>
              <Text style={styles.confirmSubtitle}>This will use {voteCoinCost} coin{voteCoinCost === 1 ? '' : 's'} and count as {selectedVotes} vote{selectedVotes === 1 ? '' : 's'}.</Text>
              <View style={styles.voteStepper}>
                <Pressable onPress={() => setSelectedVotes((value) => Math.max(1, value - 1))} style={styles.stepButton}>
                  <MaterialIcons name="remove" size={22} color="#fff" />
                </Pressable>
                <Text style={styles.stepValue}>{selectedVotes}</Text>
                <Pressable onPress={() => setSelectedVotes((value) => Math.min(100, value + 1))} style={styles.stepButton}>
                  <MaterialIcons name="add" size={22} color="#fff" />
                </Pressable>
              </View>
              <Pressable onPress={() => void sendBattleVote()} disabled={voteSending || !canSendVote} style={[styles.confirmSendButton, (voteSending || !canSendVote) && styles.voteDisabled]}>
                {voteSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmSendText}>Send ({voteCoinCost} Coin{voteCoinCost === 1 ? '' : 's'})</Text>}
              </Pressable>
              <Pressable onPress={() => setConfirmVoteOpen(false)} style={styles.confirmCancelButton}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>

          {/* Close */}
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🎥</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Request to Join Live
          </Text>

          <Text style={styles.description}>
            You’re asking to join this live stream as a guest.
          </Text>

          {/* Host */}
          <View style={styles.hostContainer}>
            {hostAvatar ? (
              <Image
                source={{ uri: hostAvatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {hostName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            <View>
              <Text style={styles.hostName}>
                {hostName}
              </Text>

              <Text style={styles.hostHandle}>
                @{hostHandle}
              </Text>
            </View>
          </View>

          {/* Information */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ⓘ</Text>

            <Text style={styles.infoText}>
              If the host accepts your request, your camera
              and microphone will become available.
            </Text>
          </View>

          {/* Request button */}
          <Pressable
            style={[
              styles.requestButton,
              requesting && styles.requestButtonDisabled,
            ]}
            onPress={onRequest}
            disabled={requesting}
          >
            <Text style={styles.requestButtonText}>
              {requesting ? 'Sending Request...' : 'Request to Join'}
            </Text>
          </Pressable>

          {/* Cancel */}
          <Pressable
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
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
  dockActionDisabled: {
    opacity: 0.45,
  },
  voteDockButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  previewDockLabel: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    marginTop: 1,
  },
  voteSuccessToast: {
    position: 'absolute',
    left: 96,
    right: 34,
    bottom: 154,
    zIndex: 50,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(18,20,28,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  voteSuccessText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    textAlign: 'center',
  },
  voteOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  voteModal: {
    margin: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: '#10141c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  voteModalHeader: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteTitle: {
    color: '#fff',
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  voteCloseButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteContestants: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  voteContestant: {
    width: 124,
    minHeight: 136,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  voteAvatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#10141c',
  },
  voteAvatarFallback: {
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voteAvatarInitial: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 29,
    fontFamily: 'Inter_700Bold',
  },
  voteContestantName: {
    marginTop: 8,
    color: '#fff',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'Inter_700Bold',
    maxWidth: '100%',
  },
  voteContestantHandle: {
    marginTop: 2,
    color: '#aeb6c5',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    maxWidth: '100%',
  },
  voteContestantScore: {
    color: '#e2e8f0',
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: 3,
  },
  voteVsInline: {
    position: 'absolute',
    right: -25,
    top: 52,
    color: '#ff4b98',
    fontSize: 22,
    lineHeight: 25,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
    zIndex: 3,
  },
  voteHint: {
    color: '#cbd5e1',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  votePackageGrid: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  votePackage: {
    flex: 1,
    minHeight: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  votePackageSelected: {
    borderColor: '#ff2b83',
    backgroundColor: 'rgba(255,43,131,0.12)',
  },
  votePackageLabel: {
    color: '#fff',
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
  },
  voteCoinRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  votePackagePrice: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  voteFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  voteBalance: {
    minWidth: 118,
    height: 45,
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  voteBalanceText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
  },
  votePrimaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2b83',
  },
  votePrimaryText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
  },
  voteDisabled: {
    opacity: 0.55,
  },
  confirmVoteModal: {
    margin: 18,
    borderRadius: 8,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#10141c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  confirmCloseButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmFlower: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTitle: {
    color: '#fff',
    marginTop: 10,
    fontSize: 19,
    lineHeight: 25,
    textAlign: 'center',
    fontFamily: 'Inter_700Bold',
  },
  confirmSubtitle: {
    color: '#cbd5e1',
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  voteStepper: {
    marginTop: 18,
    height: 43,
    minWidth: 164,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  stepButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    color: '#fff',
    minWidth: 58,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: 'Inter_700Bold',
  },
  confirmSendButton: {
    marginTop: 20,
    width: '100%',
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2b83',
  },
  confirmSendText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Inter_700Bold',
  },
  confirmCancelButton: {
    marginTop: 11,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancelText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 17,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },

  closeButton: {
    position: 'absolute',
    right: 20,
    top: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f3f3',
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 25,
    color: '#555',
    lineHeight: 28,
  },

  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1eaff',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },

  icon: {
    fontSize: 28,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },

  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f7f7f7',
    marginBottom: 16,
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
  },

  hostName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },

  hostHandle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },

  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#666',
  },

  requestButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6C3BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestButtonDisabled: {
    opacity: 0.6,
  },

  requestButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 6,
  },

  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#777',
  },
});

export default LiveFeed;
