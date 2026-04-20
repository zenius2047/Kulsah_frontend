import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  isTip?: boolean;
  isSystem?: boolean;
}

const streamImage =
  'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=1200';

const statsConfig = [
  { label: 'Viewers', icon: 'visibility' as const, color: '#60a5fa' },
  { label: 'Likes', icon: 'favorite' as const, color: '#d915d2' },
  { label: 'Gifts', icon: 'redeem' as const, color: '#4ade80' },
  { label: 'Uplink', icon: 'signal-cellular-alt' as const, color: '#34d399' },
];

const tipOptions = ['5.00', '10.00', '20.00', '50.00', '100.00'];

const CreatorLiveStream: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const chatScrollRef = useRef<ScrollView | null>(null);

  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamFlipped, setIsCamFlipped] = useState(false);
  const [aiAudit, setAiAudit] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [simTipAmount, setSimTipAmount] = useState('10.00');
  const [isProcessingSim, setIsProcessingSim] = useState(false);
  const [showSimSuccess, setShowSimSuccess] = useState(false);

  const [viewers, setViewers] = useState(14284);
  const [likes, setLikes] = useState(128400);
  const [tips, setTips] = useState(1240.5);

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

  const executeSimulatedTip = () => {
    if (!simTipAmount) return;
    setIsProcessingSim(true);
    setTimeout(() => {
      const amount = parseFloat(simTipAmount || '0');
      setTips((prev) => prev + amount);
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: 'Simulated_Fan',
          text: `just tipped $${amount.toFixed(2)} (Live Demo)`,
          isTip: true,
        },
      ]);
      setIsProcessingSim(false);
      setShowSimSuccess(true);

      setTimeout(() => {
        setShowSimSuccess(false);
        setIsTipModalOpen(false);
      }, 1500);
    }, 1200);
  };

  const handleEndSession = () => {
    setShowEndConfirm(false);
    navigation.navigate('MainTabs');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <ImageBackground
          source={{ uri: streamImage }}
          style={styles.background}
          imageStyle={isCamFlipped ? styles.backgroundImageFlipped : styles.backgroundImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.92)']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.topHud}>
            <View style={styles.topHudRow}>
              <View style={styles.liveChip}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTime}>{formatTimer(sessionSeconds)}</Text>
              </View>

              <View style={styles.topActions}>
                <Pressable
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
                </Pressable>

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
              {telemetry.map((stat) => (
                <BlurView key={stat.label} intensity={28} tint="dark" style={styles.statCard}>
                  <MaterialIcons name={stat.icon} size={18} color={stat.color} />
                  <View>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                </BlurView>
              ))}
            </ScrollView>
          </View>

          {aiAudit ? (
            <View style={styles.aiAuditWrap}>
              <BlurView intensity={28} tint="dark" style={styles.aiAuditCard}>
                <Pressable style={styles.aiCloseBtn} onPress={() => setAiAudit(null)}>
                  <MaterialIcons name="close" size={16} color="#cbd5e1" />
                </Pressable>

                <View style={styles.aiHeader}>
                  <MaterialIcons name="psychology" size={18} color="#d915d2" />
                  <Text style={styles.aiKicker}>Astro-Brain Intelligence</Text>
                </View>

                <Text style={styles.aiText}>"{aiAudit}"</Text>
              </BlurView>
            </View>
          ) : null}

          <View style={styles.bottomZone}>
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
                      <MaterialIcons name="campaign" size={16} color="#d915d2" />
                    ) : null}
                  </View>
                ))}
              </ScrollView>

              <View style={styles.sideHud}>
                <Pressable
                  onPress={() => setIsTipModalOpen(true)}
                  style={[styles.sideHudButton, styles.sideHudPrimary]}
                >
                  <MaterialIcons name="redeem" size={28} color="#fff" />
                </Pressable>

                <Pressable
                  onPress={() => setIsCamFlipped((prev) => !prev)}
                  style={[
                    styles.sideHudButton,
                    isCamFlipped ? styles.sideHudButtonActive : null,
                  ]}
                >
                  <MaterialIcons
                    name="flip-camera-ios"
                    size={28}
                    color={isCamFlipped ? '#d915d2' : '#fff'}
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

            <View style={styles.broadcastRow}>
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
                    color={broadcastText.trim() ? '#d915d2' : 'rgba(255,255,255,0.25)'}
                  />
                </Pressable>
              </BlurView>

              <BlurView intensity={24} tint="dark" style={styles.moreButton}>
                <MaterialIcons name="more-horiz" size={22} color="rgba(255,255,255,0.7)" />
              </BlurView>
            </View>
          </View>
        </ImageBackground>

        <Modal
          visible={isTipModalOpen}
          transparent
          animationType="slide"
          onRequestClose={() => !isProcessingSim && setIsTipModalOpen(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              style={styles.modalBackdrop}
              disabled={isProcessingSim}
              onPress={() => setIsTipModalOpen(false)}
            />

            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Kulsah Gift Simulation</Text>
                <Text style={styles.sheetSubtitle}>Test your live alerts and revenue HUD</Text>
              </View>

              {showSimSuccess ? (
                <View style={styles.successWrap}>
                  <View style={styles.successIconWrap}>
                    <MaterialIcons name="check-circle" size={56} color="#22c55e" />
                  </View>
                  <Text style={styles.successText}>Uplink Success</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.amountLabel}>Select Mock Amount</Text>

                  <View style={styles.amountGrid}>
                    {tipOptions.map((amount) => {
                      const selected = simTipAmount === amount;
                      return (
                        <Pressable
                          key={amount}
                          onPress={() => setSimTipAmount(amount)}
                          style={[styles.amountButton, selected ? styles.amountButtonActive : null]}
                        >
                          <Text
                            style={[
                              styles.amountButtonText,
                              selected ? styles.amountButtonTextActive : null,
                            ]}
                          >
                            ${amount}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <TextInput
                      value={simTipAmount}
                      onChangeText={setSimTipAmount}
                      keyboardType="decimal-pad"
                      placeholder="Other"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      style={styles.amountInput}
                    />
                  </View>

                  <View style={styles.simInfoCard}>
                    <Text style={styles.simInfoKicker}>Simulation Mode</Text>
                    <Text style={styles.simInfoText}>
                      This will simulate an incoming fan gift in chat and update session revenue.
                    </Text>
                  </View>

                  <Pressable
                    onPress={executeSimulatedTip}
                    disabled={isProcessingSim || !simTipAmount}
                    style={[
                      styles.confirmButton,
                      isProcessingSim || !simTipAmount ? styles.confirmButtonDisabled : null,
                    ]}
                  >
                    {isProcessingSim ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.confirmButtonText}>Confirm Mock Gift</Text>
                        <MaterialIcons name="bolt" size={20} color="#fff" />
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>

        <Modal
          visible={showEndConfirm}
          transparent
          animationType="fade"
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
    </SafeAreaView>
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
  backgroundImage: {
    resizeMode: 'cover',
  },
  backgroundImageFlipped: {
    resizeMode: 'cover',
    transform: [{ scaleX: -1 }],
  },
  topHud: {
    paddingHorizontal: 16,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(12),
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
    backgroundColor: 'rgba(217,21,210,0.22)',
    borderColor: 'rgba(217,21,210,0.45)',
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
    fontSize: fontScale(10),
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
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
    borderColor: 'rgba(217,21,210,0.35)',
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
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  aiText: {
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
    lineHeight: 21,
    paddingRight: 24,
  },
  bottomZone: {
    marginTop: 'auto',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
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
    backgroundColor: 'rgba(217,21,210,0.14)',
    borderColor: 'rgba(217,21,210,0.24)',
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
    color: 'rgba(217,21,210,0.76)',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  chatUserTip: {
    color: '#4ade80',
  },
  chatUserSystem: {
    color: '#d915d2',
  },
  chatText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(12),
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
    backgroundColor: '#d915d2',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  sideHudButtonActive: {
    borderColor: 'rgba(217,21,210,0.45)',
    backgroundColor: 'rgba(217,21,210,0.1)',
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
    backgroundColor: '#d915d2',
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontSize: fontScale(14),
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
    fontSize: fontScale(21),
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: 'rgba(255,255,255,0.38)',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(10),
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
    fontSize: fontScale(24),
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  amountLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
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
    backgroundColor: '#d915d2',
    borderColor: '#d915d2',
  },
  amountButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(14),
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
    fontSize: fontScale(14),
  },
  simInfoCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(217,21,210,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(217,21,210,0.18)',
  },
  simInfoKicker: {
    color: '#d915d2',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  simInfoText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(13),
    lineHeight: 19,
  },
  confirmButton: {
    marginTop: 18,
    height: 58,
    borderRadius: 24,
    backgroundColor: '#d915d2',
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
    fontSize: fontScale(16),
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
    fontSize: fontScale(25),
    textTransform: 'uppercase',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmText: {
    color: 'rgba(255,255,255,0.68)',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
    lineHeight: 21,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(16),
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(13),
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

export default CreatorLiveStream;
