import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import EmojiStickerPicker from '../components/EmojiStickerPicker';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { fontSize } from './typography';

type PlayableVideo = {
  id: string;
  title: string;
  artist: string;
  views: string;
  duration: string;
  img: string;
  url: string;
  isMusic?: boolean;
  timeAgo?: string;
};

type Playlist = {
  id: string;
  title: string;
  videoCount: number;
  views: string;
  timeAgo: string;
  img: string;
  videos: PlayableVideo[];
};

type CommentItem = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  time: string;
  isSticker?: boolean;
};

const PLAYLIST_DATA: Record<string, Playlist> = {
  pl1: {
    id: 'pl1',
    title: 'VIP Acoustic Sessions',
    videoCount: 3,
    views: '1.2M views',
    timeAgo: 'Updated 2 days ago',
    img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800',
    videos: [
      { id: 'pl_v1_1', title: 'Elena Rose - Odo Pa (Acoustic Solo Session)', artist: 'Elena Rose', views: '340K views', timeAgo: '1 month ago', duration: '3:42', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
      { id: 'pl_v1_2', title: 'Elena Rose Ft Kweku Flick - Odo Pa (Studio Live Acoustic Master)', artist: 'Elena Rose', views: '509K views', timeAgo: '1 month ago', duration: '2:36', img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      { id: 'pl_v1_3', title: 'Elena Rose - Acoustic Cover Series (Preview Handout)', artist: 'Elena Rose', views: '351K views', timeAgo: '2 months ago', duration: '4:15', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    ],
  },
  pl2: {
    id: 'pl2',
    title: 'Behind The Scenes & Vlogs',
    videoCount: 3,
    views: '250K views',
    timeAgo: 'Updated 1 week ago',
    img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800',
    videos: [
      { id: 'pl_v2_1', title: 'Elena Rose Live at Royal Albert Hall Rapperholic UK 2026 (Behind The Scenes)', artist: 'Elena Rose', views: '22K views', timeAgo: '2 months ago', duration: '12:24', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=800', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
      { id: 'pl_v2_2', title: 'Studio Tour: Designing Kulsah HQ Studio With Elena Rose', artist: 'Elena Rose', views: '148K views', timeAgo: '3 months ago', duration: '15:40', img: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=800', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
      { id: 'pl_v2_3', title: 'Q&A Session with Galaxy Tier Subscribers', artist: 'Elena Rose', views: '80K views', timeAgo: '4 months ago', duration: '25:12', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    ],
  },
  pl3: {
    id: 'pl3',
    title: 'Galaxy Masters Collection',
    videoCount: 3,
    views: '985K views',
    timeAgo: 'Updated yesterday',
    img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    videos: [
      { id: 'pl_v3_1', title: 'Elena Rose x Yaadman - Wins & Losses (High Definition Master)', artist: 'Elena Rose', views: '215K views', timeAgo: '3 months ago', duration: '3:00', img: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
      { id: 'pl_v3_2', title: 'Elena Rose - Put It On God ft. AlorG (Exclusive Studio Master)', artist: 'Elena Rose', views: '403K views', timeAgo: '6 months ago', duration: '3:32', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
      { id: 'pl_v3_3', title: 'Elena Rose - Sky Limit (Sub-Exclusive Vocal Mix)', artist: 'Elena Rose', views: '367K views', timeAgo: '7 months ago', duration: '4:05', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800', isMusic: true, url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    ],
  },
};

const seedComments: CommentItem[] = [
  { id: '1', user: 'KulStudio_HQ', avatar: 'https://picsum.photos/seed/stud/100', text: 'This high fidelity track is insane. Love the mastering.', time: '5m' },
  { id: '2', user: 'VibeLord_44', avatar: 'https://picsum.photos/seed/vib/100', text: 'Apostles of modern sound elements right here.', time: '1h' },
  { id: '3', user: 'GalaxyAura', avatar: 'https://picsum.photos/seed/aur/100', text: 'Subscribed yesterday specifically for this premium series.', time: '3h' },
];

const PlaylistPlayer: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();

  const playlistId = route.params?.id ?? route.params?.playlistId ?? 'pl1';
  const routeVideoId = route.params?.videoId as string | undefined;
  const currentPlaylist = useMemo(() => PLAYLIST_DATA[playlistId] ?? PLAYLIST_DATA.pl1, [playlistId]);
  const initialVideo = useMemo(() => currentPlaylist.videos.find((video) => video.id === routeVideoId) ?? route.params?.activeVideo ?? currentPlaylist.videos[0], [currentPlaylist, route.params?.activeVideo, routeVideoId]);

  const [activeVideo, setActiveVideo] = useState<PlayableVideo>(initialVideo);
  const [isOwner, setIsOwner] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentItem[]>(seedComments);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  const player = useVideoPlayer(activeVideo.url, (instance) => {
    instance.loop = false;
    instance.muted = false;
  });

  const tracks = currentPlaylist.videos;
  const activeIndex = tracks.findIndex((video) => video.id === activeVideo.id);
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const panel = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const soft = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const muted = isDark ? '#9ca3af' : theme.textSecondary;

  useEffect(() => {
    AsyncStorage.getItem('pulsar_user').then((saved: string | null) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved) as { role?: string; subscribedTo?: string[] };
        const nextIsOwner = parsed?.role === 'creator';
        setIsOwner(nextIsOwner);
        setIsSubscribed(nextIsOwner || Boolean(parsed?.subscribedTo?.includes('Elena Rose')));
      } catch {}
    });
  }, []);

  useEffect(() => {
    const match = routeVideoId ? tracks.find((video) => video.id === routeVideoId) : null;
    if (match) setActiveVideo(match);
  }, [routeVideoId, tracks]);

  useEffect(() => {
    player.play();
    setAutoAdvanced(false);
  }, [activeVideo.id, player]);

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = Number(player.duration ?? 0);
      const current = Number(player.currentTime ?? 0);
      if (!autoAdvanced && duration > 0 && current >= duration - 0.35) {
        setAutoAdvanced(true);
        playNextVideo();
      }
    }, 600);
    return () => clearInterval(interval);
  }, [autoAdvanced, player, activeVideo.id]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);

  const triggerToast = (message: string) => setToast(message);

  const navigateToTrack = (track: PlayableVideo, message?: string) => {
    setActiveVideo(track);
    navigation.setParams?.({ id: currentPlaylist.id, playlistId: currentPlaylist.id, videoId: track.id });
    if (message) triggerToast(message);
  };

  const playNextVideo = () => {
    if (activeIndex !== -1 && activeIndex < tracks.length - 1) {
      const nextVideo = tracks[activeIndex + 1];
      navigateToTrack(nextVideo, `Playing next: ${nextVideo.title}`);
    } else {
      triggerToast('End of playlist reached');
    }
  };

  const playPreviousVideo = () => {
    if (activeIndex > 0) {
      const previousVideo = tracks[activeIndex - 1];
      navigateToTrack(previousVideo, `Playing previous: ${previousVideo.title}`);
    }
  };

  const handlePostComment = () => {
    const text = commentText.trim();
    if (!text) return;
    setComments((current) => [{ id: Date.now().toString(), user: 'Me', avatar: 'https://picsum.photos/seed/me/100', text, time: 'Just now' }, ...current]);
    setCommentText('');
    setShowEmojiPicker(false);
  };

  const fetchAiPerformanceAudit = () => {
    setIsAiLoading(true);
    setTimeout(() => {
      setAiInsight(`VIP listeners are staying strongest around "${activeVideo.title.split(' - ')[1] ?? activeVideo.title}", so lead the next teaser with that emotional hook.`);
      setIsAiLoading(false);
    }, 900);
  };

  const shareTrack = async () => {
    await Share.share({ message: `${activeVideo.title} from ${currentPlaylist.title}` });
    triggerToast('Share sheet opened');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background }]} edges={[]}>
      <LinearGradient colors={isDark ? ['#111827', '#050505'] : ['#f8fafc', '#ffffff']} style={StyleSheet.absoluteFillObject} />
      {toast ? <View style={[styles.toast, { top: insets.top + 14 }]}><Text style={styles.toastText}>{toast}</Text></View> : null}

      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: isDark ? 'rgba(5,5,5,0.92)' : 'rgba(255,255,255,0.94)', borderBottomColor: border }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.iconButton, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="chevron-left" size={21} color={theme.text} /></Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>Playing Playlist</Text>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: theme.text }]}>{currentPlaylist.title}</Text>
        </View>
        <View style={[styles.iconButton, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="playlist-play" size={23} color={PRIMARY_COLOR} /></View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 74, paddingBottom: 120 }}>
        <View style={styles.videoStage}>
          {isSubscribed ? (
            <VideoView player={player} nativeControls style={styles.video} contentFit="contain" />
          ) : (
            <LinearGradient colors={['#020617', '#111827']} style={styles.lockedStage}>
              <View style={styles.lockIcon}><MaterialIcons name="stars" size={34} color={PRIMARY_COLOR} /></View>
              <Text style={styles.lockTitle}>Galaxy Member Exclusive</Text>
              <Text style={styles.lockCopy}>Join Elena Rose's Galaxy tier to unlock this playlist and studio masters.</Text>
              <Pressable onPress={() => navigation.navigate('ArtistProfile', { id: 'Elena Rose', isOwner: false })} style={styles.joinButton}><Text style={styles.joinText}>Join Galaxy Tier</Text></Pressable>
            </LinearGradient>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: theme.text }]}>{activeVideo.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.trackBadge}>Track {activeIndex + 1} of {tracks.length}</Text>
              <Text style={[styles.metaText, { color: muted }]}>{activeVideo.views}</Text>
              <View style={[styles.dot, { backgroundColor: muted }]} />
              <Text style={[styles.metaText, { color: muted }]}>{activeVideo.timeAgo ?? '1 month ago'}</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
            <Pressable onPress={() => setIsLiked((value) => !value)} style={[styles.actionChip, { backgroundColor: isLiked ? 'rgba(244,63,94,0.16)' : soft, borderColor: isLiked ? '#f43f5e' : border }]}><MaterialIcons name={isLiked ? 'favorite' : 'favorite-border'} size={18} color={isLiked ? '#f43f5e' : theme.text} /><Text style={[styles.actionText, { color: isLiked ? '#f43f5e' : theme.text }]}>Like</Text></Pressable>
            <Pressable onPress={shareTrack} style={[styles.actionChip, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="share" size={18} color={theme.text} /><Text style={[styles.actionText, { color: theme.text }]}>Share</Text></Pressable>
            <Pressable onPress={playPreviousVideo} disabled={activeIndex <= 0} style={[styles.actionChip, { backgroundColor: soft, borderColor: border, opacity: activeIndex <= 0 ? 0.38 : 1 }]}><MaterialIcons name="skip-previous" size={19} color={theme.text} /><Text style={[styles.actionText, { color: theme.text }]}>Prev</Text></Pressable>
            <Pressable onPress={playNextVideo} disabled={activeIndex === tracks.length - 1} style={[styles.actionChip, { backgroundColor: soft, borderColor: border, opacity: activeIndex === tracks.length - 1 ? 0.38 : 1 }]}><MaterialIcons name="skip-next" size={19} color={theme.text} /><Text style={[styles.actionText, { color: theme.text }]}>Next</Text></Pressable>
          </ScrollView>

          <View style={[styles.artistPanel, { backgroundColor: panel, borderColor: border }]}>
            <Pressable onPress={() => navigation.navigate('ArtistProfile', { id: activeVideo.artist, isOwner: false })} style={styles.artistMain}>
              <Image source={{ uri: 'https://picsum.photos/seed/elena/150' }} style={styles.artistAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.artistNameRow}><Text style={[styles.artistName, { color: theme.text }]}>{activeVideo.artist}</Text><MaterialIcons name="verified" size={16} color={PRIMARY_COLOR} /></View>
                <Text style={styles.artistHandle}>@elena_rose</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => triggerToast("Following Elena Rose's Galaxy transmission")} style={styles.followButton}><Text style={styles.followText}>Follow</Text></Pressable>
          </View>

          {/* {isOwner ? (
            <View style={[styles.auditPanel, { borderColor: primaryColorAlpha(0.22), backgroundColor: primaryColorAlpha(0.08) }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Audit</Text>
                {isAiLoading ? <ActivityIndicator color={PRIMARY_COLOR} /> : null}
              </View>
              <Text style={[styles.auditCopy, { color: muted }]}>{aiInsight ?? 'Run a quick retention read for this VIP track.'}</Text>
              {!aiInsight ? <Pressable onPress={fetchAiPerformanceAudit} style={styles.auditButton}><Text style={styles.auditButtonText}>Run Audit</Text></Pressable> : null}
            </View>
          ) : null} */}

          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Playlist({tracks.length})</Text>
              <Text style={styles.orderText}>In Order</Text>
            </View>
            {tracks.map((track, index) => {
              const isActive = track.id === activeVideo.id;
              return (
                <Pressable key={track.id} onPress={() => navigateToTrack(track, `Switched track: ${track.title}`)} style={[styles.trackRow, { backgroundColor: isActive ? primaryColorAlpha(0.1) : soft, borderColor: isActive ? primaryColorAlpha(0.35) : border }]}>
                  <View style={styles.trackIndex}>{isActive ? <MaterialIcons name="volume-up" size={19} color={PRIMARY_COLOR} /> : <Text style={[styles.indexText, { color: muted }]}>{String(index + 1).padStart(2, '0')}</Text>}</View>
                  <View style={styles.thumbWrap}>
                    <Image source={{ uri: track.img }} style={styles.thumb} />
                    {!isSubscribed ? <View style={styles.thumbLock}><MaterialIcons name="lock" size={13} color={PRIMARY_COLOR} /></View> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[styles.trackTitle, { color: isActive ? PRIMARY_COLOR : theme.text }]}>{track.title}</Text>
                    <Text style={[styles.trackMeta, { color: muted }]}>{track.views}  •  {track.duration}</Text>
                  </View>
                  {track.isMusic ? <MaterialIcons name="music-note" size={16} color={muted} /> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.commentsPanel, { backgroundColor: panel, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Comments</Text>
            <View style={[styles.composer, { backgroundColor: isDark ? 'rgba(2,6,23,0.68)' : '#f8fafc', borderColor: border }]}>
              <Pressable onPress={() => setShowEmojiPicker((value) => !value)} style={[styles.moodButton, { backgroundColor: showEmojiPicker ? PRIMARY_COLOR : 'transparent' }]}><MaterialIcons name="mood" size={20} color={showEmojiPicker ? '#fff' : muted} /></Pressable>
              <TextInput value={commentText} onChangeText={setCommentText} onSubmitEditing={handlePostComment} placeholder="Join the sound discussion..." placeholderTextColor={muted} style={[styles.input, { color: theme.text }]} />
              <Pressable onPress={handlePostComment} disabled={!commentText.trim()}><Text style={[styles.sendText, { color: commentText.trim() ? PRIMARY_COLOR : muted }]}>Send</Text></Pressable>
            </View>

            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentRow}>
                <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}><Text style={[styles.commentUser, { color: theme.text }]}>{comment.user}</Text><Text style={[styles.commentTime, { color: muted }]}>{comment.time}</Text></View>
                  {comment.isSticker ? <Image source={{ uri: comment.text }} style={styles.sticker} /> : <Text style={[styles.commentBody, { color: muted }]}>{comment.text}</Text>}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <EmojiStickerPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={(emoji) => setCommentText((current) => `${current}${emoji}`)}
        onStickerSelect={(stickerUrl) => {
          setComments((current) => [{ id: Date.now().toString(), user: 'Me', avatar: 'https://picsum.photos/seed/me/100', text: stickerUrl, time: 'Just now', isSticker: true }, ...current]);
          setShowEmojiPicker(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  toast: { position: 'absolute', left: 20, right: 20, zIndex: 80, alignItems: 'center' },
  toastText: { color: '#fff', backgroundColor: PRIMARY_COLOR, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.4, overflow: 'hidden' },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerCenter: { flex: 1, minWidth: 0, paddingHorizontal: 14, alignItems: 'center' },
  headerEyebrow: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1, textTransform: 'uppercase' },
  videoStage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  video: { width: '100%', height: '100%' },
  lockedStage: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 10 },
  lockIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.24)', alignItems: 'center', justifyContent: 'center' },
  lockTitle: { color: '#fff', ...fontSize.b2, lineHeight: fontSize.b2.fontSize + 2, textTransform: 'uppercase', textAlign: 'center' },
  lockCopy: { color: '#a1a1aa', ...fontSize.b5, lineHeight: 18, textAlign: 'center', maxWidth: 300 },
  joinButton: { marginTop: 4, backgroundColor: PRIMARY_COLOR, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10 },
  joinText: { color: '#000', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  content: { padding: 16, gap: 18 },
  titleBlock: { gap: 8 },
  title: { ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  trackBadge: { color: PRIMARY_COLOR, backgroundColor: primaryColorAlpha(0.14), borderColor: primaryColorAlpha(0.24), borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1 },
  metaText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  actionRow: { gap: 10, paddingRight: 16 },
  actionChip: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 15, borderRadius: 21, borderWidth: 1 },
  actionText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1 },
  artistPanel: { borderRadius: 24, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  artistMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  artistAvatar: { width: 48, height: 48, borderRadius: 15 },
  artistNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  artistName: { ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1 },
  artistHandle: { color: '#cca514', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.3 },
  followButton: { height: 38, borderRadius: 14, paddingHorizontal: 16, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  followText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  auditPanel: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2, textTransform: 'uppercase' },
  auditCopy: { ...fontSize.b5, lineHeight: 19 },
  auditButton: { height: 42, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColorAlpha(0.16), borderWidth: 1, borderColor: primaryColorAlpha(0.28) },
  auditButtonText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1 },
  section: { gap: 10 },
  orderText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 18, borderWidth: 1 },
  trackIndex: { width: 26, alignItems: 'center' },
  indexText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  thumbWrap: { width: 48, height: 48, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1f2937' },
  thumb: { width: '100%', height: '100%' },
  thumbLock: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  trackTitle: { ...fontSize.b5, lineHeight: 18 },
  trackMeta: { marginTop: 2, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  commentsPanel: { borderRadius: 28, borderWidth: 1, padding: 16, gap: 14 },
  composer: { minHeight: 52, borderRadius: 26, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 8 },
  moodButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minHeight: 44, ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1 },
  sendText: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 1.2 },
  commentRow: { flexDirection: 'row', gap: 12 },
  commentAvatar: { width: 38, height: 38, borderRadius: 19 },
  commentUser: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase', letterSpacing: 0.8 },
  commentTime: { ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1, textTransform: 'uppercase' },
  commentBody: { marginTop: 4, ...fontSize.b5, lineHeight: 19 },
  sticker: { marginTop: 8, width: 82, height: 82, borderRadius: 18 },
});

export default PlaylistPlayer;
