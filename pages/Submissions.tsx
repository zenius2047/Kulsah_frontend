import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, FontSize } from '../fonts';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import { useNavigation } from '@react-navigation/native';

type SubmissionTab = 'all' | 'shortlisted' | 'popular';
type ViewMode = 'grid' | 'list';

type ChallengeSubmission = {
  id: string;
  challengeId: string;
  challengeTitle: string;
  userId: string;
  userName: string;
  userHandle: string;
  userAvatar: string;
  contentUrl: string;
  thumbnailUrl: string;
  submittedAt: string;
  likes: number;
  votes: number;
};

const dummySubmissions: ChallengeSubmission[] = [
  {
    id: 's1',
    challengeId: 'c1',
    challengeTitle: 'Night Vibes Dance Challenge',
    userId: 'fan_1',
    userName: 'MusicLover99',
    userHandle: '@musiclover',
    userAvatar: 'https://picsum.photos/seed/fan1/200',
    contentUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800',
    submittedAt: '2 hours ago',
    likes: 124,
    votes: 45,
  },
  {
    id: 's2',
    challengeId: 'c1',
    challengeTitle: 'Night Vibes Dance Challenge',
    userId: 'fan_2',
    userName: 'Champion Fan',
    userHandle: '@champion',
    userAvatar: 'https://picsum.photos/seed/fan2/200',
    contentUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800',
    submittedAt: '5 hours ago',
    likes: 89,
    votes: 32,
  },
  {
    id: 's3',
    challengeId: 'c2',
    challengeTitle: 'Vocal Harmony Challenge',
    userId: 'fan_3',
    userName: 'BassMaster',
    userHandle: '@bassmaster',
    userAvatar: 'https://picsum.photos/seed/fan3/200',
    contentUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800',
    submittedAt: '1 day ago',
    likes: 210,
    votes: 78,
  },
  {
    id: 's4',
    challengeId: 'c3',
    challengeTitle: 'Summer Solstice Synthwave',
    userId: 'fan_4',
    userName: 'RetroLover',
    userHandle: '@retro_sol',
    userAvatar: 'https://picsum.photos/seed/fan4/200',
    contentUrl: '#',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800',
    submittedAt: '3 days ago',
    likes: 312,
    votes: 114,
  },
];

