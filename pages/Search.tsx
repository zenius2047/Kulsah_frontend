import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useDeferredValue, useState } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import KulsahInputBar from '../components/KulsahInputBar';
import { fontSize } from '../typography';
import { useQuery } from '@tanstack/react-query';
import { musicApi } from '../src/api/music.api';
import { useDiscovery } from '../src/hooks/queries/useDiscovery';
import { liveApi } from '../src/api/live.api';
import type { DiscoveryCreator, DiscoveryVideo } from '../src/types/discovery.types';
import type { MusicTrack } from '../src/types/music.types';
import { formatLiveCount } from '../src/utils/live';

type SearchTab = 'Top' | 'Users' | 'Videos' | 'Sounds' | 'LIVE' | 'Hashtags';

type SearchUser = Pick<DiscoveryCreator, 'id' | 'name' | 'handle' | 'avatar_url' | 'is_verified' | 'followers_count'>;
type SearchVideo = Pick<DiscoveryVideo, 'id' | 'title' | 'caption' | 'creator' | 'thumbnail_url' | 'playback_url' | 'stats'>;

const tabs: SearchTab[] = ['Top', 'Users', 'Videos', 'Sounds', 'LIVE', 'Hashtags'];

const trendingRanked = [
  { rank: 1, tag: 'neonnights', icon: 'trending-up' as const, count: '1.2M' },
  { rank: 2, tag: 'afrobeatpulse', icon: 'music-note' as const, count: '850K' },
  { rank: 3, tag: 'livegaming', icon: 'sports-esports' as const, count: '420K' },
  { rank: 4, tag: 'creatoreconomy', icon: 'visibility' as const, count: '120K' },
  { rank: 5, tag: 'visualart', icon: 'palette' as const, count: '95K' },
];

const recentSearches = [
  { name: 'Alex Vibe', handle: '@alex_vibe', img: 'https://picsum.photos/seed/alexvibe/150/150' },
  { name: 'Jordon DJ', handle: '@jordon_dj', img: 'https://picsum.photos/seed/jordondj/150/150' },
  { name: 'Sara Pulse', handle: '@sara_pulse', img: 'https://picsum.photos/seed/sarapulse/150/150' },
  { name: 'Pixel Pro', handle: '@pixel_pro', img: 'https://picsum.photos/seed/pixelpro/150/150' },
  { name: 'Echo Nomad', handle: '@echo_nomad', img: 'https://picsum.photos/seed/echonomad/150/150' },
];

const suggestedCreators = [
  { name: 'Kiki Storm', followers: '1.2M FOLLOWERS', img: 'https://picsum.photos/seed/kikistorm/400/600' },
  { name: 'Marcus Flow', followers: '894K FOLLOWERS', img: 'https://picsum.photos/seed/marcusflow/400/600' },
  { name: 'Luna Art', followers: '2.1M FOLLOWERS', img: 'https://picsum.photos/seed/lunaart/400/600' },
  { name: 'Sox Jazz', followers: '542K FOLLOWERS', img: 'https://picsum.photos/seed/soxjazz/400/600' },
];

