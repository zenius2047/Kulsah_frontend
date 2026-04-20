import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fontScale } from '../fonts';

type FeedTab = 'foryou' | 'premium';

interface Sound {
  id: string;
  title: string;
  artist: string;
}

interface FeedItem {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  caption: string;
  background: string;
  video: string;
  likes: string;
  comments: string;
  isLiked: boolean;
  isSubscribed: boolean;
  isPremium: boolean;
  isLive?: boolean;
  viewerCount?: string;
  ticketsAvailable: boolean;
  ticketLocation?: string;
  sound?: Sound;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isSticker?: boolean;
  likes?: number;
  isLiked?: boolean;
}

interface StreakData {
  count: number;
  lastDate: string | null;
}

const FALLBACK_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const STREAK_KEY = 'pulsar_streak_data';
const USER_KEY = 'pulsar_user';
const SAVED_VIDEOS_KEY = 'pulsar_saved_videos';

const toDayStamp = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

const getStreakData = async (): Promise<StreakData> => {
  const saved = await AsyncStorage.getItem(STREAK_KEY);
  if (!saved) return { count: 0, lastDate: null };
  try {
    return JSON.parse(saved) as StreakData;
  } catch {
    return { count: 0, lastDate: null };
  }
};

const updateStreak = async (): Promise<StreakData> => {
  const prev = await getStreakData();
  const today = toDayStamp(new Date());
  if (prev.lastDate === today) return prev;
  const next = { count: prev.lastDate ? prev.count + 1 : 1, lastDate: today };
  await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(next));
  return next;
};

const parseCount = (value: string) => {
  const v = value.toLowerCase();
  if (v.endsWith('m')) return Math.round(parseFloat(v) * 1_000_000);
  if (v.endsWith('k')) return Math.round(parseFloat(v) * 1_000);
  return Number(v.replace(/,/g, '')) || 0;
};

const formatCount = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return `${num}`;
};

