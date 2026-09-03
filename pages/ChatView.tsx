import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
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
import KulsahInputBar from '../components/KulsahInputBar';
import type { GiftSelection } from '../components/GiftDialog';
import { fontSize } from './typography';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  createClientMessageId,
  flattenConversationMessagePages,
  formatChatPresence,
  getApiErrorMessage,
  messagingApi,
  useAuthStore,
  useCancelConversationRequest,
  useConversationMessages,
  useConversations,
  useConversationUnreadCount,
  useCreateConversation,
  useMarkConversationRead,
  useMessagingStore,
  useConversationRealtime,
  useReportSignalContent,
  useSendConversationMessage,
  uploadMessageAttachment,
} from '../src';
import type { ConversationMessage, ConversationMessageRequest, SendConversationMessagePayload, Sticker } from '../src';

interface Message {
  id: number | string;
  clientMessageId?: string;
  sender: 'me' | 'other';
  text: string;
  time: string;
  type?: 'text' | 'image' | 'drop' | 'tip_request' | 'gift';
  status?: 'sending' | 'sent' | 'read' | 'failed';
  amount?: string;
  gift?: GiftSelection;
  payload?: SendConversationMessagePayload;
}

type CallType = 'audio' | 'video';
type CallStatus = 'idle' | 'dialing' | 'connected' | 'ended';

interface CurrentUser {
  role?: 'creator' | 'fan';
}

type ChatRouteParams = {
  conversationId?: string | number;
  senderId?: string | number;
  id?: string | number;
  name?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
};

const numericId = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const messageTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const serverMessageToView = (
  message: ConversationMessage,
  currentUserId?: string | number | null,
): Message => {
  const metadata = message.metadata ?? {};
  const attachmentUrl = message.attachments.find((attachment) => attachment.url)?.url;
  const rawGift = metadata.gift;
  const gift = rawGift && typeof rawGift === 'object' ? rawGift as GiftSelection : undefined;
  const amount = typeof metadata.amount === 'string' ? metadata.amount : undefined;
  const metadataSticker = metadata.sticker && typeof metadata.sticker === 'object'
    ? metadata.sticker as Partial<Sticker>
    : undefined;
  const stickerUrl = message.sticker?.media_url
    ?? metadataSticker?.media_url
    ?? (typeof metadata.sticker_url === 'string' ? metadata.sticker_url : undefined);
  const viewType: Message['type'] = message.type === 'sticker' || message.type === 'image'
    ? 'image'
    : message.type === 'drop' || message.type === 'tip_request' || message.type === 'gift'
      ? message.type
      : 'text';

  return {
    id: message.id,
    clientMessageId: message.client_message_id ?? undefined,
    sender: Number(message.sender.id) === Number(currentUserId) ? 'me' : 'other',
    text: stickerUrl || message.body || attachmentUrl || '',
    time: messageTime(message.created_at),
    type: viewType,
    status: message.delivery_status === 'read' ? 'read' : 'sent',
    amount,
    gift,
  };
};

