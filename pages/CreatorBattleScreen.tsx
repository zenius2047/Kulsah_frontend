import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RenderModeType, RtcSurfaceView, RtcTextureView, VideoSourceType } from 'react-native-agora';
import { liveApi } from '../src/api/live.api';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import {
  useCommentOnLive,
  useConfirmLive,
  useEndLive,
  useLiveParticipants,
  useLiveSession,
  useReconnectLive,
  useStartLive,
} from '../src/hooks/live/useLive';
import { useLiveRealtime } from '../src/hooks/live/useLiveRealtime';
import type {
  LiveBattle,
  LiveComment,
  LiveCredentials,
  LiveParticipants,
  LiveSession,
} from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { buildBattleTiles } from '../src/utils/liveBattle';
import { formatLiveCount } from '../src/utils/live';
import { isLiveTerminal } from '../src/utils/live';
import LiveParticipantsPanel from '../components/LiveParticipantsPanel';
import { useAuthStore } from '../src/store/auth.store';

export type CreatorBattlePerson = {
  id: number;
  name: string;
  username?: string | null;
  avatar?: string | null;
  verified?: boolean;
  fallbackImage?: string | null;
};

export type CreatorBattleFeedStageProps = {
  liveSession: LiveSession;
  battle?: LiveBattle | null;
  battleStage?: LiveParticipants['battle_stage'];
  creator: CreatorBattlePerson;
  opponent: CreatorBattlePerson;
  visible: boolean;
  children?: React.ReactNode;
};

const BattleFallback: React.FC<{ image?: string | null; side: 'creator' | 'opponent' }> = ({ image, side }) => (
  image ? (
    <Image source={{ uri: image }} resizeMode="contain" style={StyleSheet.absoluteFill} />
  ) : (
    <LinearGradient
      colors={side === 'creator' ? ['#3a102d', '#17101f', '#050505'] : ['#082f5b', '#111827', '#050505']}
      style={StyleSheet.absoluteFill}
    />
  )
);

