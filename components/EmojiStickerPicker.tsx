import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { useThemeMode } from '../theme';
import { mediumScreen } from '../types';

type PickerTab = 'emoji' | 'sticker';

export interface EmojiStickerPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (stickerUrl: string) => void;
  onClose: () => void;
  isOpen: boolean;
  initialTab?: PickerTab;
  containerStyle?: StyleProp<ViewStyle>;
}

type StickerItem = {
  id: string;
  url: string;
  label: string;
};

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

const STICKERS: StickerItem[] = [
  { id: 's1', url: 'https://picsum.photos/seed/sticker1/200', label: 'Vibe' },
  { id: 's2', url: 'https://picsum.photos/seed/sticker2/200', label: 'Energy' },
  { id: 's3', url: 'https://picsum.photos/seed/sticker3/200', label: 'Cosmic' },
  { id: 's4', url: 'https://picsum.photos/seed/sticker4/200', label: 'Synth' },
  { id: 's5', url: 'https://picsum.photos/seed/sticker5/200', label: 'Galaxy' },
  { id: 's6', url: 'https://picsum.photos/seed/sticker6/200', label: 'Neon' },
  { id: 's7', url: 'https://picsum.photos/seed/sticker7/200', label: 'Retro' },
  { id: 's8', url: 'https://picsum.photos/seed/sticker8/200', label: 'Wave' },
  { id: 's9', url: 'https://picsum.photos/seed/sticker9/200', label: 'Pulse' },
];

const EmojiStickerPicker: React.FC<EmojiStickerPickerProps> = ({
  onEmojiSelect,
  onStickerSelect,
  onClose,
  isOpen,
  initialTab = 'emoji',
  containerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [initialTab, isOpen]);

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

  const filteredStickers = useMemo(() => {
    if (!normalizedQuery) {
      return STICKERS;
    }

    return STICKERS.filter((sticker) =>
      sticker.label.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery]);

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
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: showSearch ? "#cd2bee": theme.border }]}
            >
              <MaterialIcons name="search" size={18} color={theme.textSecondary} />
            </Pressable>
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

            <Pressable
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <MaterialIcons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          {showSearch ? (
            <View style={[styles.searchWrap, { borderBottomColor: theme.border }]}>
              <View
                style={[
                  styles.searchField,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <MaterialIcons name={activeTab === 'emoji' ? "mood": "sticky-note-2"} size={18} color={theme.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search ${activeTab === 'emoji' ? 'emojis' : 'stickers'}`}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                  autoFocus
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <MaterialIcons name="close" size={18} color={theme.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
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
              <View style={[styles.stickerGrid, {justifyContent: searchQuery ? "flex-start":"space-between"}]}>
                {filteredStickers.map((sticker) => (
                  <Pressable
                    key={sticker.id}
                    onPress={() => onStickerSelect(sticker.url)}
                    style={[
                      styles.stickerCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Image source={{ uri: sticker.url }} style={styles.stickerImage} />
                    <View style={styles.stickerLabelWrap}>
                      <Text style={styles.stickerLabel}>{sticker.label}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {activeTab === 'emoji' && filteredEmojis.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No emojis found.</Text>
            ) : null}

            {activeTab === 'sticker' && filteredStickers.length === 0 ? (
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
};

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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(8),
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
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(9),
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
    fontSize: mediumScreen ? 26: 16,
    // lineHeight: 22
  },
  stickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6.5),
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6.5),
    textTransform: 'uppercase',
    letterSpacing: 2.4,
  },
  emptyText: {
    textAlign: 'center',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(8),
    paddingVertical: 18,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default EmojiStickerPicker;
