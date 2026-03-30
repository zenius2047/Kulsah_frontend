import React, { useEffect, useMemo, useState } from 'react';
import { useThemeMode } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fontScale } from '../fonts';

const SPEEDS = [0.5, 1, 1.5, 2] as const;

type VideoItem = { id: string; title: string; artist: string; handle: string; views: string; duration: string; img: string; url: string; date: string; description: string };
type CommentItem = { id: string; user: string; avatar: string; text: string; time: string };

const videos: Record<string, VideoItem> = {
  v1: { id: 'v1', title: 'Digital Dreams Rehearsal', artist: 'Elena Rose', handle: '@elena_rose', views: '1.2M', duration: '6:24', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=900', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', date: 'Aug 24, 2024', description: 'A polished rehearsal cut with cinematic transitions and replay-friendly pacing.' },
  v2: { id: 'v2', title: 'Moonlight Symphony', artist: 'Elena Rose', handle: '@elena_rose', views: '450K', duration: '4:20', img: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=900', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', date: 'Aug 18, 2024', description: 'A softer performance pass with layered vocals and slow-build atmosphere.' },
  v3: { id: 'v3', title: 'Lagos Energy Live', artist: 'Zion King', handle: '@zion_afro', views: '890K', duration: '12:15', img: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?auto=format&fit=crop&q=80&w=900', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', date: 'Aug 12, 2024', description: 'A high-energy crowd capture driven by percussion, chants, and arena pacing.' },
  v4: { id: 'v4', title: 'Synth Soul Sessions', artist: 'Luna Ray', handle: '@luna_ray', views: '120K', duration: '8:45', img: 'https://images.unsplash.com/photo-1520529277867-dbf8c5e0b340?auto=format&fit=crop&q=80&w=900', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', date: 'Aug 06, 2024', description: 'A polished studio-room set with neon grading and soulful synths.' },
};

const related = [videos.v2, videos.v3, videos.v4];
const seedComments: CommentItem[] = [
  { id: '1', user: 'GalaxyFan_1', avatar: 'https://picsum.photos/seed/fan1/120', text: 'This visual is absolute fire.', time: '2h' },
  { id: '2', user: 'GalaxyFan_2', avatar: 'https://picsum.photos/seed/fan2/120', text: 'The bridge replay moment is strong.', time: '1h' },
];

const Player: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [activeId, setActiveId] = useState(route.params?.id ?? 'v1');
  const [role, setRole] = useState<'fan' | 'creator'>('fan');
  const [studioMode, setStudioMode] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [protocol, setProtocol] = useState<'public' | 'premium'>('public');
  const [audit, setAudit] = useState<string | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(seedComments);
  const [queue, setQueue] = useState<VideoItem[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const video = videos[activeId] ?? videos.v1;
  const heatmap = useMemo(() => Array.from({ length: 24 }, (_, i) => 25 + ((i * 13) % 52)), []);
  const player = useVideoPlayer(video.url, (instance) => { instance.loop = false; instance.muted = true; });
  const accent = isDark ? '#cd2bee' : '#a21caf';
  const border = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const card = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const soft = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)';
  const subtle = isDark ? '#94a3b8' : theme.textSecondary;
  const faint = isDark ? 'rgba(255,255,255,0.45)' : theme.textMuted;
  const progress = duration > 0 ? Math.min(1, current / duration) : 0;

  useEffect(() => {
    AsyncStorage.getItem('pulsar_user').then((saved) => {
      if (!saved) return;
      try {
        const parsed = JSON.parse(saved);
        const nextRole = parsed?.role === 'creator' ? 'creator' : 'fan';
        setRole(nextRole);
        setStudioMode(nextRole === 'creator');
      } catch {}
    });
  }, []);

  useEffect(() => {
    player.playbackRate = speed;
    player.muted = muted;
    player.play();
    setPlaying(true);
    setCurrent(0);
  }, [player, speed, muted, activeId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(Number(player.currentTime ?? 0));
      setDuration(Number(player.duration ?? 0));
      setPlaying(Boolean(player.playing));
    }, 250);
    return () => clearInterval(interval);
  }, [player]);

  useEffect(() => {
    if (!showControls || !playing) return;
    const timeout = setTimeout(() => setShowControls(false), 3500);
    return () => clearTimeout(timeout);
  }, [showControls, playing]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return '0:00';
    const mins = Math.floor(value / 60);
    const secs = Math.floor(value % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    setToast(`Playback ${next}x`);
  };

  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
    setShowControls(true);
  };

  const jumpBy = (seconds: number) => {
    const total = Number(player.duration ?? 0);
    player.currentTime = Math.max(0, Math.min(Number(player.currentTime ?? 0) + seconds, total || 0));
  };

  const postComment = () => {
    if (!commentText.trim()) return;
    setComments((currentComments) => [{ id: Date.now().toString(), user: 'Me', avatar: 'https://picsum.photos/seed/me/120', text: commentText.trim(), time: 'Just now' }, ...currentComments]);
    setCommentText('');
  };

  const addToQueue = (item: VideoItem) => {
    if (queue.some((entry) => entry.id === item.id)) return setToast('Already in queue');
    setQueue((currentQueue) => [...currentQueue, item]);
    setToast('Added to queue');
  };

  const playById = (id: string) => {
    setActiveId(id);
    setQueueOpen(false);
    setShowControls(true);
  };

  const runAudit = () => {
    setLoadingAudit(true);
    setTimeout(() => {
      setAudit('Lead the next upload with the bridge visual motif to turn replay spikes into stronger completion.');
      setLoadingAudit(false);
    }, 1200);
  };

  const syncProtocol = (nextProtocol: 'public' | 'premium') => {
    setSyncing(true);
    setTimeout(() => {
      setProtocol(nextProtocol);
      setSyncing(false);
      setToast(`Protocol set to ${nextProtocol}`);
    }, 900);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#050505' : theme.background }]} edges={[]}>
      <LinearGradient colors={isDark ? ['#19051d', '#050505', '#07111f'] : ['#fdf2ff', '#f8fafc', '#eff6ff']} style={StyleSheet.absoluteFillObject} />
      {toast ? <View style={[styles.toast, { top: insets.top + 12 }]}><Text style={styles.toastText}>{toast}</Text></View> : null}

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.iconBtn, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="arrow-back" size={22} color={theme.text} /></Pressable>
        <View style={styles.headerActions}>
          {role === 'creator' ? <Pressable onPress={() => setStudioMode((v) => !v)} style={[styles.pill, { backgroundColor: studioMode ? accent : soft, borderColor: studioMode ? accent : border }]}><MaterialIcons name="analytics" size={18} color={studioMode ? '#fff' : theme.text} /><Text style={[styles.pillText, { color: studioMode ? '#fff' : theme.text }]}>Studio Mode</Text></Pressable> : null}
          <Pressable onPress={cycleSpeed} style={[styles.pillSmall, { backgroundColor: soft, borderColor: border }]}><Text style={[styles.pillText, { color: theme.text }]}>{speed}x</Text></Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <Pressable onPress={() => setShowControls(true)} style={[styles.videoShell, { marginTop: 86, borderColor: border }]}>
          <VideoView player={player} nativeControls={false} style={styles.video} />
          <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFillObject} />
          {studioMode ? <View style={styles.heatmap}>{heatmap.map((h, i) => <View key={`${i}-${h}`} style={[styles.heatBar, { height: `${h}%`, backgroundColor: isDark ? 'rgba(205,43,238,0.4)' : 'rgba(162,28,175,0.28)' }]} />)}</View> : null}
          {showControls ? <View style={styles.controls}><View style={styles.controlsRow}><Pressable style={styles.ghostBtn} onPress={() => jumpBy(-10)}><MaterialIcons name="replay-10" size={34} color="#fff" /></Pressable><Pressable style={styles.playBtn} onPress={togglePlay}><MaterialIcons name={playing ? 'pause' : 'play-arrow'} size={44} color="#fff" /></Pressable><Pressable style={styles.ghostBtn} onPress={() => jumpBy(10)}><MaterialIcons name="forward-10" size={34} color="#fff" /></Pressable></View><Pressable style={styles.muteBtn} onPress={() => setMuted((v) => !v)}><MaterialIcons name={muted ? 'volume-off' : 'volume-up'} size={18} color="#fff" /></Pressable></View> : null}
          <View style={styles.videoFooter}><View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View><View style={styles.metaRow}><Text style={styles.metaText}>{formatTime(current)} / {formatTime(duration)}</Text><Text style={styles.metaText}>{video.date}</Text></View></View>
        </Pressable>

        <View style={styles.sectionStack}>
          {studioMode ? (
            <>
              <View style={styles.statGrid}>
                {[{ label: 'Watch Time', value: '8.2k hrs', icon: 'schedule', color: '#60a5fa' }, { label: 'Retention', value: '72%', icon: 'auto-graph', color: '#34d399' }, { label: 'Revenue', value: '$4,120', icon: 'payments', color: accent }].map((stat) => (
                  <View key={stat.label} style={[styles.statCard, { backgroundColor: card, borderColor: border }]}>
                    <MaterialIcons name={stat.icon as any} size={20} color={stat.color} />
                    <Text style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: faint }]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.panel, { backgroundColor: card, borderColor: border }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.eyebrow, { color: faint }]}>Uplink Protocols</Text>
                  {syncing ? <View style={[styles.syncDot, { borderColor: accent, borderTopColor: 'transparent' }]} /> : null}
                </View>
                <View style={styles.protocolRow}>
                  {(['public', 'premium'] as const).map((item) => (
                    <Pressable key={item} onPress={() => syncProtocol(item)} style={[styles.protocolCard, { backgroundColor: protocol === item ? theme.accentSoft : soft, borderColor: protocol === item ? accent : border }]}>
                      <MaterialIcons name={item === 'public' ? 'public' : 'stars'} size={22} color={protocol === item ? accent : theme.text} />
                      <Text style={[styles.protocolTitle, { color: theme.text }]}>{item === 'public' ? 'Public Feed' : 'Premium Locked'}</Text>
                      <Text style={[styles.protocolCopy, { color: subtle }]}>{item === 'public' ? 'Visible to all' : 'Members only'}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.auditPanel, { backgroundColor: isDark ? 'rgba(205,43,238,0.10)' : 'rgba(162,28,175,0.08)', borderColor: isDark ? 'rgba(205,43,238,0.24)' : 'rgba(162,28,175,0.18)' }]}>
                <View style={styles.rowBetween}>
                  <View style={styles.auditHead}>
                    <View style={styles.auditIcon}><MaterialIcons name="psychology" size={22} color={accent} /></View>
                    <View>
                      <Text style={[styles.auditTitle, { color: accent }]}>Engagement Auditor</Text>
                      <Text style={[styles.auditSub, { color: faint }]}>Retention Analysis Engine</Text>
                    </View>
                  </View>
                  {loadingAudit ? <View style={[styles.syncDot, { borderColor: accent, borderTopColor: 'transparent' }]} /> : null}
                </View>
                <Text style={[styles.body, { color: theme.text }]}>{audit ?? 'Insight mode is ready to review your watch-time curve and surface stronger replay hooks.'}</Text>
                {!audit ? <Pressable onPress={runAudit} style={[styles.auditButton, { backgroundColor: theme.accentSoft, borderColor: accent }]}><Text style={[styles.auditButtonText, { color: accent }]}>Run Engagement Audit</Text></Pressable> : null}
              </View>
            </>
          ) : (
            <>
              <View style={styles.titleBlock}>
                <Text style={[styles.title, { color: theme.text }]}>{video.title}</Text>
                <View style={styles.titleMeta}><Text style={[styles.smallMeta, { color: subtle }]}>{video.views} Views</Text><View style={[styles.dot, { backgroundColor: faint }]} /><Text style={[styles.smallMeta, { color: subtle }]}>{video.date}</Text></View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionRow}>
                <Pressable onPress={() => setLiked((v) => !v)} style={[styles.actionChip, { backgroundColor: liked ? theme.accentSoft : soft, borderColor: liked ? accent : border }]}><MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={18} color={liked ? accent : theme.text} /><Text style={[styles.actionText, { color: liked ? accent : theme.text }]}>12k</Text></Pressable>
                <Pressable style={[styles.actionChip, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="share" size={18} color={theme.text} /><Text style={[styles.actionText, { color: theme.text }]}>Share</Text></Pressable>
                <Pressable style={[styles.actionChip, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="video-library" size={18} color={theme.text} /><Text style={[styles.actionText, { color: theme.text }]}>Library</Text></Pressable>
              </ScrollView>

              <View style={[styles.panel, { backgroundColor: card, borderColor: border }]}>
                <View style={styles.rowBetween}>
                  <Pressable style={styles.artistMain} onPress={() => navigation.navigate('ArtistProfile')}>
                    <Image source={{ uri: 'https://picsum.photos/seed/elena/150' }} style={styles.artistAvatar} />
                    <View>
                      <View style={styles.artistRow}><Text style={[styles.artistName, { color: theme.text }]}>{video.artist}</Text><MaterialIcons name="verified" size={16} color={accent} /></View>
                      <Text style={[styles.artistHandle, { color: accent }]}>{video.handle}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={[styles.followButton, { backgroundColor: accent }]}><Text style={styles.followText}>Follow</Text></Pressable>
                </View>
              </View>

              <View style={styles.copyBlock}>
                <Text style={[styles.eyebrow, { color: faint }]}>About Transmission</Text>
                <Text style={[styles.body, { color: subtle }]}>{video.description}</Text>
              </View>

              <View style={styles.commentsBlock}>
                <View style={styles.rowBetween}><Text style={[styles.sectionTitle, { color: theme.text }]}>Comments</Text><Text style={[styles.eyebrow, { color: faint }]}>{comments.length} Responses</Text></View>
                <View style={[styles.commentComposer, { backgroundColor: soft, borderColor: border }]}>
                  <TextInput value={commentText} onChangeText={setCommentText} placeholder="Add a comment..." placeholderTextColor={subtle} style={[styles.commentInput, { color: theme.text }]} />
                  <Pressable onPress={postComment}><Text style={[styles.actionText, { color: commentText.trim() ? accent : faint }]}>Post</Text></Pressable>
                </View>
                {comments.map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.rowBetween}><Text style={[styles.commentUser, { color: theme.text }]}>{comment.user}</Text><Text style={[styles.eyebrow, { color: faint }]}>{comment.time}</Text></View>
                      <Text style={[styles.commentBody, { color: subtle }]}>{comment.text}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.commentsBlock}>
                <View style={styles.rowBetween}>
                  <View style={styles.queueHeaderRow}><Text style={[styles.sectionTitle, { color: theme.text }]}>Up Next</Text>{queue.length > 0 ? <View style={[styles.queueBadge, { backgroundColor: accent }]}><Text style={styles.queueBadgeText}>{queue.length} In Queue</Text></View> : null}</View>
                  <Pressable onPress={() => setQueueOpen(true)} style={[styles.manageButton, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="playlist-play" size={18} color={accent} /><Text style={[styles.actionText, { color: accent }]}>Manage Queue</Text></Pressable>
                </View>
                {related.map((item, index) => {
                  const queued = queue.some((entry) => entry.id === item.id);
                  return (
                    <View key={item.id} style={styles.upNextRow}>
                      <Pressable onPress={() => playById(item.id)} style={styles.thumbWrap}>
                        <Image source={{ uri: item.img }} style={styles.thumb} />
                        {index === 0 ? <View style={[styles.nextBadge, { backgroundColor: accent }]}><Text style={styles.nextBadgeText}>Next Focus</Text></View> : null}
                        <View style={styles.durationBadge}><Text style={styles.durationText}>{item.duration}</Text></View>
                      </Pressable>
                      <View style={styles.upNextCopy}>
                        <Pressable onPress={() => playById(item.id)}><Text style={[styles.upNextTitle, { color: theme.text }]}>{item.title}</Text><Text style={[styles.smallMeta, { color: faint }]}>{item.artist}</Text></Pressable>
                        <Pressable onPress={() => addToQueue(item)} style={[styles.queueButton, { backgroundColor: queued ? 'rgba(34,197,94,0.14)' : theme.accentSoft, borderColor: queued ? 'rgba(34,197,94,0.22)' : accent }]}><MaterialIcons name={queued ? 'done-all' : 'playlist-add'} size={16} color={queued ? '#22c55e' : accent} /><Text style={[styles.actionText, { color: queued ? '#22c55e' : accent }]}>{queued ? 'Queued' : 'Add to Queue'}</Text></Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal visible={queueOpen} transparent animationType="slide" onRequestClose={() => setQueueOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setQueueOpen(false)} />
          <View style={[styles.queueSheet, { backgroundColor: isDark ? '#050505' : theme.background, borderColor: border, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={[styles.sheetHandle, { backgroundColor: border }]} />
            <View style={styles.rowBetween}><View><Text style={[styles.sectionTitle, { color: theme.text }]}>Broadcast Queue</Text><Text style={[styles.eyebrow, { color: accent }]}>{queue.length} Pending</Text></View><Pressable onPress={() => setQueueOpen(false)} style={[styles.iconBtn, { backgroundColor: soft, borderColor: border }]}><MaterialIcons name="close" size={20} color={theme.text} /></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              {queue.length > 0 ? queue.map((track, index) => (
                <Pressable key={`${track.id}-${index}`} onPress={() => { setQueue((currentQueue) => currentQueue.filter((_, itemIndex) => itemIndex !== index)); playById(track.id); }} style={[styles.queueRow, { backgroundColor: card, borderColor: border }]}>
                  <Image source={{ uri: track.img }} style={styles.queueThumb} />
                  <View style={{ flex: 1 }}><Text style={[styles.queueTitle, { color: theme.text }]}>{track.title}</Text><Text style={[styles.smallMeta, { color: subtle }]}>{track.artist}</Text></View>
                  <Pressable onPress={() => setQueue((currentQueue) => currentQueue.filter((_, itemIndex) => itemIndex !== index))}><MaterialIcons name="remove-circle-outline" size={18} color={faint} /></Pressable>
                </Pressable>
              )) : <View style={styles.emptyQueue}><MaterialIcons name="playlist-play" size={48} color={faint} /><Text style={[styles.commentUser, { color: theme.text }]}>No transmissions queued</Text></View>}
            </ScrollView>
            {queue.length > 0 ? <View style={styles.queueFooter}><Pressable onPress={() => setQueue([])} style={[styles.clearButton, { backgroundColor: soft, borderColor: border }]}><Text style={[styles.actionText, { color: theme.text }]}>Clear All</Text></Pressable><Pressable onPress={() => { if (queue.length === 0) return; const [next, ...rest] = queue; setQueue(rest); playById(next.id); }} style={[styles.playNextButton, { backgroundColor: accent }]}><Text style={styles.followText}>Play Next</Text></Pressable></View> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, toast: { position: 'absolute', left: 24, right: 24, zIndex: 40, alignItems: 'center' }, toastText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.6, backgroundColor: '#cd2bee', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, pill: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 }, pillSmall: { height: 42, minWidth: 62, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, pillText: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 0.8 },
  videoShell: { marginHorizontal: 12, borderRadius: 30, overflow: 'hidden', borderWidth: 1, aspectRatio: 16 / 9, backgroundColor: '#000' }, video: { ...StyleSheet.absoluteFillObject }, heatmap: { position: 'absolute', bottom: 60, left: 16, right: 16, height: 52, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }, heatBar: { flex: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 }, controls: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' }, controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 }, ghostBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, playBtn: { width: 82, height: 82, borderRadius: 41, backgroundColor: 'rgba(205,43,238,0.22)', borderWidth: 1, borderColor: 'rgba(205,43,238,0.4)', alignItems: 'center', justifyContent: 'center' }, muteBtn: { position: 'absolute', right: 18, bottom: 72, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }, videoFooter: { position: 'absolute', left: 16, right: 16, bottom: 16 }, track: { height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.24)', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 999, backgroundColor: '#cd2bee' }, metaRow: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }, metaText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionStack: { paddingHorizontal: 16, paddingTop: 22, gap: 22 }, statGrid: { flexDirection: 'row', gap: 10 }, statCard: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 16, alignItems: 'center', gap: 6 }, statValue: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(12) }, statLabel: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(6), textTransform: 'uppercase', letterSpacing: 1.1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, panel: { borderRadius: 28, borderWidth: 1, padding: 18, gap: 16 }, eyebrow: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 1.5 }, syncDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 }, protocolRow: { flexDirection: 'row', gap: 12 }, protocolCard: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 }, protocolTitle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) }, protocolCopy: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(8), textTransform: 'uppercase' },
  auditPanel: { borderRadius: 30, borderWidth: 1, padding: 18, gap: 14 }, auditHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, auditIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(205,43,238,0.10)' }, auditTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.3 }, auditSub: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(6), textTransform: 'uppercase' }, auditButton: { height: 46, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, auditButtonText: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase' },
  titleBlock: { gap: 8 }, title: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(20) }, titleMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 }, smallMeta: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1 }, dot: { width: 4, height: 4, borderRadius: 2 }, actionRow: { gap: 10 }, actionChip: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1 }, actionText: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(7), textTransform: 'uppercase', letterSpacing: 1 },
  artistMain: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }, artistAvatar: { width: 54, height: 54, borderRadius: 18 }, artistRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, artistName: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(12) }, artistHandle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1 }, followButton: { height: 42, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }, followText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(8), textTransform: 'uppercase', letterSpacing: 1.2 },
  copyBlock: { gap: 8 }, body: { fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(11), lineHeight: 20 }, commentsBlock: { gap: 14 }, sectionTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(18) }, commentComposer: { borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 }, commentInput: { flex: 1, minHeight: 46, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(11) }, commentRow: { flexDirection: 'row', gap: 12 }, commentAvatar: { width: 42, height: 42, borderRadius: 14 }, commentUser: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) }, commentBody: { marginTop: 4, fontFamily: 'PlusJakartaSansMedium', fontSize: fontScale(10), lineHeight: 18 },
  queueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, queueBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, queueBadgeText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(6), textTransform: 'uppercase' }, manageButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 }, upNextRow: { flexDirection: 'row', gap: 14 }, thumbWrap: { width: 156, aspectRatio: 16 / 9, borderRadius: 24, overflow: 'hidden' }, thumb: { width: '100%', height: '100%' }, nextBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }, nextBadgeText: { color: '#fff', fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(6), textTransform: 'uppercase' }, durationBadge: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }, durationText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(7) }, upNextCopy: { flex: 1, justifyContent: 'space-between', paddingVertical: 4 }, upNextTitle: { fontFamily: 'PlusJakartaSansExtraBold', fontSize: fontScale(11), lineHeight: 18 }, queueButton: { height: 34, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, alignSelf: 'flex-start' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }, queueSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, borderWidth: 1, paddingTop: 10, paddingHorizontal: 18, maxHeight: '82%' }, sheetHandle: { width: 44, height: 5, borderRadius: 999, alignSelf: 'center', marginBottom: 18 }, queueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, borderWidth: 1 }, queueThumb: { width: 58, height: 58, borderRadius: 16 }, queueTitle: { fontFamily: 'PlusJakartaSansBold', fontSize: fontScale(10) }, emptyQueue: { alignItems: 'center', justifyContent: 'center', paddingVertical: 44, gap: 10 }, queueFooter: { flexDirection: 'row', gap: 10 }, clearButton: { flex: 1, height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, playNextButton: { flex: 1.5, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

export default Player;