export const CreatorBattleFeedStage: React.FC<CreatorBattleFeedStageProps> = ({
  liveSession,
  battle,
  battleStage,
  creator,
  opponent,
  visible,
  children,
}) => {
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const [clock, setClock] = useState(Date.now());
  const shouldPreview = isFocused && visible;
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;

  useEffect(() => {
    let cancelled = false;

    if (!shouldPreview) {
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
  }, [liveSession.id, shouldPreview]);

  const agora = useAgoraLive({
    credentials,
    enabled: shouldPreview && Boolean(credentials),
    remoteAudioMuted: true,
  });

  useEffect(() => {
    if (shouldPreview) agora.setRemoteAudioMuted(true);
  }, [agora.setRemoteAudioMuted, shouldPreview]);

  useEffect(() => {
    if (!battle?.started_at) return;
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [battle?.started_at]);

  const stage = useMemo(() => {
    const creatorRtcUid = battleStage?.participants.find((participant) => participant.user_id === creator.id)?.rtc_uid;
    const opponentRtcUid = battleStage?.participants.find((participant) => participant.user_id === opponent.id)?.rtc_uid;
    const creatorUid = agora.remoteUids.find((uid) => uid === creatorRtcUid) ?? agora.remoteUids[0];
    const opponentUid = agora.remoteUids.find((uid) => uid === opponentRtcUid)
      ?? agora.remoteUids.find((uid) => uid !== creatorUid);

    return { creatorUid, opponentUid };
  }, [agora.remoteUids, battleStage?.participants, creator.id, opponent.id]);

  const currentIsCreatorSide = !battle || creator.id === Number(battle.creator_id);
  const creatorScore = Number(battle ? (currentIsCreatorSide ? battle.creator_score : battle.opponent_score) : 0);
  const opponentScore = Number(battle ? (currentIsCreatorSide ? battle.opponent_score : battle.creator_score) : 0);
  const scoreTotal = creatorScore + opponentScore;
  const creatorShare = scoreTotal > 0
    ? Math.max(0.18, Math.min(0.82, creatorScore / scoreTotal))
    : 0.5;
  const opponentShare = 1 - creatorShare;
  const elapsedSeconds = battle?.started_at
    ? Math.max(0, Math.floor((clock - new Date(battle.started_at).getTime()) / 1000))
    : 0;
  const timeLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  return (
    <View style={styles.screen}>
      <View style={styles.videoRow}>
        <View style={styles.videoPane}>
          {stage.creatorUid != null && shouldPreview
            ? <RtcVideoView canvas={{ uid: stage.creatorUid, renderMode: RenderModeType.RenderModeFit }} style={StyleSheet.absoluteFill} />
            : <BattleFallback image={creator.fallbackImage} side="creator" />}
        </View>
        <View style={[styles.videoPane, styles.opponentPane]}>
          {stage.opponentUid != null && shouldPreview
            ? <RtcVideoView canvas={{ uid: stage.opponentUid, renderMode: RenderModeType.RenderModeFit }} style={StyleSheet.absoluteFill} />
            : <BattleFallback image={opponent.fallbackImage} side="opponent" />}
        </View>
      </View>

      <View pointerEvents="none" style={[styles.header, { top: Platform.OS === 'ios' ? 48 : insets.top + 8 }]}>
        <View style={styles.scoreRow}>
          <LinearGradient
            colors={['#ff2b83', '#c51667']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.scoreSide, { flex: creatorShare }]}
          >
            <Text style={styles.scoreText}>{formatLiveCount(creatorScore)}</Text>
          </LinearGradient>
          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
            <Text style={styles.timerText}>{timeLabel}</Text>
          </View>
          <LinearGradient
            colors={['#1264ff', '#0a93ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.scoreSide, styles.rightScore, { flex: opponentShare }]}
          >
            <Text style={[styles.scoreText, styles.rightScoreText]}>{formatLiveCount(opponentScore)}</Text>
          </LinearGradient>
        </View>

        <View style={styles.creatorRow}>
          <View style={styles.creatorIdentity}>
            {creator.avatar ? <Image source={{ uri: creator.avatar }} style={styles.avatar} /> : null}
            <Text numberOfLines={1} style={styles.creatorName}>{creator.name}</Text>
          </View>
          <View style={[styles.creatorIdentity, styles.opponentIdentity]}>
            <Text numberOfLines={1} style={styles.creatorName}>{opponent.name}</Text>
            {opponent.avatar ? <Image source={{ uri: opponent.avatar }} style={styles.avatar} /> : null}
          </View>
        </View>
      </View>

      {children}
    </View>
  );
};

type CreatorBattleRoute = {
  params?: {
    liveSessionId?: string;
    initialLive?: LiveSession;
    quality?: string;
    battleId?: string | number;
    participantRole?: 'host' | 'opponent';
  };
};

type BattleChatMessage = {
  id: number;
  user: string;
  text: string;
  avatar?: string | null;
  gift?: boolean;
};

type ParticipantStageProps = {
  stage?: LiveParticipants['battle_stage'];
  credentials: LiveCredentials | null;
  remoteUids: number[];
  localPreviewReady: boolean;
  currentUserId?: number;
  currentUserName: string;
  currentUserAvatar?: string | null;
};

type ParticipantTile = NonNullable<LiveParticipants['battle_stage']>['participants'][number] & {
  local: boolean;
  connected: boolean;
};

const DraggableBattleTile: React.FC<{
  index: number;
  onTap: () => void;
  children: React.ReactNode;
}> = ({ index, onTap, children }) => {
  const { width, height } = useWindowDimensions();
  const position = useRef(new Animated.ValueXY({ x: Math.max(12, width - 132), y: 104 + (index * 170) })).current;
  const origin = useRef({ x: Math.max(12, width - 132), y: 104 + (index * 170) });
  const moved = useRef(false);

  useEffect(() => {
    const next = {
      x: Math.min(Math.max(12, origin.current.x), Math.max(12, width - 132)),
      y: Math.min(Math.max(72, origin.current.y), Math.max(72, height - 260)),
    };
    origin.current = next;
    position.setValue(next);
  }, [height, position, width]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
    onPanResponderGrant: () => { moved.current = false; },
    onPanResponderMove: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3) moved.current = true;
      position.setValue({ x: origin.current.x + gesture.dx, y: origin.current.y + gesture.dy });
    },
    onPanResponderRelease: (_event, gesture) => {
      if (!moved.current) {
        onTap();
        return;
      }
      const next = {
        x: Math.min(Math.max(12, origin.current.x + gesture.dx), Math.max(12, width - 132)),
        y: Math.min(Math.max(72, origin.current.y + gesture.dy), Math.max(72, height - 260)),
      };
      origin.current = next;
      Animated.spring(position, { toValue: next, useNativeDriver: false, bounciness: 5 }).start();
    },
    onPanResponderTerminate: () => position.setValue(origin.current),
  }), [height, onTap, position, width]);

  return <Animated.View
    {...panResponder.panHandlers}
    style={[styles.participantFloatingTile, { transform: position.getTranslateTransform() }]}
  >
    {children}
  </Animated.View>;
};

