import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';

interface Message {
  id: number;
  sender: 'me' | 'other';
  text: string;
  time: string;
  type?: 'text' | 'image' | 'drop' | 'tip_request';
  status?: 'sent' | 'read';
  amount?: string;
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
        .map((r) => r.trim().replace(/^"|"$/g, ''))
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

  const emojiSet = useMemo(() => ['🔥', '🙌', '❤️', '✨', '🌌', '🚀', '💯'], []);
  const stickers = useMemo(
    () => [
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=120',
      'https://images.unsplash.com/photo-1572375927902-e60e87bb7385?auto=format&fit=crop&q=80&w=120',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=120',
    ],
    [],
  );

  return (
    <View style={[styles.screen, { backgroundColor: theme.screen }]}>
      <Modal visible={callStatus !== 'idle'} transparent animationType="fade">
        <View style={styles.callOverlay}>
          <View style={styles.callTop}>
            <Image source={{ uri: `https://picsum.photos/seed/${id}/300` }} style={styles.callAvatar} />
            <Text style={styles.callName}>{id.replace('_', ' ')}</Text>
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

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
          </Pressable>

          <View style={styles.profileWrap}>
            <Image source={{ uri: `https://picsum.photos/seed/${id}/100` }} style={styles.profileAvatar} />
            <View style={styles.onlineDot} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{id.replace('_', ' ')}</Text>
            <Text style={styles.userSub}>{isTyping || isGeneratingReplies ? 'Thinking...' : 'Synchronized'}</Text>
          </View>

          <Pressable onPress={() => startCall('audio')} style={styles.iconBtn}>
            <MaterialIcons name="call" size={18} color="#fff" />
          </Pressable>
          <Pressable onPress={() => startCall('video')} style={styles.iconBtn}>
            <MaterialIcons name="videocam" size={18} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.metaCard}>
          <View>
            <Text style={styles.metaLabel}>{isCreator ? 'Support Status' : 'Your Subscription'}</Text>
            <Text style={styles.metaValue}>{meta.subStatus}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View>
            <Text style={styles.metaLabel}>{isCreator ? 'LTV' : 'Next Billing'}</Text>
            <Text style={styles.metaValue}>{isCreator ? (meta as any).ltv : (meta as any).nextBilling}</Text>
          </View>
          {isCreator && (
            <>
              <View style={styles.metaDivider} />
              <View>
                <Text style={styles.metaLabel}>Engage Score</Text>
                <Text style={[styles.metaValue, { color: '#cd2bee' }]}>{(meta as any).score}%</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView
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
                  <MaterialIcons name="play-circle" size={42} color="#cd2bee" />
                </View>
                <Text style={styles.dropTitle}>Private Drop Established</Text>
                <Text style={styles.dropName}>Nebula Acoustic Cut.mov</Text>
              </View>
            ) : m.type === 'tip_request' ? (
              <View style={styles.tipBubble}>
                <MaterialIcons name="redeem" size={24} color="#22c55e" />
                <View>
                  <Text style={styles.tipLabel}>Support Request Sent</Text>
                  <Text style={styles.tipAmount}>Requesting Tip: ${m.amount}</Text>
                </View>
              </View>
            ) : m.type === 'image' ? (
              <View style={styles.stickerBubble}>
                <Image source={{ uri: m.text }} style={styles.stickerImage} />
              </View>
            ) : (
              <View style={[styles.msgBubble, m.sender === 'me' ? styles.msgMine : styles.msgOther]}>
                <Text style={[styles.msgText, m.sender === 'me' && { color: '#fff' }]}>{m.text}</Text>
              </View>
            )}

