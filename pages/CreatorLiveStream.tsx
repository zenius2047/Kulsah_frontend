import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RenderModeType, RtcSurfaceView, RtcTextureView, VideoSourceType } from 'react-native-agora';
import { mediumScreen } from '../types';
import { fontSize } from '../typography';
import { liveApi } from '../src/api/live.api';
import {
  useCommentOnLive,
  useConfirmLive,
  useEndLive,
  useLiveSession,
  useReconnectLive,
  useStartLive,
} from '../src/hooks/live/useLive';
import { useAgoraLive } from '../src/hooks/live/useAgoraLive';
import { useLiveRealtime } from '../src/hooks/live/useLiveRealtime';
import type { LiveCredentials, LiveSession } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { formatLiveCount } from '../src/utils/live';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  avatar?: string | null;
  isTip?: boolean;
  isSystem?: boolean;
}

type CreatorLiveRoute = {
  params?: {
    liveSessionId?: string;
    initialLive?: LiveSession;
    quality?: string;
  };
};

const statsConfig = [
  { label: 'Viewers', icon: 'visibility' as const, color: '#60a5fa' },
  { label: 'Likes', icon: 'favorite' as const, color: PRIMARY_COLOR },
  { label: 'Gifts', icon: 'redeem' as const, color: '#4ade80' },
  { label: 'Uplink', icon: 'signal-cellular-alt' as const, color: '#34d399' },
];