const ParticipantBattleStage: React.FC<ParticipantStageProps> = ({
  stage,
  credentials,
  remoteUids,
  localPreviewReady,
  currentUserId,
  currentUserName,
  currentUserAvatar,
}) => {
  const Video = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  const tiles = useMemo<ParticipantTile[]>(() => {
    if (stage) return buildBattleTiles(stage, credentials, remoteUids, localPreviewReady);
    return [{
      user_id: currentUserId ?? Number(credentials?.uid ?? 0),
      rtc_uid: Number(credentials?.uid ?? 0),
      name: currentUserName,
      avatar: currentUserAvatar,
      accepted: true,
      local: true,
      connected: Boolean(credentials && localPreviewReady),
    }];
  }, [credentials, currentUserAvatar, currentUserId, currentUserName, localPreviewReady, remoteUids, stage]);
  const localTile = tiles.find((tile) => tile.local) ?? tiles.find((tile) => tile.user_id === currentUserId) ?? tiles[0];
  const [mainUserId, setMainUserId] = useState<number | null>(null);

  useEffect(() => {
    if (mainUserId == null && localTile) setMainUserId(localTile.user_id);
    if (mainUserId != null && !tiles.some((tile) => tile.user_id === mainUserId) && localTile) setMainUserId(localTile.user_id);
  }, [localTile, mainUserId, tiles]);

  const mainTile = tiles.find((tile) => tile.user_id === mainUserId) ?? localTile;
  const floatingTiles = tiles.filter((tile) => tile.user_id !== mainTile?.user_id);

  const tileContent = (tile: ParticipantTile, floating = false) => <>
    {tile.connected ? <Video
      canvas={{
        uid: tile.local ? 0 : tile.rtc_uid,
        sourceType: tile.local ? VideoSourceType.VideoSourceCameraPrimary : VideoSourceType.VideoSourceRemote,
        renderMode: RenderModeType.RenderModeHidden,
      }}
      style={StyleSheet.absoluteFill}
    /> : <LinearGradient colors={tile.local ? ['#471333', '#170b19'] : ['#07336b', '#07101f']} style={StyleSheet.absoluteFill}>
      <View style={styles.participantTileWaiting}>
        {tile.avatar ? <Image source={{ uri: tile.avatar }} style={floating ? styles.participantFloatAvatar : styles.participantMainAvatar} /> : <MaterialIcons name="person" size={floating ? 30 : 58} color="rgba(255,255,255,0.72)" />}
        <Text numberOfLines={1} style={floating ? styles.participantFloatWaitingText : styles.participantMainWaitingText}>{tile.local ? 'Preparing your camera…' : 'Connecting…'}</Text>
      </View>
    </LinearGradient>}
    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} style={styles.participantTileShade} />
    <View style={floating ? styles.participantFloatLabel : styles.participantMainLabel}>
      {tile.avatar ? <Image source={{ uri: tile.avatar }} style={styles.participantLabelAvatar} /> : null}
      <Text numberOfLines={1} style={styles.participantLabelText}>{tile.name}{tile.local ? ' · You' : ''}</Text>
    </View>
  </>;

  return <View style={StyleSheet.absoluteFill}>
    <View style={styles.participantMainVideo}>{mainTile ? tileContent(mainTile) : null}</View>
    {floatingTiles.map((tile, index) => <DraggableBattleTile key={tile.user_id} index={index} onTap={() => setMainUserId(tile.user_id)}>
      {tileContent(tile, true)}
      <View pointerEvents="none" style={styles.participantSwapHint}><MaterialIcons name="swap-vert" size={13} color="#fff" /></View>
    </DraggableBattleTile>)}
    {tiles.length === 1 ? <DraggableBattleTile index={0} onTap={() => undefined}>
      <LinearGradient colors={['#07336b', '#07101f']} style={StyleSheet.absoluteFill}>
        <View style={styles.participantTileWaiting}>
          <MaterialIcons name="person-add" size={30} color="rgba(255,255,255,0.74)" />
          <Text style={styles.participantFloatWaitingText}>Waiting for opponent</Text>
        </View>
      </LinearGradient>
    </DraggableBattleTile> : null}
  </View>;
};

const toChatMessage = (comment: LiveComment): BattleChatMessage => ({
  id: comment.id,
  user: comment.user?.name ?? comment.user?.username ?? 'Viewer',
  text: comment.body,
  avatar: comment.user?.avatar,
});

export type CreatorBattleScreenProps = {
  participantLayout?: boolean;
};

