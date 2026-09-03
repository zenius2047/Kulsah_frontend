import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RtcSurfaceView } from 'react-native-agora';
import GiftDialog, { type GiftSelection } from '../components/GiftDialog';
import { PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { liveApi } from '../src/api/live.api';
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
import type { LiveComment, LiveCredentials, LiveSession } from '../src/types/live.types';
import { getApiErrorMessage } from '../src/utils/apiError';
import { createLiveIdempotencyKey, formatLiveCount, isLiveTerminal } from '../src/utils/live';
import { fontSize } from './typography';

type ViewerLiveRoute = {
  params?: {
    liveSessionId?: string;
    initialLive?: LiveSession;
  };
};

const ViewerLiveStream: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ViewerLiveRoute>();
  const liveSessionId = route.params?.liveSessionId ?? route.params?.initialLive?.id ?? '';
  const [credentials, setCredentials] = useState<LiveCredentials | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [comment, setComment] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [hasJoinedPresence, setHasJoinedPresence] = useState(false);
  const joinStartedRef = useRef(false);
  const joinedPresenceRef = useRef(false);
  const commentScrollRef = useRef<ScrollView | null>(null);

  const liveQuery = useLiveSession(liveSessionId, Boolean(liveSessionId));
  const live = liveQuery.data ?? route.params?.initialLive;
  const joinLive = useJoinLive(liveSessionId);
  const commentLive = useCommentOnLive(liveSessionId);
  const likeLive = useLikeLive(liveSessionId);
  const giftLive = useGiftLive(liveSessionId);
  const walletQuery = useKulCoinWallet(Boolean(liveSessionId));
  useLiveRealtime(liveSessionId, hasJoinedPresence);

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

  const creatorName = live?.creator?.name ?? 'Creator';
  const terminal = isLiveTerminal(live?.status);
  const remoteUid = agora.remoteUids[0];
  const stateMessage = useMemo(() => {
    if (joinLive.isError) return getApiErrorMessage(joinLive.error);
    if (agora.error) return agora.error;
    if (terminal) return 'This Live has ended.';
    if (agora.connectionState === 'reconnecting') return 'Reconnecting to the Live...';
    return 'Connecting to the Live...';
  }, [agora.connectionState, agora.error, joinLive.error, joinLive.isError, terminal]);

  const sendComment = async () => {
    const body = comment.trim();
    if (!body || commentLive.isPending) return;
    try {
      const created = await commentLive.mutateAsync(body);
      setComments((current) => [...current, created]);
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

  const openMoreActions = () => {
    Alert.alert('Live options', undefined, [
      {
        text: 'Request to co-host',
        onPress: () => {
          void liveApi.requestCohost(liveSessionId, 'I would like to join this Live.')
            .then(() => Alert.alert('Request sent', 'The creator can now review your co-host request.'))
            .catch((error) => Alert.alert('Request not sent', getApiErrorMessage(error)));
        },
      },
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
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.media}>
          {remoteUid != null ? (
            <RtcSurfaceView canvas={{ uid: remoteUid }} style={StyleSheet.absoluteFill} />
          ) : live?.cover_url ? (
            <Image source={{ uri: live.cover_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#32113c', '#111827', '#050505']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient colors={['rgba(0,0,0,0.65)', 'transparent', 'rgba(0,0,0,0.92)']} style={StyleSheet.absoluteFill} />

          <View style={styles.header}>
            <View style={styles.creatorRow}>
              {live?.creator?.avatar ? <Image source={{ uri: live.creator.avatar }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]} />}
              <View style={styles.creatorCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.creatorName}>{creatorName}</Text>
                  {live?.creator?.verified ? <MaterialIcons name="verified" size={15} color="#60a5fa" /> : null}
                </View>
                <Text style={styles.viewerCount}>{formatLiveCount(live?.current_viewers ?? 0)} watching</Text>
              </View>
            </View>
            <Pressable style={styles.headerButton} onPress={openMoreActions}>
              <MaterialIcons name="more-horiz" size={23} color="#fff" />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={closeLive}>
              <MaterialIcons name="close" size={23} color="#fff" />
            </Pressable>
          </View>

          {remoteUid == null || terminal ? (
            <View style={styles.connectionState}>
              {!terminal && !joinLive.isError && !agora.error ? <ActivityIndicator color="#fff" /> : <MaterialIcons name={terminal ? 'sensors-off' : 'error-outline'} size={28} color="#fff" />}
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
          ) : null}

          <View style={styles.bottomArea}>
            <Text style={styles.liveTitle}>{live?.title}</Text>
            {live?.category ? <Text style={styles.category}>{live.category}</Text> : null}
            <ScrollView ref={commentScrollRef} style={styles.comments} contentContainerStyle={styles.commentsContent}>
              {comments.map((item) => (
                <View key={item.id} style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>{item.user?.name ?? item.user?.username ?? 'You'}</Text>
                  <Text style={styles.commentBody}>{item.body}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.actionsRow}>
              <View style={styles.composer}>
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  placeholder={live?.chat_enabled ? 'Say something...' : 'Chat is disabled'}
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  editable={Boolean(live?.chat_enabled) && !terminal}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={() => void sendComment()}
                />
                <Pressable disabled={!comment.trim() || commentLive.isPending} onPress={() => void sendComment()}>
                  {commentLive.isPending ? <ActivityIndicator size="small" color={PRIMARY_COLOR} /> : <MaterialIcons name="send" size={21} color={comment.trim() ? PRIMARY_COLOR : '#64748b'} />}
                </Pressable>
              </View>
              <Pressable style={styles.actionButton} disabled={terminal || likeLive.isPending} onPress={() => likeLive.mutate(1)}>
                <MaterialIcons name="favorite" size={24} color="#fb7185" />
                <Text style={styles.actionCount}>{formatLiveCount(live?.likes_count ?? 0)}</Text>
              </Pressable>
              {live?.gifts_enabled ? (
                <Pressable style={styles.actionButton} disabled={terminal} onPress={() => setGiftOpen(true)}>
                  <MaterialIcons name="redeem" size={24} color="#4ade80" />
                </Pressable>
              ) : null}
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  agora.setRemoteAudioMuted(next);
                }}
              >
                <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={24} color="#fff" />
              </Pressable>
            </View>
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
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#000' },
  media: { flex: 1, backgroundColor: '#050505' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, paddingTop: 8 },
  creatorRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: PRIMARY_COLOR },
  avatarFallback: { backgroundColor: '#32113c' },
  creatorCopy: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  creatorName: { color: '#fff', ...fontSize.b3 },
  viewerCount: { color: '#cbd5e1', marginTop: 2, ...fontSize.b5 },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  connectionState: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  connectionText: { color: '#fff', textAlign: 'center', ...fontSize.b4 },
  retryButton: { marginTop: 4, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  retryText: { color: '#fff', ...fontSize.b4 },
  bottomArea: { marginTop: 'auto', paddingHorizontal: 14, paddingBottom: 10 },
  liveTitle: { color: '#fff', ...fontSize.b1 },
  category: { color: '#d8b4fe', marginTop: 4, ...fontSize.b5, textTransform: 'uppercase', letterSpacing: 1.2 },
  comments: { maxHeight: 180, marginTop: 12 },
  commentsContent: { gap: 7, paddingTop: 40 },
  commentBubble: { alignSelf: 'flex-start', maxWidth: '86%', borderRadius: 15, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  commentAuthor: { color: '#d8b4fe', ...fontSize.b5 },
  commentBody: { color: '#fff', marginTop: 2, ...fontSize.b4 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  composer: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingHorizontal: 14, backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  input: { flex: 1, color: '#fff', ...fontSize.b4 },
  actionButton: { minWidth: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  actionCount: { color: '#fff', ...fontSize.b5 },
});

export default ViewerLiveStream;
