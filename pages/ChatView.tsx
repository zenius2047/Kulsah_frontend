import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import KulsahInputBar from '../components/KulsahInputBar';
import GiftDialog, { GiftSelection } from '../components/GiftDialog';
import { fontSize } from './typography';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: number;
  sender: 'me' | 'other';
  text: string;
  time: string;
  type?: 'text' | 'image' | 'drop' | 'tip_request' | 'gift';
  status?: 'sent' | 'read';
  amount?: string;
  gift?: GiftSelection;
}

type CallType = 'audio' | 'video';
type CallStatus = 'idle' | 'dialing' | 'connected' | 'ended';

interface CurrentUser {
  role?: 'creator' | 'fan';
}

const ChatView: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const id = ((route.params as { id?: string } | undefined)?.id || 'Elena_Rose') as string;

  const scrollRef = useRef<ScrollView>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(1250);

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'other',
      text: 'Hey! Loved the stream last night. That synth solo was unreal.',
      time: '10:45 AM',
      status: 'read',
    },
    {
      id: 2,
      sender: 'other',
      text: 'Will there be more colors for the Galactic Hoodie soon?',
      time: '10:46 AM',
      status: 'read',
    },
    {
      id: 3,
      sender: 'me',
      text: 'Yes, midnight blue is coming next week. Stay cosmic.',
      time: '11:02 AM',
      status: 'read',
    },
  ]);

  const isCreator = currentUser.role === 'creator';

  const meta = isCreator
    ? {
        subStatus: 'Monthly',
        ltv: '$450',
        score: 98,
        joined: 'Jan 2024',
      }
    : {
        subStatus: 'Yearly',
        creatorName: id.replace('_', ' '),
        nextBilling: 'Dec 12, 2026',
      };

  useEffect(() => {
    const loadUser = async () => {
      const raw = await AsyncStorage.getItem('pulsar_user');
      if (raw) setCurrentUser(JSON.parse(raw) as CurrentUser);
    };
    void loadUser();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
    const last = messages[messages.length - 1];
    if (last && last.sender === 'other') void generateSmartReplies(last.text);
  }, [messages]);

  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  const generateSmartReplies = async (lastMessage: string) => {
    setIsGeneratingReplies(true);
    setIsTyping(true);

    try {
      const apiKey = (globalThis as any)?.process?.env?.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY');

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are Mila Ray, a synthwave creator. A fan said: "${lastMessage}". Suggest 3 short brand-aligned replies as comma-separated text.`,
      });

      const replies = response.text
        ?.split(',')
        .map((r: string) => r.trim().replace(/^"|"$/g, ''))
        .filter(Boolean);

      setSmartReplies((replies || []).slice(0, 3));
    } catch {
      setSmartReplies(['Thank you! 💜', 'More coming soon!', 'Stay cosmic!']);
    } finally {
      setIsGeneratingReplies(false);
      setIsTyping(false);
    }
  };

  const handleSend = (textOverride?: string, type: Message['type'] = 'text', amount?: string) => {
    const textToSend = textOverride ?? msg;
    if (!textToSend.trim() && type === 'text') return;

    const newMsg: Message = {
      id: Date.now(),
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      amount,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setMsg('');
    setSmartReplies([]);
    setIsToolsOpen(false);
    setShowEmojiPicker(false);

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)));
    }, 900);
  };

  const startCall = (type: CallType) => {
    setCallType(type);
    setCallStatus('dialing');
    setCallDuration(0);
    setTimeout(() => setCallStatus('connected'), 2000);
  };

  const endCall = () => {
    setCallStatus('ended');
    setTimeout(() => setCallStatus('idle'), 1000);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const addEmoji = (emoji: string) => setMsg((prev) => `${prev}${emoji}`);

  const sendSticker = (stickerUrl: string) => {
    handleSend(stickerUrl, 'image');
    setShowEmojiPicker(false);
  };

  const handleSendGift = (gift: GiftSelection) => {
    const newMsg: Message = {
      id: Date.now(),
      sender: 'me',
      text: `Sent ${gift.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'gift',
      amount: `${gift.price} KC`,
      gift,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newMsg]);
    setCoinBalance((prev) => prev - gift.price);
    setGiftDialogOpen(false);
    setIsToolsOpen(false);
    setShowEmojiPicker(false);

    setTimeout(() => {
      setMessages((prev) => prev.map((m) => (m.id === newMsg.id ? { ...m, status: 'read' } : m)));
    }, 900);
  };

  const emojiSet = useMemo(() => ['🔥', '🙌', '❤️', '✨', '🌌', '🚀', '💯'], []);
  const stickers = useMemo(
    () => [
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=120',
      'https://images.unsplash.com/photo-1572375927902-e60e87bb7385?auto=format&fit=crop&q=80&w=120',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=120',
    ],
    [],
  );

  const headerBg = isDark ? '#0f1016' : theme.card;
  const footerBg = isDark ? '#0f1016' : theme.card;
  const border = theme.border;
  const subtleText = isDark ? '#6b7280' : theme.textSecondary;
  const mutedText = isDark ? '#6b7280' : theme.textMuted;
  const primaryText = theme.text;
  const panelBg = isDark ? '#12131a' : theme.card;
  const softSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const chipBg = isDark ? primaryColorAlpha(0.15) : theme.accentSoft;
  const chipBorder = isDark ? primaryColorAlpha(0.35) : primaryColorAlpha(0.25);
  const bubbleOther = isDark ? 'rgba(255,255,255,0.08)' : 'rgb(255, 255, 255)';
  const callOverlayBg = isDark ? '#000' : 'rgba(15,23,42,0.94)';
  const iconBtnBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)';
  const iconBtnBorder = isDark ? 'rgba(255,255,255,0.12)' : border;
  const chatBackground = isDark
  ? require('../assets/Chat dark.png')
  : require('../assets/Chat white.png');
  

  return (
    <ImageBackground
      source={chatBackground}
      resizeMode="cover"
      style={{ flex: 1, backgroundColor: theme.screen }}
    >
      <LinearGradient
          colors={[
            isDark ?  'rgba(0,0,0,0.1)':'rgba(0,0,0,0.0)',
            isDark ?  'rgba(0,0,0,0.1)':'rgba(0,0,0,0.0)',
          ]}
          style={{ flex: 1 }}
        >
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
    <View style={styles.screen}>
      <Modal visible={callStatus !== 'idle'} transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.callOverlay, {}]}>
          <View style={styles.callTop}>
            <Image source={{ uri: `https://picsum.photos/seed/${id}/300` }} style={styles.callAvatar} />
            <Text style={[styles.callName, { color: primaryText }]}>{id.replace('_', ' ')}</Text>
            <Text style={styles.callStatus}>
              {callStatus === 'dialing'
                ? `Requesting ${callType} connection...`
                : callStatus === 'connected'
                ? `Connected • ${formatDuration(callDuration)}`
                : 'Signal Lost'}
            </Text>
          </View>

          <View style={styles.callActions}>
            <Pressable onPress={() => setIsMuted((v) => !v)} style={[styles.callBtn, isMuted && styles.callBtnActive]}>
              <MaterialIcons name={isMuted ? 'mic-off' : 'mic'} size={22} color={isMuted ? '#000' : '#fff'} />
            </Pressable>
            <Pressable onPress={endCall} style={styles.callEndBtn}>
              <MaterialIcons name="call-end" size={32} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setIsVideoOff((v) => !v)} style={[styles.callBtn, isVideoOff && styles.callBtnActive]}>
              <MaterialIcons name={isVideoOff ? 'videocam-off' : 'videocam'} size={22} color={isVideoOff ? '#000' : '#fff'} />
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: border }]}>
        <View style={styles.headerRow}>
          {/* <Pressable onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder }]}>
            <MaterialIcons name="chevron-left" size={20} color={primaryText} />
          </Pressable> */}

          <View style={styles.profileWrap}>
            <Image source={{ uri: `https://picsum.photos/seed/${id}/100` }} style={styles.profileAvatar} />
            <View style={styles.onlineDot} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: primaryText }]}>{id.replace('_', ' ')}</Text>
            <Text style={[styles.userSub, { color: mutedText }]}>{isTyping || isGeneratingReplies ? 'Thinking...' : 'Synchronized'}</Text>
          </View>

          {/* <Pressable onPress={() => startCall('audio')} style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder }]}>
            <MaterialIcons name="call" size={18} color={primaryText} />
          </Pressable>
          <Pressable onPress={() => startCall('video')} style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder }]}>
            <MaterialIcons name="videocam" size={18} color={primaryText} />
          </Pressable> */}
        </View>

        {/* <View style={[styles.metaCard, { backgroundColor: softSurface, borderColor: border }]}>
          <View>
            <Text style={[styles.metaLabel, { color: mutedText }]}>{isCreator ? 'Support Status' : 'Your Subscription'}</Text>
            <Text style={[styles.metaValue, { color: primaryText }]}>{meta.subStatus}</Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: border }]} />
          <View>
            <Text style={[styles.metaLabel, { color: mutedText }]}>{isCreator ? 'LTV' : 'Next Billing'}</Text>
            <Text style={[styles.metaValue, { color: primaryText }]}>{isCreator ? (meta as any).ltv : (meta as any).nextBilling}</Text>
          </View>
          {isCreator && (
            <>
              <View style={[styles.metaDivider, { backgroundColor: border }]} />
              <View>
                <Text style={[styles.metaLabel, { color: mutedText }]}>Engage Score</Text>
                <Text style={[styles.metaValue, { color: PRIMARY_COLOR }]}>{(meta as any).score}%</Text>
              </View>
            </>
          )}
        </View> */}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ paddingBottom: 140 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m) => (
          <View key={m.id} style={[styles.msgRow, m.sender === 'me' ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
            {m.type === 'drop' ? (
              <View style={styles.dropBubble}>
                <View style={styles.dropThumb}>
                  <View style={styles.playButton}>
                    <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
                  </View>
                </View>
                <Text style={styles.dropTitle}>Private Drop Established</Text>
                <Text style={[styles.dropName, { color: primaryText }]}>Nebula Acoustic Cut.mov</Text>
              </View>
            ) : m.type === 'tip_request' ? (
              <View style={styles.tipBubble}>
                <MaterialIcons name="redeem" size={24} color="#22c55e" />
                <View>
                  <Text style={styles.tipLabel}>Support Request Sent</Text>
                  <Text style={[styles.tipAmount, { color: primaryText }]}>Requesting Tip: ${m.amount}</Text>
                </View>
              </View>
            ) : m.type === 'gift' ? (
              <View style={styles.giftBubble}>
                <View style={styles.giftBubbleIcon}>
                  {m.gift?.isImage ? (
                    <Image source={{ uri: m.gift.icon }} style={styles.giftBubbleImage} />
                  ) : (
                    <Text style={styles.giftBubbleEmoji}>{m.gift?.icon ?? '🎁'}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.giftBubbleLabel}>Gift Sent</Text>
                  <Text style={[styles.giftBubbleName, { color: primaryText }]}>{m.gift?.name ?? m.text}</Text>
                  <Text style={[styles.giftBubblePrice, { color: mutedText }]}>{m.amount}</Text>
                </View>
              </View>
            ) : m.type === 'image' ? (
              <View style={styles.stickerBubble}>
                <Image source={{ uri: m.text }} style={styles.stickerImage} />
              </View>
            ) : (
              <View style={[styles.msgBubble, m.sender === 'me' ? styles.msgMine : styles.msgOther, m.sender === 'other' && { backgroundColor: bubbleOther, borderColor: border }]}>
                <Text style={[styles.msgText, { color: m.sender === 'me' ? '#fff' : primaryText }]}>{m.text}</Text>
              </View>
            )}

            <Text style={[styles.msgMeta, { color: mutedText }]}>
              {m.time}
              {m.sender === 'me' ? ` • ${m.status || 'sent'}` : ''}
            </Text>
          </View>
        ))}
      </ScrollView>

      {isToolsOpen && (
        <View style={[styles.toolsSheet, { backgroundColor: panelBg, borderColor: border }]}>
          {isCreator ? (
            <>
              <Pressable style={[styles.toolItem, { backgroundColor: softSurface }]} onPress={() => handleSend('Nebula Acoustic Cut', 'drop')}>
                <MaterialIcons name="movie-edit" size={22} color={PRIMARY_COLOR} />
                <View>
                  <Text style={[styles.toolTitle, { color: primaryText }]}>Send Private Drop</Text>
                  <Text style={[styles.toolSub, { color: subtleText }]}>Attach locked clip from library</Text>
                </View>
              </Pressable>
              <Pressable style={[styles.toolItem, { backgroundColor: softSurface }]} onPress={() => handleSend('Support Request', 'tip_request', '50.00')}>
                <MaterialIcons name="payments" size={22} color="#22c55e" />
                <View>
                  <Text style={[styles.toolTitle, { color: primaryText }]}>Request Supporting Tip</Text>
                  <Text style={[styles.toolSub, { color: subtleText }]}>Generate one-on-one tip node</Text>
                </View>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={[styles.toolItem, { backgroundColor: softSurface }]} onPress={() => navigation.navigate('Wallet')}>
                <MaterialIcons name="account-balance-wallet" size={22} color={PRIMARY_COLOR} />
                <View>
                  <Text style={[styles.toolTitle, { color: primaryText }]}>Top Up Coins</Text>
                  <Text style={[styles.toolSub, { color: subtleText }]}>Add Kulsah coins to wallet</Text>
                </View>
              </Pressable>
              <Pressable style={[styles.toolItem, { backgroundColor: softSurface }]} onPress={() => handleSend('Sent a tip! 🎁', 'tip_request', '10.00')}>
                <MaterialIcons name="volunteer-activism" size={22} color="#22c55e" />
                <View>
                  <Text style={[styles.toolTitle, { color: primaryText }]}>Send a Tip</Text>
                  <Text style={[styles.toolSub, { color: subtleText }]}>Support creator with coins</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      )}

      <View style={[styles.footer, { backgroundColor: footerBg, borderTopColor: border }]}>
        {smartReplies.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repliesRow}>
            {smartReplies.map((reply, idx) => (
              <Pressable key={idx} onPress={() => handleSend(reply)} style={[styles.replyChip, { backgroundColor: chipBg, borderColor: chipBorder }]}>
                <Text style={styles.replyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {showEmojiPicker && (
          <View style={[styles.emojiPanel, { backgroundColor: softSurface, borderColor: border }]}>
            <View style={styles.emojiRow}>
              {emojiSet.map((emoji) => (
                <Pressable key={emoji} onPress={() => addEmoji(emoji)} style={[styles.emojiBtn, { borderColor: border, backgroundColor: isDark ? 'transparent' : theme.card }]}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {stickers.map((url) => (
                <Pressable key={url} onPress={() => sendSticker(url)} style={[styles.stickerBtn, { borderColor: border }]}>
                  <Image source={{ uri: url }} style={styles.stickerBtnImg} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <Pressable onPress={() => setIsToolsOpen((v) => !v)} style={[styles.addBtn, { backgroundColor: softSurface, borderColor: border }, isToolsOpen && styles.addBtnActive]}>
            <MaterialIcons name="add" size={28} color={isToolsOpen ? '#fff' : PRIMARY_COLOR} />
          </Pressable>

          <KulsahInputBar
              value={msg}
              onChangeText={setMsg}
              placeholder={isCreator ? 'Broadcasting to your community...' : `Message ${id.replace('_', ' ')}...`}
              placeholderTextColor={mutedText}
              containerStyle={[styles.inputWrap, { borderColor: border, backgroundColor: softSurface }]}
              inputStyle={[styles.input, { color: primaryText }]}
              onSubmitEditing={() => handleSend()}
              rightAccessory={(
                <>
                  <View style={styles.inputActions}>
                    <Pressable
                      onPress={() => setGiftDialogOpen(true)}
                      style={styles.inputIcon}
                    >
                      <MaterialIcons name="redeem" size={24} color={mutedText} />
                    </Pressable>
                    <Pressable
                      onPress={() => setShowEmojiPicker((v) => !v)}
                      style={styles.inputIcon}
                    >
                      <MaterialIcons name="mood" size={24} color={showEmojiPicker ? PRIMARY_COLOR : mutedText} />
                    </Pressable>
                  </View>
                  {msg.trim() ? (
                    <Pressable onPress={() => handleSend()} style={styles.inputSendButton}>
                      <MaterialIcons name="send" size={18} color="#fff" />
                    </Pressable>
                  ) : null}
                </>
              )}
            />
        </View>
      </View>
      <GiftDialog
        isOpen={giftDialogOpen}
        onClose={() => setGiftDialogOpen(false)}
        creatorName={id.replace('_', ' ')}
        currentBalance={coinBalance}
        onSendGift={handleSendGift}
        onTopUpSuccess={(amount) => setCoinBalance((prev) => prev + amount)}
      />
    </View>
    </KeyboardAvoidingView>
    </LinearGradient>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  callOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 70,
    paddingHorizontal: 24,
  },
  callTop: { alignItems: 'center', gap: 10 },
  callAvatar: { width: 132, height: 132, borderRadius: 36, borderWidth: 3, borderColor: primaryColorAlpha(0.35) },
  callName: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  callStatus: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 2 },
  callActions: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  callBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  callBtnActive: { backgroundColor: '#fff' },
  callEndBtn: { width: 74, height: 74, borderRadius: 24, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 52,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileWrap: { position: 'relative' },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: primaryColorAlpha(0.5) },
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  userName: { ...fontSize.h1, lineHeight: fontSize.b5.lineHeight },
  userSub: { ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight },
  metaCard: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLabel: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1 },
  metaValue: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  metaDivider: { width: 1, height: 20 },
  messages: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  msgRow: { marginBottom: 14 },
  msgBubble: { maxWidth: '86%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  msgMine: { backgroundColor: PRIMARY_COLOR },
  msgOther: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  msgText: { ...fontSize.b3, lineHeight: 19 },
  msgMeta: { marginTop: 5, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  dropBubble: {
    maxWidth: '86%',
    borderRadius: 24,
    backgroundColor: primaryColorAlpha(0.12),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    padding: 12,
    gap: 6,
  },
  dropThumb: { borderRadius: 14, backgroundColor: '#000', height: 120, justifyContent: 'center', alignItems: 'center' },
  playButton: { width: 66, height: 66, borderRadius: 33, backgroundColor: primaryColorAlpha(0.24), borderWidth: 1, borderColor: primaryColorAlpha(0.5), alignItems: 'center', justifyContent: 'center' },
  dropTitle: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  dropName: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  tipBubble: {
    maxWidth: '86%',
    borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    padding: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipLabel: { color: '#22c55e', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  tipAmount: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  giftBubble: {
    maxWidth: '86%',
    borderRadius: 24,
    backgroundColor: primaryColorAlpha(0.12),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.35),
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftBubbleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.16),
  },
  giftBubbleImage: {
    width: '100%',
    height: '100%',
  },
  giftBubbleEmoji: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  giftBubbleLabel: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  giftBubbleName: {
    marginTop: 2,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  giftBubblePrice: {
    marginTop: 2,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  stickerBubble: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 96,
    height: 96,
  },
  stickerImage: { width: '100%', height: '100%' },
  toolsSheet: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 102,
    zIndex: 30,
    borderRadius: 24,
    borderWidth: 1,
    padding: 8,
    gap: 4,
  },
  toolItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14 },
  toolTitle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  toolSub: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  footer: {
    paddingTop: 6,
    paddingHorizontal: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
  },
  repliesRow: { gap: 8, paddingVertical: 6 },
  replyChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  replyText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  emojiPanel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  stickerBtn: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  stickerBtnImg: { width: '100%', height: '100%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnActive: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR },
  inputWrap: {
    flex: 1,
    height: 48,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  inputActions: { flexDirection: 'row' },
  inputIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputSendButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: PRIMARY_COLOR, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.12)' },
});

export default ChatView;
