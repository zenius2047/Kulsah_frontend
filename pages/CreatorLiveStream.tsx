import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';
import GiftDialog, { GiftSelection } from '../components/GiftDialog';
import { FontSize } from '../fonts';
import { mediumScreen } from '../types';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  isTip?: boolean;
  isSystem?: boolean;
}

const statsConfig = [
  { label: 'Viewers', icon: 'visibility' as const, color: '#60a5fa' },
  { label: 'Likes', icon: 'favorite' as const, color: PRIMARY_COLOR },
  { label: 'Gifts', icon: 'redeem' as const, color: '#4ade80' },
  { label: 'Uplink', icon: 'signal-cellular-alt' as const, color: '#34d399' },
];

const CreatorLiveStream: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const chatScrollRef = useRef<ScrollView | null>(null);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  const [giftDialogOpen, setGiftDialogOpen] = useState(false);

  const [viewers, setViewers] = useState(14284);
  const [likes, setLikes] = useState(128400);
  const [tips, setTips] = useState(1240.5);
  const [coinBalance, setCoinBalance] = useState(1250);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, user: 'Alex_Vibes', text: 'This lighting is next level!' },
    { id: 2, user: 'Sarah_Music', text: 'Play the new single!' },
    { id: 3, user: 'BeatMaster', text: 'sent a Buy Dinner gift!', isTip: true },
    { id: 4, user: 'Nova_Fan', text: 'Watching from Lagos!' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    const telemetryInterval = setInterval(() => {
      setViewers((v) => Math.max(0, v + Math.floor(Math.random() * 10) - 4));
      setLikes((l) => l + Math.floor(Math.random() * 50));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(telemetryInterval);
    };
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [chatMessages]);

  const telemetry = useMemo(
    () => [
      { ...statsConfig[0], value: viewers.toLocaleString() },
      { ...statsConfig[1], value: `${(likes / 1000).toFixed(1)}k` },
      {
        ...statsConfig[2],
        value: `$${tips.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      { ...statsConfig[3], value: '98%' },
    ],
    [likes, tips, viewers]
  );

  const formatTimer = (s: number) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getAIEnergyAudit = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents:
          "You are a live session moderator for a creator named Mila Ray. Summarize the current chat energy in one high-energy futuristic sentence for Mila to read aloud.",
      });
      setAiAudit(
        response.text ||
          'Your global audience is surging and the room is electric. Nigeria wants the next anthem now.'
      );
    } catch (e) {
      setAiAudit(
        "Energy levels are peaking. Fans from Lagos are requesting Nebula and the stream is fully locked in."
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleBroadcast = () => {
    if (!broadcastText.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'SYSTEM',
        text: broadcastText.trim(),
        isSystem: true,
      },
    ]);
    setBroadcastText('');
  };

  const handleEndSession = () => {
    setShowEndConfirm(false);
    navigation.navigate('MainTabs');
  };

  const handleSendGift = (gift: GiftSelection) => {
    setCoinBalance((prev) => prev - gift.price);
    setTips((prev) => prev + gift.price);
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: 'Gift_Fan',
        text: `sent ${gift.name} worth ${gift.price} KC`,
        isTip: true,
      },
    ]);
  };

  const toggleCameraFacing = () => {
    setCameraFacing((current) => (current === 'front' ? 'back' : 'front'));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {!permission?.granted ? (
        <View style={styles.permissionScreen}>
          {!permission ? (
            <>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.permissionText}>Loading camera...</Text>
            </>
          ) : (
            <>
              <MaterialIcons name="videocam" size={42} color="#ffffff" />
              <Text style={styles.permissionTitle}>Camera access needed</Text>
              <Text style={styles.permissionText}>
                Turn on camera permission to preview your live stream before you go on air.
              </Text>
              <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
                <Text style={styles.permissionButtonText}>Enable Camera</Text>
              </Pressable>
            </>
          )}
        </View>
      ) : (
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <View style={styles.background}>
          <CameraView style={StyleSheet.absoluteFill} facing={cameraFacing} />
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
                {/* <Pressable
                  onPress={getAIEnergyAudit}
                  disabled={isAiLoading}
                  style={[
                    styles.circleHudButton,
                    aiAudit ? styles.circleHudButtonActive : null,
                  ]}
                >
                  {isAiLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialIcons name="auto-awesome" size={22} color="#fff" />
                  )}
                </Pressable> */}

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

          {/* {aiAudit ? (
            <View style={styles.aiAuditWrap}>
              <BlurView intensity={28} tint="dark" style={styles.aiAuditCard}>
                <Pressable style={styles.aiCloseBtn} onPress={() => setAiAudit(null)}>
                  <MaterialIcons name="close" size={16} color="#cbd5e1" />
                </Pressable>

                <View style={styles.aiHeader}>
                  <MaterialIcons name="psychology" size={18} color={PRIMARY_COLOR} />
                  <Text style={styles.aiKicker}>Astro-Brain Intelligence</Text>
                </View>

                <Text style={styles.aiText}>"{aiAudit}"</Text>
              </BlurView>
            </View>
          ) : null} */}

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
                    {!message.isSystem ? (
                      <Image
                        source={{ uri: `https://picsum.photos/seed/fan${message.id}/60` }}
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
                <Pressable
                  onPress={() => setGiftDialogOpen(true)}
                  style={[styles.sideHudButton, styles.sideHudPrimary]}
                >
                  <MaterialIcons name="redeem" size={28} color="#fff" />
                </Pressable>

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
                  onPress={() => setIsMuted((prev) => !prev)}
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
                <TextInput
                  value={broadcastText}
                  onChangeText={setBroadcastText}
                  placeholder="Broadcast a system alert..."
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  style={styles.broadcastInput}
                  onSubmitEditing={handleBroadcast}
                  returnKeyType="send"
                />

                <Pressable onPress={handleBroadcast} disabled={!broadcastText.trim()}>
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

        <GiftDialog
          isOpen={giftDialogOpen}
          onClose={() => setGiftDialogOpen(false)}
          creatorName="Mila Ray"
          currentBalance={coinBalance}
          onSendGift={(gift) => {
            handleSendGift(gift);
            setGiftDialogOpen(false);
          }}
          onTopUpSuccess={(amount) => setCoinBalance((prev) => prev + amount)}
        />

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
                {viewers.toLocaleString()} viewers.
              </Text>

              <Pressable onPress={handleEndSession} style={styles.shutdownButton}>
                <Text style={styles.shutdownButtonText}>Confirm Shutdown</Text>
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
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.eighteen: FontSize.fourteen,
    marginTop: 18,
    marginBottom: 8,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
    lineHeight: 20,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  statsRow: {
    gap: 10,
    paddingVertical: 14,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.twelve: FontSize.eight,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: FontSize.ten,
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  aiText: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: FontSize.fourteen,
    lineHeight: 21,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twelve:FontSize.eight,
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
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
    lineHeight: 17,
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
    backgroundColor: 'red'

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
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twenty: FontSize.sixteen,
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.twelve: FontSize.eight,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twenty: FontSize.sixteen,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.sixteen:FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.fourteen: FontSize.ten,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  simInfoText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
    lineHeight: 19,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.eighteen:  FontSize.fourteen,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? FontSize.twenty: FontSize.sixteen,
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen ? FontSize.sixteen: FontSize.twelve,
    lineHeight: 15,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen : FontSize.twelve,
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
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? FontSize.sixteen : FontSize.twelve,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

export default CreatorLiveStream;