const VideoFeedItem: React.FC<{
  item: FeedItem;
  isPlaying: boolean;
  isGlobalMuted: boolean;
  isGuest: boolean;
  onSubscribe: (id: string) => void;
  onRequireAuth: () => void;
}> = ({ item, isPlaying, isGlobalMuted, isGuest, onSubscribe, onRequireAuth }) => {
  const navigation = useNavigation<any>();
  const player = useVideoPlayer(item.video || FALLBACK_VIDEO, (p) => {
    p.loop = true;
    p.muted = isGlobalMuted;
  });
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likesCount, setLikesCount] = useState(() => parseCount(item.likes));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    { id: '1', user: 'GalaxyFan_1', avatar: 'https://picsum.photos/seed/fan1/100', text: 'This visual is fire.', time: '2h' },
  ]);
  const isLocked = item.isPremium && !item.isSubscribed;

  useEffect(() => {
    player.muted = isGlobalMuted;
  }, [player, isGlobalMuted]);

  useEffect(() => {
    if (isLocked) {
      player.pause();
      return;
    }
    if (isPlaying) player.play();
    else player.pause();
  }, [isPlaying, isLocked, player]);

  useEffect(() => {
    const loadSaved = async () => {
      const raw = await AsyncStorage.getItem(SAVED_VIDEOS_KEY);
      if (!raw) return;
      const list = JSON.parse(raw) as Array<{ id: string }>;
      setIsBookmarked(list.some((v) => v.id === item.id));
    };
    void loadSaved();
  }, [item.id]);

  const requireAuthOr = (fn: () => void) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    fn();
  };

  const toggleLike = () =>
    requireAuthOr(() => {
      const next = !isLiked;
      setIsLiked(next);
      setLikesCount((prev) => (next ? prev + 1 : prev - 1));
    });

  const toggleBookmark = () =>
    requireAuthOr(async () => {
      const next = !isBookmarked;
      setIsBookmarked(next);
      const raw = await AsyncStorage.getItem(SAVED_VIDEOS_KEY);
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      if (next) {
        list.push({ id: item.id, title: item.caption, artist: item.artist, img: item.background });
      } else {
        const idx = list.findIndex((v) => v.id === item.id);
        if (idx >= 0) list.splice(idx, 1);
      }
      await AsyncStorage.setItem(SAVED_VIDEOS_KEY, JSON.stringify(list));
    });

  const postComment = () =>
    requireAuthOr(() => {
      if (!commentText.trim()) return;
      const nextComment: Comment = {
        id: Date.now().toString(),
        user: 'Me',
        avatar: 'https://picsum.photos/seed/profile/100',
        text: commentText.trim(),
        time: 'Just now',
      };
      setComments((prev) => [nextComment, ...prev]);
      setCommentText('');
      setShowEmojiTray(false);
    });

  return (
    <View style={styles.item}>
      <VideoView player={player} style={StyleSheet.absoluteFillObject} nativeControls={false} contentFit="cover" />
      <View style={styles.dim} />

      {isLocked && (
        <View style={styles.lockOverlay}>
          <MaterialIcons name="lock" size={40} color="#cd2bee" />
          <Text style={styles.lockTitle}>Subscriber Exclusive</Text>
          <Pressable style={styles.unlockBtn} onPress={() => onSubscribe(item.id)}>
            <Text style={styles.unlockText}>UNLOCK NOW</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.rightRail}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <Pressable style={styles.railBtn} onPress={toggleLike}>
          <MaterialIcons name={isLiked ? 'favorite' : 'favorite-border'} size={28} color={isLiked ? '#cd2bee' : '#fff'} />
          <Text style={styles.railLabel}>{formatCount(likesCount)}</Text>
        </Pressable>
        <Pressable style={styles.railBtn} onPress={() => requireAuthOr(() => setShowComments(true))}>
          <MaterialIcons name="chat-bubble-outline" size={26} color="#fff" />
          <Text style={styles.railLabel}>{item.comments}</Text>
        </Pressable>
        <Pressable style={styles.railBtn} onPress={() => void toggleBookmark()}>
          <MaterialIcons name={isBookmarked ? 'bookmark' : 'bookmark-outline'} size={26} color={isBookmarked ? '#cd2bee' : '#fff'} />
          <Text style={styles.railLabel}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <Pressable onPress={() => navigation.navigate('ArtistProfile')}>
          <Text style={styles.handle}>@{item.handle}</Text>
        </Pressable>
        <Text style={styles.caption}>{item.caption}</Text>
        {item.sound && <Text style={styles.sound}>{item.sound.title} • {item.sound.artist}</Text>}
        {item.ticketsAvailable && <Text style={styles.ticket}>Tickets • {item.ticketLocation}</Text>}
      </View>

      <Modal visible={showComments} transparent animationType="slide" onRequestClose={() => setShowComments(false)}>
        <Pressable style={styles.modalRoot} onPress={() => setShowComments(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>{item.comments} Comments</Text>
            <ScrollView style={{ maxHeight: 250 }} keyboardShouldPersistTaps="handled">
              {comments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <Image source={{ uri: c.avatar }} style={styles.commentAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>{c.user}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {showEmojiTray && (
              <View style={styles.emojiTray}>
                {['🔥', '🙌', '❤️', '✨', '🌌', '🚀', '💯'].map((emoji) => (
                  <Pressable key={emoji} onPress={() => setCommentText((prev) => `${prev}${emoji}`)} style={styles.emojiBtn}>
                    <Text>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.inputRow}>
              <Pressable onPress={() => setShowEmojiTray((v) => !v)}>
                <MaterialIcons name="mood" size={20} color={showEmojiTray ? '#cd2bee' : '#71717a'} />
              </Pressable>
              <TextInput
                style={styles.input}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#71717a"
              />
              <Pressable onPress={postComment} disabled={!commentText.trim()}>
                <Text style={[styles.postBtn, !commentText.trim() && { opacity: 0.3 }]}>POST</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const FeedCopy: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<FeedTab>('foryou');
  const [isGlobalMuted, setIsGlobalMuted] = useState(false);
  const [isGuest, setIsGuest] = useState(true);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [streak, setStreak] = useState<StreakData>({ count: 0, lastDate: null });
  const [activeIndex, setActiveIndex] = useState(0);
  const [items, setItems] = useState<FeedItem[]>([
    {
      id: 'live-1',
      artist: 'Elena Rose',
      handle: 'elena_rose',
      avatar: 'https://picsum.photos/seed/elena/150/150',
      caption: "PREMIUM LIVE: Exclusive 'Nebula' listening party.",
      background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
      video: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-dj-playing-music-at-a-club-41743-large.mp4',
      likes: '85.2K',
      comments: '4.2K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      isLive: true,
      viewerCount: '5.4K',
      ticketsAvailable: false,
    },
    {
      id: '1',
      artist: 'Zion King',
      handle: 'zionking_afro',
      avatar: 'https://picsum.photos/seed/zion/150/150',
      caption: 'Live from the main stage.',
      background: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      likes: '1.2M',
      comments: '45.8K',
      isLiked: true,
      isSubscribed: false,
      isPremium: false,
      isLive: true,
      ticketsAvailable: false,
    },
    {
      id: '2',
      artist: 'Amara',
      handle: 'amara_official',
      avatar: 'https://picsum.photos/seed/amara/150/150',
      caption: 'Exclusive rehearsal visual drop.',
      background: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800',
      video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      likes: '890K',
      comments: '12.4K',
      isLiked: false,
      isSubscribed: true,
      isPremium: true,
      ticketsAvailable: true,
      ticketLocation: 'London, UK',
      sound: { id: 's1', title: 'Neon Dreams', artist: 'Synthwave Kid' },
    },
  ]);

  useEffect(() => {
    const load = async () => {
      setStreak(await updateStreak());
      const savedUser = await AsyncStorage.getItem(USER_KEY);
      setIsGuest(!savedUser);
    };
    void load();
  }, []);

  useEffect(() => {
    if (!isGuest) return;
    const timer = setTimeout(() => setShowSignupPrompt(true), 5000);
    return () => clearTimeout(timer);
  }, [isGuest]);

  const displayedItems = useMemo(() => {
    if (activeTab === 'premium') return items.filter((i) => i.isPremium);
    return items;
  }, [activeTab, items]);

  const onViewRef = React.useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  });

  const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 80 });

  const handleSubscribe = (id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isSubscribed: true } : i)));
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.screen }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />

      <View style={styles.header}>
        <Pressable style={styles.circle} onPress={() => navigation.navigate('Discover')}>
          <MaterialIcons name="search" size={22} color="#fff" />
        </Pressable>
        <View style={styles.tabs}>
          <Pressable onPress={() => setActiveTab('foryou')} style={[styles.tab, activeTab === 'foryou' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'foryou' && styles.tabTextActive]}>FOR YOU</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('premium')} style={[styles.tab, activeTab === 'premium' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'premium' && styles.tabTextActive]}>PREMIUM</Text>
          </Pressable>
        </View>
        <Pressable style={styles.circle} onPress={() => setIsGlobalMuted((v) => !v)}>
          <MaterialIcons name={isGlobalMuted ? 'volume-off' : 'volume-up'} size={22} color="#fff" />
        </Pressable>
      </View>

      {streak.count > 0 && (
        <View style={styles.streak}>
          <MaterialIcons name="local-fire-department" size={14} color="#f97316" />
          <Text style={styles.streakLabel}>{streak.count}</Text>
        </View>
      )}

      <FlatList
        data={displayedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <VideoFeedItem
            item={item}
            isPlaying={index === activeIndex}
            isGlobalMuted={isGlobalMuted}
            isGuest={isGuest}
            onSubscribe={handleSubscribe}
            onRequireAuth={() => setShowSignupPrompt(true)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        ListFooterComponent={
          <View style={styles.footer}>
            <ActivityIndicator color="#cd2bee" />
            <Text style={styles.footerText}>Syncing more galaxy feed...</Text>
          </View>
        }
      />

      <Modal visible={showSignupPrompt && isGuest} transparent animationType="fade" onRequestClose={() => setShowSignupPrompt(false)}>
        <View style={styles.promptRoot}>
          <Pressable style={styles.promptBackdrop} onPress={() => setShowSignupPrompt(false)} />
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>Join the Galaxy</Text>
            <Text style={styles.promptText}>Create an account to follow creators and unlock premium drops.</Text>
            <Pressable style={styles.promptPrimary} onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.promptPrimaryText}>CREATE ACCOUNT</Text>
            </Pressable>
            <Pressable onPress={() => setShowSignupPrompt(false)}>
              <Text style={styles.promptSecondary}>MAYBE LATER</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: { position: 'absolute', top: 54, left: 16, right: 16, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 999, padding: 2, backgroundColor: 'rgba(0,0,0,0.35)' },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  tabTextActive: { color: '#fff' },
  streak: { position: 'absolute', top: 102, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(249,115,22,0.5)', backgroundColor: 'rgba(249,115,22,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  streakLabel: { color: '#fb923c', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansExtraBold' },
  item: { height: '100%', justifyContent: 'flex-end' },
  dim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  rightRail: { position: 'absolute', right: 14, bottom: 94, alignItems: 'center', gap: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  railBtn: { alignItems: 'center' },
  railLabel: { color: '#fff', fontSize: fontScale(10), fontFamily: 'PlusJakartaSansBold' },
  bottom: { paddingHorizontal: 16, paddingBottom: 88, width: '80%' },
  handle: { color: '#fff', fontSize: fontScale(17), fontFamily: 'PlusJakartaSansExtraBold' },
  caption: { color: '#fff', marginTop: 4, fontFamily: 'PlusJakartaSansBold' },
  sound: { color: '#cbd5e1', marginTop: 6, fontSize: fontScale(12) },
  ticket: { color: '#22c55e', marginTop: 6, fontFamily: 'PlusJakartaSansBold' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', gap: 8 },
  lockTitle: { color: '#fff', fontSize: fontScale(20), fontFamily: 'PlusJakartaSansExtraBold' },
  unlockBtn: { marginTop: 10, backgroundColor: '#cd2bee', borderRadius: 14, paddingHorizontal: 20, height: 48, justifyContent: 'center' },
  unlockText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1 },
  modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#111218', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 16, maxHeight: '78%' },
  sheetTitle: { color: '#e4e4e7', fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 10 },
  commentRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentUser: { color: '#fff', fontFamily: 'PlusJakartaSansBold' },
  commentText: { color: '#d4d4d8' },
  emojiTray: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  emojiBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  inputRow: { marginTop: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, color: '#fff', minHeight: 44 },
  postBtn: { color: '#cd2bee', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(11) },
  footer: { height: 110, justifyContent: 'center', alignItems: 'center', gap: 8 },
  footerText: { color: '#94a3b8', fontSize: fontScale(11) },
  promptRoot: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  promptBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  promptCard: { width: '100%', maxWidth: 360, borderRadius: 24, backgroundColor: '#111218', padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  promptTitle: { color: '#fff', fontSize: fontScale(21), fontFamily: 'PlusJakartaSansExtraBold', textAlign: 'center' },
  promptText: { color: '#a1a1aa', marginTop: 8, textAlign: 'center' },
  promptPrimary: { marginTop: 14, height: 48, borderRadius: 12, backgroundColor: '#cd2bee', justifyContent: 'center', alignItems: 'center' },
  promptPrimaryText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1 },
  promptSecondary: { color: '#71717a', textAlign: 'center', marginTop: 10, fontFamily: 'PlusJakartaSansBold' },
});

export default FeedCopy;
