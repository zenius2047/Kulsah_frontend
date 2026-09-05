import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import GiftDialog, { type GiftSelection } from '../components/GiftDialog';
import KulsahWhite from '../assets/icons/kulsah-white-svg.svg';
import { PRIMARY_COLOR } from '../theme';
import { liveApi } from '../src/api/live.api';
import { useFollowCreatorMutation } from '../src/hooks/general/useGeneralMutations';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import {
  useCommentOnLive,
  useGiftLive,
  useJoinLive,
  useLikeLive,
  useLiveSession,
} from '../src/hooks/live/useLive';
import { useLiveRealtime } from '../src/hooks/live/useLiveRealtime';
import { useKulCoinWallet } from '../src/hooks/kulcoin/useKulCoin';
import { useAuthStore } from '../src/store/auth.store';
import type {
  LiveComment,
  LiveCredentials,
  LiveRealtimeGift,
  LiveSession,
} from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { createLiveIdempotencyKey, formatLiveCount, isLiveTerminal } from '../src/utils/live';
import { fontSize } from './typography';

type ViewerLiveRoute = {
  params?: {
    liveSessionId?: string;
    initialLive?: LiveSession;
  };
};

const HEARTS = [
  { right: 4, bottom: 254, size: 20, color: '#6d16ad', rotate: '-9deg' },
  { right: 25, bottom: 292, size: 26, color: '#e3387b', rotate: '8deg' },
  { right: 2, bottom: 326, size: 17, color: '#8a1ec3', rotate: '-5deg' },
  { right: 28, bottom: 358, size: 15, color: '#d92d72', rotate: '11deg' },
  { right: 5, bottom: 394, size: 24, color: '#df3a80', rotate: '-8deg' },
] as const;

const DOUBLE_TAP_WINDOW_MS = 300;

