import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
  LayoutChangeEvent,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediumScreen, setUser, User, user } from '../types';
import LocalIcon from '../assets/icons/local-activity-svg.svg';
import MovieIcon from '../assets/icons/play-circle-svg.svg';
import BookMarkIcon from '../assets/icons/bookmark-svg.svg';
import PremiumIcon from '../assets/icons/premium-svg.svg';
import SwitchIcon from '../assets/icons/switch.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CreatorSwitch from '../assets/icons/switch-creator.svg';
import { fontSize } from '../typography';
import TicketIcon from '../assets/icons/Ticket1.svg';
import { parseApiError, useSwitchRole, useWatchedVideos } from '../src';

interface FanProfileProps {
  onLogout?: () => void;
  onToggleRole?: () => void;
}

type ProfileTab = 'Video' | 'Premium' | 'Tickets' | 'Saved' | 'Favorite';

type StreakData = {
  count: number;
};

type Creator = {
  id: string;
  name: string;
  img: string;
  handle: string;
  premiumCount: number;
};

type PremiumAsset = {
  id: string;
  title: string;
  views?: string;
  count?: number;
  img: string;
};

const extractWatchedVideos = (value: unknown): Array<Record<string, any>> => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  if (Array.isArray(record.videos)) return record.videos as Array<Record<string, any>>;
  if (record.videos && typeof record.videos === 'object') {
    const videosRecord = record.videos as Record<string, unknown>;
    if (Array.isArray(videosRecord.data)) return videosRecord.data as Array<Record<string, any>>;
  }
  if (record.data && record.data !== value) return extractWatchedVideos(record.data);

  return [];
};

const STICKY_HEADER_INDICES = [2];

