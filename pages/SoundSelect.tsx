import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { fontSize } from './typography';
import { useMusic } from '../src/hooks/queries/useMusic';
import type { MusicTrack } from '../src/types/music.types';

type MusicTab = 'Trending' | 'Popular';

const tabs: MusicTab[] = ['Trending', 'Popular'];

const formatDuration = (duration?: number | null) => {
  const seconds = Math.max(0, Math.round(duration ?? 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

type PreviewSound = Awaited<ReturnType<typeof Audio.Sound.createAsync>>['sound'];

type VoteSheetContentProps = {
  onClose?: () => void;
  sheetMode?: boolean;
  selectedTrackId?: string | null;
  onSelect?: (track: MusicTrack) => void;
};

export const VoteSheetContent: React.FC<VoteSheetContentProps> = ({
  onClose,
  sheetMode = false,
  selectedTrackId = null,
  onSelect,
}) => {
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<MusicTab>('Trending');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim());
  const previewRef = useRef<PreviewSound | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const musicParams = useMemo(() => (
    deferredQuery
      ? { search: deferredQuery, limit: 25 }
      : activeTab === 'Popular'
        ? { sort: 'popular' as const, limit: 25 }
        : { trending: true, limit: 25 }
  ), [activeTab, deferredQuery]);
  const music = useMusic(musicParams);
  const tracks = music.data?.data ?? [];

  const stopPreview = useCallback(async () => {
    const preview = previewRef.current;
    previewRef.current = null;
    setPlayingTrackId(null);
    if (!preview) return;

    try {
      await preview.stopAsync();
    } catch {}
    try {
      await preview.unloadAsync();
    } catch {}
  }, []);

  useEffect(() => () => {
    void stopPreview();
  }, [stopPreview]);

  const togglePreview = useCallback(async (track: MusicTrack) => {
    if (!track.stream_url) return;
    if (playingTrackId === track.id) {
      await stopPreview();
      return;
    }

    await stopPreview();
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
      const { sound } = await Audio.Sound.createAsync({ uri: track.stream_url }, { shouldPlay: true });
      previewRef.current = sound;
      setPlayingTrackId(track.id);
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded || status.didJustFinish) void stopPreview();
      });
    } catch {
      await stopPreview();
    }
  }, [playingTrackId, stopPreview]);

  const selectTrack = useCallback((track: MusicTrack) => {
    if (!track.external_id) return;
    void stopPreview();
    onSelect?.(track);
    onClose?.();
  }, [onClose, onSelect, stopPreview]);

  const screenBackground = isDark ? '#0a050d' : theme.background;
  const panelBackground = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const headerBackground = isDark ? 'rgba(10,5,13,0.82)' : 'rgba(255,255,255,0.9)';
  const rowBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const rowHover = isDark ? 'rgba(255,255,255,0.1)' : theme.card;
  const ringColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
  const subtleText = isDark ? '#94a3b8' : theme.textSecondary;
  const mutedText = isDark ? '#64748b' : theme.textMuted;

  return (
    <View style={[styles.sheetRoot, sheetMode && styles.sheetRootOverlay]}>
      {!sheetMode ? <View style={styles.backdrop} /> : null}
      <View style={[styles.modalCard, sheetMode && styles.sheetCard, { backgroundColor: screenBackground, borderColor: ringColor }]}>
        <View style={[styles.header, { backgroundColor: headerBackground}]}>
          {/* <Pressable style={styles.headerButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color={theme.text} />
          </Pressable> */}
          <Text style={[styles.headerTitle, { color: theme.text }]}>Sound Select</Text>
          {/* <Pressable style={styles.headerButton}>
            <MaterialIcons name="search" size={24} color={theme.text} />
          </Pressable> */}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.searchWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : theme.surface, borderColor: ringColor }]}>
            <MaterialIcons name="search" size={20} color={subtleText} />
            <TextInput includeFontPadding={false}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for sounds"
              placeholderTextColor={subtleText}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[styles.tabButton, { borderBottomColor: isActive ? PRIMARY_COLOR : 'transparent' }]}
                >
                  <Text style={[styles.tabText, { color: isActive ? PRIMARY_COLOR : subtleText }]}>
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="bolt" size={20} color={PRIMARY_COLOR} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {deferredQuery ? 'Search results' : activeTab === 'Popular' ? 'Popular Audio' : 'Trending Audio'}
              </Text>
            </View>
            <View style={styles.hotBadge}>
              <Text style={styles.hotBadgeText}>{deferredQuery ? 'Results' : 'Audius'}</Text>
            </View>
          </View>

          <View style={styles.list}>
            {music.isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator color={PRIMARY_COLOR} />
                <Text style={[styles.emptyStateText, { color: mutedText }]}>Loading music…</Text>
              </View>
            ) : null}

            {!music.isLoading && music.isError ? (
              <Pressable style={styles.emptyState} onPress={() => void music.refetch()}>
                <MaterialIcons name="refresh" size={24} color={PRIMARY_COLOR} />
                <Text style={[styles.emptyStateText, { color: mutedText }]}>Could not load music. Tap to retry.</Text>
              </Pressable>
            ) : null}

            {!music.isLoading && !music.isError && tracks.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="music-off" size={24} color={mutedText} />
                <Text style={[styles.emptyStateText, { color: mutedText }]}>No streamable tracks found.</Text>
              </View>
            ) : null}

            {tracks.map((track) => {
              const isSelected = selectedTrackId === track.id;
              const isPlaying = playingTrackId === track.id;
              const artwork = track.thumbnail_artwork ?? track.large_artwork;

              return (
              <View
                key={track.id}
                style={[
                  styles.trackRow,
                  {
                    backgroundColor: rowBackground,
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : theme.border,
                  },
                ]}
              >
                <View style={styles.trackMain}>
                  <View style={[styles.coverWrap, { borderColor: ringColor }]}>
                    {artwork ? <Image source={{ uri: artwork }} style={styles.coverImage} /> : null}
                    <View style={styles.coverOverlay}>
                      <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={30} color="#fff" />
                    </View>
                  </View>

                  <View style={styles.trackCopy}>
                    <Text style={[styles.trackTitle, { color: theme.text }]} numberOfLines={1}>
                      {track.title || 'Untitled track'}
                    </Text>
                    <Text style={[styles.trackArtist, { color: subtleText }]} numberOfLines={1}>
                      {track.artist || 'Unknown artist'}
                    </Text>
                    <Text style={[styles.trackDuration, { color: mutedText }]}>
                      {formatDuration(track.duration)} · {track.usage_count.toLocaleString()} uses
                    </Text>
                  </View>
                </View>

                <View style={styles.trackActions}>
                  <View style={styles.utilityActions}>
                    <Pressable
                      style={styles.utilityButton}
                      accessibilityRole="button"
                      accessibilityLabel={`${isPlaying ? 'Pause' : 'Play'} ${track.title || 'track'} preview`}
                      disabled={!track.stream_url}
                      onPress={() => void togglePreview(track)}
                    >
                      <MaterialIcons name={isPlaying ? 'pause-circle-outline' : 'play-circle-outline'} size={25} color={PRIMARY_COLOR} />
                    </Pressable>
                  </View>

                  <Pressable
                    style={[
                      styles.selectButton,
                      isSelected
                        ? styles.selectButtonActive
                        : { backgroundColor: rowHover },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Use ${track.title || 'this sound'}`}
                    disabled={!track.external_id}
                    onPress={() => selectTrack(track)}
                  >
                    <MaterialIcons
                      name={isSelected ? 'check' : 'add'}
                      size={22}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const Vote: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <VoteSheetContent />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a050d',
  },
  sheetRoot: {
    flex: 1,
  },
  sheetRootOverlay: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.8)',
  },
  modalCard: {
    flex: 1,
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetCard: {
    flex: 0,
    maxHeight: '84%',
    marginTop: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    ...fontSize.h1, lineHeight: fontSize.h1.lineHeight,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 36,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 7,
    marginBottom: 12,
  },
  searchInput: {
    // flex: 1,
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
    includeFontPadding: false,
  },
  tabsScroll: {
    marginBottom: 24,
  },
  tabsContent: {
    gap: 14,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tabButton: {
    paddingBottom: 7,
    borderBottomWidth: 2,
  },
  tabText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  hotBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: primaryColorAlpha(0.1),
    borderWidth: 1,
    borderColor: primaryColorAlpha(0.2),
  },
  hotBadgeText: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  list: {
    gap: 14,
  },
  emptyState: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    textAlign: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
  },
  trackMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  coverWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  trackCopy: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  trackArtist: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  trackDuration: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    marginTop: 2,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  utilityActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  utilityButton: {
    width: 28,
    height: 28,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
});

export default Vote;