const CreatorBattleScreen: React.FC<CreatorBattleScreenProps> = ({ participantLayout = false }) => {
  const navigation = useNavigation<any>();
  const route = useRoute<CreatorBattleRoute>();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const liveSessionId = route.params?.liveSessionId ?? route.params?.initialLive?.id ?? '';
  const isOpponent = route.params?.participantRole === 'opponent';
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const permissionsGranted = Boolean(cameraPermission?.granted && microphonePermission?.granted);
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [chatMessages, setChatMessages] = useState<BattleChatMessage[]>([]);
  const [clock, setClock] = useState(Date.now());
  const [acceptingBattle, setAcceptingBattle] = useState(false);
  const [acceptanceError, setAcceptanceError] = useState<string | null>(null);
  const chatRef = useRef<ScrollView | null>(null);
  const startAttemptedRef = useRef(false);
  const confirmedRef = useRef(false);

  const liveQuery = useLiveSession(liveSessionId, Boolean(liveSessionId));
  const live = liveQuery.data ?? route.params?.initialLive;
  const participants = useLiveParticipants(liveSessionId, Boolean(liveSessionId) && !isLiveTerminal(live?.status));
  const startLive = useStartLive(liveSessionId);
  const confirmLive = useConfirmLive(liveSessionId);
  const reconnectLive = useReconnectLive(liveSessionId);
  const endLive = useEndLive(liveSessionId);
  const commentLive = useCommentOnLive(liveSessionId);
  const stage = participants.data?.battle_stage;
  const battle = participants.data?.battles.find((item) => item.status === 'active')
    ?? participants.data?.battles.find((item) => item.status === 'accepted')
    ?? participants.data?.battles.find((item) => item.status === 'pending')
    ?? null;
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;

  useLiveRealtime(liveSessionId, Boolean(liveSessionId), {
    onComment: (comment) => {
      setChatMessages((current) => current.some((item) => item.id === comment.id)
        ? current
        : [...current, toChatMessage(comment)]);
    },
    onGift: (gift) => {
      const id = -gift.transaction_id;
      setChatMessages((current) => current.some((item) => item.id === id) ? current : [...current, {
        id,
        user: `Viewer #${gift.sender_id}`,
        text: `sent ${gift.quantity}x ${gift.gift_name}`,
        gift: true,
      }]);
    },
  });

  const agora = useAgoraLive({
    credentials,
    enabled: permissionsGranted && Boolean(credentials) && !isLiveTerminal(live?.status),
    onJoined: async () => {
      if (isOpponent) return;
      if (confirmedRef.current) return;
      confirmedRef.current = true;
      try {
        await confirmLive.mutateAsync();
      } catch (error) {
        confirmedRef.current = false;
        setConnectionError(getApiErrorMessage(error));
      }
    },
    onReconnected: async () => {
      if (isOpponent) return;
      try {
        await reconnectLive.mutateAsync();
        await confirmLive.mutateAsync();
      } catch {
        // Agora keeps retrying while REST state is reconciled on the next heartbeat.
      }
    },
    renewCredentials: async () => {
      if (isOpponent) {
        const response = await liveApi.cohostCredentials(liveSessionId);
        setCredentials(response.data.data);
        return response.data.data;
      }
      const response = await startLive.mutateAsync();
      setCredentials(response.credentials);
      return response.credentials;
    },
  });

  useEffect(() => {
    if (isOpponent || !permissionsGranted || !liveSessionId || credentials || startAttemptedRef.current) return;
    startAttemptedRef.current = true;
    void startLive.mutateAsync()
      .then((response) => setCredentials(response.credentials))
      .catch((error) => {
        startAttemptedRef.current = false;
        setConnectionError(getApiErrorMessage(error));
      });
  }, [credentials, isOpponent, liveSessionId, permissionsGranted, startLive]);

  useEffect(() => {
    if (isOpponent || !liveSessionId || !credentials) return;
    const heartbeat = () => void liveApi.heartbeat(liveSessionId, {
      broadcast_state: agora.connectionState,
      network_quality: agora.networkQuality,
      audio_state: muted ? 'muted' : 'enabled',
      video_state: 'enabled',
      resolution: route.params?.quality ?? null,
    }).catch(() => undefined);
    heartbeat();
    const interval = setInterval(heartbeat, 10_000);
    return () => clearInterval(interval);
  }, [agora.connectionState, agora.networkQuality, credentials, isOpponent, liveSessionId, muted, route.params?.quality]);

  useEffect(() => {
    const interval = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages]);

  const orderedTiles = useMemo(() => {
    if (!stage) return [];
    const tiles = buildBattleTiles(stage, credentials, agora.remoteUids, agora.localPreviewReady);
    return [...tiles].sort((left, right) => Number(right.local) - Number(left.local));
  }, [agora.localPreviewReady, agora.remoteUids, credentials, stage]);
  const localParticipant = orderedTiles.find((tile) => tile.local) ?? stage?.participants.find((item) => item.user_id === currentUser?.id);
  const opponentParticipant = orderedTiles.find((tile) => !tile.local)
    ?? stage?.participants.find((item) => item.user_id !== currentUser?.id);
  const currentIsCreator = battle ? String(battle.creator_id) === String(currentUser?.id ?? live?.creator?.id) : true;
  const leftScore = Number(battle ? (currentIsCreator ? battle.creator_score : battle.opponent_score) : 0);
  const rightScore = Number(battle ? (currentIsCreator ? battle.opponent_score : battle.creator_score) : 0);
  const elapsed = battle?.started_at ? Math.max(0, Math.floor((clock - new Date(battle.started_at).getTime()) / 1000)) : 0;
  const timer = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  const toggleMuted = () => {
    setMuted((current) => {
      agora.setMuted(!current);
      return !current;
    });
  };

  const toggleCamera = () => {
    agora.switchCamera();
    setCameraFacing((current) => current === 'front' ? 'back' : 'front');
  };

  const sendComment = async () => {
    const body = commentText.trim();
    if (!body || commentLive.isPending) return;
    try {
      const comment = await commentLive.mutateAsync(body);
      setChatMessages((current) => current.some((item) => item.id === comment.id)
        ? current
        : [...current, toChatMessage(comment)]);
      setCommentText('');
    } catch (error) {
      Alert.alert('Message not sent', getApiErrorMessage(error));
    }
  };

  const endBattleLive = async () => {
    if (endLive.isPending) return;
    try {
      const ended = await endLive.mutateAsync('creator_ended');
      setShowEndConfirm(false);
      navigation.replace('StreamEnded', { liveSessionId, endedLive: ended });
    } catch (error) {
      Alert.alert('Could not end Live', getApiErrorMessage(error));
    }
  };

  const acceptInvitation = async () => {
    const battleId = route.params?.battleId ?? battle?.id;
    if (!battleId || acceptingBattle) return;
    setAcceptingBattle(true);
    setAcceptanceError(null);
    try {
      const response = await liveApi.acceptBattle(battleId);
      if (!response.data.credentials) throw new Error('Battle access could not be created.');
      setCredentials(response.data.credentials);
      await participants.refetch();
    } catch (error) {
      setAcceptanceError(getApiErrorMessage(error));
    } finally {
      setAcceptingBattle(false);
    }
  };

  const leaveBattle = async () => {
    try {
      if (credentials) await liveApi.leaveCohost(liveSessionId);
    } catch {
      // The Agora connection still closes when the screen unmounts.
    }
    setCredentials(null);
    navigation.goBack();
  };

  const cancelBeforeStart = async () => {
    if (isOpponent) {
      navigation.goBack();
      return;
    }
    try {
      if (liveSessionId) await endLive.mutateAsync('creator_ended');
    } catch {
      // Leaving the screen remains available if cleanup is retried by the backend.
    }
    navigation.navigate('MainTabs');
  };

  if (!permissionsGranted) {
    return <View style={styles.broadcastPermission}>
      <StatusBar hidden />
      {!cameraPermission || !microphonePermission ? <ActivityIndicator size="large" color="#fff" /> : <>
        <MaterialIcons name="videocam" size={44} color="#fff" />
        <Text style={styles.broadcastPermissionTitle}>Camera and microphone access needed</Text>
        <Text style={styles.broadcastPermissionCopy}>Enable both permissions to {isOpponent ? 'join the creator battle' : 'start your creator battle'}.</Text>
        <Pressable onPress={() => void Promise.all([requestCameraPermission(), requestMicrophonePermission()])} style={styles.broadcastPermissionPrimary}>
          <Text style={styles.broadcastControlText}>Enable Camera & Microphone</Text>
        </Pressable>
        <Pressable onPress={() => void cancelBeforeStart()} style={styles.broadcastPermissionCancel}>
          <Text style={styles.broadcastPermissionCancelText}>{isOpponent ? 'Not now' : 'Cancel battle'}</Text>
        </Pressable>
      </>}
    </View>;
  }

  const renderPane = (side: 'left' | 'right') => {
    const tile = side === 'left' ? orderedTiles[0] : orderedTiles[1];
    const fallbackName = side === 'left'
      ? localParticipant?.name ?? live?.creator?.name ?? currentUser?.name ?? 'You'
      : opponentParticipant?.name ?? 'Waiting for opponent';
    const fallbackAvatar = side === 'left'
      ? localParticipant?.avatar ?? live?.creator?.avatar ?? currentUser?.avatar
      : opponentParticipant?.avatar;
    return <View style={[styles.broadcastPane, side === 'right' && styles.broadcastRightPane]}>
      {tile?.connected ? <RtcVideoView
        canvas={{
          uid: tile.local ? 0 : tile.rtc_uid,
          sourceType: tile.local ? VideoSourceType.VideoSourceCameraPrimary : VideoSourceType.VideoSourceRemote,
          renderMode: RenderModeType.RenderModeHidden,
        }}
        style={StyleSheet.absoluteFill}
      /> : side === 'left' && credentials && agora.localPreviewReady ? <RtcVideoView
        canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCameraPrimary, renderMode: RenderModeType.RenderModeHidden }}
        style={StyleSheet.absoluteFill}
      /> : <LinearGradient colors={side === 'left' ? ['#4a1238', '#190c1b', '#050505'] : ['#07336b', '#111827', '#050505']} style={StyleSheet.absoluteFill}>
        <View style={styles.broadcastWaiting}>
          {fallbackAvatar ? <Image source={{ uri: fallbackAvatar }} style={styles.broadcastWaitingAvatar} /> : <MaterialIcons name="person" size={50} color="rgba(255,255,255,0.72)" />}
          <Text style={styles.broadcastWaitingText}>{fallbackName}</Text>
          {side === 'right' ? <Text style={styles.broadcastWaitingSubtext}>{battle?.status === 'pending' ? 'Invitation pending' : 'Invite a creator to begin'}</Text> : null}
        </View>
      </LinearGradient>}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.76)']} style={styles.broadcastPaneShade} />
      <View style={styles.broadcastIdentity}>
        {fallbackAvatar ? <Image source={{ uri: fallbackAvatar }} style={styles.broadcastIdentityAvatar} /> : null}
        <Text numberOfLines={1} style={styles.broadcastIdentityName}>{fallbackName}{side === 'left' ? ' · You' : ''}</Text>
      </View>
    </View>;
  };

  return <KeyboardAvoidingView style={styles.broadcastRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <StatusBar hidden translucent backgroundColor="transparent" />
    {participantLayout ? <ParticipantBattleStage
      stage={stage}
      credentials={credentials}
      remoteUids={agora.remoteUids}
      localPreviewReady={agora.localPreviewReady}
      currentUserId={currentUser?.id == null ? undefined : Number(currentUser.id)}
      currentUserName={currentUser?.name ?? live?.creator?.name ?? 'Creator'}
      currentUserAvatar={currentUser?.avatar ?? live?.creator?.avatar}
    /> : <View style={styles.broadcastVideoRow}>
        {renderPane('left')}
        {renderPane('right')}
      </View>}
    <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />

    <View style={[styles.broadcastScoreHud, { top: insets.top + 10 }]}>
      <LinearGradient colors={['#ff2f86', '#d21368']} style={styles.broadcastScoreLeft}>
        <Text style={styles.broadcastScoreText}>{formatLiveCount(leftScore)}</Text>
      </LinearGradient>
      <View style={styles.broadcastVs}>
        <Text style={styles.broadcastVsText}>VS</Text>
        <Text style={styles.broadcastTimer}>{timer}</Text>
      </View>
      <LinearGradient colors={['#0868f7', '#1198ff']} style={styles.broadcastScoreRight}>
        <Text style={[styles.broadcastScoreText, styles.broadcastScoreRightText]}>{formatLiveCount(rightScore)}</Text>
      </LinearGradient>
    </View>

    {connectionError || agora.error ? <View style={[styles.broadcastError, { top: insets.top + 70 }]}>
      <MaterialIcons name="error-outline" size={17} color="#fff" />
      <Text numberOfLines={2} style={styles.broadcastErrorText}>{connectionError ?? agora.error}</Text>
    </View> : null}

    <View style={[styles.broadcastBottom, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <ScrollView ref={chatRef} style={styles.broadcastChat} contentContainerStyle={styles.broadcastChatContent} showsVerticalScrollIndicator={false}>
        {chatMessages.slice(-20).map((message) => <View key={message.id} style={styles.broadcastChatMessage}>
          {message.avatar ? <Image source={{ uri: message.avatar }} style={styles.broadcastChatAvatar} /> : <View style={styles.broadcastChatAvatarFallback}><MaterialIcons name={message.gift ? 'redeem' : 'person'} size={14} color="#fff" /></View>}
          <Text style={styles.broadcastChatLine}><Text style={styles.broadcastChatUser}>{message.user} </Text>{message.text}</Text>
        </View>)}
      </ScrollView>

      <View style={styles.broadcastToolbar}>
        {!isOpponent ? <LiveParticipantsPanel
          liveSessionId={liveSessionId}
          creator
          showInviteButton
          showGuestButton={false}
          enabled={Boolean(credentials) && live?.status === 'live'}
          initialTab="battles"
          initiallyOpen={live?.status === 'live' && !battle}
        /> : null}
        <Pressable accessibilityLabel="Switch camera" onPress={toggleCamera} style={[styles.broadcastControl, cameraFacing === 'back' && styles.broadcastControlActive]}>
          <MaterialIcons name="flip-camera-ios" size={23} color="#fff" />
        </Pressable>
        <Pressable accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'} onPress={toggleMuted} style={[styles.broadcastControl, muted && styles.broadcastControlMuted]}>
          <MaterialIcons name={muted ? 'mic-off' : 'mic'} size={23} color="#fff" />
        </Pressable>
        <View style={styles.broadcastGiftCount}>
          <MaterialIcons name="redeem" size={22} color="#ff3c83" />
          <Text style={styles.broadcastGiftText}>{formatLiveCount(live?.gifts_count ?? 0)}</Text>
        </View>
        <Pressable accessibilityLabel={isOpponent ? 'Leave creator battle' : 'End creator battle'} onPress={() => isOpponent ? void leaveBattle() : setShowEndConfirm(true)} style={styles.broadcastEndButton}>
          <Text style={styles.broadcastEndText}>{isOpponent ? 'Leave' : 'End'}</Text>
        </Pressable>
      </View>

      <View style={styles.broadcastCommentRow}>
        <View style={styles.broadcastCommentInputWrap}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            onSubmitEditing={() => void sendComment()}
            returnKeyType="send"
            placeholder="Add comment..."
            placeholderTextColor="rgba(255,255,255,0.68)"
            style={styles.broadcastCommentInput}
          />
          <Pressable onPress={() => void sendComment()} disabled={!commentText.trim() || commentLive.isPending}>
            <MaterialIcons name="send" size={20} color={commentText.trim() ? '#fff' : 'rgba(255,255,255,0.45)'} />
          </Pressable>
        </View>
      </View>
    </View>

    {isOpponent && !credentials ? <View style={styles.battleInviteOverlay}>
      <View style={styles.battleInviteCard}>
        <View style={styles.battleInviteIcon}><MaterialIcons name="sports-mma" size={30} color="#fff" /></View>
        <Text style={styles.broadcastModalTitle}>Creator battle invitation</Text>
        <Text style={styles.broadcastModalCopy}>{live?.creator?.name ?? 'A creator'} invited you to join this live battle as a co-host.</Text>
        {acceptanceError ? <Text style={styles.battleInviteError}>{acceptanceError}</Text> : null}
        <Pressable disabled={acceptingBattle || !(route.params?.battleId ?? battle?.id)} onPress={() => void acceptInvitation()} style={[styles.broadcastPermissionPrimary, styles.battleInviteAccept, (acceptingBattle || !(route.params?.battleId ?? battle?.id)) && styles.battleInviteDisabled]}>
          {acceptingBattle ? <ActivityIndicator color="#fff" /> : <Text style={styles.broadcastControlText}>{route.params?.battleId ?? battle?.id ? 'Accept & join battle' : 'Loading invitation…'}</Text>}
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.broadcastModalKeep}>
          <Text style={styles.broadcastModalKeepText}>Not now</Text>
        </Pressable>
      </View>
    </View> : null}

    <Modal visible={showEndConfirm} transparent animationType="fade" onRequestClose={() => setShowEndConfirm(false)}>
      <View style={styles.broadcastModalBackdrop}>
        <View style={styles.broadcastModalCard}>
          <MaterialIcons name="sensors-off" size={44} color="#ef4444" />
          <Text style={styles.broadcastModalTitle}>End creator battle?</Text>
          <Text style={styles.broadcastModalCopy}>This ends the live stream for everyone and finalizes the battle.</Text>
          <Pressable disabled={endLive.isPending} onPress={() => void endBattleLive()} style={styles.broadcastModalEnd}>
            {endLive.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.broadcastControlText}>End battle</Text>}
          </Pressable>
          <Pressable onPress={() => setShowEndConfirm(false)} style={styles.broadcastModalKeep}>
            <Text style={styles.broadcastModalKeepText}>Keep streaming</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  </KeyboardAvoidingView>;
};

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#050505',
  },
  videoRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
  },
  videoPane: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#160b17',
  },
  opponentPane: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#07182b',
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 12,
  },
  scoreRow: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scoreSide: {
    minWidth: 86,
    height: 28,
    borderTopLeftRadius: 7,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  rightScore: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 8,
  },
  scoreText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'Inter_700Bold',
  },
  rightScoreText: {
    textAlign: 'right',
  },
  vsBadge: {
    width: 54,
    height: 45,
    marginHorizontal: -4,
    marginTop: -3,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0d13',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  vsText: {
    color: '#ff4b98',
    fontSize: 14,
    lineHeight: 17,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Inter_700Bold',
  },
  creatorRow: {
    height: 35,
    marginTop: -8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorIdentity: {
    maxWidth: '44%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  opponentIdentity: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  creatorName: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  broadcastRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  broadcastVideoRow: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  broadcastPane: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#180b17',
  },
  broadcastRightPane: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.28)',
    backgroundColor: '#07182d',
  },
  broadcastPaneShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  broadcastWaiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  broadcastWaitingAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  broadcastWaitingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  broadcastWaitingSubtext: {
    marginTop: 5,
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  broadcastIdentity: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 226,
    minHeight: 34,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(9,10,15,0.72)',
  },
  broadcastIdentityAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  broadcastIdentityName: {
    flex: 1,
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Inter_700Bold',
  },
  broadcastScoreHud: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 52,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 20,
  },
  broadcastScoreLeft: {
    flex: 1,
    height: 31,
    paddingHorizontal: 11,
    justifyContent: 'center',
    borderTopLeftRadius: 6,
    borderBottomRightRadius: 8,
  },
  broadcastScoreRight: {
    flex: 1,
    height: 31,
    paddingHorizontal: 11,
    justifyContent: 'center',
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 8,
  },
  broadcastScoreText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 19,
    fontFamily: 'Inter_700Bold',
  },
  broadcastScoreRightText: {
    textAlign: 'right',
  },
  broadcastVs: {
    width: 58,
    height: 52,
    marginHorizontal: -3,
    marginTop: -4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0c12',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 2,
  },
  broadcastVsText: {
    color: '#ff3c8e',
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Inter_700Bold',
    fontStyle: 'italic',
  },
  broadcastTimer: {
    color: '#fff',
    fontSize: 12,
    lineHeight: 15,
    fontFamily: 'Inter_700Bold',
  },
  broadcastError: {
    position: 'absolute',
    left: 18,
    right: 18,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(185,28,28,0.9)',
    zIndex: 24,
  },
  broadcastErrorText: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
    lineHeight: 16,
  },
  broadcastBottom: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    zIndex: 30,
  },
  broadcastChat: {
    width: '83%',
    maxHeight: 172,
  },
  broadcastChatContent: {
    gap: 8,
    paddingBottom: 8,
  },
  broadcastChatMessage: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingRight: 8,
  },
  broadcastChatAvatar: {
    width: 27,
    height: 27,
    borderRadius: 14,
  },
  broadcastChatAvatarFallback: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  broadcastChatLine: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 12,
    lineHeight: 17,
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  broadcastChatUser: {
    color: '#4cc2ff',
    fontFamily: 'Inter_700Bold',
  },
  broadcastToolbar: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  broadcastControl: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,20,29,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  broadcastControlActive: {
    borderColor: '#249cff',
  },
  broadcastControlMuted: {
    backgroundColor: 'rgba(185,28,28,0.82)',
  },
  broadcastGiftCount: {
    height: 42,
    minWidth: 54,
    borderRadius: 21,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,20,29,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  broadcastGiftText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  broadcastEndButton: {
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef3340',
  },
  broadcastEndText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  broadcastCommentRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  broadcastCommentInputWrap: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(18,23,32,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  broadcastCommentInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    paddingVertical: 0,
  },
  broadcastPermission: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#050505',
  },
  broadcastPermissionTitle: {
    marginTop: 16,
    color: '#fff',
    fontSize: 19,
    lineHeight: 25,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  broadcastPermissionCopy: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  broadcastPermissionPrimary: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2f86',
  },
  broadcastPermissionCancel: {
    minHeight: 44,
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastPermissionCancelText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
  },
  broadcastModalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  broadcastModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#111722',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  broadcastModalTitle: {
    marginTop: 12,
    color: '#fff',
    fontSize: 20,
    lineHeight: 25,
    fontFamily: 'Inter_700Bold',
  },
  broadcastModalCopy: {
    marginTop: 8,
    color: '#b8c2d4',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  broadcastModalEnd: {
    width: '100%',
    height: 50,
    marginTop: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef3340',
  },
  broadcastControlText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  broadcastModalKeep: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastModalKeepText: {
    color: '#b8c2d4',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  battleInviteOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  battleInviteCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#111722',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  battleInviteIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff2f86',
  },
  battleInviteAccept: {
    width: '100%',
  },
  battleInviteDisabled: {
    opacity: 0.5,
  },
  battleInviteError: {
    marginTop: 12,
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  participantMainVideo: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#08080b',
  },
  participantFloatingTile: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#10131a',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#000',
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
    zIndex: 18,
  },
  participantTileWaiting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  participantMainAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  participantFloatAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.78)',
  },
  participantMainWaitingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    fontFamily: 'Inter_700Bold',
  },
  participantFloatWaitingText: {
    marginTop: 7,
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  participantTileShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 116,
  },
  participantMainLabel: {
    position: 'absolute',
    left: 14,
    bottom: 224,
    maxWidth: '72%',
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(9,10,15,0.72)',
  },
  participantFloatLabel: {
    position: 'absolute',
    left: 5,
    right: 5,
    bottom: 5,
    minHeight: 27,
    borderRadius: 14,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(9,10,15,0.76)',
  },
  participantLabelAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  participantLabelText: {
    flexShrink: 1,
    color: '#fff',
    fontSize: 10,
    lineHeight: 13,
    fontFamily: 'Inter_700Bold',
  },
  participantSwapHint: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
});

export default CreatorBattleScreen;
