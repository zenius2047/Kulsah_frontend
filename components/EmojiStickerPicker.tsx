import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR } from "../theme";
import { mediumScreen } from '../types';
import KulsahInputBar from './KulsahInputBar';
import { fontSize } from './typography';
import {
  useFavoriteStickers,
  useRecentStickers,
  useStickerPack,
  useStickerPacks,
  useStickerSearch,
} from '../src/hooks/stickers/useStickers';
import type { Sticker } from '../src/types/sticker.types';

type PickerTab = 'emoji' | 'sticker';

export interface EmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (stickerUrl: string, sticker?: Sticker) => void;
  onClose: () => void;
  isOpen: boolean;
  initialTab?: PickerTab;
  stickerOnly?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

type EmojiItem = {
  symbol: string;
  label: string;
};

const EMOJIS: EmojiItem[] = [
  { symbol: '\u{1F525}', label: 'fire' },
  { symbol: '\u{1F30C}', label: 'galaxy' },
  { symbol: '\u2728', label: 'sparkles' },
  { symbol: '\u{1F3A7}', label: 'headphones' },
  { symbol: '\u{1F64C}', label: 'celebration' },
  { symbol: '\u{1F4AF}', label: 'hundred' },
  { symbol: '\u2764\uFE0F', label: 'heart' },
  { symbol: '\u{1F680}', label: 'rocket' },
  { symbol: '\u{1F60D}', label: 'love eyes' },
  { symbol: '\u{1F44F}', label: 'clap' },
  { symbol: '\u26A1', label: 'lightning' },
  { symbol: '\u{1F48E}', label: 'diamond' },
  { symbol: '\u{1F308}', label: 'rainbow' },
  { symbol: '\u{1F3B8}', label: 'guitar' },
  { symbol: '\u{1F3B9}', label: 'piano' },
  { symbol: '\u{1F3A4}', label: 'microphone' },
  { symbol: '\u{1F3AC}', label: 'clapper' },
  { symbol: '\u{1F37F}', label: 'popcorn' },
  { symbol: '\u{1F3A8}', label: 'art' },
  { symbol: '\u{1F47E}', label: 'arcade alien' },
  { symbol: '\u{1F6F8}', label: 'flying saucer' },
  { symbol: '\u{1FA90}', label: 'ringed planet' },
  { symbol: '\u{1F31F}', label: 'glowing star' },
  { symbol: '\u{1F319}', label: 'moon' },
];