const categoryLabel = (category?: string | null) => {
  if (!category) return 'Live';
  return category.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const ViewerLiveStream: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ViewerLiveRoute>();
  const { width, height } = useWindowDimensions();
  const liveSessionId = route.params?.liveSessionId ?? route.params?.initialLive?.id ?? '';
  const currentUser = useAuthStore((state) => state.user);
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [giftActivity, setGiftActivity] = useState<LiveRealtimeGift[]>([]);
  const [comment, setComment] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [hasJoinedPresence, setHasJoinedPresence] = useState(false);
  const [showLikeHearts, setShowLikeHearts] = useState(false);
  const joinStartedRef = useRef(false);
  const joinedPresenceRef = useRef(false);
  const commentScrollRef = useRef<ScrollView | null>(null);
  const lastStreamTapRef = useRef<number | null>(null);
  const heartAnimations = useRef(HEARTS.map(() => new Animated.Value(0))).current;

  const liveQuery = useLiveSession(liveSessionId, Boolean(liveSessionId));
  const live = liveQuery.data ?? route.params?.initialLive;
  const joinLive = useJoinLive(liveSessionId);
  const commentLive = useCommentOnLive(liveSessionId);
  const likeLive = useLikeLive(liveSessionId);
  const giftLive = useGiftLive(liveSessionId);
  const followCreator = useFollowCreatorMutation();
  const walletQuery = useKulCoinWallet(Boolean(liveSessionId));
  useLiveRealtime(liveSessionId, hasJoinedPresence, {
    onComment: (incomingComment) => {
      setComments((current) => current.some((item) => item.id === incomingComment.id)
        ? current
        : [...current, incomingComment]);
    },
    onGift: (incomingGift) => {
      setGiftActivity((current) => [
        incomingGift,
        ...current.filter((item) => item.transaction_id !== incomingGift.transaction_id),
      ].slice(0, 2));
    },
  });

  const agora = useAgoraLive({
    credentials,
    renewCredentials: async () => {
      const response = await joinLive.mutateAsync();
      setCredentials(response.credentials);
      return response.credentials;
    },
  });

  useEffect(() => {
    if (!liveSessionId || joinStartedRef.current) return;
    joinStartedRef.current = true;
    void joinLive.mutateAsync()
      .then((response) => {
        joinedPresenceRef.current = true;
        setHasJoinedPresence(true);
        setCredentials(response.credentials);
      })
      .catch(() => {
        joinStartedRef.current = false;
      });
  }, [liveSessionId]);

  useEffect(() => () => {
    if (liveSessionId && joinedPresenceRef.current) {
      void liveApi.leave(liveSessionId).catch(() => undefined);
    }
  }, [liveSessionId]);

  useEffect(() => {
    commentScrollRef.current?.scrollToEnd({ animated: true });
  }, [comments]);

  useEffect(() => {
    setIsFollowing(Boolean(live?.creator?.is_following));
  }, [live?.creator?.id, live?.creator?.is_following]);

  useEffect(() => () => {
    heartAnimations.forEach((animation) => animation.stopAnimation());
  }, [heartAnimations]);

  const creatorName = live?.creator?.name ?? 'Creator';
  const creatorHandle = live?.creator?.handle
    ?? live?.creator?.username
    ?? creatorName.toLowerCase().replace(/\s+/g, '');
  const terminal = isLiveTerminal(live?.status);
  const remoteUid = agora.remoteUids[0];
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  const isCompact = width < 375 || height < 720;
  const giftGoal = 1000;
  const giftProgress = Math.min(1, Math.max(0, (live?.gift_value_kc ?? 0) / giftGoal));
  const progressWidth = `${Math.max(8, giftProgress * 100)}%` as `${number}%`;
  const stateMessage = useMemo(() => {
    if (joinLive.isError) return getApiErrorMessage(joinLive.error);
    if (agora.error) return agora.error;
    if (terminal) return 'This Live has ended.';
    if (agora.connectionState === 'reconnecting') return 'Reconnecting to the Live...';
    return 'Connecting to the Live...';
  }, [agora.connectionState, agora.error, joinLive.error, joinLive.isError, terminal]);
  const insets = useSafeAreaInsets();
  const sendComment = async () => {
    const body = comment.trim();
    if (!body || commentLive.isPending) return;
    try {
      const created = await commentLive.mutateAsync(body);
      setComments((current) => current.some((item) => item.id === created.id)
        ? current
        : [...current, created]);
      setComment('');
    } catch (error) {
      Alert.alert('Comment not sent', getApiErrorMessage(error));
    }
  };

  const sendGift = async (gift: GiftSelection) => {
    await giftLive.mutateAsync({
      gift_id: Number(gift.id),
      quantity: 1,
      idempotency_key: createLiveIdempotencyKey(liveSessionId, 'gift'),
    });
  };

  const requestCohost = () => {
    void liveApi.requestCohost(liveSessionId, 'I would like to join this Live.')
      .then(() => Alert.alert('Request sent', 'The creator can now review your guest request.'))
      .catch((error) => Alert.alert('Request not sent', getApiErrorMessage(error)));
  };

  const shareLive = () => {
    void Share.share({
      title: `${creatorName} is live on Kulsah`,
      message: `Watch ${creatorName} live on Kulsah${live?.title ? ` — ${live.title}` : '.'}`,
    });
  };

  const toggleFollow = () => {
    if (!live?.creator?.id || String(live.creator.id) === String(currentUser?.id)) return;
    const nextFollowing = !isFollowing;
    setIsFollowing(nextFollowing);
    followCreator.mutate(
      { creator: live.creator.id, following: nextFollowing },
      { onError: () => setIsFollowing(!nextFollowing) },
    );
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    agora.setRemoteAudioMuted(next);
  };

  const playLikeHearts = () => {
    heartAnimations.forEach((animation) => {
      animation.stopAnimation();
      animation.setValue(0);
    });
    setShowLikeHearts(true);
    Animated.stagger(
      70,
      heartAnimations.map((animation) => Animated.timing(animation, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      })),
    ).start(({ finished }) => {
      if (finished) setShowLikeHearts(false);
    });
  };

  const handleStreamTap = () => {
    if (terminal || likeLive.isPending) return;

    const now = Date.now();
    const previousTap = lastStreamTapRef.current;
    if (previousTap === null || now - previousTap > DOUBLE_TAP_WINDOW_MS) {
      lastStreamTapRef.current = now;
      return;
    }

    lastStreamTapRef.current = null;
    playLikeHearts();
    void likeLive.mutateAsync(1).catch(() => undefined);
  };

  const openMoreActions = () => {
    Alert.alert('Live options', undefined, [
      { text: isMuted ? 'Unmute Live' : 'Mute Live', onPress: toggleMute },
      { text: 'Request to join as guest', onPress: requestCohost },
      {
        text: 'Report Live',
        style: 'destructive',
        onPress: () => {
          void liveApi.report(liveSessionId, { category: 'inappropriate_content' })
            .then(() => Alert.alert('Report received', 'Thank you. Our moderation team will review it.'))
            .catch((error) => Alert.alert('Report not sent', getApiErrorMessage(error)));
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const closeLive = () => {
    if (liveSessionId && joinedPresenceRef.current) {
      joinedPresenceRef.current = false;
      setHasJoinedPresence(false);
      void liveApi.leave(liveSessionId).catch(() => undefined);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.screen} edges={[]}>
        <View style={styles.media}>
          {remoteUid != null ? (
            <RtcVideoView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />
          ) : live?.cover_url ? (
            <Image source={{ uri: live.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#23102f', '#090d19', '#020204']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.72)', 'transparent', 'transparent', 'rgba(0,0,0,0.94)']}
            locations={[0, 0.24, 0.54, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            accessibilityLabel="Like live stream"
            accessibilityHint="Double tap the stream to like it"
            onPress={handleStreamTap}
            style={styles.doubleTapArea}
          />

          {/* <View style={styles.brandHeader}>
            <Pressable accessibilityLabel="Leave live stream" hitSlop={10} style={styles.clearButton} onPress={closeLive}>
              <MaterialIcons name="arrow-back-ios-new" size={25} color="#fff" />
            </Pressable>
            <View pointerEvents="none" style={styles.logoWrap}>
              <KulsahWhite width={104} height={46} />
            </View>
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Share live stream" hitSlop={10} style={styles.clearButton} onPress={shareLive}>
                <MaterialIcons name="ios-share" size={27} color="#fff" />
              </Pressable>
              <Pressable accessibilityLabel="More live options" hitSlop={10} style={styles.clearButton} onPress={openMoreActions}>
                <MaterialIcons name="more-horiz" size={27} color="#fff" />
              </Pressable>
            </View>
          </View> */}

          <View style={[styles.creatorPanel, { top: Platform.OS === 'ios' ? 54: insets.top + 15 }]}>
            <View style={styles.avatarColumn}>
              <LinearGradient colors={['#ff9a3d', '#f22575', '#6911b7']} style={styles.avatarRing}>
                {live?.creator?.avatar ? (
                  <Image source={{ uri: live.creator.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>{creatorName.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
              </LinearGradient>
              {/* <View style={styles.livePill}><Text style={styles.livePillText}>LIVE</Text></View> */}
            </View>
            <View style={styles.creatorCopy}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.creatorName}>{creatorName}</Text>
                {live?.creator?.verified ? <MaterialIcons name="verified" size={17} color="#fff" /> : null}
              </View>
              <View style={styles.creatorLikes}>
                <MaterialIcons name="favorite" size={13} color="#ff4d8d" />
                <Text numberOfLines={1} style={styles.creatorLikesText}>{formatLiveCount(live?.likes_count ?? 0)}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.followPanel, { top: Platform.OS === 'ios' ? 54: insets.top + 15}]}>
             <View style={styles.viewerBadge}>
                <MaterialIcons name="visibility" size={16} color="#fff" />
                <Text style={styles.viewerBadgeText}>{formatLiveCount(live?.current_viewers ?? 0)}</Text>
              </View>
            {String(live?.creator?.id ?? '') !== String(currentUser?.id ?? 'viewer') ? (
              <Pressable disabled={followCreator.isPending} onPress={toggleFollow} style={({ pressed }) => [pressed && styles.pressed]}>
                <LinearGradient
                  colors={isFollowing ? ['rgba(31,25,35,0.96)', 'rgba(31,25,35,0.96)'] : ['#e32b71', '#7508a9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.followButton, isFollowing && styles.followingButton]}
                >
                  {followCreator.isPending ? <ActivityIndicator size="small" color="#fff" /> : (
                    <Text style={styles.followText}>{isFollowing ? 'Following' : 'Follow'}</Text>
                  )}
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>

          {/* <View style={styles.categoryRow}>
            <View style={styles.categoryChip}>
              <MaterialIcons name={live?.category === 'music' ? 'music-note' : 'live-tv'} size={18} color="#fff" />
              <Text style={styles.categoryChipText}>{categoryLabel(live?.category)}</Text>
            </View>
            <View style={styles.categoryChip}>
              <MaterialIcons name="local-fire-department" size={18} color="#ff7628" />
              <Text style={styles.categoryChipText}>Original</Text>
            </View>
          </View> */}

          {/* {!isCompact ? (
            <View style={styles.promoRail} pointerEvents="none">
              <View style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View>
                    <Text style={styles.goalLabel}>Road to Star</Text>
                    <Text style={styles.goalLevel}>Level 3</Text>
                  </View>
                  <MaterialIcons name="star" size={37} color="#ffb526" />
                </View>
                <View style={styles.progressTrack}>
                  <LinearGradient colors={['#ff2e78', '#ff758b']} style={[styles.progressFill, { width: progressWidth }]} />
                </View>
                <Text style={styles.goalCount}>{formatLiveCount(live?.gift_value_kc ?? 0)} / 1K</Text>
              </View>
              <View style={styles.festCard}>
                <MaterialIcons name="redeem" size={36} color="#ff367e" />
                <Text style={styles.festBrand}>kulsah</Text>
                <Text style={styles.festTitle}>GIFT FEST</Text>
                <View style={styles.festDivider} />
                <Text style={styles.festTime}>LIVE</Text>
              </View>
            </View>
          ) : null} */}

          {remoteUid == null || terminal ? (
            <View pointerEvents="box-none" style={styles.connectionState}>
              <View style={styles.connectionCard}>
                {!terminal && !joinLive.isError && !agora.error ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <MaterialIcons name={terminal ? 'sensors-off' : 'error-outline'} size={26} color="#fff" />
                )}
                <Text style={styles.connectionText}>{stateMessage}</Text>
                {joinLive.isError ? (
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => {
                      joinStartedRef.current = false;
                      void joinLive.mutateAsync().then((response) => {
                        joinedPresenceRef.current = true;
                        setHasJoinedPresence(true);
                        setCredentials(response.credentials);
                      });
                    }}
                  >
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <View style={styles.activityArea}>
            {giftActivity.map((gift, index) => (
              <View key={gift.transaction_id} style={[styles.giftBubble, index === 0 && styles.pinnedGiftBubble]}>
                <View style={styles.activityAvatar}><MaterialIcons name="person" size={19} color="#fff" /></View>
                <View style={styles.activityCopy}>
                  <Text style={styles.activityName}>Viewer {index === 0 ? <Text style={styles.pinnedText}> • PINNED</Text> : null}</Text>
                  <Text style={styles.activityBody}>sent {gift.gift_name}  🎁  x {gift.quantity}</Text>
                </View>
              </View>
            ))}

            <ScrollView
              ref={commentScrollRef}
              style={[styles.comments, { maxHeight: isCompact ? 150 : 230 }]}
              contentContainerStyle={styles.commentsContent}
              showsVerticalScrollIndicator={false}
            >
              {comments.slice(-6).map((item) => (
                <View key={item.id} style={styles.commentLine}>
                  {item.user?.avatar ? (
                    <Image source={{ uri: item.user.avatar }} style={styles.commentAvatar} />
                  ) : (
                    <View style={[styles.commentAvatar, styles.commentAvatarFallback]}>
                      <Text style={styles.commentAvatarInitial}>{(item.user?.name ?? item.user?.username ?? 'Y').charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.commentCopy}>
                    <Text style={styles.commentAuthor}>{item.user?.name ?? item.user?.username ?? 'You'}</Text>
                    <Text style={styles.commentBody}>{item.body}</Text>
                  </View>
                </View>
              ))}
              {live?.description ? (
                <View style={styles.hostMessage}>
                  <View style={styles.hostAvatarMark}><Text style={styles.hostAvatarText}>kulsah</Text></View>
                  <View style={styles.commentCopy}>
                    <Text style={styles.commentAuthor}>{creatorHandle} <Text style={styles.hostTag}> Host </Text></Text>
                    <Text style={styles.commentBody}>{live.description}</Text>
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </View>

          {showLikeHearts ? (
            <View pointerEvents="none" style={styles.heartTrail}>
              {HEARTS.map((heart, index) => {
                const animation = heartAnimations[index];
                return (
                  <Animated.View
                    key={`${heart.bottom}-${index}`}
                    style={{
                      position: 'absolute',
                      right: heart.right,
                      bottom: heart.bottom,
                      opacity: animation.interpolate({
                        inputRange: [0, 0.12, 0.75, 1],
                        outputRange: [0, 1, 1, 0],
                      }),
                      transform: [
                        { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [18, -62] }) },
                        { scale: animation.interpolate({ inputRange: [0, 0.18, 1], outputRange: [0.4, 1.15, 0.9] }) },
                        { rotate: heart.rotate },
                      ],
                    }}
                  >
                    <MaterialIcons name="favorite" size={heart.size} color={heart.color} />
                  </Animated.View>
                );
              })}
            </View>
          ) : null}

          {/* <View style={styles.actionRail}>
            <View style={styles.railItem}>
              <Pressable disabled={terminal || likeLive.isPending} onPress={() => likeLive.mutate(1)}>
                <LinearGradient colors={['#ea377c', '#ce176b']} style={styles.likeButton}>
                  {likeLive.isPending ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="favorite" size={27} color="#fff" />}
                </LinearGradient>
              </Pressable>
              <Text style={styles.railCount}>{formatLiveCount(live?.likes_count ?? 0)}</Text>
            </View>
            <View style={styles.railItem}>
              <Pressable style={styles.railButton} onPress={shareLive}><MaterialIcons name="share" size={27} color="#fff" /></Pressable>
              <Text style={styles.railCount}>Share</Text>
            </View>
            {live?.gifts_enabled ? (
              <View style={styles.railItem}>
                <Pressable disabled={terminal} style={styles.railButton} onPress={() => setGiftOpen(true)}><MaterialIcons name="redeem" size={27} color="#fff" /></Pressable>
                <Text style={styles.railCount}>{formatLiveCount(live?.gifts_count ?? 0)}</Text>
              </View>
            ) : null}
            <Pressable style={styles.railButton} onPress={openMoreActions}><MaterialIcons name="more-horiz" size={28} color="#fff" /></Pressable>
          </View> */}

          <View style={styles.bottomDock}>
            <View style={styles.composer}>
              <TextInput
                value={comment}
                onChangeText={setComment}
                placeholder={live?.chat_enabled ? 'Say something...' : 'Chat is disabled'}
                placeholderTextColor="rgba(255,255,255,0.48)"
                editable={Boolean(live?.chat_enabled) && !terminal}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={() => void sendComment()}
              />
              <Pressable disabled={!comment.trim() || commentLive.isPending} onPress={() => void sendComment()}>
                {commentLive.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialIcons name={comment.trim() ? 'send' : 'sentiment-satisfied-alt'} size={25} color={comment.trim() ? PRIMARY_COLOR : '#fff'} />
                )}
              </Pressable>
            </View>
            {live?.gifts_enabled ? (
              <Pressable style={styles.dockAction} disabled={terminal} onPress={() => setGiftOpen(true)}>
                <MaterialIcons name="redeem" size={28} color="#ff3277" />
                <Text style={styles.dockLabel}>Gift</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.dockAction} disabled={terminal} onPress={requestCohost}>
              <MaterialIcons name="group" size={27} color="#fff" />
              <Text style={styles.dockLabel}>Guests</Text>
            </Pressable>
            <Pressable style={styles.dockAction} onPress={openMoreActions}>
              <MaterialIcons name="more-horiz" size={28} color="#fff" />
              <Text style={styles.dockLabel}>More</Text>
            </Pressable>
          </View>
        </View>

        <GiftDialog
          isOpen={giftOpen}
          onClose={() => setGiftOpen(false)}
          creatorName={creatorName}
          currentBalance={walletQuery.data?.total_kc ?? 0}
          onSendGift={sendGift}
          onGiftSent={() => void liveQuery.refetch()}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  screen: { flex: 1, backgroundColor: '#000' },
  media: { flex: 1, overflow: 'hidden', backgroundColor: '#050505' },
  doubleTapArea: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  brandHeader: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, zIndex: 8 },
  clearButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { position: 'absolute', left: '50%', marginLeft: -52, top: 3, width: 104, height: 46, alignItems: 'center', justifyContent: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  creatorPanel: { position: 'absolute', left: 14, zIndex: 7, flexDirection: 'row', alignItems: 'flex-start', maxWidth: '50%', gap: 3 },
  avatarColumn: { width: 38, alignItems: 'center' },
  avatarRing: { width: 36, height: 36, borderRadius: 28, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: '100%', height: '100%', borderRadius: 26, borderWidth: 1.5, borderColor: '#08050b' },
  avatarFallback: { backgroundColor: '#391343', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 19, fontFamily: 'PlusJakartaSans-Bold' },
  livePill: { marginTop: -6, minWidth: 44, height: 20, paddingHorizontal: 8, borderRadius: 10, backgroundColor: '#e72c73', alignItems: 'center', justifyContent: 'center' },
  livePillText: { color: '#fff', fontSize: 10, lineHeight: 13, fontFamily: 'PlusJakartaSans-Bold', letterSpacing: 0.5 },
  creatorCopy: { marginLeft: 0, paddingTop: 3, flexShrink: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  creatorName: { color: '#fff',...fontSize.b2, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', flexShrink: 1, letterSpacing: 0.2 },
  creatorLikes: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  creatorLikesText: { color: 'rgba(255,255,255,0.92)', ...fontSize.b5, fontFamily: 'Inter_500Medium' },
  viewerBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 25, marginTop: 0, borderRadius: 15, backgroundColor: 'rgba(18,21,33,0.78)', borderWidth: 0, borderColor: 'rgba(255,255,255,0.1)' },
  viewerBadgeText: { color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans-Medium' },
  followPanel: { position: 'absolute', top: 76, right: 14, zIndex: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  followButton: { minWidth: 40, height: 25, paddingHorizontal: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 0, borderColor: 'rgba(255,93,166,0.8)' },
  followingButton: { borderColor: 'rgba(255,255,255,0.18)' },
  followText: { color: '#fff', fontSize: 14, lineHeight: 18, fontFamily: 'PlusJakartaSans-SemiBold' },
  fireBadge: { height: 39, paddingHorizontal: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(18,18,24,0.88)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  fireText: { color: '#fff', fontSize: 13, fontFamily: 'PlusJakartaSans-Medium' },
  categoryRow: { position: 'absolute', top: 151, left: 14, zIndex: 7, flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '72%' },
  categoryChip: { height: 33, paddingHorizontal: 11, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(20,22,31,0.76)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  categoryChipText: { color: '#fff', fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans-Medium' },
  promoRail: { position: 'absolute', top: 199, right: 14, zIndex: 6, width: 137, alignItems: 'stretch', gap: 12 },
  goalCard: { padding: 12, borderRadius: 15, backgroundColor: 'rgba(17,14,21,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  goalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalLabel: { color: '#fff', fontSize: 11, lineHeight: 15, fontFamily: 'PlusJakartaSans-SemiBold' },
  goalLevel: { color: 'rgba(255,255,255,0.68)', fontSize: 10, lineHeight: 14, fontFamily: 'PlusJakartaSans-Regular', marginTop: 4 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 10 },
  progressFill: { height: '100%', borderRadius: 3 },
  goalCount: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontFamily: 'PlusJakartaSans-Medium', marginTop: 7 },
  festCard: { alignSelf: 'flex-end', width: 102, paddingVertical: 11, paddingHorizontal: 8, borderRadius: 15, alignItems: 'center', backgroundColor: 'rgba(23,18,28,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)' },
  festBrand: { color: '#fff', fontSize: 10, fontFamily: 'PlusJakartaSans-Regular', marginTop: 2 },
  festTitle: { color: '#fff', fontSize: 11, fontFamily: 'PlusJakartaSans-Bold' },
  festDivider: { width: '72%', height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 6 },
  festTime: { color: 'rgba(255,255,255,0.84)', fontSize: 10, fontFamily: 'PlusJakartaSans-Medium' },
  connectionState: { ...StyleSheet.absoluteFillObject, zIndex: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 38 },
  connectionCard: { maxWidth: 280, alignItems: 'center', gap: 9, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.42)' },
  connectionText: { color: '#fff', textAlign: 'center', ...fontSize.b5 },
  retryButton: { marginTop: 3, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  retryText: { color: '#fff', ...fontSize.b5 },
  activityArea: { position: 'absolute', zIndex: 7, left: 14, right: 82, bottom: 74 },
  giftBubble: { width: '92%', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 23, marginBottom: 7, backgroundColor: 'rgba(8,8,12,0.68)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  pinnedGiftBubble: { backgroundColor: 'rgba(35,20,28,0.7)' },
  activityAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  activityCopy: { flex: 1 },
  activityName: { color: '#fff', fontSize: 12, lineHeight: 16, fontFamily: 'PlusJakartaSans-SemiBold' },
  pinnedText: { color: '#ff347b', fontSize: 10, fontFamily: 'PlusJakartaSans-Bold' },
  activityBody: { color: '#fff', fontSize: 12, lineHeight: 17, fontFamily: 'PlusJakartaSans-Regular' },
  comments: { width: '100%' },
  commentsContent: { gap: 7, paddingTop: 4 },
  commentLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, paddingRight: 4 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  commentAvatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.13)' },
  commentAvatarInitial: { color: '#fff', fontSize: 12, fontFamily: 'PlusJakartaSans-Bold' },
  commentCopy: { flex: 1, paddingTop: 1 },
  commentAuthor: { color: '#fff', fontSize: 12, lineHeight: 15, fontFamily: 'PlusJakartaSans-SemiBold' },
  commentBody: { color: '#fff', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans-Regular', marginTop: 1, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3 },
  hostMessage: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 2, paddingVertical: 5 },
  hostAvatarMark: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10141c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  hostAvatarText: { color: '#fff', fontSize: 8, fontFamily: 'PlusJakartaSans-Bold' },
  hostTag: { color: '#fff', backgroundColor: '#d22670', fontSize: 9, fontFamily: 'PlusJakartaSans-Bold' },
  heartTrail: { ...StyleSheet.absoluteFillObject, zIndex: 5 },
  actionRail: { position: 'absolute', zIndex: 9, right: 12, bottom: 78, alignItems: 'center', gap: 10 },
  railItem: { alignItems: 'center', gap: 3 },
  likeButton: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  railButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,18,24,0.78)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  railCount: { color: '#fff', fontSize: 10, lineHeight: 13, fontFamily: 'PlusJakartaSans-Medium', textShadowColor: '#000', textShadowRadius: 3 },
  bottomDock: { position: 'absolute', zIndex: 10, left: 14, right: 14, bottom: 6, height: 58, flexDirection: 'row', alignItems: 'center', gap: 8 },
  composer: { flex: 1, minWidth: 130, height: 46, flexDirection: 'row', alignItems: 'center', borderRadius: 23, paddingHorizontal: 14, backgroundColor: 'rgba(16,18,23,0.84)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  input: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 17, fontFamily: 'PlusJakartaSans-Regular', paddingVertical: 0 },
  dockAction: { width: 47, height: 56, alignItems: 'center', justifyContent: 'center' },
  dockLabel: { color: '#fff', fontSize: 10, lineHeight: 13, fontFamily: 'PlusJakartaSans-Medium', marginTop: 1 },
  pressed: { opacity: 0.72 },
});

export default ViewerLiveStream;