            <Text style={styles.msgMeta}>
              {m.time}
              {m.sender === 'me' ? ` • ${m.status || 'sent'}` : ''}
            </Text>
          </View>
        ))}
      </ScrollView>

      {isToolsOpen && (
        <View style={styles.toolsSheet}>
          {isCreator ? (
            <>
              <Pressable style={styles.toolItem} onPress={() => handleSend('Nebula Acoustic Cut', 'drop')}>
                <MaterialIcons name="movie-edit" size={22} color="#cd2bee" />
                <View>
                  <Text style={styles.toolTitle}>Send Private Drop</Text>
                  <Text style={styles.toolSub}>Attach locked clip from library</Text>
                </View>
              </Pressable>
              <Pressable style={styles.toolItem} onPress={() => handleSend('Support Request', 'tip_request', '50.00')}>
                <MaterialIcons name="payments" size={22} color="#22c55e" />
                <View>
                  <Text style={styles.toolTitle}>Request Supporting Tip</Text>
                  <Text style={styles.toolSub}>Generate one-on-one tip node</Text>
                </View>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.toolItem} onPress={() => navigation.navigate('Wallet')}>
                <MaterialIcons name="account-balance-wallet" size={22} color="#cd2bee" />
                <View>
                  <Text style={styles.toolTitle}>Top Up Coins</Text>
                  <Text style={styles.toolSub}>Add Kulsah coins to wallet</Text>
                </View>
              </Pressable>
              <Pressable style={styles.toolItem} onPress={() => handleSend('Sent a tip! 🎁', 'tip_request', '10.00')}>
                <MaterialIcons name="volunteer-activism" size={22} color="#22c55e" />
                <View>
                  <Text style={styles.toolTitle}>Send a Tip</Text>
                  <Text style={styles.toolSub}>Support creator with coins</Text>
                </View>
              </Pressable>
            </>
          )}
        </View>
      )}

      <View style={styles.footer}>
        {smartReplies.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repliesRow}>
            {smartReplies.map((reply, idx) => (
              <Pressable key={idx} onPress={() => handleSend(reply)} style={styles.replyChip}>
                <Text style={styles.replyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {showEmojiPicker && (
          <View style={styles.emojiPanel}>
            <View style={styles.emojiRow}>
              {emojiSet.map((emoji) => (
                <Pressable key={emoji} onPress={() => addEmoji(emoji)} style={styles.emojiBtn}>
                  <Text style={{ fontSize: fontScale(18) }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {stickers.map((url) => (
                <Pressable key={url} onPress={() => sendSticker(url)} style={styles.stickerBtn}>
                  <Image source={{ uri: url }} style={styles.stickerBtnImg} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.inputRow}>
          <Pressable onPress={() => setIsToolsOpen((v) => !v)} style={[styles.addBtn, isToolsOpen && styles.addBtnActive]}>
            <MaterialIcons name="add" size={28} color={isToolsOpen ? '#fff' : '#cd2bee'} />
          </Pressable>

          <View style={styles.inputWrap}>
            <TextInput
              value={msg}
              onChangeText={setMsg}
              placeholder={isCreator ? 'Broadcasting to your community...' : `Message ${id.replace('_', ' ')}...`}
              placeholderTextColor="#6b7280"
              style={styles.input}
              onSubmitEditing={() => handleSend()}
            />
            <Pressable onPress={() => setShowEmojiPicker((v) => !v)}>
              <MaterialIcons name="mood" size={22} color={showEmojiPicker ? '#cd2bee' : '#6b7280'} />
            </Pressable>
          </View>

          <Pressable onPress={() => handleSend()} disabled={!msg.trim()} style={[styles.sendBtn, !msg.trim() && styles.sendBtnDisabled]}>
            <MaterialIcons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  callOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 70,
    paddingHorizontal: 24,
  },
  callTop: { alignItems: 'center', gap: 10 },
  callAvatar: { width: 132, height: 132, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(205,43,238,0.35)' },
  callName: { color: '#fff', fontSize: fontScale(27), fontFamily: 'PlusJakartaSansExtraBold' },
  callStatus: { color: '#cd2bee', fontSize: fontScale(11), letterSpacing: 2, fontFamily: 'PlusJakartaSansExtraBold' },
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f1016',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  profileWrap: { position: 'relative' },
  profileAvatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: 'rgba(205,43,238,0.5)' },
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e' },
  userName: { color: '#fff', fontSize: fontScale(12), fontFamily: 'PlusJakartaSansExtraBold' },
  userSub: { color: '#6b7280', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  metaCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLabel: { color: '#6b7280', fontSize: fontScale(8), fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1 },
  metaValue: { color: '#fff', fontSize: fontScale(11), fontFamily: 'PlusJakartaSansExtraBold' },
  metaDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  messages: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  msgRow: { marginBottom: 14 },
  msgBubble: { maxWidth: '86%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  msgMine: { backgroundColor: '#cd2bee' },
  msgOther: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  msgText: { color: '#e5e7eb', fontSize: fontScale(13), lineHeight: 19, fontFamily: 'PlusJakartaSansMedium' },
  msgMeta: { marginTop: 5, color: '#6b7280', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansBold' },
  dropBubble: {
    maxWidth: '86%',
    borderRadius: 24,
    backgroundColor: 'rgba(205,43,238,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.35)',
    padding: 12,
    gap: 6,
  },
  dropThumb: { borderRadius: 14, backgroundColor: '#000', height: 120, justifyContent: 'center', alignItems: 'center' },
  dropTitle: { color: '#cd2bee', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansExtraBold' },
  dropName: { color: '#fff', fontSize: fontScale(12), fontFamily: 'PlusJakartaSansBold' },
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
  tipLabel: { color: '#22c55e', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  tipAmount: { color: '#fff', fontSize: fontScale(13), fontFamily: 'PlusJakartaSansBold' },
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
    backgroundColor: '#12131a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 8,
    gap: 4,
  },
  toolItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)' },
  toolTitle: { color: '#fff', fontSize: fontScale(11), fontFamily: 'PlusJakartaSansExtraBold' },
  toolSub: { color: '#6b7280', fontSize: fontScale(9), fontFamily: 'PlusJakartaSansBold' },
  footer: {
    paddingTop: 6,
    paddingHorizontal: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0f1016',
  },
  repliesRow: { gap: 8, paddingVertical: 6 },
  replyChip: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(205,43,238,0.35)', backgroundColor: 'rgba(205,43,238,0.15)', paddingHorizontal: 12, paddingVertical: 8 },
  replyText: { color: '#cd2bee', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  emojiPanel: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
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
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerBtn: { width: 44, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  stickerBtnImg: { width: '100%', height: '100%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnActive: { backgroundColor: '#cd2bee', borderColor: '#cd2bee' },
  inputWrap: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, color: '#fff', fontSize: fontScale(13), fontFamily: 'PlusJakartaSansBold' },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#cd2bee', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.12)' },
});

export default ChatView;