const EmojiStickerPicker = React.memo<EmojiStickerPickerProps>(function EmojiStickerPicker({
  onEmojiSelect,
  onStickerSelect,
  onClose,
  isOpen,
  initialTab = 'emoji',
  stickerOnly = false,
  containerStyle,
}) {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [stickerSource, setStickerSource] = useState<'pack' | 'recent' | 'favorites'>('pack');
  const [activePackId, setActivePackId] = useState<number | null>(null);

  const stickersEnabled = isOpen && (stickerOnly || activeTab === 'sticker');
  const packsQuery = useStickerPacks(stickersEnabled);
  const packQuery = useStickerPack(activePackId, stickersEnabled && stickerSource === 'pack');
  const recentQuery = useRecentStickers(stickersEnabled && stickerSource === 'recent');
  const favoritesQuery = useFavoriteStickers(stickersEnabled && stickerSource === 'favorites');
  const searchStickersQuery = useStickerSearch(
    debouncedSearchQuery,
    stickersEnabled && showSearch && debouncedSearchQuery.length > 0,
  );

  useEffect(() => {
    if (isOpen) {
      setActiveTab(stickerOnly ? 'sticker' : initialTab);
      setShowSearch(false);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setStickerSource('pack');
    }
  }, [initialTab, isOpen, stickerOnly]);

  useEffect(() => {
    if (activePackId === null && packsQuery.data?.items.length) {
      setActivePackId(packsQuery.data.items[0].id);
    }
  }, [activePackId, packsQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const surfaceColor = useMemo(
    () => (isDark ? 'rgba(12,14,20,0.94)' : 'rgba(255,255,255,0.94)'),
    [isDark]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredEmojis = useMemo(() => {
    if (!normalizedQuery) {
      return EMOJIS;
    }

    return EMOJIS.filter(
      (emoji) =>
        emoji.label.toLowerCase().includes(normalizedQuery) ||
        emoji.symbol.includes(searchQuery)
    );
  }, [normalizedQuery, searchQuery]);

  const activeStickerQuery = stickerSource === 'recent'
    ? recentQuery
    : stickerSource === 'favorites'
      ? favoritesQuery
      : packQuery;
  const isSearchingStickers = showSearch && debouncedSearchQuery.length > 0;
  const stickers = isSearchingStickers
    ? searchStickersQuery.data?.items ?? []
    : activeStickerQuery.data?.items ?? [];
  const stickersLoading = isSearchingStickers
    ? searchStickersQuery.isLoading || searchQuery.trim() !== debouncedSearchQuery
    : activeStickerQuery.isLoading || (stickerSource === 'pack' && packsQuery.isLoading);
  const stickersError = isSearchingStickers ? searchStickersQuery.error : activeStickerQuery.error;

  if (!isOpen) {
    return null;
  }

  return (
    <View style={[styles.overlay, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      <View style={[styles.sheetWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <BlurView
          intensity={isDark ? 28 : 36}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.sheet,
            {
              backgroundColor: surfaceColor,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Pressable
              onPress={() => {
                setShowSearch((prev) => !prev);
                setSearchQuery('');
              }}
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: showSearch ? PRIMARY_COLOR: theme.border }]}
            >
              <MaterialIcons name="search" size={18} color={theme.textSecondary} />
            </Pressable>
            {stickerOnly ? (
              <View style={[styles.tabWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.tabText, { color: theme.accent }]}>Stickers</Text>
              </View>
            ) : (
            <View style={[styles.tabWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Pressable
                onPress={() => setActiveTab('emoji')}
                style={[
                  styles.tabButton,
                  activeTab === 'emoji'
                    ? [styles.tabButtonActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff' }]
                    : null,
                ]}
              >
                <Text style={[styles.tabText, { color: activeTab === 'emoji' ? theme.accent : theme.textMuted }]}>
                  Emojis
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('sticker')}
                style={[
                  styles.tabButton,
                  activeTab === 'sticker'
                    ? [styles.tabButtonActive, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff' }]
                    : null,
                ]}
              >
                <Text style={[styles.tabText, { color: activeTab === 'sticker' ? theme.accent : theme.textMuted }]}>
                  Stickers
                </Text>
              </Pressable>
            </View>
            )}

            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <MaterialIcons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {showSearch ? (
            <View style={[styles.searchWrap, { borderBottomColor: theme.border }]}>
              <KulsahInputBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search ${activeTab === 'emoji' ? 'emojis' : 'stickers'}`}
                  placeholderTextColor={theme.textMuted}
                  containerStyle={[
                    styles.searchField,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                  inputStyle={[styles.searchInput, { color: theme.text }]}
                  autoFocus
                  leftAccessory={<MaterialIcons name={activeTab === 'emoji' ? "mood": "sticky-note-2"} size={18} color={theme.textMuted} />}
                  rightAccessory={searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <MaterialIcons name="close" size={18} color={theme.textMuted} />
                    </Pressable>
                  ) : null}
                />
            </View>
          ) : null}

          {activeTab === 'sticker' && !isSearchingStickers ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.collectionTabs, { borderBottomColor: theme.border }]}
            >
              <Pressable
                onPress={() => setStickerSource('recent')}
                style={[styles.collectionChip, { borderColor: stickerSource === 'recent' ? PRIMARY_COLOR : theme.border }]}
              >
                <MaterialIcons name="history" size={15} color={stickerSource === 'recent' ? PRIMARY_COLOR : theme.textMuted} />
                <Text style={[styles.collectionChipText, { color: stickerSource === 'recent' ? PRIMARY_COLOR : theme.textMuted }]}>Recent</Text>
              </Pressable>
              <Pressable
                onPress={() => setStickerSource('favorites')}
                style={[styles.collectionChip, { borderColor: stickerSource === 'favorites' ? PRIMARY_COLOR : theme.border }]}
              >
                <MaterialIcons name="favorite-border" size={15} color={stickerSource === 'favorites' ? PRIMARY_COLOR : theme.textMuted} />
                <Text style={[styles.collectionChipText, { color: stickerSource === 'favorites' ? PRIMARY_COLOR : theme.textMuted }]}>Favorites</Text>
              </Pressable>
              {packsQuery.data?.items.map((pack) => {
                const selected = stickerSource === 'pack' && activePackId === pack.id;
                return (
                  <Pressable
                    key={pack.id}
                    onPress={() => {
                      setActivePackId(pack.id);
                      setStickerSource('pack');
                    }}
                    style={[styles.collectionChip, { borderColor: selected ? PRIMARY_COLOR : theme.border }]}
                  >
                    <Text style={[styles.collectionChipText, { color: selected ? PRIMARY_COLOR : theme.textMuted }]}>{pack.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'emoji' ? (
              <View style={[styles.emojiGrid, {justifyContent: 'flex-start', gap: mediumScreen ? 13: 20}]}>
                {filteredEmojis.map((emoji) => (
                  <Pressable
                    key={`${emoji.label}-${emoji.symbol}`}
                    onPress={() => onEmojiSelect(emoji.symbol)}
                    style={[styles.emojiButton, { backgroundColor: theme.surface }]}
                  >
                    <Text style={styles.emojiText}>{emoji.symbol}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={[styles.stickerGrid, { justifyContent: searchQuery ? 'flex-start' : 'space-between' }]}>
                {stickers.map((sticker) => (
                  <Pressable
                    key={sticker.id}
                    onPress={() => onStickerSelect(sticker.media_url, sticker)}
                    style={[
                      styles.stickerCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image source={{ uri: sticker.thumbnail_url || sticker.media_url }} style={styles.stickerImage} />
                    <View style={styles.stickerLabelWrap}>
                      <Text style={styles.stickerLabel} numberOfLines={1}>{sticker.name}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === 'emoji' && filteredEmojis.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No emojis found.</Text>
            ) : null}

            {activeTab === 'sticker' && stickersLoading ? (
              <View style={styles.stickerState}>
                <ActivityIndicator color={PRIMARY_COLOR} />
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Loading stickers...</Text>
              </View>
            ) : null}

            {activeTab === 'sticker' && stickersError && !stickersLoading ? (
              <Pressable
                onPress={() => void (isSearchingStickers ? searchStickersQuery.refetch() : activeStickerQuery.refetch())}
                style={styles.stickerState}
              >
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>Could not load stickers. Tap to retry.</Text>
              </Pressable>
            ) : null}

            {activeTab === 'sticker' && !stickersLoading && !stickersError && stickers.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No stickers found.</Text>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <Text style={[styles.footerText, { color: theme.textMuted }]}>Kulsah Expression Engine</Text>
          </View>
        </BlurView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    paddingHorizontal: 16,
  },
  sheet: {
    overflow: 'hidden',
    borderRadius: 32,
    borderWidth: 1,
    maxHeight: 420,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  tabWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
  },
  tabButton: {
    minWidth: 96,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  tabText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  searchField: {
    minHeight: 44,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minHeight: 40,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  scrollContent: {
    padding: 16,
  },emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: 13,
    // justifyContent: 'flex-start',
  },
  emojiButton: {
    // width: mediumScreen ? '14%': '15%',
    // aspectRatio: 2,
    borderRadius: 999,
    // alignItems: 'flex-start',
    // justifyContent: 'flex-start',
    padding: 5
  },
  emojiText: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    // lineHeight: 22
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  collectionTabs: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  collectionChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  collectionChipText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  stickerState: {
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerCard: {
    width: '30.5%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
  stickerLabelWrap: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  stickerLabel: {
    color: '#ffffff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  footerText: {
    textAlign: 'center',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  emptyText: {
    textAlign: 'center',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    paddingVertical: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default EmojiStickerPicker;