const FanProfile: React.FC<FanProfileProps> = ({ onToggleRole }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>('Video');
  const [streak, setStreak] = useState<StreakData>({ count: 7 });
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const isTablet = width >= 768;
  const insets = useSafeAreaInsets();
  const mainYRef = useRef<number | null>(null);
  const statsLayoutRef = useRef<{ y: number; height: number } | null>(null);
  const statsBottomYRef = useRef<number | null>(null);
  const isStatsOutOfViewRef = useRef(false);
  const [isStatsOutOfView, setIsStatsOutOfView] = useState(false);
  const stickyTopPadding = insets.top + 8;
  const [isRoleSwitchModalOpen, setIsRoleSwitchModalOpen] = useState(false);
  const elevatedSurface = isDark ? 'rgba(31, 16, 34, 0.75)' : theme.card;
  const { mutateAsync: switchRole } = useSwitchRole();
  const {
    data: watchedVideosResponse,
    isLoading: watchedVideosLoading,
    error: watchedVideosError,
    refetch: refetchWatchedVideos,
  } = useWatchedVideos({ per_page: 100 });
  const watchedVideos = useMemo(
    () =>
      extractWatchedVideos(watchedVideosResponse).map((item) => ({
          id: item.id,
          title: item.title,
          views: item.views ? `${item.views} views` : item.title,
          img: item.img ?? undefined,
        })),
    [watchedVideosResponse]
  );
  useFocusEffect(
    useCallback(() => {
      void refetchWatchedVideos();
    }, [refetchWatchedVideos])
  );
  const tabsSectionStyle = useMemo(
    () => [
      s.tabsSection,
      {
        backgroundColor: theme.screen,
        paddingTop: isStatsOutOfView ? stickyTopPadding : 0,
        borderTopWidth: 0,
      },
    ],
    [isStatsOutOfView, stickyTopPadding, theme.screen]
  );

  const updateStatsBottomY = useCallback(() => {
    const statsLayout = statsLayoutRef.current;
    if (mainYRef.current === null) {
      return;
    }
    if (statsLayout === null) {
      return;
    }

    statsBottomYRef.current = mainYRef.current + statsLayout.y + statsLayout.height;
  }, []);

  const handleMainLayout = useCallback((e: LayoutChangeEvent) => {
    mainYRef.current = e.nativeEvent.layout.y;
    updateStatsBottomY();
  }, [updateStatsBottomY]);

  const handleStatsLayout = useCallback((e: LayoutChangeEvent) => {
    statsLayoutRef.current = {
      y: e.nativeEvent.layout.y,
      height: e.nativeEvent.layout.height,
    };
    updateStatsBottomY();
  }, [updateStatsBottomY]);

  const setStatsOutOfView = useCallback((nextIsOutOfView: boolean) => {
    if (nextIsOutOfView !== isStatsOutOfViewRef.current) {
      isStatsOutOfViewRef.current = nextIsOutOfView;
      setIsStatsOutOfView(nextIsOutOfView);
    }
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const statsBottomY = statsBottomYRef.current;
    if (statsBottomY === null) {
      return;
    }

    setStatsOutOfView(e.nativeEvent.contentOffset.y >= statsBottomY);
  }, [setStatsOutOfView]);

  useEffect(() => {
    setStreak({ count: 7 });
  }, []);

  useEffect(() => {
    setSelectedCreator(null);
  }, [activeTab]);

  const tabs: { id: ProfileTab; icon: keyof typeof MaterialIcons.glyphMap }[] = [
    { id: 'Video', icon: 'movie' },
    { id: 'Premium', icon: 'workspace-premium' },
    { id: 'Tickets', icon: 'local-activity' },
    { id: 'Saved', icon: 'bookmark' },
    { id: 'Favorite', icon: 'favorite' },

  ];

  const stats = [
    { label: 'Following', value: '24', onPress: () => navigation.navigate('MainTabs') },
    { label: 'Unlocked', value: '12', onPress: () => navigation.navigate('MainTabs') },
    {
      label: 'Events',
      value: '2',
      onPress: () => navigation.navigate('FanSettings', { view: 'identity', fromProfile: true }),
    },
  ];

  const vibes = ['Afrobeats', 'Synthwave', 'Midnight R&B'];

  const favorites = [
    { name: 'Elena Rose', img: 'https://picsum.photos/seed/elena/150', handle: '@elena_r' },
    { name: 'Zion King', img: 'https://picsum.photos/seed/zion/150', handle: '@zion_k' },
    { name: 'Amara', img: 'https://picsum.photos/seed/amara/150', handle: '@amara_v' },
  ];

  const favoriteVideos = [
    { id: 'fv1', title: 'Midnight Soul Session', artist: 'Elena Rose', views: '1.2M', img: 'https://picsum.photos/seed/vid1/400/225' },
    { id: 'fv2', title: 'Summer Tour BTS', artist: 'Burna Boy', views: '840K', img: 'https://picsum.photos/seed/vid2/400/225' },
  ];
  const subscribedCreators: Creator[] = [
    { id: 'c1', name: 'Elena Rose', img: 'https://picsum.photos/seed/elena/150', handle: '@elena_r', premiumCount: 12 },
    { id: 'c2', name: 'Zion King', img: 'https://picsum.photos/seed/zion/150', handle: '@zion_k', premiumCount: 8 },
    { id: 'c3', name: 'Amara', img: 'https://picsum.photos/seed/amara/150', handle: '@amara_v', premiumCount: 15 },
  ];

  const premiumContent: Record<string, { videos: PremiumAsset[]; playlists: PremiumAsset[] }> = {
    c1: {
      videos: [
        { id: 'pv1', title: 'Acoustic Session: Midnight', views: '12k', img: 'https://picsum.photos/seed/pv1/400/225' },
        { id: 'pv2', title: 'Behind the Scenes: Tour', views: '8k', img: 'https://picsum.photos/seed/pv2/400/225' },
      ],
      playlists: [{ id: 'pl1', title: 'Ethereal Soul Collection', count: 12, img: 'https://picsum.photos/seed/pl1/400/400' }],
    },
    c2: {
      videos: [{ id: 'pv3', title: 'Studio Vlog #42', views: '5k', img: 'https://picsum.photos/seed/pv3/400/225' }],
      playlists: [{ id: 'pl2', title: 'Afro-Cinema BTS', count: 5, img: 'https://picsum.photos/seed/pl2/400/400' }],
    },
    c3: {
      videos: [{ id: 'pv4', title: 'Vocal Masterclass', views: '20k', img: 'https://picsum.photos/seed/pv4/400/225' }],
      playlists: [{ id: 'pl3', title: 'Live Performance Archive', count: 24, img: 'https://picsum.photos/seed/pl3/400/400' }],
    },
  };

  const handleSwitchRole = async () => {
    try {
      await switchRole({ role: 'creator' });
      const nextUser = {
        id: user?.id || 'mila_ray_01',
        name: user?.name || 'Mila Ray',
        role: 'creator' as const,
      } as User;
      setUser(nextUser);
      await AsyncStorage.setItem('pulsar_user', JSON.stringify(nextUser));
      if (onToggleRole) {
        // console.log('onToggleRole exists.........')
        onToggleRole();
        return;
      }
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: 'MainTabs' }],
      // });
      navigation.navigate('MainTabs', {
                screen: 'Galaxy',
                // params: { tabToRoute: 'challenges' },
              })
    } catch (caughtError) {
      const parsed = parseApiError(caughtError);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  const renderVideoGrid = (
    items: Array<{ id: string; title: string; views?: string; img?: string }>
  ) => (
    <View style={s.videoGridWrap}>
      <View style={[s.videoGrid, { paddingHorizontal: isTablet ? 15 : 3 }]}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate('MainTabs')}
            style={[
              s.videoGridCard,
              {
                backgroundColor: isDark ? '#0f172a' : theme.surface,
              },
            ]}
          >
            {item.img ? <Image source={{ uri: item.img }} style={s.videoGridImage} /> : null}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.videoGridOverlay} />
            <View style={s.videoGridMeta}>
              <MaterialIcons name="play-arrow" size={14} color="#fff" />
              <Text style={s.videoGridMetaText}>{item.views ?? item.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderWatchedVideos = () => {
    if (watchedVideosLoading) {
      return (
        <View style={[s.videoStateCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          <Text style={[s.videoStateText, { color: theme.textSecondary }]}>Loading watched videos...</Text>
        </View>
      );
    }

    if (watchedVideosError) {
      return (
        <Pressable
          onPress={() => void refetchWatchedVideos()}
          style={[s.videoStateCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}
        >
          <MaterialIcons name="cloud-off" size={18} color={theme.textSecondary} />
          <Text style={[s.videoStateText, { color: theme.textSecondary }]}>Could not load watched videos. Tap to retry.</Text>
        </Pressable>
      );
    }

    if (watchedVideos.length === 0) {
      return (
        <View style={[s.videoStateCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
          <MaterialIcons name="movie" size={20} color={theme.textSecondary} />
          <Text style={[s.videoStateText, { color: theme.textSecondary }]}>Watched videos will appear here.</Text>
        </View>
      );
    }

    return renderVideoGrid(watchedVideos);
  };

  const renderPremiumVaultContent = (creatorId: string) => {
    const creator = subscribedCreators.find((item) => item.id === creatorId);
    const vault = premiumContent[creatorId];
    if (!vault) return null;

    const recentVideos = vault.videos.slice(0, 1).map((video) => ({
      ...video,
      views: `${video.views ?? '0'} views`,
      timeAgo: '1 month ago',
      duration: '2:36',
    }));
    const musicReleases = vault.videos.map((video, index) => ({
      ...video,
      views: `${video.views ?? '0'} views`,
      timeAgo: index === 0 ? '5 months ago' : '6 months ago',
      duration: index === 0 ? '2:41' : '3:32',
      isMusic: true,
    }));

    return (
      <View style={s.artistPremiumWrap}>
        <Text style={[s.artistPremiumHeading, { color: theme.text }]}>Recent Videos</Text>

        {recentVideos.map((video) => (
          <Pressable
            key={video.id}
            onPress={() => navigation.navigate('VideoPlayer')}
            style={[s.artistRecentCard, { backgroundColor: isDark ? '#000' : '#fff', shadowColor: isDark ? '#fff' : '#000' }]}
          >
            <Image source={{ uri: video.img }} style={s.artistRecentImage} />
            <View style={s.artistRecentOverlay}>
              <View style={s.artistPlayCircle}>
                <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
              </View>
              <View style={s.artistDurationPill}>
                <MaterialIcons name="music-note" color="white" size={16} />
                <Text style={s.artistDurationText}>{video.duration}</Text>
              </View>
            </View>

            <View style={s.artistRecentInfo}>
              <Image source={{ uri: creator?.img || video.img }} style={[s.artistRecentAvatar, { backgroundColor: isDark ? '#fff' : '#000' }]} />
              <View style={s.artistRecentCopy}>
                <Text numberOfLines={2} style={[s.artistRecentTitle, { color: theme.text }]}>{`${creator?.name || 'Creator'} - ${video.title}`}</Text>
                <Text style={s.artistRecentMeta}>{`${video.views} • ${video.timeAgo}`}</Text>
                <View style={s.artistRecentDivider} />
                <Text numberOfLines={2} style={s.artistRecentSeries}>Exclusive Master Series</Text>
              </View>
            </View>
          </Pressable>
        ))}

        <View style={s.artistPlaylistSection}>
          <View style={s.artistSectionHeader}>
            <Text style={[s.artistPremiumHeading, { color: theme.text }]}>Playlists</Text>
            <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.artistPlaylistScroll}>
            {vault.playlists.map((playlist) => (
              <Pressable key={playlist.id} onPress={() => navigation.navigate('PlaylistPlayer', { id: playlist.id })} style={s.artistPlaylistCard}>
                <View style={s.artistPlaylistThumb}>
                  <Image source={{ uri: playlist.img }} style={s.thumbImage} />
                  <View style={s.artistPlaylistShade} />
                  <View style={s.artistPlaylistBadge}>
                    <MaterialIcons name="playlist-play" size={22} color="#d4d4d8" />
                    <Text style={s.artistPlaylistCount}>{playlist.count ?? 0} Videos</Text>
                  </View>
                  <View style={s.artistPlaylistLock}>
                    <MaterialIcons name="lock" size={16} color={PRIMARY_COLOR} />
                  </View>
                </View>
                <Text numberOfLines={2} style={[s.artistPlaylistTitle, { color: theme.text }]}>{playlist.title}</Text>
                <Text style={s.artistPlaylistMeta}>{playlist.views ?? 'Premium drop'} • Updated 2 days ago</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.artistReleaseSection}>
          <View style={s.artistSectionHeader}>
            <Text style={[s.artistPremiumHeading, { color: theme.text }]}>Videos</Text>
            <MaterialIcons name="chevron-right" size={18} color="#71717a" />
          </View>

          <View style={s.artistReleaseList}>
            {musicReleases.map((item) => (
              <Pressable key={item.id} onPress={() => navigation.navigate('VideoPlayer')} style={[s.artistReleaseCard, { backgroundColor: isDark ? '#0f172a' : theme.surface }]}>
                <View style={s.artistReleaseThumb}>
                  <Image source={{ uri: item.img }} style={s.thumbImage} />
                  <View style={s.artistReleaseLockOverlay}>
                    <View style={s.artistReleaseLockButton}>
                      <MaterialIcons name="lock" size={15} color={PRIMARY_COLOR} />
                    </View>
                  </View>
                  <View style={s.artistReleaseDuration}>
                    <MaterialIcons name="music-note" size={10} color="#d4d4d8" />
                    <Text style={s.artistReleaseDurationText}>{item.duration}</Text>
                  </View>
                </View>

                <View style={s.artistReleaseInfo}>
                  <Text numberOfLines={4} style={[s.artistReleaseTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={s.artistReleaseMeta}>{item.views} • {item.timeAgo}</Text>
                </View>

                <Pressable style={s.artistMoreButton}>
                  <MaterialIcons name="more-vert" size={20} color="#71717a" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  };


  return (
    <View style={[s.screen, { backgroundColor: theme.screen }]}>
      <ScrollView
        stickyHeaderIndices={STICKY_HEADER_INDICES}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.coverSection}>
          <ImageBackground
            // resizeMode='contain'
            source={{
              uri: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792704/banner_image_-2_man_t7rt22.jpg',
            }}
            style={s.cover}
          >
            <LinearGradient colors={[isDark ?'rgba(0,0,0,0.08)':'rgba(255,255,255,0.08)', isDark ?'rgba(0,0,0,0.15)': 'rgba(255,255,255,0.15)', isDark?'rgb(6, 9, 19)': 'rgb(255, 255, 255)']} style={StyleSheet.absoluteFillObject} />

            <View style={s.headerRow}>
              <Pressable onPress={() => navigation.navigate('MainTabs')} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                <MaterialIcons name="close" size={20} color={theme.text} />
              </Pressable>

              <View style={s.headerActions}>
                <Pressable onPress={() => navigation.navigate('FanSettings', { view: 'identity', fromProfile: true })} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                  <MaterialIcons name="badge" size={20} color={theme.text} />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('FanSettings')} style={[s.glassButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.82)' }]}>
                  <MaterialIcons name="settings" size={20} color={theme.text} />
                </Pressable>
              </View>
            </View>
          </ImageBackground>

          <View style={s.profileRow}>
            <View style={s.avatarWrap}>
              <Image
              resizeMode='cover'
              source={{ uri: 'https://res.cloudinary.com/dh0dywpzm/image/upload/v1779792704/profile_image_man_tu0uw1.jpg' }} style={[s.avatar, {borderColor: isDark ?'#060913': 'white',}]} />
              {streak.count > 0 && (
                <Pressable onPress={() => navigation.navigate('StreakReward')} style={[s.streakBadge, {borderColor: isDark ?'#060913': 'white',}]}>
                  <MaterialIcons name="local-fire-department" size={12} color="#fff" />
                  <Text style={s.streakCount}>{streak.count}</Text>
                </Pressable>
              )}
            </View>

            <View style={s.nameWrap}>
              <Text style={[s.name, { color: theme.text }]}>Alex Rivera</Text>
              <Text style={[s.member, { color: theme.textSecondary }]}>Member #0042</Text>
            </View>
          </View>
        </View>

        <View onLayout={handleMainLayout} style={[s.main, { backgroundColor: theme.screen }]}>
          <View style={s.vibesRow}>
            {vibes.map((vibe) => (
              <View key={vibe} style={[s.vibeChip, { backgroundColor: isDark ? '#111827' : theme.surface, borderColor: theme.border }]}>
                <Text style={[s.vibeText, { color: theme.text }]}>{vibe}</Text>
              </View>
            ))}
            <Pressable onPress={() => navigation.navigate('VibeSignature')} style={s.vibeEdit}>
              <MaterialIcons name="edit" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>

          <View onLayout={handleStatsLayout} style={s.statsRow}>
            {stats.map((stat) => (
              <Pressable key={stat.label} onPress={stat.onPress} style={[s.statCard, {
              // borderColor: theme.border
              }]}>
                <Text style={[s.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={s.actionSection}>
            <Pressable onPress={()=>(
              setIsRoleSwitchModalOpen(true)
            )} style={s.switchRoleCard}>
              <LinearGradient
                colors={['#4f46e5', PRIMARY_COLOR]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.switchRoleGradient}
              >
                <View style={s.switchRoleLeft}>
                  <View style={s.switchRoleIcon}>
                    <SwitchIcon  height={20} width={20} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.switchRoleTitle}>Switch to Creator</Text>
                    <Text style={s.switchRoleMeta}>Upload, Go Live and Monetize</Text>
                  </View>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
        <View style={tabsSectionStyle}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
            {tabs.map((tab) => (
              <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={s.tabButton}>
                {
            tab.id === 'Video' ? <MovieIcon height={22} width={22} fill={activeTab === tab.id ? PRIMARY_COLOR : '#69738d'}/>:
            tab.id === 'Premium'? <PremiumIcon height={22} width={22} fill={activeTab === tab.id ? PRIMARY_COLOR : '#69738d'}/>:
            tab.id === 'Tickets'? <LocalIcon height={22} width={22} fill={activeTab === tab.id ? PRIMARY_COLOR : '#69738d'}/>:
            tab.id === 'Saved'?   <BookMarkIcon height={22} width={22} fill={activeTab === tab.id ? PRIMARY_COLOR : '#69738d'}/>:
            tab.id === 'Favorite'? <MaterialIcons name="favorite-border" size={22} color={activeTab === tab.id ? PRIMARY_COLOR : '#69738d'}/>:null
          }
                <Text style={[s.tabText, { color: activeTab === tab.id ? PRIMARY_COLOR : theme.textSecondary }, activeTab === tab.id && s.tabTextActive]}>{tab.id}</Text>
                {activeTab === tab.id ? <View style={s.tabIndicator} /> : null}
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.tabContent}>
              {activeTab === 'Favorite' && (
                <View style={[s.sectionGroup, {paddingHorizontal: -16}]}>
                  <View style={s.sectionBlock}>
                    {/* <Text style={[s.sectionEyebrow, { color: theme.textSecondary }]}>Favorite Videos</Text> */}
                    {renderVideoGrid(favoriteVideos)}
                  </View>
                </View>
              )}

              {activeTab === 'Premium' && (
                <View style={s.sectionGroup}>
                  {!selectedCreator ? (
                    <View style={s.sectionBlock}>
                      <Text style={[s.sectionEyebrow, { color: theme.textSecondary }]}>Subscribed Creators</Text>
                      <View style={s.listWrap}>
                        {subscribedCreators.map((creator) => (
                          <Pressable key={creator.id} onPress={() => setSelectedCreator(creator.id)} style={[s.listCard, { backgroundColor: isDark ? '#111827' : theme.card, borderColor: theme.border, padding: 16 }]}>
                            <View style={s.listLeft}>
                              <Image source={{ uri: creator.img }} style={s.listAvatar} />
                              <View>
                                <Text style={[s.listTitle, { color: theme.text }]}>{creator.name}</Text>
                                <Text style={[s.listMeta, { color: theme.textSecondary }]}>{creator.handle}</Text>
                              </View>
                            </View>
                            <View style={s.creatorRight}>
                              <Text style={s.creatorDropMeta}>{creator.premiumCount} Drops</Text>
                              <MaterialIcons name="chevron-right" size={20} color={theme.textSecondary} />
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={[s.sectionGroup, {paddingHorizontal: 0}]}>
                      <View style={s.vaultHeader}>
                        <Pressable onPress={() => setSelectedCreator(null)} style={s.backRow}>
                          <MaterialIcons name="chevron-left" size={14} color={PRIMARY_COLOR} />
                          <Text style={s.backText}>Back to Creators</Text>
                        </Pressable>
                        <Text style={s.sectionEyebrow}>
                          {subscribedCreators.find((creator) => creator.id === selectedCreator)?.name}'s Vault
                        </Text>
                      </View>

                      {renderPremiumVaultContent(selectedCreator)}
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'Video' && (
                renderWatchedVideos()
              )}

              {activeTab === 'Tickets' && (
                <View style={s.listWrap}>
                  {[1, 2].map((item) => (
                    <Pressable key={item} onPress={() => navigation.navigate('FanTicket')} style={[s.ticketCard, {borderColor: theme.border,}]}>
                      <View style={s.ticketLeft}>
                        <View style={s.ticketIconWrap}>
                          <TicketIcon height={24} width={24}/>
                        </View>
                        <View>
                          <Text style={[s.ticketTitle, { color: theme.text }]}>Summer Festival 2024</Text>
                          <Text style={[s.ticketMeta, { color: theme.textSecondary }]}>Aug 24 - O2 Arena</Text>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={22} color={theme.textSecondary} />
                    </Pressable>
                  ))}
                </View>
              )}

              {activeTab === 'Saved' && (
                <View style={s.savedGrid}>
                  {[1, 2, 3, 4].map((item) => (
                    <Pressable key={item} style={s.savedCard}>
                      <View style={s.squareThumbWrap}>
                        <Image source={{ uri: `https://picsum.photos/seed/saved${item}/400/400` }} style={s.thumbImage} />
                        <View style={s.savedBadge}>
                          <MaterialIcons name="bookmark" size={14} color={PRIMARY_COLOR} />
                        </View>
                      </View>
                      {/* <Text style={[s.gridTitle, { color: theme.text }]}>Saved Collection Item</Text> */}
                    </Pressable>
                  ))}
                </View>
              )}
          </View>

      </ScrollView>
      <Modal
        visible={isRoleSwitchModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setIsRoleSwitchModalOpen(false)}
      >
        <View style={s.roleModalRoot}>
          <Pressable
            style={s.roleModalBackdrop}
            onPress={() => setIsRoleSwitchModalOpen(false)}
          />
          <View style={[s.roleModalCard, { backgroundColor: elevatedSurface, borderColor: theme.border }]}>
            <CreatorSwitch height={88} width={88} color={theme.accent} />
            <View style={s.roleModalCopy}>
              <Text style={[s.roleModalTitle, { color: theme.text }]}>Switch to Creator?</Text>
              <Text style={[s.roleModalBody, { color: theme.textSecondary }]}>
                You're about to unlock creator tools. You'll be able to upload content, manage events, and track your revenue.
              </Text>
            </View>
            <View style={s.roleModalActions}>
              <Pressable
                onPress={() => {
                  setIsRoleSwitchModalOpen(false);
                  handleSwitchRole();
                }}
                style={s.roleModalPrimary}
              >
                <Text style={s.roleModalPrimaryText}>Confirm Switch</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsRoleSwitchModalOpen(false)}
                style={[s.roleModalSecondary, { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Text style={[s.roleModalSecondaryText, { color: theme.text }]}>Stay as Fan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#060913',
  },
  content: {
    paddingBottom: 120,
  },
  coverSection: {
    marginBottom: 14,
  },
  cover: {
    height: 200,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  profileRow: {
    marginTop: -46,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 999,
    borderWidth: 6,

  },
  streakBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 42,
    height: 42,
    borderRadius: 25,
    backgroundColor: '#f97316',
    borderWidth: 4,
    // borderColor: '#060913',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCount: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    marginTop: 1,
  },
  nameWrap: {
    paddingBottom: 10,
  },
  name: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.fontSize + 2,
  },
  member: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
    marginTop: 2,
  },
  main: {
    // paddingHorizontal: 18,
    gap: 24,
  },
  vibesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  vibeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: primaryColorAlpha(0.1),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.24),
  },
  vibeText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  vibeEdit: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18
  },
  statCard: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center'
    // backgroundColor: 'rgba(255,255,255,0.05)',
    // borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.fontSize + 2,
  },
  statLabel: {
    color: '#8f95af',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  actionSection: {
    gap: 14,
  },
  switchRoleCard: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    marginHorizontal: 18,
  },
  switchRoleGradient: {
    minHeight: 48,
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRoleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  switchRoleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRoleTitle: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  switchRoleMeta: {
    color: 'rgba(255,255,255,0.78)',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 3,
  },
  tabsSection: {
    gap: 18,
    marginTop: 24,
    zIndex: 10,
    // elevation: 4,
  },
  tabsRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 5
  },
  tabButton: {
    minWidth: 72,
    alignItems: 'center',
    paddingBottom: 12,
    marginRight: 12,
  },
  tabText: {
    color: '#6b7280',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  tabTextActive: {
    color: PRIMARY_COLOR,
  },
  tabIndicator: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: -1,
    height: 2,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  tabContent: {
    gap: 18,
    marginTop: 18,
  },
  sectionGroup: {
    gap: 24,
    paddingHorizontal: 16,
  },
  sectionBlock: {
    gap: 12,
  },
  sectionEyebrow: {
    color: '#71788f',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
  },
  sectionMini: {
    color: '#71788f',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  listWrap: {
    gap: 12,
    // paddingHorizontal: 18,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
  },
  listTitle: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  listMeta: {
    color: '#8f95af',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  creatorDropMeta: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  videoGridWrap: {
    marginHorizontal: -5,
    // paddingBottom: 120
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 1,
  },
  videoGridCard: {
    overflow: 'hidden',
    borderRadius: 2,
    position: 'relative',
    width: '33%',
    height: 210,
    // aspectRatio: 16 / 9,
  },
  videoGridImage: {
    width: '100%',
    height: '100%',
  },
  videoGridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  videoGridMeta: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  videoGridMetaText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  videoStateCard: {
    marginHorizontal: 16,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoStateText: {
    flex: 1,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 3,
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    // rowGap: 14,
  },
  gridCard: {
    width: '49%',
    // gap: 3,
  },
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 1,
    // paddingHorizontal: 5,
  },
  savedCard: {
    width: '33.2%',
    height: 210,
    // gap: 8,
  },
  videoThumbWrap: {
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
    // height: 150,
  },
  verticalThumbWrap: {
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  squareThumbWrap: {
    // aspectRatio: 1,
    borderRadius: 0,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111827',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  squareDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  favoriteDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTag: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  premiumTagText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistCount: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  playlistCountText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  artistPremiumWrap: {
    gap: 20,
  },
  artistPremiumHeading: {
    fontSize: fontSize.b2.fontSize + 2,
    fontFamily: fontSize.b2.fontFamily,
    lineHeight: fontSize.b2.fontSize + 4,
    // paddingHorizontal: 16,
  },
  artistRecentCard: {
    borderRadius: 24,
    minHeight: 320,
    gap: 10,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    // marginHorizontal: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  artistRecentImage: {
    height: 176,
    width: '100%',
  },
  artistRecentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistPlayCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: primaryColorAlpha(0.24),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistDurationPill: {
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
    bottom: 10,
    backgroundColor: '#00000097',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 2,
  },
  artistDurationText: {
    color: '#fff',
    ...fontSize.b2,
    lineHeight: fontSize.b2.fontSize + 1,
  },
  artistRecentInfo: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    paddingBottom: 16,
  },
  artistRecentAvatar: {
    height: 45,
    width: 45,
    borderRadius: 999,
  },
  artistRecentCopy: {
    flex: 1,
    gap: 5,
  },
  artistRecentTitle: {
    fontSize: fontSize.b2.fontSize,
    fontFamily: 'Pogonia_700Bold',
    lineHeight: fontSize.b2.fontSize + 4,
  },
  artistRecentMeta: {
    fontSize: fontSize.b4.fontSize,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgb(100,116,139)',
  },
  artistRecentDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(100,116,139,0.12)',
    marginTop: 6,
  },
  artistRecentSeries: {
    marginTop: 6,
    color: 'rgb(113,113,122)',
    fontSize: fontSize.b4.fontSize,
    fontFamily: 'Inter_700Bold',
  },
  artistPlaylistSection: {
    gap: 10,
  },
  artistSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  artistPlaylistScroll: {
    // paddingHorizontal: 16,
    gap: 14,
  },
  artistPlaylistCard: {
    width: 220,
    gap: 10,
  },
  artistPlaylistThumb: {
    height: 124,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  artistPlaylistShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  artistPlaylistBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    width: 68,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  artistPlaylistCount: {
    color: '#d4d4d8',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  artistPlaylistLock: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artistPlaylistTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 3,
  },
  artistPlaylistMeta: {
    color: '#71717a',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  artistReleaseSection: {
    gap: 10,
    // paddingHorizontal: 16,
  },
  artistReleaseList: {
    gap: 12,
  },
  artistReleaseCard: {
    minHeight: 112,
    borderRadius: 18,
    flexDirection: 'row',
    padding: 10,
    gap: 12,
    position: 'relative',
  },
  artistReleaseThumb: {
    width: 96,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  artistReleaseLockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistReleaseLockButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistReleaseDuration: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  artistReleaseDurationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  artistReleaseInfo: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  artistReleaseTitle: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 2,
    width: '86%',
  },
  artistReleaseMeta: {
    color: '#71717a',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  artistMoreButton: {
    position: 'absolute',
    right: 4,
    top: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticalMeta: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verticalMetaText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  gridTitle: {
    color: '#d7dbea',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  gridMeta: {
    color: '#8f95af',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  vaultHeader: {
    gap: 10,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    marginHorizontal: 16,
    // borderColor: 'rgb(255, 255, 255)',
  },
  ticketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ticketIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    // backgroundColor: primaryColorAlpha(0.1),
    // borderWidth: 1,
    // borderColor: primaryColorAlpha(0.24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketTitle: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  ticketMeta: {
    color: '#8f95af',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginTop: 2,
  },
  savedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleModalRoot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    roleModalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.62)',
    },
    roleModalCard: {
      width: '100%',
      maxWidth: 380,
      borderRadius: 48,
      borderWidth: 1,
      padding: 40,
      alignItems: 'center',
    },
    roleModalIcon: {
      width: 80,
      height: 80,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    roleModalCopy: {
      alignItems: 'center',
      gap: 8,
    },
    roleModalTitle: {
      ...fontSize.b1,
      textTransform: 'uppercase',
      textAlign: 'center',
      lineHeight: 28,
    },
    roleModalBody: {
      ...fontSize.b4,
      lineHeight: 20,
      textAlign: 'center',
    },
    roleModalActions: {
      width: '100%',
      gap: 12,
      marginTop: 28,
    },
    roleModalSecondary: {
      width: '100%',
      minHeight: 64,
      borderRadius: 24,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roleModalSecondaryText: {
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 1.6,
    },
    roleModalPrimary: {
      width: '100%',
      minHeight: 64,
      borderRadius: 24,
      backgroundColor: PRIMARY_COLOR,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: PRIMARY_COLOR,
      shadowOpacity: 0.3,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    roleModalPrimaryText: {
      color: '#ffffff',
      ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
      textTransform: 'uppercase',
      letterSpacing: 1.8,
    },
});

export default FanProfile;