const ChatView: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as ChatRouteParams;
  const routedConversationId = numericId(params.conversationId);
  const participantId = numericId(params.senderId ?? params.id);
  const [resolvedConversationId, setResolvedConversationId] = useState<number | undefined>(routedConversationId);
  const activeConversationId = routedConversationId ?? resolvedConversationId;
  const id = String(params.name || params.id || 'Conversation');
  const avatar = params.avatar || `https://picsum.photos/seed/${encodeURIComponent(id)}/100`;
  const authUser = useAuthStore((state) => state.user);
  const setUnreadCount = useMessagingStore((state) => state.setUnreadCount);
  const onlineUserIds = useMessagingStore((state) => state.onlineUserIds);
  const onlinePresenceReady = useMessagingStore((state) => state.onlinePresenceReady);
  const messagesQuery = useConversationMessages(activeConversationId);
  const unreadQuery = useConversationUnreadCount(Boolean(activeConversationId));
  const createConversationMutation = useCreateConversation();
  const cancelRequestMutation = useCancelConversationRequest();
  const reportSignalContent = useReportSignalContent();
  const sendMessageMutation = useSendConversationMessage();
  const markReadMutation = useMarkConversationRead();
  const conversationsQuery = useConversations();
  const { isParticipantTyping } = useConversationRealtime(activeConversationId);
  const setActiveConversationId = useMessagingStore((state) => state.setActiveConversationId);
  const serverMessages = useMemo(
    () => flattenConversationMessagePages(messagesQuery.data?.pages),
    [messagesQuery.data],
  );
  const conversation = useMemo(() => (
    conversationsQuery.data?.pages
      .flatMap((page) => page.data)
      .find((item) => Number(item.id) === Number(activeConversationId))
  ), [activeConversationId, conversationsQuery.data]);
  const conversationParticipant = useMemo(() => (
    conversation?.participants.find((item) => Number(item.user_id) === Number(participantId))
      ?? conversation?.participants.find((item) => Number(item.user_id) !== Number(authUser?.id))
  ), [authUser?.id, conversation, participantId]);
  const participantPresenceId = numericId(
    conversationParticipant?.user_id ?? conversationParticipant?.user.id ?? participantId,
  );
  const participantOnlineFallback = conversationParticipant?.user.is_online ?? params.isOnline ?? false;
  const participantIsOnline = Boolean(
    isParticipantTyping
    || (onlinePresenceReady && participantPresenceId
      ? onlineUserIds.includes(participantPresenceId)
      : participantOnlineFallback),
  );

  const scrollRef = useRef<ScrollView>(null);
  const lastMarkedReadRef = useRef<number | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingActiveRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [msg, setMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isGeneratingReplies, setIsGeneratingReplies] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [coinBalance, setCoinBalance] = useState(1250);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [pendingMessageRequest, setPendingMessageRequest] = useState<ConversationMessageRequest | null>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [presenceClock, setPresenceClock] = useState(() => Date.now());

  const participantStatus = isParticipantTyping
    ? 'Typing…'
    : formatChatPresence(
      participantIsOnline,
      conversationParticipant?.user.last_seen_at ?? params.lastSeenAt,
      presenceClock,
    );

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
    if (last && last.sender === 'other') generateSmartReplies(last.text);
  }, [messages]);

  useEffect(() => {
    const mapped = serverMessages.map((message) => serverMessageToView(message, authUser?.id));
    setMessages((current) => {
      const serverClientIds = new Set(mapped.map((message) => message.clientMessageId).filter(Boolean));
      const localOnly = current.filter((message) => (
        (message.status === 'sending' || message.status === 'failed')
        && !serverClientIds.has(message.clientMessageId)
      ));
      return [...mapped, ...localOnly];
    });
  }, [authUser?.id, serverMessages]);

  useEffect(() => {
    if (unreadQuery.data != null) setUnreadCount(unreadQuery.data);
  }, [setUnreadCount, unreadQuery.data]);

  useEffect(() => {
    lastMarkedReadRef.current = null;
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || serverMessages.length === 0) return;
    const lastMessage = serverMessages[serverMessages.length - 1];
    if (lastMarkedReadRef.current === lastMessage.id) return;
    lastMarkedReadRef.current = lastMessage.id;
    markReadMutation.mutate({
      conversation: activeConversationId,
      payload: {
        last_read_message_id: lastMessage.id,
        read_at: new Date().toISOString(),
      },
    });
  }, [activeConversationId, markReadMutation.mutate, serverMessages]);

  useEffect(() => {
    if (!activeConversationId) return;
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

    if (!msg.trim()) {
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        void messagingApi.stopTyping(activeConversationId).catch(() => undefined);
      }
      return;
    }

    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      void messagingApi.startTyping(activeConversationId).catch(() => undefined);
    }
    typingTimerRef.current = setTimeout(() => {
      typingActiveRef.current = false;
      void messagingApi.stopTyping(activeConversationId).catch(() => undefined);
    }, 1_200);

    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [activeConversationId, msg]);

  useEffect(() => () => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (typingActiveRef.current && activeConversationId) {
      void messagingApi.stopTyping(activeConversationId).catch(() => undefined);
    }
  }, [activeConversationId]);

  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  const generateSmartReplies = async (lastMessage: string) => {
    setSmartReplies(['Thank you!', 'More coming soon!', 'Stay cosmic!']);
    return;
    /* Direct client-side AI generation is disabled until the backend exposes
       an authenticated AI endpoint.
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
    */
  };

  const resolveConversationId = async () => {
    if (activeConversationId) return activeConversationId;
    if (!participantId) {
      Alert.alert('Conversation unavailable', 'Open this chat from Signal or choose a valid recipient first.');
      return undefined;
    }
    Alert.alert('Send an introduction first', 'Start this conversation with a text message before adding attachments.');
    return undefined;
  };

  const submitMessage = async (
    conversationId: number,
    localMessage: Message,
    payload: SendConversationMessagePayload,
  ) => {
    try {
      const saved = await sendMessageMutation.mutateAsync({ conversation: conversationId, payload });
      const mapped = serverMessageToView(saved, authUser?.id);
      setMessages((current) => current.map((message) => (
        message.clientMessageId === localMessage.clientMessageId ? mapped : message
      )));
      return true;
    } catch {
      setMessages((current) => current.map((message) => (
        message.clientMessageId === localMessage.clientMessageId
          ? { ...message, status: 'failed' }
          : message
      )));
      return false;
    }
  };

  const handleSend = async (
    textOverride?: string,
    type: Message['type'] = 'text',
    amount?: string,
    metadata: Record<string, unknown> = {},
    payloadOverrides: Pick<SendConversationMessagePayload, 'sticker_id'> = {},
  ) => {
    if (pendingMessageRequest) return false;
    const textToSend = textOverride ?? msg;
    if (!textToSend.trim() && type === 'text') return false;

    const clientMessageId = createClientMessageId();
    const payload: SendConversationMessagePayload = {
      client_message_id: clientMessageId,
      idempotency_key: clientMessageId,
      type: type === 'image' ? 'sticker' : type,
      body: textToSend,
      ...payloadOverrides,
      metadata: {
        ...metadata,
        ...(amount ? { amount } : {}),
      },
    };
    const newMsg: Message = {
      id: clientMessageId,
      clientMessageId,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      amount,
      gift: metadata.gift && typeof metadata.gift === 'object'
        ? metadata.gift as GiftSelection
        : undefined,
      status: 'sending',
      payload,
    };

    setMessages((prev) => [...prev, newMsg]);
    setMsg('');
    setSmartReplies([]);
    setIsToolsOpen(false);

    if (!activeConversationId) {
      if (!participantId) {
        setMessages((current) => current.filter((message) => message.clientMessageId !== clientMessageId));
        setMsg(textToSend);
        Alert.alert('Conversation unavailable', 'Open this chat from Signal or choose a valid recipient first.');
        return false;
      }

      try {
        const result = await createConversationMutation.mutateAsync({
          participant_ids: [participantId],
          initial_message: payload,
        });

        if (result.kind === 'request') {
          setPendingMessageRequest(result.request);
          setMessages((current) => current.map((message) => (
            message.clientMessageId === clientMessageId ? { ...message, status: 'sent' } : message
          )));
          Alert.alert('Message request sent', `${id.replace('_', ' ')} can reply after accepting your request.`);
          return true;
        }

        const conversation = result.conversation;
        setResolvedConversationId(conversation.id);
        const savedInitialMessage = conversation.last_message?.client_message_id === clientMessageId
          ? conversation.last_message
          : null;

        if (savedInitialMessage) {
          const mapped = serverMessageToView(savedInitialMessage, authUser?.id);
          setMessages((current) => current.map((message) => (
            message.clientMessageId === clientMessageId ? mapped : message
          )));
          return true;
        }

        return submitMessage(conversation.id, newMsg, payload);
      } catch (error) {
        setMessages((current) => current.filter((message) => message.clientMessageId !== clientMessageId));
        setMsg(textToSend);
        Alert.alert('Unable to start conversation', getApiErrorMessage(error));
        return false;
      }
    }

    return submitMessage(activeConversationId, newMsg, payload);
  };

  const retryMessage = async (message: Message) => {
    if (!activeConversationId || !message.payload) return;
    setMessages((current) => current.map((item) => (
      item.clientMessageId === message.clientMessageId ? { ...item, status: 'sending' } : item
    )));
    await submitMessage(activeConversationId, { ...message, status: 'sending' }, message.payload);
  };

  const cancelPendingMessageRequest = async () => {
    if (!pendingMessageRequest || cancelRequestMutation.isPending) return;
    try {
      await cancelRequestMutation.mutateAsync(pendingMessageRequest.id);
      const introClientMessageId = pendingMessageRequest.intro_client_message_id;
      setPendingMessageRequest(null);
      setMessages((current) => current.filter((message) => (
        !introClientMessageId || message.clientMessageId !== introClientMessageId
      )));
    } catch (error) {
      Alert.alert('Could not cancel request', getApiErrorMessage(error));
    }
  };

  const pickAndSendImage = async () => {
    if (isUploadingAttachment) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow photo access to attach an image.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (selection.canceled || !selection.assets[0]) return;

    setIsUploadingAttachment(true);
    try {
      const conversationId = await resolveConversationId();
      if (!conversationId) return;
      const asset = selection.assets[0];
      const attachment = await uploadMessageAttachment(conversationId, {
        uri: asset.uri,
        fileName: asset.fileName || `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || 'image/jpeg',
        kind: 'image',
      });
      const clientMessageId = createClientMessageId();
      const payload: SendConversationMessagePayload = {
        client_message_id: clientMessageId,
        idempotency_key: clientMessageId,
        type: 'image',
        body: null,
        attachment_ids: [attachment.id],
      };
      const localMessage: Message = {
        id: clientMessageId,
        clientMessageId,
        sender: 'me',
        text: asset.uri,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'image',
        status: 'sending',
        payload,
      };
      setMessages((current) => [...current, localMessage]);
      setIsToolsOpen(false);
      await submitMessage(conversationId, localMessage, payload);
    } catch {
      Alert.alert('Attachment failed', 'The image could not be uploaded. Please try again.');
    } finally {
      setIsUploadingAttachment(false);
    }
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

  useEffect(() => {
    setActiveConversationId(activeConversationId ?? null);
    return () => setActiveConversationId(null);
  }, [activeConversationId, setActiveConversationId]);

  useEffect(() => {
    const interval = setInterval(() => setPresenceClock(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const sendSticker = (stickerUrl: string, sticker?: Sticker) => {
    void handleSend(
      stickerUrl,
      'image',
      undefined,
      sticker ? { sticker, sticker_url: sticker.media_url } : { sticker_url: stickerUrl },
      sticker ? { sticker_id: sticker.id } : {},
    );
  };

  const handleSendGift = (gift: GiftSelection) => {
    void handleSend(`Sent ${gift.name}`, 'gift', `${gift.price} KC`, { gift }).then((sent) => {
      if (sent) setCoinBalance((prev) => prev - gift.price);
    });
  };

  const reportConversationUser = () => {
    if (!participantId || reportSignalContent.isPending) return;
    Alert.alert(
      `Report ${id.replace('_', ' ')}?`,
      'Send this account to the Kulsah safety team for review.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            void reportSignalContent.mutateAsync({
              type: 'user',
              id: participantId,
              reason: 'Reported from Signal conversation.',
            }).then(() => {
              Alert.alert('Report submitted', 'Thanks. The safety team will review this account.');
            }).catch((error) => {
              Alert.alert('Could not submit report', getApiErrorMessage(error));
            });
          },
        },
      ],
    );
  };

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
    // <ImageBackground
    //   source={chatBackground}
    //   resizeMode="cover"
    //   style={{ flex: 1, backgroundColor: theme.screen }}
    // >
      // <LinearGradient
      //     colors={[
      //       isDark ?  'rgba(0,0,0,0.1)':'rgba(0,0,0,0.0)',
      //       isDark ?  'rgba(0,0,0,0.1)':'rgba(0,0,0,0.0)',
      //     ]}
      //     style={{ flex: 1 }}
      //   >
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
    <View style={styles.screen}>
      <Modal visible={callStatus !== 'idle'} transparent animationType="fade" statusBarTranslucent>
        <View style={[styles.callOverlay, {}]}>
          <View style={styles.callTop}>
            <Image source={{ uri: avatar }} style={styles.callAvatar} />
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
            <Image source={{ uri: avatar }} style={styles.profileAvatar} />
            {participantIsOnline ? <View style={[styles.onlineDot, { borderColor: headerBg }]} /> : null}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: primaryText }]}>{id.replace('_', ' ')}</Text>
            <Text style={[styles.userSub, { color: isParticipantTyping || participantIsOnline ? '#22c55e' : mutedText }]}>
              {participantStatus}
            </Text>
          </View>

          {participantId ? (
            <Pressable
              disabled={reportSignalContent.isPending}
              onPress={reportConversationUser}
              accessibilityRole="button"
              accessibilityLabel={`Report ${id.replace('_', ' ')}`}
              style={[styles.iconBtn, { backgroundColor: iconBtnBg, borderColor: iconBtnBorder }]}
            >
              {reportSignalContent.isPending ? (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              ) : (
                <MaterialIcons name="more-horiz" size={20} color={primaryText} />
              )}
            </Pressable>
          ) : null}

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
        {messagesQuery.hasNextPage ? (
          <Pressable
            style={styles.historyButton}
            disabled={messagesQuery.isFetchingNextPage}
            onPress={() => void messagesQuery.fetchNextPage()}
          >
            {messagesQuery.isFetchingNextPage
              ? <ActivityIndicator color={PRIMARY_COLOR} />
              : <Text style={styles.historyButtonText}>Load earlier messages</Text>}
          </Pressable>
        ) : null}
        {messagesQuery.isLoading ? (
          <View style={styles.messageState}>
            <ActivityIndicator color={PRIMARY_COLOR} />
            <Text style={[styles.messageStateText, { color: mutedText }]}>Loading messages...</Text>
          </View>
        ) : null}
        {messagesQuery.isError ? (
          <View style={styles.messageState}>
            <Text style={[styles.messageStateText, { color: primaryText }]}>Messages could not be loaded.</Text>
            <Pressable style={styles.historyButton} onPress={() => void messagesQuery.refetch()}>
              <Text style={styles.historyButtonText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
        {!messagesQuery.isLoading && !messagesQuery.isError && messages.length === 0 ? (
          <View style={styles.messageState}>
            <MaterialIcons name="forum" size={34} color={mutedText} />
            <Text style={[styles.messageStateText, { color: mutedText }]}>No messages yet. Say hello.</Text>
          </View>
        ) : null}
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

            <Pressable disabled={m.status !== 'failed'} onPress={() => void retryMessage(m)}>
            <Text style={[styles.msgMeta, { color: m.status === 'failed' ? '#ef4444' : mutedText }]}>
              {m.time}
              {m.sender === 'me' ? ` • ${m.status === 'failed' ? 'failed — tap to retry' : (m.status || 'sent')}` : ''}
            </Text>
            </Pressable>
          </View>
        ))}
        {isParticipantTyping ? (
          <View
            accessibilityRole="text"
            accessibilityLabel={`${id.replace('_', ' ')} is typing`}
            style={styles.typingIndicatorRow}
          >
            <View style={[styles.typingIndicatorBubble, { backgroundColor: bubbleOther, borderColor: border }]}>
              <View style={styles.typingDot} />
              <View style={[styles.typingDot, styles.typingDotMiddle]} />
              <View style={styles.typingDot} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {isToolsOpen && !pendingMessageRequest && (
        <View style={[styles.toolsSheet, { backgroundColor: panelBg, borderColor: border }]}>
          <Pressable
            style={[styles.toolItem, { backgroundColor: softSurface }]}
            disabled={isUploadingAttachment}
            onPress={() => void pickAndSendImage()}
          >
            {isUploadingAttachment
              ? <ActivityIndicator color={PRIMARY_COLOR} />
              : <MaterialIcons name="image" size={22} color={PRIMARY_COLOR} />}
            <View>
              <Text style={[styles.toolTitle, { color: primaryText }]}>Send Image</Text>
              <Text style={[styles.toolSub, { color: subtleText }]}>Upload a photo to this conversation</Text>
            </View>
          </Pressable>
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
        {pendingMessageRequest ? (
          <View style={[styles.pendingRequestBanner, { backgroundColor: softSurface, borderColor: border }]}>
            <View style={styles.pendingRequestIcon}>
              <MaterialIcons name="schedule-send" size={21} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.pendingRequestBody}>
              <Text style={[styles.pendingRequestTitle, { color: primaryText }]}>Message request pending</Text>
              <Text style={[styles.pendingRequestText, { color: mutedText }]}>You can send more messages after this request is accepted.</Text>
            </View>
            <Pressable
              disabled={cancelRequestMutation.isPending}
              onPress={() => void cancelPendingMessageRequest()}
              style={styles.cancelRequestButton}
            >
              {cancelRequestMutation.isPending ? (
                <ActivityIndicator size="small" color={PRIMARY_COLOR} />
              ) : (
                <Text style={styles.cancelRequestText}>Cancel</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <>
        {smartReplies.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.repliesRow}>
            {smartReplies.map((reply, idx) => (
              <Pressable key={idx} onPress={() => handleSend(reply)} style={[styles.replyChip, { backgroundColor: chipBg, borderColor: chipBorder }]}>
                <Text style={styles.replyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <Pressable onPress={() => setIsToolsOpen((v) => !v)} style={[styles.addBtn, { backgroundColor: softSurface, borderColor: border }, isToolsOpen && styles.addBtnActive]}>
            <MaterialIcons name="add" size={28} color={isToolsOpen ? '#fff' : PRIMARY_COLOR} />
          </Pressable>

          <KulsahInputBar
              value={msg}
              onChangeText={setMsg}
              expressionPicker={{
                onStickerSelect: sendSticker,
                giftOptions: {
                  creatorName: id.replace('_', ' '),
                  currentBalance: coinBalance,
                  onSendGift: handleSendGift,
                  onTopUpSuccess: (amount) => setCoinBalance((prev) => prev + amount),
                },
              }}
              placeholder={isCreator ? 'Broadcasting to your community...' : `Message ${id.replace('_', ' ')}...`}
              placeholderTextColor={mutedText}
              containerStyle={[styles.inputWrap, { borderColor: border, backgroundColor: softSurface }]}
              inputStyle={[styles.input, { color: primaryText }]}
              onSubmitEditing={() => void handleSend()}
              rightAccessory={(
                <>
                  {msg.trim() ? (
                    <Pressable onPress={() => void handleSend()} style={styles.inputSendButton}>
                      <MaterialIcons name="send" size={18} color="#fff" />
                    </Pressable>
                  ) : null}
                </>
              )}
            />
        </View>
          </>
        )}
      </View>
    </View>
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
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
  onlineDot: { position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, backgroundColor: '#22c55e' },
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
  messageState: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  messageStateText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textAlign: 'center' },
  historyButton: { alignSelf: 'center', minHeight: 36, justifyContent: 'center', paddingHorizontal: 16, marginBottom: 12 },
  historyButtonText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  msgRow: { marginBottom: 14 },
  msgBubble: { maxWidth: '86%', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
  msgMine: { backgroundColor: PRIMARY_COLOR },
  msgOther: { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  msgText: { ...fontSize.b3, lineHeight: 19 },
  msgMeta: { marginTop: 5, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  typingIndicatorRow: { alignItems: 'flex-start', marginBottom: 14 },
  typingIndicatorBubble: {
    minWidth: 52,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  typingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#94a3b8' },
  typingDotMiddle: { opacity: 0.65 },
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
  pendingRequestBanner: {
    minHeight: 72,
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingRequestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.13),
  },
  pendingRequestBody: { flex: 1 },
  pendingRequestTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontFamily: 'Inter_700Bold',
  },
  pendingRequestText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    marginTop: 2,
  },
  cancelRequestButton: {
    minWidth: 58,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  cancelRequestText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontFamily: 'Inter_700Bold',
  },
  repliesRow: { gap: 8, paddingVertical: 6 },
  replyChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  replyText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
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