const Submissions: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SubmissionTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [activePlayerVideo, setActivePlayerVideo] = useState<ChallengeSubmission | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(35);
  const [volume, setVolume] = useState(80);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSubmissions(dummySubmissions);
    setLoading(false);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2600);
  };

  const toggleShortlist = (id: string, name: string) => {
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Removed ${name} from shortlist.`);
      } else {
        next.add(id);
        showToast(`Added ${name} to shortlist.`);
      }
      return next;
    });
  };

  const toggleApprove = (id: string, name: string) => {
    setApprovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Revoked approval for ${name}.`);
      } else {
        next.add(id);
        showToast(`Approved and featured ${name}.`);
      }
      return next;
    });
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const searchable = [
          submission.userName,
          submission.userHandle,
          submission.challengeTitle,
        ].join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      if (activeTab === 'shortlisted') return shortlistedIds.has(submission.id);
      if (activeTab === 'popular') return submission.likes >= 120;
      return true;
    });
  }, [activeTab, searchQuery, shortlistedIds, submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const totalLikes = submissions.reduce((sum, submission) => sum + submission.likes, 0);
    return {
      total,
      totalShortlisted: shortlistedIds.size,
      averageLikes: total > 0 ? Math.round(totalLikes / total) : 0,
    };
  }, [shortlistedIds.size, submissions]);

  const resetFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
  };

  const openPlayer = (submission: ChallengeSubmission) => {
    setActivePlayerVideo(submission);
    setIsPlaying(true);
  };

  const closePlayer = () => {
    setActivePlayerVideo(null);
    setIsPlaying(false);
  };

  return (
    <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: theme.background, marginTop: Platform.OS === 'ios' ? 54 : insets.top }]}>
      <View style={[styles.header, { backgroundColor: isDark ? '#000000' : '#ffffff', borderBottomColor: isDark ? '#27272a' : '#e2e8f0' }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Submission Radar</Text>
            <Text style={styles.headerSubtitle}>Fan Submissions Live Review</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.searchBox, { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e2e8f0', marginHorizontal: 20 }]}>
          <MaterialIcons name="search" size={20} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by participant or challenge..."
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
              <MaterialIcons name="close" size={18} color={theme.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabList}>
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'shortlisted' as const, label: 'Shortlist' },
            { id: 'popular' as const, label: 'Popular' },
          ].map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tab,
                  selected ? styles.tabSelected : styles.tabIdle,
                  !selected ? { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e2e8f0' } : null,
                ]}
              >
                <Text style={[styles.tabText, { color: selected ? '#ffffff' : isDark ? '#a1a1aa' : '#475569' }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {toastMessage ? (
        <View pointerEvents="none" style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 130 }]}
      >
        <View style={styles.statsGrid}>
          <StatCard icon="video-library" label="Submissions" value={`${stats.total}`} color={PRIMARY_COLOR} styles={styles} />
          <StatCard icon="grade" label="Shortlisted" value={`${stats.totalShortlisted}`} color="#f59e0b" styles={styles} />
          <StatCard icon="favorite" label="Avg Likes" value={`${stats.averageLikes}`} color="#f43f5e" styles={styles} />
        </View>

        <View style={styles.modeRow}>
          <View style={[styles.modeWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderColor: theme.border }]}>
            <Pressable onPress={() => setViewMode('list')} style={[styles.modeButton, viewMode === 'list' ? styles.modeButtonActive : null]}>
              <MaterialIcons name="view-list" size={18} color={viewMode === 'list' ? PRIMARY_COLOR : theme.textMuted} />
            </Pressable>
            <Pressable onPress={() => setViewMode('grid')} style={[styles.modeButton, viewMode === 'grid' ? styles.modeButtonActive : null]}>
              <MaterialIcons name="grid-view" size={18} color={viewMode === 'grid' ? PRIMARY_COLOR : theme.textMuted} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={PRIMARY_COLOR} />
          </View>
        ) : filteredSubmissions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: theme.border }]}>
            <MaterialIcons name="playlist-remove" size={34} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No submissions fit criteria</Text>
            <Pressable onPress={resetFilters}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </Pressable>
          </View>
        ) : viewMode === 'list' ? (
          <View style={styles.listStack}>
            {filteredSubmissions.map((submission) => (
              <SubmissionListCard
                key={submission.id}
                submission={submission}
                isShortlisted={shortlistedIds.has(submission.id)}
                isApproved={approvedIds.has(submission.id)}
                onOpen={() => openPlayer(submission)}
                onShortlist={() => toggleShortlist(submission.id, submission.userName)}
                onApprove={() => toggleApprove(submission.id, submission.userName)}
                styles={styles}
              />
            ))}
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {filteredSubmissions.map((submission) => (
              <SubmissionGridCard
                key={submission.id}
                submission={submission}
                isShortlisted={shortlistedIds.has(submission.id)}
                isApproved={approvedIds.has(submission.id)}
                onOpen={() => openPlayer(submission)}
                onShortlist={() => toggleShortlist(submission.id, submission.userName)}
                onApprove={() => toggleApprove(submission.id, submission.userName)}
                styles={styles}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <PlayerModal
        visible={!!activePlayerVideo}
        submission={activePlayerVideo}
        isPlaying={isPlaying}
        playProgress={playProgress}
        volume={volume}
        shortlisted={!!activePlayerVideo && shortlistedIds.has(activePlayerVideo.id)}
        approved={!!activePlayerVideo && approvedIds.has(activePlayerVideo.id)}
        onClose={closePlayer}
        onTogglePlay={() => setIsPlaying((prev) => !prev)}
        onSetProgress={setPlayProgress}
        onSetVolume={setVolume}
        onShortlist={() => activePlayerVideo && toggleShortlist(activePlayerVideo.id, activePlayerVideo.userName)}
        onApprove={() => activePlayerVideo && toggleApprove(activePlayerVideo.id, activePlayerVideo.userName)}
        onReward={() => {
          if (!activePlayerVideo) return;
          showToast(`Awarded 500 KulCoins to ${activePlayerVideo.userName}.`);
          closePlayer();
        }}
        styles={styles}
      />
    </SafeAreaView>
  );
};

const StatCard = ({ icon, label, value, color, styles }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string; color: string; styles: ReturnType<typeof createStyles> }) => (
  <View style={styles.statCard}>
    <View style={[styles.statGlow, { backgroundColor: color }]} />
    <MaterialIcons name={icon} size={16} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SubmissionListCard = ({
  submission,
  isShortlisted,
  isApproved,
  onOpen,
  onShortlist,
  onApprove,
  styles,
}: {
  submission: ChallengeSubmission;
  isShortlisted: boolean;
  isApproved: boolean;
  onOpen: () => void;
  onShortlist: () => void;
  onApprove: () => void;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={[styles.submissionListCard, isApproved ? styles.approvedCard : isShortlisted ? styles.shortlistedCard : null]}>
    {isApproved ? (
      <View style={styles.approvedMark}>
        <MaterialIcons name="check" size={12} color="#fff" />
      </View>
    ) : null}
    <Pressable onPress={onOpen} style={styles.listThumb}>
      <Image source={{ uri: submission.thumbnailUrl }} style={styles.fillImage} />
      <View style={styles.thumbOverlay}>
        <MaterialIcons name="play-circle" size={32} color="#fff" />
      </View>
    </Pressable>
    <View style={styles.submissionBody}>
      <View style={styles.userRow}>
        <Image source={{ uri: submission.userAvatar }} style={styles.userAvatar} />
        <Text numberOfLines={1} style={styles.userName}>{submission.userName}</Text>
        <Text numberOfLines={1} style={styles.userHandle}>{submission.userHandle}</Text>
      </View>
      <Text numberOfLines={1} style={styles.submissionTitle}>{submission.challengeTitle}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.submittedAt}>{submission.submittedAt}</Text>
        {isShortlisted ? <Text style={styles.shortlistPill}>Shortlisted</Text> : null}
      </View>
      <View style={styles.performanceRow}>
        <Metric icon="favorite" value={`${submission.likes}`} color="#f43f5e" styles={styles} />
        <Metric icon="how-to-vote" value={`${submission.votes} votes`} color="#10b981" styles={styles} />
      </View>
    </View>
    <View style={styles.actionColumn}>
      <IconAction icon="star" active={isShortlisted} activeColor="#f59e0b" onPress={onShortlist} styles={styles} />
      <IconAction icon="check-circle" active={isApproved} activeColor="#10b981" onPress={onApprove} styles={styles} />
      <IconAction icon="visibility" active activeColor={PRIMARY_COLOR} onPress={onOpen} styles={styles} />
    </View>
  </View>
);

const SubmissionGridCard = ({
  submission,
  isShortlisted,
  isApproved,
  onOpen,
  onShortlist,
  onApprove,
  styles,
}: {
  submission: ChallengeSubmission;
  isShortlisted: boolean;
  isApproved: boolean;
  onOpen: () => void;
  onShortlist: () => void;
  onApprove: () => void;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={[styles.gridCard, isApproved ? styles.gridApproved : isShortlisted ? styles.gridShortlisted : null]}>
    <ImageBackground source={{ uri: submission.thumbnailUrl }} resizeMode="cover" style={styles.gridImage}>
      <LinearGradient colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.94)']} style={StyleSheet.absoluteFillObject} />
      <View style={styles.gridMarks}>
        {isApproved ? <View style={[styles.gridMark, { backgroundColor: '#10b981' }]}><MaterialIcons name="check" size={11} color="#fff" /></View> : null}
        {isShortlisted ? <View style={[styles.gridMark, { backgroundColor: '#f59e0b' }]}><MaterialIcons name="star" size={11} color="#fff" /></View> : null}
      </View>
      <Pressable onPress={onOpen} style={styles.gridOpenLayer}>
        <MaterialIcons name="play-circle" size={36} color="rgba(255,255,255,0.9)" />
      </Pressable>
      <View style={styles.gridInfo}>
        <View style={styles.gridUserRow}>
          <Image source={{ uri: submission.userAvatar }} style={styles.gridAvatar} />
          <Text numberOfLines={1} style={styles.gridUserName}>{submission.userName}</Text>
        </View>
        <Text numberOfLines={1} style={styles.gridTitle}>{submission.challengeTitle}</Text>
        <View style={styles.gridMeta}>
          <Text style={styles.gridMetaText}>{submission.submittedAt}</Text>
          <Text style={styles.gridLikes}>{submission.likes} likes</Text>
        </View>
        <View style={styles.gridActions}>
          <Pressable onPress={onShortlist} style={[styles.gridActionButton, isShortlisted ? styles.gridShortlistButton : null]}>
            <Text style={styles.gridActionText}>{isShortlisted ? 'Starred' : 'Shortlist'}</Text>
          </Pressable>
          <Pressable onPress={onApprove} style={[styles.gridActionButton, isApproved ? styles.gridApproveButton : null]}>
            <Text style={styles.gridActionText}>{isApproved ? 'Featured' : 'Approve'}</Text>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
  </View>
);

const Metric = ({ icon, value, color, styles }: { icon: keyof typeof MaterialIcons.glyphMap; value: string; color: string; styles: ReturnType<typeof createStyles> }) => (
  <View style={styles.metricMini}>
    <MaterialIcons name={icon} size={14} color={color} />
    <Text style={styles.metricMiniText}>{value}</Text>
  </View>
);

const IconAction = ({ icon, active, activeColor, onPress, styles }: { icon: keyof typeof MaterialIcons.glyphMap; active: boolean; activeColor: string; onPress: () => void; styles: ReturnType<typeof createStyles> }) => (
  <Pressable onPress={onPress} style={[styles.iconAction, active ? { backgroundColor: `${activeColor}1A`, borderColor: `${activeColor}55` } : null]}>
    <MaterialIcons name={icon} size={17} color={active ? activeColor : '#94a3b8'} />
  </Pressable>
);

const PlayerModal = ({
  visible,
  submission,
  isPlaying,
  playProgress,
  volume,
  shortlisted,
  approved,
  onClose,
  onTogglePlay,
  onSetProgress,
  onSetVolume,
  onShortlist,
  onApprove,
  onReward,
  styles,
}: {
  visible: boolean;
  submission: ChallengeSubmission | null;
  isPlaying: boolean;
  playProgress: number;
  volume: number;
  shortlisted: boolean;
  approved: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onSetProgress: (value: number) => void;
  onSetVolume: (value: number) => void;
  onShortlist: () => void;
  onApprove: () => void;
  onReward: () => void;
  styles: ReturnType<typeof createStyles>;
}) => {
  if (!submission) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <View style={styles.playerCard}>
          <View style={styles.playerTop}>
            <View style={styles.playerUserPill}>
              <Image source={{ uri: submission.userAvatar }} style={styles.playerUserAvatar} />
              <Text style={styles.playerUserName}>{submission.userName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.playerClose}>
              <MaterialIcons name="close" size={17} color="#fff" />
            </Pressable>
          </View>
          <View style={styles.videoCanvas}>
            <Image source={{ uri: submission.thumbnailUrl }} style={styles.fillImage} />
            {!isPlaying ? (
              <View style={styles.pausedOverlay}>
                <MaterialIcons name="play-arrow" size={56} color="#fff" />
              </View>
            ) : (
              <View style={styles.equalizer}>
                {[12, 24, 16, 28].map((height, index) => (
                  <View key={`${height}-${index}`} style={[styles.equalizerBar, { height }]} />
                ))}
              </View>
            )}
            <View style={styles.hud}>
              <Text style={styles.hudChallenge}>{submission.challengeTitle}</Text>
              <Text style={styles.hudTitle}>{submission.userName}'s Transmission</Text>
              <ProgressBar value={playProgress} onSetValue={onSetProgress} styles={styles} />
            </View>
          </View>
          <View style={styles.playerControls}>
            <View style={styles.controlTopRow}>
              <Pressable onPress={onTogglePlay} style={styles.playControl}>
                <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={22} color={PRIMARY_COLOR} />
              </Pressable>
              <View style={styles.volumeWrap}>
                <MaterialIcons name={volume === 0 ? 'volume-off' : volume < 50 ? 'volume-down' : 'volume-up'} size={18} color="rgba(255,255,255,0.66)" />
                <ProgressBar value={volume} onSetValue={onSetVolume} compact styles={styles} />
              </View>
              <View style={styles.playerStats}>
                <Metric icon="favorite" value={`${submission.likes}`} color="#f43f5e" styles={styles} />
                <Metric icon="how-to-vote" value={`${submission.votes}`} color="#10b981" styles={styles} />
              </View>
            </View>
            <View style={styles.reviewActions}>
              <Pressable onPress={onShortlist} style={[styles.reviewButton, shortlisted ? styles.reviewShortlisted : null]}>
                <MaterialIcons name="grade" size={16} color={shortlisted ? '#f59e0b' : '#fff'} />
                <Text style={[styles.reviewButtonText, shortlisted ? { color: '#f59e0b' } : null]}>{shortlisted ? 'Shortlisted' : 'Shortlist'}</Text>
              </Pressable>
              <Pressable onPress={onApprove} style={[styles.reviewButton, approved ? styles.reviewApproved : null]}>
                <MaterialIcons name="workspace-premium" size={16} color={approved ? '#10b981' : '#fff'} />
                <Text style={[styles.reviewButtonText, approved ? { color: '#10b981' } : null]}>{approved ? 'Approved' : 'Approve'}</Text>
              </Pressable>
            </View>
            <Pressable onPress={onReward} style={styles.rewardButton}>
              <MaterialIcons name="payments" size={18} color="#fff" />
              <Text style={styles.rewardButtonText}>Send Direct KulCoin Reward</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProgressBar = ({ value, onSetValue, compact, styles }: { value: number; onSetValue: (value: number) => void; compact?: boolean; styles: ReturnType<typeof createStyles> }) => {
  const [barWidth, setBarWidth] = useState(1);

  return (
    <Pressable
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      onPress={(event) => {
        const next = Math.min(100, Math.max(0, Math.round((event.nativeEvent.locationX / barWidth) * 100)));
        onSetValue(next);
      }}
      style={compact ? styles.progressCompact : styles.progressTrack}
    >
      <View style={[styles.progressFill, { width: `${value}%` }]} />
    </Pressable>
  );
};

const createStyles = (isDark: boolean) => {
  const text = isDark ? '#ffffff' : '#0f172a';
  const card = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const muted = isDark ? '#a1a1aa' : '#64748b';

  return StyleSheet.create({
    safeArea: { flex: 1 },
    header: { paddingTop: 8, paddingBottom: 14, borderBottomWidth: 1 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
    headerRoundBtn: { height: 40, width: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    headerTitleWrap: { alignItems: 'center' },
    headerSpacer: { width: 40 },
    headerIconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    headerCopy: { flex: 1, alignItems: 'center' },
    headerTitle: { fontFamily: FontFamily.extraBold, fontSize: FontSize.fourteen, textTransform: 'uppercase', letterSpacing: 2.2 },
    headerSubtitle: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase', letterSpacing: 1 },
    toast: { position: 'absolute', top: 78, left: 34, right: 34, zIndex: 20, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.9)', borderWidth: 1, borderColor: primaryColorAlpha(0.25), paddingHorizontal: 14, paddingVertical: 11 },
    toastText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.nine, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1.1 },
    content: { padding: 20, gap: 18 },
    statsGrid: { flexDirection: 'row', gap: 8 },
    statCard: { flex: 1, minHeight: 92, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderWidth: 1, borderColor: border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 10 },
    statGlow: { position: 'absolute', right: -10, top: -12, width: 48, height: 48, borderRadius: 24, opacity: 0.08 },
    statValue: { color: text, fontFamily: FontFamily.extraBold, fontSize: FontSize.fourteen, marginTop: 6 },
    statLabel: { color: muted, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase', letterSpacing: 1.1, marginTop: 3, textAlign: 'center' },
    searchBox: { height: 48, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 },
    searchInput: { flex: 1, fontFamily: FontFamily.bold, fontSize: FontSize.twelve, paddingVertical: 0 },
    tabList: { gap: 8, paddingTop: 12, paddingHorizontal: 20 },
    tab: { minHeight: 34, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tabSelected: { backgroundColor: PRIMARY_COLOR, borderColor: 'transparent' },
    tabIdle: { backgroundColor: card, borderColor: border },
    tabText: { fontFamily: FontFamily.extraBold, fontSize: FontSize.eleven, letterSpacing: 1.2, textTransform: 'uppercase' },
    clearText: { fontFamily: FontFamily.extraBold, fontSize: FontSize.ten },
    controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    segmentWrap: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 4, flexDirection: 'row', gap: 4 },
    segmentButton: { flex: 1, minHeight: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segmentButtonActive: { backgroundColor: PRIMARY_COLOR },
    segmentText: { fontFamily: FontFamily.extraBold, fontSize: FontSize.eight, textTransform: 'uppercase', letterSpacing: 1 },
    modeRow: { flexDirection: 'row', justifyContent: 'flex-end' },
    modeWrap: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 3, gap: 2 },
    modeButton: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    modeButtonActive: { backgroundColor: card },
    loadingWrap: { minHeight: 180, alignItems: 'center', justifyContent: 'center' },
    emptyCard: { minHeight: 180, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
    emptyText: { fontFamily: FontFamily.extraBold, fontSize: FontSize.eleven, textTransform: 'uppercase', letterSpacing: 1 },
    resetText: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: FontSize.nine, textTransform: 'uppercase', letterSpacing: 1.2 },
    listStack: { gap: 14 },
    submissionListCard: { position: 'relative', borderRadius: 28, padding: 14, backgroundColor: card, borderWidth: 1, borderColor: border, flexDirection: 'row', alignItems: 'center', gap: 12 },
    approvedCard: { borderColor: 'rgba(16,185,129,0.5)', backgroundColor: isDark ? 'rgba(16,185,129,0.06)' : '#ecfdf5' },
    shortlistedCard: { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: isDark ? 'rgba(245,158,11,0.05)' : '#fffbeb' },
    approvedMark: { position: 'absolute', top: 10, left: 10, zIndex: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
    listThumb: { width: 90, height: 90, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111827' },
    fillImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
    thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.28)', alignItems: 'center', justifyContent: 'center' },
    submissionBody: { flex: 1, minWidth: 0, gap: 5 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userAvatar: { width: 22, height: 22, borderRadius: 11 },
    userName: { color: text, flexShrink: 1, fontFamily: FontFamily.extraBold, fontSize: FontSize.nine, textTransform: 'uppercase', letterSpacing: 0.8 },
    userHandle: { color: muted, flexShrink: 1, fontFamily: FontFamily.bold, fontSize: FontSize.eight },
    submissionTitle: { color: text, fontFamily: FontFamily.extraBold, fontSize: FontSize.eleven, textTransform: 'uppercase' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    submittedAt: { color: muted, fontFamily: FontFamily.bold, fontSize: FontSize.seven, textTransform: 'uppercase', letterSpacing: 0.8 },
    shortlistPill: { color: '#f59e0b', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', backgroundColor: 'rgba(245,158,11,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase' },
    performanceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 2 },
    metricMini: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metricMiniText: { color: isDark ? '#d4d4d8' : '#475569', fontFamily: FontFamily.extraBold, fontSize: FontSize.ten },
    actionColumn: { gap: 7 },
    iconAction: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', alignItems: 'center', justifyContent: 'center' },
    gridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    gridCard: { width: '48%', aspectRatio: 1 / 1.32, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: border, backgroundColor: '#111827' },
    gridApproved: { borderColor: '#10b981' },
    gridShortlisted: { borderColor: '#f59e0b' },
    gridImage: { flex: 1 },
    gridMarks: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 4, zIndex: 2 },
    gridMark: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    gridOpenLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    gridInfo: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 6 },
    gridUserRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    gridAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
    gridUserName: { color: '#fff', flex: 1, fontFamily: FontFamily.extraBold, fontSize: FontSize.nine, textTransform: 'uppercase', letterSpacing: 0.8 },
    gridTitle: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.ten, textTransform: 'uppercase' },
    gridMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    gridMetaText: { color: 'rgba(255,255,255,0.55)', fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase' },
    gridLikes: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase' },
    gridActions: { flexDirection: 'row', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
    gridActionButton: { flex: 1, minHeight: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' },
    gridShortlistButton: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
    gridApproveButton: { backgroundColor: '#10b981', borderColor: '#10b981' },
    gridActionText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase', letterSpacing: 0.6 },
    modalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', alignItems: 'center', justifyContent: 'flex-end', padding: 14 },
    playerCard: { width: '100%', maxWidth: 390, borderRadius: 36, overflow: 'hidden', backgroundColor: '#09090b', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    playerTop: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    playerUserPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
    playerUserAvatar: { width: 22, height: 22, borderRadius: 11 },
    playerUserName: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.eight, textTransform: 'uppercase', letterSpacing: 1 },
    playerClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    videoCanvas: { aspectRatio: 3 / 4, backgroundColor: '#000', overflow: 'hidden' },
    pausedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.32)', alignItems: 'center', justifyContent: 'center' },
    equalizer: { position: 'absolute', right: 24, bottom: 86, height: 34, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    equalizerBar: { width: 4, borderRadius: 4, backgroundColor: PRIMARY_COLOR },
    hud: { position: 'absolute', left: 16, right: 16, bottom: 14, padding: 14, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.46)' },
    hudChallenge: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: FontSize.seven, textTransform: 'uppercase', letterSpacing: 1 },
    hudTitle: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.twelve, textTransform: 'uppercase', marginTop: 4 },
    progressTrack: { height: 14, marginTop: 10, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, overflow: 'hidden' },
    progressCompact: { flex: 1, height: 8, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 999, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: PRIMARY_COLOR, borderRadius: 999 },
    playerControls: { padding: 18, gap: 16 },
    controlTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    playControl: { width: 42, height: 42, borderRadius: 21, backgroundColor: primaryColorAlpha(0.18), alignItems: 'center', justifyContent: 'center' },
    volumeWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    playerStats: { gap: 4 },
    reviewActions: { flexDirection: 'row', gap: 8 },
    reviewButton: { flex: 1, minHeight: 44, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    reviewShortlisted: { backgroundColor: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.35)' },
    reviewApproved: { backgroundColor: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.35)' },
    reviewButtonText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.eight, textTransform: 'uppercase', letterSpacing: 1 },
    rewardButton: { minHeight: 46, borderRadius: 16, backgroundColor: PRIMARY_COLOR, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    rewardButtonText: { color: '#fff', fontFamily: FontFamily.extraBold, fontSize: FontSize.eight, textTransform: 'uppercase', letterSpacing: 1.5 },
  });
};

export default Submissions;
