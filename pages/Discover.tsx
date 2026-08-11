import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  GestureResponderEvent,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRIMARY_COLOR, primaryColorAlpha, useThemeMode } from '../theme';
import CalenderIcon from '../assets/icons/calendar-svg.svg';
import LocationIcon from '../assets/icons/location-svg.svg';
import { fontSize } from './typography';
import { useDiscovery, useFollowCreatorMutation } from '../src';


type DiscoverTab = 'all' | 'creators' | 'tickets' | 'videos' | 'challenges';

interface CreatorItem {
  id: string;
  name: string;
  handle: string;
  isLive: boolean;
  avatar: string;
  style: string;
  tool: string;
  followers: string;
  isPremium?: boolean;
  isVerified?: boolean;
}

interface TicketItem {
  id: string;
  eventTitle: string;
  creator: string;
  date: string;
  venue: string;
  price: number;
  currency: string;
  img: string;
  colors: readonly [string, string];
  duration: string;
}

interface VideoItem {
  id: string;
  title: string;
  creator: string;
  views: string;
  likes: number;
  img: string;
  duration: string;
  category: string;
  isLiked?: boolean;
}

const compactCount = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return String(value);
};

const formatDuration = (seconds: number | null) => seconds == null
  ? '--:--'
  : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const formatEventDuration = (minutes: number | null) => {
  if (minutes == null) return 'Event';
  if (minutes < 60) return `${minutes} min`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} Hour Event`;
};

interface ChallengeItem {
  id: string;
  tag: string;
  creator: string;
  prizePool: string;
  participants: number;
  type: 'VFX Overlay' | 'Seamless Transition' | 'Cinematic Vlog' | 'Drone Hyperlapse';
  endTime: string;
  img: string;
}

const topCreators: CreatorItem[] = [
  { id: 'sarah_vfx', name: 'Sarah Chen', handle: '@sarahvfx', isLive: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', style: '3D VFX & Neon Transitions', tool: 'After Effects • Blender', followers: '3.1M', isPremium: true },
  { id: 'devon_vlog', name: 'Devon Carter', handle: '@devoncarter', isLive: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', style: 'Cinematic Travel Vlogs', tool: 'DaVinci Resolve • Red Komodo', followers: '1.8M', isPremium: true },
  { id: 'aisha_cgi', name: 'Aisha Rahman', handle: '@aishacgi', isLive: false, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', style: 'Virtual Production & CGI', tool: 'Unreal Engine 5 • Nuke', followers: '2.9M', isPremium: true },
  { id: 'elena_edits', name: 'Elena Rostova', handle: '@elenacuts', isLive: true, avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', style: 'Cyberpunk Drone Hyperlapses', tool: 'Premiere Pro • DJI Mavic 3 Pro', followers: '2.5M' },
  { id: 'marcus_focus', name: 'Marcus Thorne', handle: '@marcuscinemas', isLive: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', style: 'Anamorphic Storytelling', tool: 'Sony FX3 • Sirui 50mm', followers: '4.2M', isPremium: true },
  { id: 'kenji_tokyo', name: 'Kenji Sato', handle: '@kenjitokyo', isLive: false, avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200', style: 'First-Person Hyperlapse', tool: 'Insta360 Pro • Gimbal Rig', followers: '1.2M' },
  { id: 'liam_drone', name: 'Liam Gallagher', handle: '@liamdrone', isLive: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200', style: 'FPV Mountain Speedflying', tool: 'GoPro Hero 12 • Custom Quad', followers: '1.5M' },
  { id: 'alex_rivera', name: 'Alex Rivera', handle: '@alexrivera', isLive: false, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', style: 'Cyberpunk CGI Concept', tool: 'Unreal Engine 5 • Blender', followers: '1.4M', isPremium: true },
  { id: 'amara_vfx', name: 'Amara Lopez', handle: '@amaralopez', isLive: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', style: 'Hyperreal Motion Design', tool: 'Cinema 4D • Octane', followers: '2.1M' },
  { id: 'lucas_3d', name: 'Lucas Dupont', handle: '@lucas3d', isLive: true, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200', style: 'Anamorphic Real-time Sim', tool: 'Houdini • Unreal Engine 5', followers: '1.9M', isPremium: true },
];

const ticketShows: TicketItem[] = [
  { id: 'tix-grading', eventTitle: 'Mastering Cinematic Color Grading', creator: 'Devon Carter', date: 'JUN 15, 2026', venue: 'Metropolis Theater & Virtual Dome', price: 120, currency: 'KulCoins', img: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=400', colors: ['rgba(245,158,11,0.3)', 'rgba(244,63,94,0.04)'], duration: '4 Hour Live Lab' },
  { id: 'tix-blender', eventTitle: 'Real-time 3D Blender Integrations', creator: 'Sarah Chen', date: 'JUL 08, 2026', venue: 'Tokyo Creative Hub (Online)', price: 90, currency: 'KulCoins', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400', colors: ['rgba(6,182,212,0.3)', 'rgba(59,130,246,0.04)'], duration: '3 Hour Interactive Stream' },
  { id: 'tix-mavic', eventTitle: 'Advanced Drone Cinematography Camp', creator: 'Elena Rostova', date: 'AUG 12, 2026', venue: 'Grand Canyon Scenic Reserve', price: 250, currency: 'KulCoins', img: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400', colors: ['rgba(168,85,247,0.3)', 'rgba(99,102,241,0.04)'], duration: 'Full Day Hybrid Pass' },
  { id: 'tix-anamorphic', eventTitle: 'Short Film Premiere & Q&A Board', creator: 'Marcus Thorne', date: 'SEP 04, 2026', venue: 'Rooftop Cinema Lounge, LA', price: 60, currency: 'KulCoins', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400', colors: ['rgba(236,72,153,0.3)', 'rgba(168,85,247,0.04)'], duration: '2 Hour Exclusive Stream' },
];

const trendingVideos: VideoItem[] = [
  { id: 'cl1', title: 'How I filmed this surreal cyberpunk look in Shibuya utilizing pure camera tricks', creator: 'Sarah Chen', views: '4.8M', likes: 312000, img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400', duration: '8:45', category: 'VFX Tutorial' },
  { id: 'cl2', title: 'The art of the whip-pan seamless cinematic transition - 60 seconds masterclass', creator: 'Devon Carter', views: '2.1M', likes: 184000, img: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400', duration: '1:00', category: 'Transition' },
  { id: 'cl3', title: 'Tracking 4K cinematic FPV drone shots through Tokyo alleyways', creator: 'Elena Rostova', views: '3.6M', likes: 295000, img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=400', duration: '11:20', category: 'Cinematic Drone' },
  { id: 'cl4', title: 'Lighting setups that make a $1,000 camera body look like an Alexa LF', creator: 'Marcus Thorne', views: '1.9M', likes: 104500, img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400', duration: '14:32', category: 'Studio Lighting' },
];

const activeChallenges: ChallengeItem[] = [
    {
      id: 'ch-seamless',
      tag: 'ContinuousMatchCutChallenge',
      creator: 'Devon Carter',
      prizePool: 'GH₵ 8,000',
      participants: 41200,
      type: 'Seamless Transition',
      endTime: 'Ends in 2 days',
      img: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'ch-cyberneon',
      tag: 'CyberpunkColorVibeGrading',
      creator: 'Sarah Chen',
      prizePool: 'GH₵ 5,500',
      participants: 28900,
      type: 'VFX Overlay',
      endTime: 'Ends in 4 days',
      img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'ch-hyperlapse',
      tag: 'InfiniteSpeedRampHyperlapse',
      creator: 'Elena Rostova',
      prizePool: 'GH₵ 10,000',
      participants: 51000,
      type: 'Drone Hyperlapse',
      endTime: 'Ends in 12 hours',
      img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=150'
    },
    {
      id: 'ch-anamorphic',
      tag: 'AnamorphicAtmosphericDepth',
      creator: 'Lucas Dupont',
      prizePool: 'GH₵ 12,500',
      participants: 34500,
      type: 'Cinematic Vlog',
      endTime: 'Ends in 3 days',
      img: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=150'
    }
  ];

export const DISCOVER_UPDATE_COUNT =
  topCreators.length + ticketShows.length + trendingVideos.length + activeChallenges.length;

const tabs: { id: DiscoverTab; label: string }[] = [
  { id: 'all', label: 'All Spotlights' },
  { id: 'creators', label: 'Top Creators' },
  { id: 'tickets', label: 'Event' },
  { id: 'videos', label: 'Trending Reels' },
  { id: 'challenges', label: 'Creators Challenges' },
];

const LiveCreatorAvatar = ({
  avatar,
  isLive,
  styles,
}: {
  avatar: string;
  isLive: boolean;
  styles: ReturnType<typeof createStyles>;
}) => {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLive) {
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [isLive, pulse]);

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.75],
  });

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.08],
  });

  return (
    <View style={styles.creatorAvatarShell}>
      {isLive ? (
        <>
          <Animated.View
            style={[
              styles.liveAvatarHalo,
              {
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              },
            ]}
          />
          <View style={styles.liveAvatarGlow} />
        </>
      ) : null}
      <View style={[styles.creatorAvatarWrap, isLive ? styles.creatorAvatarWrapLive : null]}>
        <Image source={{ uri: avatar }} style={styles.creatorAvatar} />
      </View>
    </View>
  );
};

type DiscoverProps = {
  embedded?: boolean;
  onHorizontalSwipeAreaTouchChange?: (isTouching: boolean) => void;
};

const DiscoverSkeleton = ({ isDark, styles }: { isDark: boolean; styles: ReturnType<typeof createStyles> }) => {
  const base = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.07)';
  const strong = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.11)';

  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Loading discovery" style={styles.skeletonRoot}>
      <View style={styles.skeletonSection}>
        <View style={[styles.skeletonHeading, { backgroundColor: strong }]} />
        <View style={styles.skeletonHorizontalRow}>
          {[0, 1, 2].map((item) => (
            <View key={`creator-${item}`} style={[styles.skeletonCreatorCard, { backgroundColor: base }]}>
              <View style={[styles.skeletonAvatar, { backgroundColor: strong }]} />
              <View style={[styles.skeletonLineLong, { backgroundColor: strong }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: base }]} />
              <View style={[styles.skeletonButton, { backgroundColor: strong }]} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.skeletonSection}>
        <View style={[styles.skeletonHeading, { backgroundColor: strong }]} />
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((item) => (
            <View key={`event-${item}`} style={[styles.skeletonEventCard, { backgroundColor: base }]}>
              <View style={[styles.skeletonEventImage, { backgroundColor: strong }]} />
              <View style={[styles.skeletonLineLong, { backgroundColor: strong }]} />
              <View style={[styles.skeletonLineShort, { backgroundColor: base }]} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.skeletonSection}>
        <View style={[styles.skeletonHeading, { backgroundColor: strong }]} />
        <View style={styles.skeletonHorizontalRow}>
          {[0, 1].map((item) => <View key={`video-${item}`} style={[styles.skeletonVideoCard, { backgroundColor: strong }]} />)}
        </View>
      </View>
    </View>
  );
};

const Discover: React.FC<DiscoverProps> = ({
  embedded = false,
  onHorizontalSwipeAreaTouchChange,
}) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [activeTab, setActiveTab] = useState<DiscoverTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [pendingFollowCreatorIds, setPendingFollowCreatorIds] = useState<Set<string>>(new Set());
  const [ticketCart, setTicketCart] = useState<string[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const query = searchQuery.trim().toLowerCase();
  const discoveryQuery = useDiscovery({ tab: 'all', page: 1, limit: 100, ...(debouncedSearch ? { search_query: debouncedSearch } : {}) });
  const followCreatorMutation = useFollowCreatorMutation();
  const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const filteredCreators: CreatorItem[] = useMemo(() => (discoveryQuery.data?.data.creators ?? []).map((creator) => ({
    id: String(creator.id), name: creator.name, handle: `@${creator.handle}`, isLive: creator.is_live,
    avatar: creator.avatar_url || `https://picsum.photos/seed/creator-${creator.id}/200/200`,
    style: creator.style || 'Creator', tool: creator.tools.join(' • '), followers: compactCount(creator.followers_count),
    isPremium: creator.is_premium, isVerified: creator.is_verified,
  })), [discoveryQuery.data]);
  const filteredTickets: TicketItem[] = useMemo(() => (discoveryQuery.data?.data.events ?? []).map((event) => ({
    id: String(event.id), eventTitle: event.title, creator: event.creator.name,
    date: event.starts_at ? new Date(event.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase() : 'DATE TBA',
    venue: event.venue || event.location_type || 'Venue TBA', price: event.minimum_ticket_price ?? 0,
    currency: event.currency || 'GHS', img: event.cover_url || `https://picsum.photos/seed/event-${event.id}/600/400`,
    colors: ['rgba(245,158,11,0.3)', 'rgba(244,63,94,0.04)'] as const,
    duration: formatEventDuration(event.duration_minutes),
  })), [discoveryQuery.data]);
  const filteredVideos: VideoItem[] = useMemo(() => (discoveryQuery.data?.data.videos ?? []).map((video) => ({
    id: String(video.id), title: video.title || video.caption || 'Untitled video', creator: video.creator.name,
    views: compactCount(video.stats.views_count), likes: video.stats.likes_count,
    img: video.thumbnail_url || `https://picsum.photos/seed/video-${video.id}/400/600`,
    duration: formatDuration(video.duration_seconds), category: video.category || 'Video', isLiked: video.viewer.is_liked,
  })), [discoveryQuery.data]);
  const filteredChallenges = useMemo(() => activeChallenges.filter((challenge) => [challenge.tag, challenge.creator, challenge.type].some((value) => value.toLowerCase().includes(query))), [query]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    setFollowedCreators((discoveryQuery.data?.data.creators ?? []).filter((creator) => creator.is_following).map((creator) => String(creator.id)));
    setLikedVideos((discoveryQuery.data?.data.videos ?? []).filter((video) => video.viewer.is_liked).map((video) => String(video.id)));
  }, [discoveryQuery.data]);
  const horizontalSwipeAreaHandlers = {
    onTouchStart: () => onHorizontalSwipeAreaTouchChange?.(true),
    onTouchEnd: () => onHorizontalSwipeAreaTouchChange?.(false),
    onTouchCancel: () => onHorizontalSwipeAreaTouchChange?.(false),
    onScrollBeginDrag: () => onHorizontalSwipeAreaTouchChange?.(true),
    onScrollEndDrag: () => onHorizontalSwipeAreaTouchChange?.(false),
    onMomentumScrollEnd: () => onHorizontalSwipeAreaTouchChange?.(false),
  };

  const stop = (event: GestureResponderEvent) => event.stopPropagation();

  const handleFollowToggle = (creatorId: string, event: GestureResponderEvent) => {
    stop(event);
    if (pendingFollowCreatorIds.has(creatorId)) return;

    const wasFollowing = followedCreators.includes(creatorId);
    const following = !wasFollowing;
    setFollowedCreators((current) => following
      ? [...current.filter((id) => id !== creatorId), creatorId]
      : current.filter((id) => id !== creatorId));
    setPendingFollowCreatorIds((current) => new Set(current).add(creatorId));

    followCreatorMutation.mutate(
      { creator: creatorId, following },
      {
        onError: () => {
          setFollowedCreators((current) => wasFollowing
            ? [...current.filter((id) => id !== creatorId), creatorId]
            : current.filter((id) => id !== creatorId));
        },
        onSettled: () => {
          setPendingFollowCreatorIds((current) => {
            const next = new Set(current);
            next.delete(creatorId);
            return next;
          });
        },
      },
    );
  };

  const handleLikeVideo = (videoId: string, event: GestureResponderEvent) => {
    stop(event);
    setLikedVideos((prev) => (prev.includes(videoId) ? prev.filter((id) => id !== videoId) : [...prev, videoId]));
  };

  const handleViewChallenge = (challengeId: string, event: GestureResponderEvent) => {
    stop(event);
    navigation.navigate('ChallengeFeed', { challengeId });
  };

  const handleConfirmTicketPurchase = () => {
    if (!selectedTicket) return;
    setTicketCart((prev) => (prev.includes(selectedTicket.id) ? prev : [...prev, selectedTicket.id]));
    setSelectedTicket(null);
    setIsSuccessModalOpen(true);
  };

  const renderEmpty = (message: string) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          embedded
            ? { backgroundColor: 'transparent', borderBottomWidth: 0, paddingTop: 0 }
            : { backgroundColor: isDark ? 'rgb(0, 0, 0)' : 'rgb(255, 255, 255)', borderBottomColor: isDark ? '#27272a' : '#e2e8f0' },
        ]}
      >
          {!embedded ? (
            <View style={{
              // backgroundColor: 'blue',
              flexDirection: 'row',
              justifyContent: 'center',
              marginBottom: 20,
              paddingHorizontal: 20,
            }}>
                      {/* <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: theme.border }]}>
                        <MaterialIcons name="chevron-left" size={22} color={theme.text} />
                      </Pressable> */}
              
                      <View style={styles.headerTitleWrap}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Discover</Text>
                        <Text style={styles.headerSubtitle}>Galaxy Universe</Text>
                      </View>
              
                      {/* <View style={styles.headerSpacer} /> */}
                      {/* <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
                        <MaterialIcons name="notifications-none" size={22} color={theme.text} />
                      </Pressable> */}
                    </View>
          ) : null}
          <View/>

          <View style={[styles.searchWrap, { backgroundColor: isDark ? '#18181b' : '#fff', borderColor: isDark ? '#27272a' : '#e2e8f0', marginHorizontal: 20 }]}> 
            <MaterialIcons name="search" size={20} color={isDark ? '#71717a' : '#94a3b8'} />
            <TextInput includeFontPadding={false}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search directors, masterclasses, cinematic transitions..."
              placeholderTextColor={isDark ? '#71717a' : '#94a3b8'}
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <MaterialIcons name="close" size={18} color={isDark ? '#a1a1aa' : '#64748b'} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabList} {...horizontalSwipeAreaHandlers}>
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, isSelected ? styles.tabSelected : styles.tabIdle]}>
                  <Text style={[styles.tabText, { color: isSelected ? '#fff' : isDark ? '#a1a1aa' : '#475569' }]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}> 
        {/* <View style={styles.ambientOne} pointerEvents="none" />
        <View style={styles.ambientTwo} pointerEvents="none" /> */}

        

        <View style={styles.main}>
          {discoveryQuery.isLoading ? <DiscoverSkeleton isDark={isDark} styles={styles} /> : null}
          {discoveryQuery.isError ? renderEmpty('Discovery could not be loaded. Try again later.') : null}
          {!discoveryQuery.isLoading && (activeTab === 'all' || activeTab === 'creators') && (
            <View style={styles.section}>
              <SectionHeader icon="movie-creation" title="Top creators" color={PRIMARY_COLOR} />
              {discoveryQuery.isLoading ? null : filteredCreators.length === 0 ? renderEmpty('No creators matching your query.') : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.creatorList} {...horizontalSwipeAreaHandlers}>
                  {filteredCreators.map((creator) => {
                    const isFollowed = followedCreators.includes(creator.id);
                    return (
                      <Pressable key={creator.id} onPress={() => navigation.navigate('ArtistProfile', { isOwner: false, id: creator.name })} style={styles.creatorCard}>
                        {/* {creator.isLive ? (
                          <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE</Text>
                          </View>
                        ) : null} */}
                        {/* {creator.isPremium ? <Text style={styles.proBadge}>PRO</Text> : null} */}
                        <LiveCreatorAvatar avatar={creator.avatar} isLive={creator.isLive} styles={styles} />
                        <View style={styles.creatorCopy}>
                          <View style={styles.creatorNameRow}>
                            <Text numberOfLines={1} style={styles.creatorName}>{creator.name}</Text>
                            {creator.isVerified ? <MaterialIcons name="verified" size={12} color={PRIMARY_COLOR} /> : null}
                          </View>
                          <Text style={[styles.creatorHandle, {marginTop: 4, marginBottom: 4}]}>{creator.handle}</Text>
                          <Text numberOfLines={1} style={styles.creatorStyle}>{creator.style}</Text>
                        </View>
                        <Pressable disabled={pendingFollowCreatorIds.has(creator.id) || creator.isLive} onPress={(event) => handleFollowToggle(creator.id, event)} style={[styles.followButton, isFollowed ? styles.followingButton : styles.subscribeButton,{borderColor: creator.isLive ? 'red': PRIMARY_COLOR, backgroundColor: creator.isLive ? 'rgba(255, 0, 0, 1)': isFollowed ? primaryColorAlpha(0.1): PRIMARY_COLOR, opacity: pendingFollowCreatorIds.has(creator.id) ? 0.65 : 1} ]}>
                          {pendingFollowCreatorIds.has(creator.id) ? <ActivityIndicator size="small" color={isFollowed ? PRIMARY_COLOR : '#fff'} /> : <MaterialIcons name={creator.isLive ? 'videocam' : isFollowed ? 'done' : 'person-add-alt-1'} size={12} color={creator.isLive ? 'white': isFollowed ? PRIMARY_COLOR : '#fff'} />}
                          <Text style={[styles.followText, { color: creator.isLive ? 'white': isFollowed ? PRIMARY_COLOR : '#fff' }]}>{creator.isLive ? "Join Live" : isFollowed ? 'Following' : 'Follow'}</Text>
                        </Pressable>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}

          {!discoveryQuery.isLoading && (activeTab === 'all' || activeTab === 'tickets') && (
            <View style={styles.section}>
              <SectionHeader icon="confirmation-number" title="Event" color={PRIMARY_COLOR} action="view calendar" onAction={() => navigation.navigate('Events')} />
              {discoveryQuery.isLoading ? null : filteredTickets.length === 0 ? renderEmpty('No video workshops matching your search.') : (
                <View style={styles.twoColumnGrid}>
                  {filteredTickets.map((ticket) => {
                    const inCart = ticketCart.includes(ticket.id);
                    return (
                      <Pressable
                        key={ticket.id}
                        onPress={() => navigation.navigate('EventDetail', { id: ticket.id, isOwner: false })}
                        style={styles.ticketCard}
                      >
                        <LinearGradient colors={ticket.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                        <Image source={{ uri: ticket.img }} style={styles.ticketImage} />
                        <View style={styles.ticketBody}>
                          <View style={styles.ticketCreatorRow}>
                            <MaterialIcons name="videocam" size={11} color={PRIMARY_COLOR} />
                            <Text numberOfLines={1} style={styles.ticketCreator}>by {ticket.creator}</Text>
                          </View>
                          <Text numberOfLines={2} style={styles.ticketTitle}>{ticket.eventTitle}</Text>
                          <View style={{
                            flexDirection: 'row',
                            gap: 2
                          }}>
                            <CalenderIcon fill={PRIMARY_COLOR} height={10} width={10}/>
                            <Text numberOfLines={1} style={styles.ticketMeta}>{ticket.date}</Text>
                          </View>
                          <View style={{
                            flexDirection: 'row',
                            gap : 2
                          }}>
                            <LocationIcon fill={"#00000076"} height={10} width={10}/>
                            <Text numberOfLines={1} style={styles.ticketVenue}>{ticket.venue}</Text>
                          </View>
                          <Text style={[styles.ticketVenue, {color: PRIMARY_COLOR}]}>{ticket.duration}</Text>
                          <View style={styles.dashedLine} />
                          <View style={styles.ticketFooter}>
                            <View>
                              <Text style={styles.priceLabel}>Price</Text>
                              <Text style={styles.priceText}>{ticket.currency} {ticket.price}</Text>
                            </View>
                            {/* <Pressable onPress={(event) => { stop(event); setSelectedTicket(ticket); }} style={[styles.bookButton, inCart ? styles.bookedButton : null]}>
                              <Text style={[styles.bookButtonText, { color: inCart ? '#059669' : '#fff' }]}>{inCart ? 'Booked' : 'Book'}</Text>
                            </Pressable> */}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {!discoveryQuery.isLoading && (activeTab === 'all' || activeTab === 'challenges') && (
            <View style={styles.section}>
              <SectionHeader icon="emoji-events" title="Creator Challenges" color={PRIMARY_COLOR} action="view more" onAction={() => navigation.navigate('Challenges')} />
              {filteredChallenges.length === 0 ? renderEmpty('No creator challenges matching your query.') : (
                <View style={styles.twoColumnGrid}>
                  {filteredChallenges.map((challenge) => {
                    const matchedCreator = topCreators.find((creator) => creator.name === challenge.creator);
                    return (
                      <Pressable key={challenge.id} onPress={() => navigation.navigate('ChallengeFeed', { challengeId: challenge.id })} style={styles.challengeCard}>
                        <View style={styles.challengeImageWrap}>
                          <Image source={{ uri: challenge.img }} style={styles.challengeImage} />
                          {/* <Text numberOfLines={1} style={styles.challengeType}>{challenge.type}</Text> */}
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.42)']} style={styles.challengeImageFade} />
                        </View>
                        <View style={styles.challengeBody}>
                          <View style={styles.challengeCreatorRow}>
                            <Image source={{ uri: matchedCreator?.avatar || challenge.img }} style={styles.challengeAvatar} />
                            <Text numberOfLines={1} style={styles.challengeCreator}>@{challenge.creator}</Text>
                          </View>
                          <Text numberOfLines={2} style={styles.challengeTitle}>#{challenge.tag}</Text>
                          <Text style={styles.challengePrize}>{challenge.prizePool}</Text>
                          <View style={styles.metricPill}>
                            <MaterialIcons name="groups" size={11} color={PRIMARY_COLOR} />
                            <Text style={styles.metricText}>{(challenge.participants / 1000).toFixed(1)}K entries</Text>
                          </View>
                          <View style={styles.dashedLine} />
                          <View style={styles.challengeFooter}>
                            <Text numberOfLines={1} style={styles.joinedText}>+{(challenge.participants - 110).toLocaleString()} joined</Text>
                            {/* <Pressable onPress={(event) => handleViewChallenge(challenge.id, event)} style={styles.joinButton}>
                              <MaterialIcons name="visibility" size={11} color="#fff" />
                              <Text style={[styles.joinText, { color: '#fff' }]}>View</Text>
                            </Pressable> */}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {!discoveryQuery.isLoading && (activeTab === 'all' || activeTab === 'videos') && (
            <View style={styles.section}>
              <SectionHeader icon="play-circle-outline" title="Trending Now" color={PRIMARY_COLOR} action="see full trend" onAction={() => navigation.navigate('TrendingVideos')} />
              {discoveryQuery.isLoading ? null : filteredVideos.length === 0 ? renderEmpty('No reels or clips matching your query.') : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoList} {...horizontalSwipeAreaHandlers}>
                  {filteredVideos.map((video) => {
                    const isLiked = likedVideos.includes(video.id);
                    return (
                      <Pressable key={video.id} onPress={() => navigation.navigate('MainTabs', {screen: "Galaxy"})} style={styles.videoCard}>
                        <Image source={{ uri: video.img }} style={styles.videoImage} />
                        <LinearGradient colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0.82)']} style={StyleSheet.absoluteFill} />
                        {/* <Text style={styles.videoCategory}>{video.category}</Text> */}
                        <Text style={styles.videoDuration}>{video.duration}</Text>
                        {/* <Pressable onPress={(event) => handleLikeVideo(video.id, event)} style={styles.likeButton}>
                          <MaterialIcons name="favorite" size={15} color={isLiked ? '#f43f5e' : '#64748b'} />
                        </Pressable> */}
                        {/* <View style={styles.playOverlay}>
                          <View style={styles.playButton}>
                            <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
                          </View>
                        </View> */}
                        <View style={styles.videoInfo}>
                          <Text numberOfLines={1} style={styles.videoCreator}>{video.creator}</Text>
                          {/* <Text numberOfLines={2} style={styles.videoTitle}>{video.title}</Text> */}
                          <View style={styles.viewsRow}>
                            <MaterialIcons name="visibility" size={10} color="rgba(255,255,255,0.78)" />
                            <Text style={styles.viewsText}>{video.views} Views</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <TicketModal ticket={selectedTicket} styles={styles} onClose={() => setSelectedTicket(null)} onConfirm={handleConfirmTicketPurchase} onConfigure={(ticket) => { setSelectedTicket(null); navigation.navigate('SelectTickets', { eventId: ticket.id }); }} />
      <SuccessModal visible={isSuccessModalOpen} styles={styles} onClose={() => setIsSuccessModalOpen(false)} />
    </SafeAreaView>
  );
};

const SectionHeader = ({ icon, title, color, action, onAction }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; color: string; action?: string; onAction?: () => void }) => (
  <View style={sectionHeaderStyles.row}>
    <View style={sectionHeaderStyles.titleRow}>
      <MaterialIcons name={icon} size={16} color={color} />
      <Text style={sectionHeaderStyles.title}>{title}</Text>
    </View>
    {action ? (
      <Pressable onPress={onAction} style={sectionHeaderStyles.actionButton}>
        <Text style={sectionHeaderStyles.actionText}>{action}</Text>
      </Pressable>
    ) : null}
  </View>
);

const TicketModal = ({ ticket, styles, onClose, onConfirm, onConfigure }: { ticket: TicketItem | null; styles: ReturnType<typeof createStyles>; onClose: () => void; onConfirm: () => void; onConfigure: (ticket: TicketItem) => void }) => (
  <Modal visible={Boolean(ticket)} transparent animationType="slide" onRequestClose={onClose}>
    {ticket ? (
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.ticketModalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <View style={styles.modalTitleCopy}>
              <Text style={styles.modalEyebrow}>CREATOR MASTERCLASS PASS</Text>
              <Text style={styles.modalTitle}>{ticket.eventTitle}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.modalCloseButton}>
              <MaterialIcons name="close" size={20} color="#71717a" />
            </Pressable>
          </View>
          <View style={styles.modalTicketCard}>
            <Image source={{ uri: ticket.img }} style={styles.modalTicketImage} />
            <View style={styles.modalTicketCopy}>
              <Text style={styles.modalTicketInstructor}>Instructed by {ticket.creator}</Text>
              <Text numberOfLines={1} style={styles.modalTicketTitle}>{ticket.eventTitle}</Text>
              <Text numberOfLines={2} style={styles.modalTicketMeta}>{ticket.date} • {ticket.venue}</Text>
            </View>
          </View>
          <View style={styles.breakdown}>
            <PriceRow label="1x VIP Hub Access Pass" value={`GH₵ ${ticket.price}`} styles={styles} />
            <PriceRow label="Interactive Project Stems" value="Included" styles={styles} success />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Deduction</Text>
              <Text style={styles.totalValue}>GH₵{" "}{ticket.price}</Text>
            </View>
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={() => onConfigure(ticket)} style={styles.configureButton}>
              <Text style={styles.configureText}>Configure Seat</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Book Securely</Text>
            </Pressable>
          </View>
        </View>
      </View>
    ) : null}
  </Modal>
);

const PriceRow = ({ label, value, styles, success }: { label: string; value: string; styles: ReturnType<typeof createStyles>; success?: boolean }) => (
  <View style={styles.priceRow}>
    <Text style={styles.priceRowLabel}>{label}</Text>
    <Text style={[styles.priceRowValue, success ? styles.successText : null]}>{value}</Text>
  </View>
);

const SuccessModal = ({ visible, styles, onClose }: { visible: boolean; styles: ReturnType<typeof createStyles>; onClose: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.successOverlay}>
      <View style={styles.successCard}>
        <View style={styles.successIconWrap}>
          <MaterialIcons name="check-circle" size={40} color="#10b981" />
        </View>
        <Text style={styles.successTitle}>Pass Secured!</Text>
        <Text style={styles.successBody}>Your VIP Creator Access ticket is successfully saved to your creator catalog, ready for the livestream.</Text>
        <Pressable onPress={onClose} style={styles.successButton}>
          <Text style={styles.successButtonText}>Access My Tickets</Text>
        </Pressable>
      </View>
    </View>
  </Modal>
);

const sectionHeaderStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: '#71717a', ...fontSize.mediumTitleText, lineHeight: fontSize.mediumTitleText.lineHeight, letterSpacing: 1.5, textTransform: 'uppercase' },
  actionButton: { minHeight: 32, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 12, },
  actionText: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.5, textTransform: 'uppercase' },
});

const createStyles = (isDark: boolean) => {
  const background = isDark ? '#09090b' : '#f8fafc';
  const card = isDark ? '#18181b' : '#ffffff';
  const cardMuted = isDark ? '#09090b' : '#f8fafc';
  const border = isDark ? '#27272a' : '#e2e8f0';
  const text = isDark ? '#ffffff' : '#0f172a';
  const textSoft = isDark ? '#d4d4d8' : '#334155';
  const muted = isDark ? '#a1a1aa' : '#64748b';

  return StyleSheet.create({
    safeArea: { flex: 1 },
    content: { backgroundColor: background },
    ambientOne: { position: 'absolute', top: 0, alignSelf: 'center', width: 240, height: 240, borderRadius: 120, backgroundColor: primaryColorAlpha(isDark ? 0.08 : 0.12), opacity: 0.85 },
    ambientTwo: { position: 'absolute', top: 480, right: -100, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(147,51,234,0.06)' },
    header: {  paddingBottom: 14, borderBottomWidth: 1,},
    headerRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',},
    iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: card, borderWidth: 1, borderColor: border },
    headerTitle: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight, letterSpacing: 2.2, textTransform: 'uppercase' },
    notificationDot: { position: 'absolute', top: 11, right: 11, width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY_COLOR, borderWidth: 2, borderColor: background },
    searchWrap: { height: 48, borderRadius: 999, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, gap: 5, overflow: 'hidden' },
    searchInput: {...fontSize.b3, lineHeight: fontSize.b3.lineHeight, flex: 1,  },
    tabList: { gap: 8, paddingTop: 12, paddingHorizontal: 20 },
    tab: { minHeight: 34, paddingHorizontal: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    tabSelected: { backgroundColor: PRIMARY_COLOR, borderColor: 'transparent' },
    tabIdle: { backgroundColor: card, borderColor: border },
    tabText: { ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, letterSpacing: 1.2, textTransform: 'uppercase' },
    main: { paddingTop: 24, gap: 32 },
    section: { gap: 14 },
    skeletonRoot: { gap: 30, paddingBottom: 30 },
    skeletonSection: { gap: 14 },
    skeletonHeading: { width: 132, height: 16, borderRadius: 8, marginHorizontal: 20 },
    skeletonHorizontalRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, overflow: 'hidden' },
    skeletonCreatorCard: { width: 172, minHeight: 200, borderRadius: 20, padding: 14, alignItems: 'center', gap: 11 },
    skeletonAvatar: { width: 70, height: 70, borderRadius: 35 },
    skeletonLineLong: { width: '76%', height: 11, borderRadius: 6 },
    skeletonLineShort: { width: '52%', height: 9, borderRadius: 5 },
    skeletonButton: { width: '80%', height: 28, borderRadius: 14, marginTop: 4 },
    skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
    skeletonEventCard: { width: '48.4%', minHeight: 224, borderRadius: 18, overflow: 'hidden', paddingBottom: 14, alignItems: 'center', gap: 12 },
    skeletonEventImage: { width: '100%', height: 112 },
    skeletonVideoCard: { width: 220, aspectRatio: 4 / 5, borderRadius: 20 },
    emptyState: { padding: 28, borderRadius: 18, backgroundColor: card, borderWidth: 1, borderColor: border, alignItems: 'center' },
    emptyText: { color: muted, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textAlign: 'center' },
    creatorList: { gap: 8, paddingVertical: 4, paddingRight: 20, paddingHorizontal: 20 },
    creatorCard: { width: 172, minHeight: 200, borderRadius: 20, backgroundColor: card, borderWidth: 1, borderColor: border, padding: 14, alignItems: 'center', overflow: 'hidden',  },
    liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#ef4444', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
    liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff' },
    liveText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1 },
    proBadge: { position: 'absolute', top: 10, right: 10, color: '#f59e0b', backgroundColor: isDark ? 'rgba(120,53,15,0.32)' : '#fffbeb', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.8 },
    creatorAvatarShell: { marginTop: 0, marginBottom: 12, width: 76, height: 74, alignItems: 'center', justifyContent: 'center' },
    liveAvatarHalo: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: 'rgba(239,68,68,0.28)' },
    liveAvatarGlow: {
      position: 'absolute',
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: 'rgba(239,68,68,0.1)',
      shadowColor: '#ef4444',
      shadowOpacity: isDark ? 0.52 : 0.32,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 5,
    },
    creatorAvatarWrap: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: primaryColorAlpha(0.28), padding: 3, backgroundColor: card },
    creatorAvatarWrapLive: {
      borderColor: '#ef4444',
      shadowColor: '#ef4444',
      shadowOpacity: isDark ? 0.6 : 0.38,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
    creatorAvatar: { width: '100%', height: '100%', borderRadius: 32 },
    creatorLiveIcon: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: PRIMARY_COLOR, textAlign: 'center', textAlignVertical: 'center', borderWidth: 2, borderColor: card },
    creatorCopy: { alignItems: 'center', flex: 1, width: '100%' },
    creatorNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, maxWidth: '100%' },
    creatorName: { color: text, ...fontSize.nameText, lineHeight: fontSize.nameText.lineHeight, letterSpacing: 1, textTransform: 'uppercase', maxWidth: 120 },
    creatorHandle: { color: muted, ...fontSize.handleTextSmall, lineHeight: fontSize.handleTextSmall.lineHeight,letterSpacing: 0.5},
    creatorStyle: { color: textSoft, ...fontSize.creatorStyleText,textAlign: 'center', lineHeight: fontSize.creatorStyleText.lineHeight},
    followButton: { width: '100%', height: 34, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1 },
    subscribeButton: { backgroundColor: PRIMARY_COLOR, borderColor: 'transparent' },
    followingButton: { backgroundColor: primaryColorAlpha(0.1), borderColor: primaryColorAlpha(0.2) },
    followText: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
    twoColumnGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
    ticketCard: { width: '48.5%', borderRadius: 20, overflow: 'hidden', backgroundColor: card, borderWidth: 1, borderColor: border },
    ticketImage: { width: '100%', aspectRatio: 3 / 4, backgroundColor: cardMuted },
    ticketBody: { padding: 12, gap: 6 },
    ticketCreatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ticketCreator: { flex: 1, color: PRIMARY_COLOR, ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, letterSpacing: 0.8, textTransform: 'uppercase' },
    ticketTitle: { color: text, ...fontSize.tabText,lineHeight: fontSize.tabText.lineHeight, textTransform: 'uppercase' },
    ticketMeta: { color: textSoft, fontSize:fontSize.b5.fontSize, fontFamily: "Inter_500Medium", lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    ticketVenue: { color: muted, fontSize: fontSize.b5.fontSize, fontFamily: "Inter_500Medium", lineHeight: fontSize.b5.lineHeight },
    dashedLine: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: border, marginVertical: 6 },
    ticketFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    priceLabel: { color: muted, ...fontSize.b5, fontFamily: "Inter_500Medium", lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.8, textTransform: 'uppercase' },
    priceText: { color: PRIMARY_COLOR, ...fontSize.b5, fontFamily: "Inter_500Medium", lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    bookButton: { minWidth: 54, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR },
    bookedButton: { backgroundColor: isDark ? 'rgba(6,78,59,0.24)' : '#ecfdf5', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0' },
    bookButtonText: { ...fontSize.b5, fontFamily: "Inter_500Medium", lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.8, textTransform: 'uppercase' },
    challengeCard: { width: '48.5%', borderRadius: 20, padding: 0, backgroundColor: card, borderWidth: 1, borderColor: border },
    challengeImageWrap: { width: '100%', aspectRatio: 3 / 4, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', backgroundColor: cardMuted },
    challengeImage: { width: '100%', height: '100%' },
    challengeImageFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 48 },
    challengeType: { position: 'absolute', top: 8, left: 8, right: 8, color: text, backgroundColor: isDark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    challengeBody: { padding: 10, gap: 6 },
    challengeCreatorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    challengeAvatar: { width: 16, height: 16, borderRadius: 8 },
    challengeCreator: { flex: 1, color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    challengeTitle: { color: text, ...fontSize.b4,lineHeight: 18, textTransform: 'uppercase' },
    challengePrize: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
    metricPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: cardMuted, borderWidth: 1, borderColor: border },
    metricText: { color: textSoft, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    challengeFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    joinedText: { flex: 1, color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    joinButton: { height: 30, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: PRIMARY_COLOR },
    joinedButton: { backgroundColor: isDark ? 'rgba(6,78,59,0.24)' : '#ecfdf5', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0' },
    joinText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.6, textTransform: 'uppercase' },
    videoList: { gap: 10, paddingBottom: 6, paddingHorizontal: 20 },
    videoCard: { width: 220, aspectRatio: 4 / 5, borderRadius: 10, overflow: 'hidden', backgroundColor: '#0f172a', borderWidth: 1, borderColor: border },
    videoImage: { width: '100%', height: '100%', position: 'absolute' },
    videoCategory: { position: 'absolute', top: 10, left: 10, color: '#fb7185', backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
    videoDuration: { position: 'absolute', top: 10, right: 10, color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    likeButton: { position: 'absolute', right: 12, bottom: 58, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#18181b' : 'rgba(255,255,255,0.92)', borderWidth: 1, borderColor: border },
    playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    playButton: { width: 66, height: 66, borderRadius: 33, backgroundColor: primaryColorAlpha(0.24), borderWidth: 1, borderColor: primaryColorAlpha(0.5), alignItems: 'center', justifyContent: 'center' },
    videoInfo: { position: 'absolute', left: 12, right: 42, bottom: 12 },
    videoCreator: { color: '#fb7185', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1.2, textTransform: 'uppercase' },
    videoTitle: { color: '#fff', ...fontSize.b5,lineHeight: 15, marginTop: 4 },
    viewsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
    viewsText: { color: 'rgba(255,255,255,0.78)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
    ticketModalSheet: { borderTopLeftRadius: 36, borderTopRightRadius: 36, backgroundColor: card, borderTopWidth: 1, borderColor: border, padding: 22, paddingBottom: 34, gap: 18 },
    modalHandle: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, backgroundColor: isDark ? '#3f3f46' : '#e2e8f0' },
    modalTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
    modalTitleCopy: { flex: 1 },
    modalEyebrow: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1.7 },
    modalTitle: { color: text, ...fontSize.b1,lineHeight: 28, textTransform: 'uppercase', marginTop: 4 },
    modalCloseButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: cardMuted, borderWidth: 1, borderColor: border },
    modalTicketCard: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 22, backgroundColor: cardMuted, borderWidth: 1, borderColor: border },
    modalTicketImage: { width: 64, height: 64, borderRadius: 14 },
    modalTicketCopy: { flex: 1, justifyContent: 'center' },
    modalTicketInstructor: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 0.7, textTransform: 'uppercase' },
    modalTicketTitle: { color: textSoft, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase', marginTop: 4 },
    modalTicketMeta: { color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, marginTop: 4 },
    breakdown: { gap: 12 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: border, paddingBottom: 10, gap: 10 },
    priceRowLabel: { flex: 1, color: muted, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    priceRowValue: { color: text, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
    successText: { color: '#10b981' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { color: textSoft, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
    totalValue: { color: PRIMARY_COLOR, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
    modalActions: { flexDirection: 'row', gap: 12 },
    configureButton: { flex: 1, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: cardMuted, borderWidth: 1, borderColor: border },
    configureText: { color: textSoft, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
    confirmButton: { flex: 1, height: 48, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR },
    confirmText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
    successOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,0.45)' },
    successCard: { width: '100%', maxWidth: 320, borderRadius: 30, padding: 24, alignItems: 'center', gap: 14, backgroundColor: card, borderWidth: 1, borderColor: border },
    successIconWrap: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(6,78,59,0.22)' : '#ecfdf5', borderWidth: 1, borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0' },
    successTitle: { color: text, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase' },
    successBody: { color: textSoft, ...fontSize.b4,lineHeight: 20, textAlign: 'center' },
    successButton: { width: '100%', height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981' },
    successButtonText: { color: '#fff', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
    // headerTitle: {
    //     color: '#fff',
    //     ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    //     //     letterSpacing: 2,
    //     textTransform: 'uppercase',
    //   },
      headerSubtitle: {
        color: PRIMARY_COLOR,
        marginTop: 4,
        ...fontSize.h2, lineHeight: fontSize.h2.lineHeight,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
      },
      headerSpacer: {
        width: 40,
      },
      headerTitleWrap: {
        alignItems: 'center',
      },
      headerRoundBtn: {
        height: 40,
        width: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
      },
  });
};

export default Discover;