const CreatorLiveStream: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<CreatorLiveRoute>();
  const liveSessionId = route.params?.liveSessionId ?? route.params?.initialLive?.id ?? '';
  const chatScrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const permissionsGranted = Boolean(cameraPermission?.granted && microphonePermission?.granted);

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const startAttemptedRef = useRef(false);
  const confirmedRef = useRef(false);

  const liveQuery = useLiveSession(liveSessionId, Boolean(liveSessionId));
  const live = liveQuery.data ?? route.params?.initialLive;
  const startLive = useStartLive(liveSessionId);
  const confirmLive = useConfirmLive(liveSessionId);
  const reconnectLive = useReconnectLive(liveSessionId);
  const endLive = useEndLive(liveSessionId);
  const commentLive = useCommentOnLive(liveSessionId);
  useLiveRealtime(liveSessionId, Boolean(liveSessionId), {
    onComment: (comment) => {
      setChatMessages((current) => current.some((item) => item.id === comment.id)
        ? current
        : [...current, {
          id: comment.id,
          user: comment.user?.name ?? comment.user?.username ?? 'Viewer',
          text: comment.body,
          avatar: comment.user?.avatar,
        }]);
    },
    onGift: (gift) => {
      const activityId = -gift.transaction_id;
      setChatMessages((current) => current.some((item) => item.id === activityId)
        ? current
        : [...current, {
          id: activityId,
          user: `Viewer #${gift.sender_id}`,
          text: `sent ${gift.quantity}x ${gift.gift_name} (${gift.coin_amount} KC)`,
          isTip: true,
        }]);
    },
  });
  const RtcVideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  const localVideoCanvas = useMemo(
    () => ({
      uid: 0,
      sourceType: VideoSourceType.VideoSourceCameraPrimary,
      renderMode: RenderModeType.RenderModeFit,
    }),
    []
  );

  const agora = useAgoraLive({
    credentials,
    enabled: permissionsGranted,
    onJoined: async () => {
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
      try {
        await reconnectLive.mutateAsync();
        await confirmLive.mutateAsync();
      } catch {
        // The SDK continues its own retry loop; the next REST refresh reconciles state.
      }
    },
    renewCredentials: async () => {
      const response = await startLive.mutateAsync();
      setCredentials(response.credentials);
      return response.credentials;
    },
  });

  useEffect(() => {
    if (!permissionsGranted || !liveSessionId || credentials || startAttemptedRef.current) return;
    startAttemptedRef.current = true;
    void startLive.mutateAsync()
      .then((response) => setCredentials(response.credentials))
      .catch((error) => {
        startAttemptedRef.current = false;
        setConnectionError(getApiErrorMessage(error));
      });
  }, [credentials, liveSessionId, permissionsGranted]);

  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!liveSessionId || !credentials) return;
    const sendHeartbeat = () => {
      void liveApi.heartbeat(liveSessionId, {
        broadcast_state: agora.connectionState,
        network_quality: agora.networkQuality,
        audio_state: isMuted ? 'muted' : 'enabled',
        video_state: 'enabled',
        resolution: route.params?.quality ?? null,
      }).catch(() => undefined);
    };
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10_000);
    return () => clearInterval(interval);
  }, [agora.connectionState, agora.networkQuality, credentials, isMuted, liveSessionId, route.params?.quality]);

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages]);

  const telemetry = useMemo(
    () => [
      { ...statsConfig[0], value: formatLiveCount(live?.current_viewers ?? 0) },
      { ...statsConfig[1], value: formatLiveCount(live?.likes_count ?? 0) },
      {
        ...statsConfig[2],
        value: `${formatLiveCount(live?.earnings_kc ?? 0)} KC`,
      },
      { ...statsConfig[3], value: agora.connectionState === 'connected' ? (agora.networkQuality <= 2 ? 'Good' : 'Weak') : 'Connecting' },
    ],
    [agora.connectionState, agora.networkQuality, live?.current_viewers, live?.earnings_kc, live?.likes_count]
  );

  const formatTimer = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const handleBroadcast = async () => {
    const body = broadcastText.trim();
    if (!body || commentLive.isPending) return;
    try {
      const comment = await commentLive.mutateAsync(body);
      setChatMessages((current) => current.some((item) => item.id === comment.id)
        ? current
        : [...current, {
          id: comment.id,
          user: comment.user?.name ?? live?.creator?.name ?? 'Host',
          text: comment.body,
          avatar: comment.user?.avatar,
          isSystem: true,
        }]);
      setBroadcastText('');
    } catch (error) {
      Alert.alert('Message not sent', getApiErrorMessage(error));
    }
  };

  const handleEndSession = async () => {
    if (endLive.isPending) return;
    try {
      const ended = await endLive.mutateAsync('creator_ended');
      setShowEndConfirm(false);
      navigation.replace('StreamEnded', { liveSessionId, endedLive: ended });
    } catch (error) {
      Alert.alert('Could not end Live', getApiErrorMessage(error));
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === 'front' ? 'back' : 'front'));
    agora.switchCamera();
  };

  const toggleMuted = () => {
    setIsMuted((current) => {
      const next = !current;
      agora.setMuted(next);
      return next;
    });
  };

  const requestMediaPermissions = async () => {
    await Promise.all([requestCameraPermission(), requestMicrophonePermission()]);
  };

  const cancelLiveSetup = async () => {
    try {
      if (liveSessionId) await endLive.mutateAsync('creator_ended');
    } catch {
      // Navigation still exits; stale-session reconciliation remains authoritative.
    }
    navigation.navigate('MainTabs');
  };

  return (
    <KeyboardAvoidingView style={styles.fullScreenRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <View style={styles.safeArea}>
      <StatusBar hidden translucent backgroundColor="transparent" barStyle="light-content" />
      {!permissionsGranted ? (
        <View style={styles.permissionScreen}>
          {!cameraPermission || !microphonePermission ? (
            <>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.permissionText}>Loading camera...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="videocam" size={42} color="#ffffff" />
              <Text style={styles.permissionTitle}>Camera and microphone access needed</Text>
              <Text style={styles.permissionText}>
                Turn on camera and microphone access so viewers can see and hear your Live.
              </Text>
              <Pressable style={styles.permissionButton} onPress={() => void requestMediaPermissions()}>
                <Text style={styles.permissionButtonText}>Enable Camera & Microphone</Text>
              </Pressable>
              <Pressable style={styles.permissionCancelButton} onPress={() => void cancelLiveSetup()}>
                <Text style={styles.permissionCancelText}>Cancel Live</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <View style={styles.background}>
          {credentials && agora.localPreviewReady ? (
            <RtcVideoView canvas={localVideoCanvas} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.connectingMedia]}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.permissionText}>Preparing secure broadcast...</Text>
            </View>
          )}
              {agora.remoteUids.length > 0 ? (
            <View style={styles.remoteGrid}>
              {agora.remoteUids.slice(0, 3).map((uid) => (
                <RtcVideoView
                  key={uid}
                  canvas={{
                    uid,
                    sourceType: VideoSourceType.VideoSourceRemote,
                    renderMode: RenderModeType.RenderModeFit,
                  }}
                  style={styles.remoteVideo}
                />
              ))}
            </View>
          ) : null}
          <LinearGradient
            colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.92)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.topHud, { paddingTop: Platform.OS === 'ios' ? 54 : insets.top }]}>
            <View style={[styles.topHudRow, {paddingHorizontal: 16}]}>
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTime}>{formatTimer(sessionSeconds)}</Text>
              </View>

              <View style={styles.topActions}>
                <Pressable
                  onPress={() => setShowEndConfirm(true)}
                  style={styles.endSessionButton}
                >
                  <Text style={styles.endSessionText}>End Session</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
            >
              <View style={{
                width: 10,
              }}/>
              {telemetry.map((stat, index) => (
                <BlurView key={stat.label} intensity={28} tint="dark" style={styles.statCard}>
                  <MaterialIcons name={stat.icon} size={18} color={stat.color} />
                  <View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                </BlurView>
              ))}
               <View style={{
                width: 10,
              }}/>
            </ScrollView>
          </View>

          {connectionError || agora.error ? (
            <View style={styles.connectionErrorBanner}>
              <MaterialIcons name="error-outline" size={18} color="#fff" />
              <Text style={styles.connectionErrorText}>{connectionError ?? agora.error}</Text>
            </View>
          ) : null}

          <View style={[styles.bottomZone,{paddingBottom: insets.bottom}]}>
            <View style={styles.contentRow}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                ref={chatScrollRef}
                style={styles.chatPane}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
              >
                {chatMessages.map((message) => (
                  <View
                    key={message.id}
                    style={[
                      styles.chatCard,
                      message.isTip ? styles.chatTipCard : null,
                      message.isSystem ? styles.chatSystemCard : null,
                    ]}
                  >
                    {!message.isSystem && message.avatar ? (
                      <Image
                        source={{ uri: message.avatar }}
                        style={styles.chatAvatar}
                      />
                    ) : null}

                    <View style={styles.chatTextWrap}>
                      <Text
                        style={[
                          styles.chatUser,
                          message.isTip ? styles.chatUserTip : null,
                          message.isSystem ? styles.chatUserSystem : null,
                        ]}
                      >
                        {message.user}
                      </Text>
                      <Text style={styles.chatText}>{message.text}</Text>
                    </View>

                    {message.isTip ? (
                      <MaterialIcons name="verified" size={16} color="#4ade80" />
                    ) : null}
                    {message.isSystem ? (
                      <MaterialIcons name="campaign" size={16} color={PRIMARY_COLOR} />
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.sideHud}>
                <View style={[styles.sideHudButton, styles.sideHudPrimary]}>
                  <MaterialIcons name="redeem" size={24} color="#fff" />
                  <Text style={styles.sideMetricText}>{formatLiveCount(live?.gifts_count ?? 0)}</Text>
                </View>

                <Pressable
                  onPress={toggleCameraFacing}
                  style={[
                    styles.sideHudButton,
                    cameraFacing === 'back' ? styles.sideHudButtonActive : null,
                  ]}
                >
                  <MaterialIcons
                    name="flip-camera-ios"
                    size={28}
                    color={cameraFacing === 'back' ? PRIMARY_COLOR : '#fff'}
                  />
                </Pressable>

                <Pressable
                  onPress={toggleMuted}
                  style={[
                    styles.sideHudButton,
                    isMuted ? styles.sideHudButtonDanger : null,
                  ]}
                >
                  <MaterialIcons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={28}
                    color={isMuted ? '#ef4444' : '#fff'}
                  />
                </Pressable>

                <BlurView intensity={24} tint="dark" style={styles.audioMeter}>
                  <View style={styles.audioBars}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.audioBar,
                          {
                            height: isMuted ? 4 : 10 + ((i * 9 + sessionSeconds * 5) % 24),
                            opacity: isMuted ? 0.25 : 1,
                          },
                        ]}
                      />
                    ))}
                  </View>
                </BlurView>
              </View>
            </View>

            <View style={[styles.broadcastRow]}>
              <BlurView intensity={28} tint="dark" style={styles.broadcastInputWrap}>
                <TextInput includeFontPadding={false}
                  value={broadcastText}
                  onChangeText={setBroadcastText}
                  placeholder="Broadcast a system alert..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.broadcastInput}
                  onSubmitEditing={() => void handleBroadcast()}
                  returnKeyType="send"
                />

                <Pressable onPress={() => void handleBroadcast()} disabled={!broadcastText.trim() || commentLive.isPending}>
                  <MaterialIcons
                    name="campaign"
                    size={22}
                    color={broadcastText.trim() ? PRIMARY_COLOR : 'rgba(255,255,255,0.25)'}
                  />
                </Pressable>
              </BlurView>

              <BlurView intensity={24} tint="dark" style={styles.moreButton}>
                <MaterialIcons name="more-horiz" size={22} color="rgba(255,255,255,0.7)" />
              </BlurView>
            </View>
          </View>
        </View>

        <Modal
          visible={showEndConfirm}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setShowEndConfirm(false)}
        >
          <View style={styles.modalCenterRoot}>
            <Pressable
              style={styles.modalBackdropStrong}
              onPress={() => setShowEndConfirm(false)}
            />

            <View style={styles.confirmCard}>
              <View style={styles.shutdownIconWrap}>
                <MaterialIcons name="sensors-off" size={52} color="#ef4444" />
              </View>

              <Text style={styles.confirmTitle}>Shutdown Protocol</Text>
              <Text style={styles.confirmText}>
                Ending this transmission will finalize session revenue and disconnect{' '}
                {formatLiveCount(live?.current_viewers ?? 0)} viewers.
              </Text>

              <Pressable onPress={() => void handleEndSession()} disabled={endLive.isPending} style={styles.shutdownButton}>
                {endLive.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.shutdownButtonText}>Confirm Shutdown</Text>}
              </Pressable>

              <Pressable
                onPress={() => setShowEndConfirm(false)}
                style={styles.keepStreamingButton}
              >
                <Text style={styles.keepStreamingText}>Keep Streaming</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
      )}
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenRoot: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  connectingMedia: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  remoteGrid: {
    position: 'absolute',
    top: 118,
    right: 14,
    gap: 8,
    zIndex: 2,
  },
  remoteVideo: {
    width: 108,
    height: 152,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  permissionScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#000',
  },
  permissionTitle: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    marginTop: 18,
    marginBottom: 8,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.75)',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textAlign: 'center',
    marginTop: 10,
  },
  permissionButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    width: "80%"
  },
  permissionButtonText: {
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  topHud: {
    paddingHorizontal: 0,
    paddingTop: 8,
  },
  topHudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  liveTime: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 2.4,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  circleHudButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleHudButtonActive: {
    backgroundColor: primaryColorAlpha(0.22),
    borderColor: primaryColorAlpha(0.45),
  },
  endSessionButton: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
  },
  endSessionText: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  statsRow: {
    gap: 10,
    paddingVertical: 14,
  },
  permissionCancelButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  permissionCancelText: {
    color: '#cbd5e1',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
  },
  connectionErrorBanner: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(185,28,28,0.88)',
  },
  connectionErrorText: {
    flex: 1,
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.38)',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    marginTop: 2,
  },
  aiAuditWrap: {
    paddingHorizontal: 16,
    marginTop: 2,
  },
  aiAuditCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    padding: 18,
  },
  aiCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  aiKicker: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  aiText: {
    color: 'rgba(255,255,255,0.92)',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    paddingRight: 24,
  },
  bottomZone: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    // paddingBottom: 16,
    gap: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  chatPane: {
    flex: 1,
    maxHeight: 300,
  },
  chatContent: {
    paddingTop: 70,
    gap: 8,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chatTipCard: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.28)',
  },
  chatSystemCard: {
    backgroundColor: primaryColorAlpha(0.14),
    borderColor: primaryColorAlpha(0.24),
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  chatTextWrap: {
    flex: 1,
  },
  chatUser: {
    color: primaryColorAlpha(0.76),
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  chatUserTip: {
    color: '#4ade80',
  },
  chatUserSystem: {
    color: PRIMARY_COLOR,
  },
  chatText: {
    color: '#fff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    marginTop: 2,
  },
  sideHud: {
    gap: 12,
    alignItems: 'center',
  },
  sideHudButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  sideMetricText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  sideHudPrimary: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sideHudButtonActive: {
    borderColor: primaryColorAlpha(0.45),
    backgroundColor: primaryColorAlpha(0.1),
  },
  sideHudButtonDanger: {
    borderColor: 'rgba(239,68,68,0.45)',
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  audioMeter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  audioBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 26,
  },
  audioBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    // backgroundColor: 'red'

  },
  broadcastInputWrap: {
    flex: 1,
    minHeight: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  broadcastInput: {
    flex: 1,
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  moreButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  sheet: {
    backgroundColor: '#0f0a12',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    alignItems: 'center',
    marginBottom: 22,
  },
  sheetTitle: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.38)',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    marginTop: 6,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  successWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successText: {
    color: '#22c55e',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.4)',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountButton: {
    width: '31%',
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  amountButtonText: {
    color: 'rgba(255,255,255,0.7)',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  amountButtonTextActive: {
    color: '#fff',
  },
  amountInput: {
    width: '31%',
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    textAlign: 'center',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  simInfoCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 24,
    backgroundColor: primaryColorAlpha(0.08),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.18),
  },
  simInfoKicker: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  simInfoText: {
    color: 'rgba(255,255,255,0.72)',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
  },
  confirmButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 24,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  modalCenterRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalBackdropStrong: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.94)',
  },
  confirmCard: {
    width: '100%',
    borderRadius: 36,
    backgroundColor: '#120b16',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.22)',
    padding: 28,
    alignItems: 'center',
  },
  shutdownIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  confirmTitle: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    color: 'rgba(255,255,255,0.68)',
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    textAlign: 'center',
    marginBottom: 24,
  },
  shutdownButton: {
    width: '100%',
    height: 58,
    borderRadius: 24,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shutdownButtonText: {
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  keepStreamingButton: {
    width: '100%',
    height: 54,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepStreamingText: {
    color: 'rgba(255,255,255,0.7)',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

export default CreatorLiveStream;