const Search: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark, theme } = useThemeMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('Top');
  const deferredSearch = useDeferredValue(searchQuery.trim());
  const hasQuery = deferredSearch.length > 0;
  const discoveryTab = activeTab === 'Users' ? 'creators' : activeTab === 'Videos' ? 'videos' : 'all';
  const discoveryQuery = useDiscovery(
    { tab: discoveryTab, page: 1, limit: 30, ...(hasQuery ? { search_query: deferredSearch } : {}) },
    { enabled: hasQuery && (activeTab === 'Top' || activeTab === 'Users' || activeTab === 'Videos') },
  );
  const soundsQuery = useQuery({
    queryKey: ['search', 'sounds', deferredSearch],
    queryFn: () => musicApi.browse({ search: deferredSearch, limit: 30, sort: 'relevant' }).then((response) => response.data.data),
    enabled: hasQuery && (activeTab === 'Top' || activeTab === 'Sounds'),
    staleTime: 60_000,
  });
  const liveQuery = useQuery({
    queryKey: ['search', 'live', deferredSearch],
    queryFn: () => liveApi.discover({ page: 1, per_page: 30, search_query: deferredSearch }).then((response) => response.data),
    enabled: hasQuery && (activeTab === 'Top' || activeTab === 'LIVE'),
    staleTime: 15_000,
  });
  const users = discoveryQuery.data?.data.creators ?? [];
  const videos = discoveryQuery.data?.data.videos ?? [];
  const sounds = soundsQuery.data ?? [];
  const liveResults = liveQuery.data?.data ?? [];
  const isSearching = discoveryQuery.isLoading || soundsQuery.isLoading || liveQuery.isLoading;

  const cardGap = 14;
  const contentWidth = width - 32;
  const twoColumnWidth = (contentWidth - cardGap) / 2;
  const colors = {
    background: isDark ? '#0a0a0c' : theme.background,
    header: isDark ? 'rgba(10,10,12,0.96)' : 'rgba(255,255,255,0.96)',
    border: isDark ? 'rgba(255,255,255,0.06)' : theme.border,
    surface: isDark ? '#1a1a1e' : 'rgba(15,23,42,0.04)',
    surfacePressed: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)',
    text: theme.text,
    textSoft: isDark ? 'rgba(255,255,255,0.62)' : theme.textSecondary,
    textMuted: isDark ? 'rgba(255,255,255,0.42)' : theme.textMuted,
    textFaint: isDark ? 'rgba(255,255,255,0.24)' : 'rgba(15,23,42,0.34)',
    icon: isDark ? 'rgba(255,255,255,0.34)' : theme.textSecondary,
    iconFaint: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.25)',
    card: isDark ? '#1a1a1e' : theme.card,
    followBg: isDark ? '#fff' : theme.accent,
    followText: isDark ? '#0f172a' : '#fff',
    accent: theme.accent,
  };

  const openProfile = (user: SearchUser | string) => {
    navigation.navigate('ArtistProfile', { id: typeof user === 'string' ? user : user.id, isOwner: false });
  };

  const openVideo = (video: SearchVideo) => {
    navigation.navigate('VideoPlayer', {
      id: video.id,
      item: {
        id: video.id,
        artist: video.creator.name,
        handle: video.creator.handle,
        avatar: video.creator.avatar_url,
        caption: video.caption ?? video.title ?? '',
        video: video.playback_url,
        thumbnail_url: video.thumbnail_url,
        likes: String(video.stats.likes_count),
        comments: String(video.stats.comments_count),
      },
    });
  };

  const renderUserRow = (user: SearchUser, compact = false) => (
    <Pressable
      key={user.handle}
      onPress={() => openProfile(user)}
      style={({ pressed }) => [styles.userRow, compact && styles.userRowCompact, pressed && { backgroundColor: colors.surfacePressed }]}
    >
      {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }, compact ? styles.avatarCompact : null]} /> : <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }, compact ? styles.avatarCompact : null]} />}
      <View style={styles.userCopy}>
        <View style={styles.inlineCenter}>
          <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>{user.name}</Text>
          {user.is_verified ? <MaterialIcons name="verified" size={compact ? 14 : 16} color={colors.accent} /> : null}
        </View>
        <Text style={[styles.userMeta, { color: colors.textMuted }]} numberOfLines={1}>
          @{user.handle.replace(/^@/, '')} {compact ? `- ${formatLiveCount(user.followers_count)} followers` : ''}
        </Text>
        {!compact ? <Text style={[styles.userFollowers, { color: colors.textFaint }]}>{formatLiveCount(user.followers_count)} followers</Text> : null}
      </View>
      <Pressable style={({ pressed }) => [styles.followButton, { backgroundColor: colors.followBg }, pressed && styles.buttonPressed]}>
        <Text style={[styles.followText, { color: colors.followText }]}>Follow</Text>
      </Pressable>
    </Pressable>
  );

  const renderVideoCard = (vid: SearchVideo) => (
    <Pressable
      key={vid.id}
      onPress={() => openVideo(vid)}
      style={({ pressed }) => [{ width: twoColumnWidth }, pressed && styles.cardPressed]}
    >
      <View style={[styles.videoThumb, { backgroundColor: colors.card }]}>
        {vid.thumbnail_url ? <Image source={{ uri: vid.thumbnail_url }} style={styles.fillImage} /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.viewsBadge}>
          <MaterialIcons name="play-arrow" size={13} color="#fff" />
          <Text style={styles.viewsText}>{formatLiveCount(vid.stats.views_count)}</Text>
        </View>
      </View>
      <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>{vid.title ?? vid.caption ?? 'Untitled video'}</Text>
      <View style={styles.authorRow}>
        <View style={styles.authorDot} />
        <Text style={[styles.authorText, { color: colors.textMuted }]} numberOfLines={1}>{vid.creator.name}</Text>
      </View>
    </Pressable>
  );

  const renderSearchResults = () => {
    switch (activeTab) {
      case 'Top':
        return (
          <View style={styles.resultsStack}>
            <SectionHeader title="Users" action="See more" colors={colors} onPress={() => setActiveTab('Users')} />
            <View style={styles.stackSmall}>{users.slice(0, 3).map((user) => renderUserRow(user, true))}</View>

            <SectionHeader title="Videos" action="See more" colors={colors} onPress={() => setActiveTab('Videos')} />
            <View style={styles.gridRow}>{videos.slice(0, 2).map(renderVideoCard)}</View>

            <View style={[styles.keywordBlock, { borderTopColor: colors.border }]}>
              <Text style={[styles.kicker, { color: colors.textMuted }]}>Related keywords</Text>
              {[1, 2].map((i) => (
                <Pressable key={i} style={({ pressed }) => [styles.keywordRow, pressed && { backgroundColor: colors.surfacePressed }]}>
                  <View style={[styles.keywordIcon, { backgroundColor: colors.surface }]}>
                    <MaterialIcons name="search" size={20} color={colors.textFaint} />
                  </View>
                  <Text style={[styles.keywordText, { color: colors.textSoft }]} numberOfLines={1}>
                    {searchQuery} <Text style={{ color: colors.textFaint }}>mix {i}</Text>
                  </Text>
                  <MaterialIcons name="north-west" size={19} color={colors.iconFaint} />
                </Pressable>
              ))}
            </View>
          </View>
        );
      case 'Users':
        return <View style={styles.stackSmall}>{users.map((user) => renderUserRow(user))}</View>;
      case 'Videos':
        return <View style={styles.gridRow}>{videos.map(renderVideoCard)}</View>;
      case 'Sounds':
        return (
          <View style={styles.stackSmall}>
            {sounds.map((sound: MusicTrack) => (
              <Pressable key={sound.id} style={({ pressed }) => [styles.soundRow, pressed && { backgroundColor: colors.surfacePressed }]}>
                <View style={[styles.soundCover, { backgroundColor: colors.card }]}>
                  {sound.thumbnail_artwork ? <Image source={{ uri: sound.thumbnail_artwork }} style={styles.fillImage} /> : null}
                  <View style={styles.soundPlay}>
                    <MaterialIcons name="play-arrow" size={20} color="#fff" />
                  </View>
                </View>
                <View style={styles.userCopy}>
                  <Text style={[styles.soundTitle, { color: colors.text }]} numberOfLines={1}>{sound.title ?? 'Untitled sound'}</Text>
                  <Text style={[styles.userMeta, { color: colors.textMuted }]}>{sound.artist ?? 'Unknown artist'}</Text>
                  <Text style={[styles.userFollowers, { color: colors.textFaint }]}>{formatLiveCount(sound.usage_count)} videos</Text>
                </View>
                <MaterialIcons name="bookmark-border" size={24} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        );
      case 'LIVE':
        return (
          <View style={styles.gridRow}>
            {liveResults.map((live) => (
              <Pressable key={live.id} onPress={() => navigation.navigate('LiveStream', { liveSessionId: live.id, initialLive: live })} style={[styles.liveCard, { width: twoColumnWidth, backgroundColor: colors.card }]}>
                {live.cover_url ? <Image source={{ uri: live.cover_url }} style={styles.fillImage} /> : null}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.86)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
                <View style={styles.viewerBadge}>
                  <Text style={styles.viewerText}>{formatLiveCount(live.current_viewers)} watching</Text>
                </View>
                <View style={styles.liveBottom}>
                  <Text style={styles.liveTitle} numberOfLines={1}>{live.title}</Text>
                  <View style={styles.inlineCenter}>
                    <View style={styles.liveAvatar} />
                    <Text style={styles.liveUser}>{live.creator?.name ?? 'Creator'}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        );
      case 'Hashtags':
        return (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={58} color={colors.textFaint} />
            <Text style={[styles.emptyText, { color: colors.textFaint }]}>Hashtag search is not available yet.</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView edges={[]} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        style={[styles.screen, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? insets.top + 4 : insets.top + 12, backgroundColor: colors.header, borderBottomColor: colors.border }]}>
          <View style={styles.searchRow}>
            {/* <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backButton, pressed && styles.iconPressed]}>
              <MaterialIcons name="chevron-left" size={28} color={colors.text} />
            </Pressable> */}
            <KulsahInputBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor={colors.textFaint}
                returnKeyType="search"
                containerStyle={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: isDark ? 0 : 1 }]}
                inputStyle={[styles.searchInput, { color: colors.text }]}
                leftAccessory={<MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />}
                rightAccessory={(
                  <>
                    {searchQuery ? (
                      <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                        <MaterialIcons name="close" size={16} color={colors.textMuted} />
                      </Pressable>
                    ) : null}
                    <MaterialIcons name="mic" size={21} color={colors.icon} style={styles.micIcon} />
                  </>
                )}
              />
            <Pressable onPress={Keyboard.dismiss}>
              <Text style={[styles.searchAction, { color: colors.accent }]}>Search</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabButton}>
                  <Text style={[styles.tabText, { color: colors.textMuted }, isActive && { color: colors.text }]}>{tab}</Text>
                  {isActive ? <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {!searchQuery ? (
            <>
              <View>
                <View style={styles.sectionTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Recently searched</Text>
                  <Pressable>
                    <Text style={[styles.clearText, { color: colors.textFaint }]}>Clear</Text>
                  </Pressable>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentContent}>
                  {recentSearches.map((user) => (
                    <Pressable key={user.handle} onPress={() => openProfile(user.name)} style={({ pressed }) => [styles.recentItem, pressed && styles.recentPressed]}>
                      <Image source={{ uri: user.img }} style={[styles.recentAvatar, { backgroundColor: colors.card }]} />
                      <Text style={[styles.recentHandle, { color: colors.textMuted }]} numberOfLines={1}>{user.handle.toLowerCase()}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View>
                <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Trending</Text>
                <View style={styles.trendingList}>
                  {trendingRanked.map((item) => (
                    <Pressable key={item.tag} style={({ pressed }) => [styles.trendingRow, pressed && { backgroundColor: colors.surfacePressed }]}>
                      <View style={styles.inlineCenter}>
                        <Text style={[styles.rank, { color: colors.textFaint }, item.rank <= 3 && { color: colors.accent }]}>{item.rank}</Text>
                        <View>
                          <Text style={[styles.trendTag, { color: colors.text }]}>#{item.tag}</Text>
                          <View style={styles.inlineCenter}>
                            <MaterialIcons name={item.icon} size={13} color={colors.textFaint} />
                            <Text style={[styles.trendMeta, { color: colors.textFaint }]}>{item.count} POSTS</Text>
                          </View>
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={23} color={colors.iconFaint} />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={[styles.sectionTitle, { color: colors.textSoft }]}>Suggested for You</Text>
                <View style={styles.gridRow}>
                  {suggestedCreators.map((creator) => (
                    <Pressable
                      key={creator.name}
                      onPress={() => openProfile(creator.name)}
                      style={({ pressed }) => [styles.creatorCard, { width: twoColumnWidth, backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.cardPressed]}
                    >
                      <Image source={{ uri: creator.img }} style={styles.fillImage} />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.86)']} style={StyleSheet.absoluteFillObject} />
                      <View style={styles.creatorBottom}>
                        <Text style={styles.creatorName} numberOfLines={1}>{creator.name}</Text>
                        <Text style={styles.creatorFollowers} numberOfLines={1}>{creator.followers}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          ) : isSearching ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="search" size={42} color={colors.textFaint} />
              <Text style={[styles.emptyText, { color: colors.textFaint }]}>Searching</Text>
            </View>
          ) : (
            renderSearchResults()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type SearchColors = {
  textMuted: string;
  accent: string;
};

const SectionHeader = ({ title, action, colors, onPress }: { title: string; action: string; colors: SearchColors; onPress: () => void }) => (
  <View style={styles.sectionTitleRow}>
    <Text style={[styles.kicker, { color: colors.textMuted }]}>{title}</Text>
    <Pressable onPress={onPress}>
      <Text style={[styles.inlineAction, { color: colors.accent }]}>{action}</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  screen: { flex: 1, backgroundColor: '#0a0a0c' },
  header: {
    backgroundColor: 'rgba(10,10,12,0.96)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 12 },
  backButton: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
  iconPressed: { transform: [{ scale: 0.92 }] },
  searchBox: {
    flex: 1,
    height: 44,
    minHeight: 44,
    borderRadius: 999,
    backgroundColor: '#1a1a1e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: { marginLeft: 14 },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingLeft: 10,
    paddingRight: 8,
    color: '#fff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  clearButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  micIcon: { marginRight: 14 },
  searchAction: { color: PRIMARY_COLOR, ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, fontFamily: "Inter_500Medium" },
  tabsContent: { paddingHorizontal: 10 },
  tabButton: { minWidth: 70, alignItems: 'center', paddingHorizontal: 10, paddingTop: 12, paddingBottom: 13 },
  tabText: { color: 'rgba(255,255,255,0.42)', ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight, letterSpacing: 1.2, textTransform: 'uppercase' },
  tabTextActive: { color: '#fff' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 16, right: 16, height: 3, borderRadius: 999, backgroundColor: PRIMARY_COLOR },
  content: { paddingHorizontal: 16, paddingTop: 24, gap: 38 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: 'rgba(255,255,255,0.62)', ...fontSize.mediumTitleText, lineHeight: fontSize.mediumTitleText.lineHeight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 18 },
  clearText: { color: 'rgba(255,255,255,0.24)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase' },
  recentContent: { gap: 20, paddingVertical: 4, paddingRight: 16 },
  recentItem: { width: 72, alignItems: 'center', gap: 8 },
  recentPressed: { transform: [{ scale: 0.96 }] },
  recentAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a1e' },
  recentHandle: { width: 68, textAlign: 'center', color: 'rgba(255,255,255,0.42)', ...fontSize.handleTextSmall, lineHeight: fontSize.handleTextSmall.lineHeight },
  trendingList: { gap: 21 },
  trendingRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14 },
  inlineCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rank: { width: 22, color: 'rgba(255,255,255,0.24)', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  rankHot: { color: PRIMARY_COLOR },
  trendTag: { color: '#fff', ...fontSize.b2, lineHeight: fontSize.b2.lineHeight, textTransform: 'uppercase' },
  trendMeta: { color: 'rgba(255,255,255,0.25)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  creatorCard: { aspectRatio: 3.5 / 5, borderRadius: 30, overflow: 'hidden', backgroundColor: '#1a1a1e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardPressed: { transform: [{ scale: 0.98 }] },
  fillImage: { width: '100%', height: '100%' },
  creatorBottom: { position: 'absolute', left: 18, right: 18, bottom: 22 },
  creatorName: { color: '#fff', ...fontSize.nameText, lineHeight: fontSize.nameText.lineHeight, letterSpacing: 1, textTransform: 'uppercase' },
  creatorFollowers: { marginTop: 5, color: 'rgba(255,255,255,0.45)', ...fontSize.creatorStyleText, lineHeight: fontSize.creatorStyleText.lineHeight, letterSpacing: 1.6 },
  resultsStack: { gap: 28 },
  stackSmall: { gap: 12 },
  kicker: { color: 'rgba(255,255,255,0.42)', ...fontSize.mediumTitleText, lineHeight: fontSize.tabText.lineHeight, textTransform: 'uppercase', letterSpacing: 1.4 },
  inlineAction: { color: PRIMARY_COLOR, ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
  userRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, paddingHorizontal: 2, borderRadius: 16 },
  userRowCompact: { minHeight: 56 },
  pressedSurface: { backgroundColor: 'rgba(255,255,255,0.05)' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a1a1e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatarCompact: { width: 48, height: 48, borderRadius: 24 },
  userCopy: { flex: 1, minWidth: 0 },
  userName: { color: '#fff', ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  userMeta: { marginTop: 2, color: 'rgba(255,255,255,0.42)', ...fontSize.handleTextSmall, lineHeight: fontSize.handleTextSmall.lineHeight },
  userFollowers: { marginTop: 5, color: 'rgba(255,255,255,0.24)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1.1 },
  followButton: { height: 35, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  buttonPressed: { transform: [{ scale: 0.96 }], backgroundColor: PRIMARY_COLOR },
  followText: { color: '#0f172a', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'uppercase', letterSpacing: 1 },
  videoThumb: { width: '100%', aspectRatio: 4 / 5, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1a1a1e' },
  viewsBadge: { position: 'absolute', left: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.45)' },
  viewsText: { color: '#fff', ...fontSize.badgeTextSmall, lineHeight: fontSize.badgeTextSmall.lineHeight },
  videoTitle: { marginTop: 8, color: 'rgba(255,255,255,0.92)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  authorRow: { marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: primaryColorAlpha(0.24) },
  authorText: { color: 'rgba(255,255,255,0.42)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  keywordBlock: { paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  keywordRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 4, borderRadius: 14 },
  keywordIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1e' },
  keywordText: { flex: 1, color: 'rgba(255,255,255,0.66)', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  keywordMuted: { color: 'rgba(255,255,255,0.24)' },
  soundRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 8, borderRadius: 16 },
  soundCover: { width: 64, height: 64, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1e' },
  soundPlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.18)' },
  soundTitle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  liveCard: { aspectRatio: 3 / 4.5, borderRadius: 18, overflow: 'hidden', backgroundColor: '#1a1a1e' },
  liveBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: '#dc2626' },
  liveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  liveBadgeText: { color: '#fff', ...fontSize.badgeTextSmall, lineHeight: fontSize.badgeTextSmall.lineHeight, letterSpacing: 1 },
  viewerBadge: { position: 'absolute', top: 12, right: 10, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.45)' },
  viewerText: { color: '#fff', ...fontSize.badgeTextSmall, lineHeight: fontSize.badgeTextSmall.lineHeight },
  liveBottom: { position: 'absolute', left: 14, right: 14, bottom: 16 },
  liveTitle: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginBottom: 7 },
  liveAvatar: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', backgroundColor: primaryColorAlpha(0.26) },
  liveUser: { color: 'rgba(255,255,255,0.65)', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyText: { marginTop: 12, color: 'rgba(255,255,255,0.28)', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, textTransform: 'uppercase', letterSpacing: 1.2 },
});

export default Search;
