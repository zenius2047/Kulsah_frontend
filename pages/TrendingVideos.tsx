import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import { fontSize } from './typography';
import { useDiscovery } from '../src/hooks/queries/useDiscovery';
import type { DiscoveryVideo } from '../src/types/discovery.types';

type TrendingRange = 'day' | 'week' | 'month';

const genres = ['All', 'AfroBeats', 'Soul', 'HighLife', 'Drill', 'Acoustic', 'Jazz'];

const TrendingVideos: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<TrendingRange>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenre, setActiveGenre] = useState('All');
  const discoveryQuery = useDiscovery({ tab: 'videos', page: 1, limit: 100 });

  const glass = isDark ? 'rgba(255,255,255,0.06)' : theme.card;
  const softBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const chipIdleBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)';
  const mutedText = isDark ? 'rgba(255,255,255,0.35)' : theme.textMuted;
  const secondaryText = isDark ? 'rgba(255,255,255,0.5)' : theme.textSecondary;
  const surface = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const headerBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)';

  const filteredVideos = useMemo(() => {
    return (discoveryQuery.data?.data.videos ?? []).filter((video) => {
      const category = video.category ?? '';
      const matchesSearch =
        !searchQuery ||
        (video.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.caption ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.handle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenre = activeGenre === 'All' || category.toLowerCase() === activeGenre.toLowerCase();

      return matchesSearch && matchesGenre;
    });
  }, [activeGenre, discoveryQuery.data?.data.videos, searchQuery]);

  const openVideo = (video: DiscoveryVideo) => {
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: headerBorder }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.iconButton, { backgroundColor: chipIdleBg, borderColor: softBorder }]}
            >
              <MaterialIcons name="chevron-left" size={20} color={theme.text} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Trending</Text>
              <Text style={styles.headerSubtitle}>Galaxy Orbit Velocity</Text>
            </View>

            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchWrap}>
            <View style={[styles.searchBar, { backgroundColor: chipIdleBg, borderColor: softBorder }]}>
              <MaterialIcons name="search" size={20} color={secondaryText} />
              <TextInput includeFontPadding={false}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search trending galaxy..."
                placeholderTextColor={mutedText}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={18} color={secondaryText} />
                </Pressable>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
              <View style={[styles.filterGroup, { borderRightColor: softBorder }]}>
                {[
                  { id: 'day', label: 'Today' },
                  { id: 'week', label: 'Weekly' },
                  { id: 'month', label: 'Monthly' },
                ].map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setActiveTab(item.id as TrendingRange)}
                      style={[
                        styles.filterChip,
                        { backgroundColor: active ? PRIMARY_COLOR : chipIdleBg },
                      ]}
                    >
                      <Text style={[styles.filterChipText, { color: active ? '#ffffff' : secondaryText }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {genres.map((genre) => {
                const active = activeGenre === genre;
                return (
                  <Pressable
                    key={genre}
                    onPress={() => setActiveGenre(genre)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? (isDark ? '#ffffff' : '#0f172a') : chipIdleBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? (isDark ? '#0f172a' : '#ffffff') : secondaryText },
                      ]}
                    >
                      {genre}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {discoveryQuery.isLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyBody, { color: secondaryText }]}>Loading trending videos...</Text>
            </View>
          ) : filteredVideos.length > 0 ? (
            filteredVideos.map((video, idx) => (
              <Pressable
                key={video.id}
                onPress={() => openVideo(video)}
                style={[styles.videoCard, { backgroundColor: surface, borderColor: softBorder }]}
              >
                <View style={styles.visualWrap}>
                  {video.thumbnail_url ? <Image source={{ uri: video.thumbnail_url }} style={styles.videoImage} /> : null}
                  <View style={styles.imageOverlay} />

                  <View style={styles.rankBadge}>
                    <Text style={styles.rankLabel}>Rank</Text>
                    <Text
                      style={[
                        styles.rankValue,
                        { color: idx < 3 ? PRIMARY_COLOR : '#0f172a' },
                      ]}
                    >
                      #{idx + 1}
                    </Text>
                  </View>

                  <View style={styles.playOverlay}>
                    <View style={styles.playButton}>
                      <MaterialIcons name="play-arrow" size={38} color="#ffffff" />
                    </View>
                  </View>

                  <View style={styles.visualCopy}>
                    <View style={styles.tagRow}>
                      {(video.category ? [video.category] : ['Trending']).map((tag) => (
                        <View key={tag} style={styles.tagChip}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <Text style={styles.videoTitle}>{video.title ?? video.caption ?? 'Untitled video'}</Text>
                  </View>
                </View>

                <View style={styles.videoBody}>
                  <View style={styles.metaRow}>
                    <View style={styles.creatorWrap}>
                      <View style={styles.creatorAvatarWrap}>
                        {video.creator.avatar_url ? <Image source={{ uri: video.creator.avatar_url }} style={styles.creatorAvatar} /> : <View style={[styles.creatorAvatar, { backgroundColor: chipIdleBg }]} />}
                        <View style={styles.creatorVerify}>
                          <MaterialIcons name="verified" size={10} color="#ffffff" />
                        </View>
                      </View>

                      <View>
                        <Text style={[styles.metaLabel, { color: mutedText }]}>Creator</Text>
                        <Text style={[styles.creatorName, { color: theme.text }]}>{video.creator.name}</Text>
                      </View>
                    </View>

                    <View style={styles.impactWrap}>
                      <Text style={[styles.metaLabel, { color: mutedText }]}>Impact</Text>
                      <Text style={styles.impactValue}>{video.stats.views_count.toLocaleString()} Views</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: chipIdleBg }]}>
                <MaterialIcons name="search-off" size={34} color={mutedText} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Matches In Orbit</Text>
              <Text style={[styles.emptyBody, { color: secondaryText }]}>
                Try broadening your search or filters
              </Text>
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setActiveGenre('All');
                  setActiveTab('day');
                }}
              >
                <Text style={styles.resetText}>Reset Everything</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    // paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...fontSize.h1, lineHeight: fontSize.h1.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: PRIMARY_COLOR,
    marginTop: 4,
    ...fontSize.h2, lineHeight: fontSize.h2.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerSpacer: {
    width: 42,
  },
  searchWrap: {
    gap: 14,
  },
  searchBar: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
  },
  searchInput: {
    flex: 1,
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
  },
  filterScroll: {
    gap: 10,
    paddingBottom: 2,
    paddingHorizontal: 20
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 10,
    marginRight: 2,
    borderRightWidth: 1,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    ...fontSize.tabText, lineHeight: fontSize.tabText.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 120,
  },
  videoCard: {
    borderRadius: 34,
    overflow: 'hidden',
    borderWidth: 1,
  },
  visualWrap: {
    height: 260,
    position: 'relative',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  rankBadge: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankLabel: {
    color: '#64748b',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  rankValue: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: primaryColorAlpha(0.24),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  visualCopy: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagText: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  videoTitle: {
    color: '#ffffff',
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    textTransform: 'uppercase',
    width: '86%',
  },
  videoBody: {
    padding: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  creatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  creatorAvatarWrap: {
    position: 'relative',
  },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: primaryColorAlpha(0.2),
  },
  creatorVerify: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PRIMARY_COLOR,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  creatorName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  impactWrap: {
    alignItems: 'flex-end',
  },
  impactValue: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 14,
  },
  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
  },
  emptyBody: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  resetText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 8,
  },
});

export default TrendingVideos;
