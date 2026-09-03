import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { EmojiKeyboard, type EmojiType } from 'rn-emoji-keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from '../theme';
import { fontSize } from './typography';
import KulcoinTopUpDrawer from './KulcoinTopUpDrawer';
import { communityApi } from '../src/api/community.api';
import { kulCoinApi } from '../src/api/kulcoin.api';
import {
  useFavoriteStickers,
  useRecentStickers,
  useStickerPack,
  useStickerPacks,
  useStickerSearch,
} from '../src/hooks/stickers/useStickers';
import { useKulCoinGifts, useKulCoinWallet } from '../src/hooks/kulcoin/useKulCoin';
import { queryClient } from '../src/lib/queryClient';
import type { KulCoinGift } from '../src/types/kulcoin.types';
import type { Sticker } from '../src/types/sticker.types';
import { parseApiError } from '../src/utils/apiError';
import type { GiftSelection } from './GiftDialog';

const KULCOIN_ICON = require('../assets/coin.png');

export type ExpressionPickerTab = 'emoji' | 'sticker' | 'gift';

export type ExpressionGiftOptions = {
  creatorName: string;
  currentBalance?: number;
  creatorId?: string | number;
  communityPostId?: string | number;
  message?: string;
  onSendGift?: (gift: GiftSelection) => void | Promise<void>;
  onGiftSent?: (gift: GiftSelection) => void;
  onTopUpSuccess?: (amount: number) => void;
  onRecharge?: () => void;
};

export interface ExpressionPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect?: (stickerUrl: string, sticker?: Sticker) => void | Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  initialTab?: ExpressionPickerTab;
  giftOptions?: ExpressionGiftOptions;
  containerStyle?: StyleProp<ViewStyle>;
}

type GiftCategory = 'all' | string;

type GiftItem = {
  id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  emoji?: string;
  image?: string;
};

const GIFT_EMOJI_BY_CODE: Record<string, string> = {
  rose: '\u{1F339}',
  heart: '\u{1F496}',
  fire: '\u{1F525}',
  trophy: '\u{1F3C6}',
  crown: '\u{1F451}',
  diamond: '\u{1F48E}',
  'super-star': '\u2B50',
  'ankara-glow': '\u{1F9F5}',
  'kente-drip': '\u{1F9E3}',
  'dashiki-style': '\u{1F455}',
  'gele-queen': '\u{1F451}',
  'african-pride': '\u{1F30D}',
  'jollof-love': '\u{1F35B}',
  'suya-spice': '\u{1F356}',
  'injera-feast': '\u{1FAD3}',
  'fufu-bowl': '\u{1F35A}',
  'maize-harvest': '\u{1F33D}',
};

const toGiftItem = (gift: KulCoinGift): GiftItem => ({
  id: String(gift.id),
  code: gift.code,
  name: gift.name,
  price: Number(gift.coin_cost),
  category: gift.category || 'other',
  image: gift.icon_url || undefined,
  emoji: GIFT_EMOJI_BY_CODE[gift.code] ?? '\u{1F381}',
});

const TABS: Array<{ key: ExpressionPickerTab; label: string; icon: 'mood' | 'sticky-note-2' | 'redeem' }> = [
  { key: 'emoji', label: 'Emoji', icon: 'mood' },
  { key: 'sticker', label: 'Stickers', icon: 'sticky-note-2' },
  { key: 'gift', label: 'Gifts', icon: 'redeem' },
];

const ExpressionPicker = React.memo<ExpressionPickerProps>(function ExpressionPicker({
  onEmojiSelect,
  onStickerSelect,
  onClose,
  isOpen,
  initialTab = 'emoji',
  giftOptions,
  containerStyle,
}) {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeTab, setActiveTab] = useState<ExpressionPickerTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [stickerSource, setStickerSource] = useState<'pack' | 'recent' | 'favorites'>('pack');
  const [activePackId, setActivePackId] = useState<number | null>(null);
  const [activeGiftCategory, setActiveGiftCategory] = useState<GiftCategory>('all');
  const [selectedGift, setSelectedGift] = useState<GiftItem | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [isSendingGift, setIsSendingGift] = useState(false);

  const stickersEnabled = isOpen && activeTab === 'sticker';
  const packsQuery = useStickerPacks(stickersEnabled);
  const packQuery = useStickerPack(activePackId, stickersEnabled && stickerSource === 'pack');
  const recentQuery = useRecentStickers(stickersEnabled && stickerSource === 'recent');
  const favoritesQuery = useFavoriteStickers(stickersEnabled && stickerSource === 'favorites');
  const searchStickersQuery = useStickerSearch(
    debouncedSearchQuery,
    stickersEnabled && debouncedSearchQuery.length > 0,
  );

  const hasBackendGiftRecipient = Boolean(
    (giftOptions?.communityPostId != null && giftOptions.communityPostId !== '')
      || (giftOptions?.creatorId != null && giftOptions.creatorId !== ''),
  );
  const giftsEnabled = isOpen && activeTab === 'gift' && Boolean(giftOptions);
  const giftsQuery = useKulCoinGifts(giftsEnabled);
  const walletQuery = useKulCoinWallet(giftsEnabled && hasBackendGiftRecipient);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setStickerSource('pack');
      setActiveGiftCategory('all');
      setSelectedGift(null);
    } else {
      setTopUpOpen(false);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (activePackId === null && packsQuery.data?.items.length) {
      setActivePackId(packsQuery.data.items[0].id);
    }
  }, [activePackId, packsQuery.data]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const activeStickerQuery = stickerSource === 'recent'
    ? recentQuery
    : stickerSource === 'favorites'
      ? favoritesQuery
      : packQuery;

  const isSearchingStickers = debouncedSearchQuery.length > 0;
  const stickers = isSearchingStickers
    ? searchStickersQuery.data?.items ?? []
    : activeStickerQuery.data?.items ?? [];
  const stickersLoading = isSearchingStickers
    ? searchStickersQuery.isLoading || searchQuery.trim() !== debouncedSearchQuery
    : activeStickerQuery.isLoading || (stickerSource === 'pack' && packsQuery.isLoading);
  const stickersError = isSearchingStickers ? searchStickersQuery.error : activeStickerQuery.error;

  const giftCatalog = useMemo(
    () => (giftsQuery.data ?? [])
      .filter((gift) => gift.is_active)
      .sort((left, right) => left.sort_order - right.sort_order)
      .map(toGiftItem),
    [giftsQuery.data],
  );
  const giftCategories = useMemo<GiftCategory[]>(
    () => ['all', ...Array.from(new Set(giftCatalog.map((gift) => gift.category)))],
    [giftCatalog],
  );
  const gifts = useMemo(
    () => (activeGiftCategory === 'all'
      ? giftCatalog
      : giftCatalog.filter((gift) => gift.category === activeGiftCategory)),
    [activeGiftCategory, giftCatalog],
  );

  const resolvedBalance = hasBackendGiftRecipient
    ? (walletQuery.data?.total_kc ?? giftOptions?.currentBalance ?? 0)
    : (giftOptions?.currentBalance ?? 0);
  const isBalanceLoading = hasBackendGiftRecipient && walletQuery.isLoading;
  const isBalanceKnown = !hasBackendGiftRecipient || walletQuery.isSuccess || resolvedBalance > 0;
  const hasInsufficientBalance = Boolean(
    selectedGift && isBalanceKnown && resolvedBalance < selectedGift.price,
  );

  const selectTab = (tab: ExpressionPickerTab) => {
    setActiveTab(tab);
    if (tab !== 'sticker') {
      setSearchQuery('');
    }
  };

  const handleStickerPress = async (sticker: Sticker) => {
    if (!onStickerSelect) return;
    await onStickerSelect(sticker.media_url, sticker);
    onClose();
  };

  const handleGiftSend = async () => {
    if (!selectedGift || !giftOptions || isSendingGift) return;

    if (hasInsufficientBalance) {
      if (giftOptions.onRecharge) {
        onClose();
        giftOptions.onRecharge();
      } else {
        setTopUpOpen(true);
      }
      return;
    }

    const selection: GiftSelection = {
      id: selectedGift.id,
      name: selectedGift.name,
      price: selectedGift.price,
      icon: selectedGift.emoji ?? selectedGift.image ?? 'redeem',
      isImage: Boolean(selectedGift.image),
    };

    setIsSendingGift(true);
    try {
      const payload = {
        gift_id: Number(selectedGift.id),
        quantity: 1,
        message: giftOptions.message?.trim() || undefined,
        idempotency_key: `gift-${giftOptions.communityPostId ?? giftOptions.creatorId ?? 'legacy'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        device_info: { platform: Platform.OS },
      };

      if (giftOptions.communityPostId != null && giftOptions.communityPostId !== '') {
        await communityApi.giftPost(giftOptions.communityPostId, payload);
        await queryClient.invalidateQueries({ queryKey: ['community'] });
      } else if (giftOptions.creatorId != null && giftOptions.creatorId !== '') {
        await kulCoinApi.sendGift({ ...payload, creator_id: giftOptions.creatorId });
      } else if (giftOptions.onSendGift) {
        await giftOptions.onSendGift(selection);
      } else {
        throw new Error('A gift recipient is required.');
      }

      await queryClient.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] });
      giftOptions.onGiftSent?.(selection);
      if (hasBackendGiftRecipient) {
        Alert.alert('Gift sent', `${selection.name} was sent to ${giftOptions.creatorName}.`);
      }
      setSelectedGift(null);
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setIsSendingGift(false);
    }
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable accessibilityLabel="Close expression picker" style={styles.backdrop} onPress={onClose} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? '#111116' : '#ffffff',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 8),
              },
              containerStyle,
            ]}
          >
            <View style={styles.tabs}>
              {TABS.map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${tab.label} tab`}
                    accessibilityHint={`Switch to ${tab.label.toLowerCase()} expressions`}
                    onPress={() => selectTab(tab.key)}
                    style={styles.tabButton}
                  >
                    <MaterialIcons name={tab.icon} size={22} color={active ? PRIMARY_COLOR : theme.textMuted} />
                  </Pressable>
                );
              })}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={20} color={theme.textMuted} />
              </Pressable>
            </View>

            {activeTab === 'emoji' ? (
              <View style={[styles.emojiPanel, { backgroundColor: isDark ? '#111116' : '#ffffff' }]}>
                <EmojiKeyboard
                  onEmojiSelected={(selection: EmojiType) => onEmojiSelect(selection.emoji)}
                  emojiSize={20}
                  enableRecentlyUsed
                  hideHeader
                  disableSafeArea
                  styles={{
                    container: {
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      overflow: 'hidden',
                    },
                  }}
                  theme={{
                    backdrop: isDark ? '#000000aa' : '#0f172a55',
                    container: isDark ? '#111116' : '#ffffff',
                    header: theme.text,
                    category: {
                      icon: theme.textMuted,
                      iconActive: PRIMARY_COLOR,
                      container: isDark ? '#1c1c23' : '#f1f5f9',
                      containerActive: isDark ? '#2a172d' : '#f3e8ff',
                    },
                    emoji: {
                      selected: primaryColorAlpha(0.18),
                    },
                  }}
                />
              </View>
            ) : null}

            {activeTab === 'sticker' ? (
              <View style={styles.panel}>
                <View style={[styles.searchField, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <MaterialIcons name="search" size={20} color={theme.textMuted} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search stickers"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                      <MaterialIcons name="close" size={18} color={theme.textMuted} />
                    </Pressable>
                  ) : null}
                </View>

                {!isSearchingStickers ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionTabs}>
                    <Pressable
                      onPress={() => setStickerSource('recent')}
                      style={[
                        styles.collectionChip,
                        { borderColor: stickerSource === 'recent' ? PRIMARY_COLOR : theme.border },
                      ]}
                    >
                      <MaterialIcons
                        name="history"
                        size={15}
                        color={stickerSource === 'recent' ? PRIMARY_COLOR : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.collectionChipText,
                          { color: stickerSource === 'recent' ? PRIMARY_COLOR : theme.textMuted },
                        ]}
                      >
                        Recent
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setStickerSource('favorites')}
                      style={[
                        styles.collectionChip,
                        { borderColor: stickerSource === 'favorites' ? PRIMARY_COLOR : theme.border },
                      ]}
                    >
                      <MaterialIcons
                        name="favorite-border"
                        size={15}
                        color={stickerSource === 'favorites' ? PRIMARY_COLOR : theme.textMuted}
                      />
                      <Text
                        style={[
                          styles.collectionChipText,
                          { color: stickerSource === 'favorites' ? PRIMARY_COLOR : theme.textMuted },
                        ]}
                      >
                        Favorites
                      </Text>
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
                          style={[
                            styles.collectionChip,
                            { borderColor: selected ? PRIMARY_COLOR : theme.border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.collectionChipText,
                              { color: selected ? PRIMARY_COLOR : theme.textMuted },
                            ]}
                          >
                            {pack.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.stickerGrid}>
                  {stickers.map((sticker) => (
                    <Pressable
                      key={sticker.id}
                      onPress={() => void handleStickerPress(sticker)}
                      style={[styles.stickerCard, { backgroundColor: theme.surface }]}
                    >
                      <Image
                        source={{ uri: sticker.thumbnail_url || sticker.media_url }}
                        style={styles.stickerImage}
                        resizeMode="contain"
                      />
                    </Pressable>
                  ))}
                  {stickersLoading ? (
                    <View style={styles.fullState}>
                      <ActivityIndicator color={PRIMARY_COLOR} />
                      <Text style={[styles.stateText, { color: theme.textMuted }]}>Loading stickers...</Text>
                    </View>
                  ) : null}
                  {stickersError && !stickersLoading ? (
                    <Pressable
                      onPress={() => void (isSearchingStickers ? searchStickersQuery.refetch() : activeStickerQuery.refetch())}
                      style={styles.fullState}
                    >
                      <Text style={[styles.stateText, { color: theme.textMuted }]}>Could not load stickers. Tap to retry.</Text>
                    </Pressable>
                  ) : null}
                  {!stickersLoading && !stickersError && stickers.length === 0 ? (
                    <Text style={[styles.stateText, styles.fullState, { color: theme.textMuted }]}>No stickers found.</Text>
                  ) : null}
                </ScrollView>
              </View>
            ) : null}

            {activeTab === 'gift' ? (
              <View style={styles.panel}>
                {giftOptions ? (
                  <>
                    <View style={styles.giftHeader}>
                      <Text style={[styles.giftHeading, { color: theme.text }]}>
                        Send a gift to {giftOptions.creatorName}
                      </Text>
                      <View style={[styles.balancePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Image source={KULCOIN_ICON} style={styles.coinIcon} />
                        {isBalanceLoading ? (
                          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                        ) : (
                          <Text style={[styles.balanceValue, { color: theme.text }]}>{resolvedBalance}</Text>
                        )}
                      </View>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collectionTabs}>
                      {giftCategories.map((category) => {
                        const selected = activeGiftCategory === category;
                        return (
                          <Pressable
                            key={category}
                            onPress={() => {
                              setActiveGiftCategory(category);
                              setSelectedGift(null);
                            }}
                            style={[
                              styles.giftCategory,
                              { backgroundColor: selected ? PRIMARY_COLOR : theme.surface },
                            ]}
                          >
                            <Text
                              style={[
                                styles.collectionChipText,
                                { color: selected ? '#ffffff' : theme.textMuted },
                              ]}
                            >
                              {category}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.giftGrid}>
                      {gifts.map((gift) => {
                        const selected = selectedGift?.id === gift.id;
                        return (
                          <Pressable
                            key={gift.id}
                            disabled={isSendingGift}
                            onPress={() => setSelectedGift(gift)}
                            style={[
                              styles.giftCard,
                              {
                                backgroundColor: theme.surface,
                                borderColor: selected ? PRIMARY_COLOR : 'transparent',
                              },
                            ]}
                          >
                            <View style={[styles.giftMedia, { backgroundColor: isDark ? '#24242b' : '#eef2f7' }]}>
                              {gift.image ? (
                                <Image source={{ uri: gift.image }} style={styles.giftImage} resizeMode="contain" />
                              ) : (
                                <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                              )}
                            </View>
                            <Text style={[styles.giftName, { color: theme.text }]} numberOfLines={1}>
                              {gift.name}
                            </Text>
                            <View style={styles.giftPriceRow}>
                              <Image source={KULCOIN_ICON} style={styles.giftCoinIcon} />
                              <Text style={[styles.giftPrice, { color: theme.textMuted }]}>{gift.price}</Text>
                            </View>
                          </Pressable>
                        );
                      })}
                      {giftsQuery.isLoading ? (
                        <View style={styles.fullState}>
                          <ActivityIndicator color={PRIMARY_COLOR} />
                          <Text style={[styles.stateText, { color: theme.textMuted }]}>Loading gifts...</Text>
                        </View>
                      ) : null}
                      {giftsQuery.isError ? (
                        <Pressable onPress={() => void giftsQuery.refetch()} style={styles.fullState}>
                          <Text style={[styles.stateText, { color: theme.textMuted }]}>Could not load gifts. Tap to retry.</Text>
                        </Pressable>
                      ) : null}
                      {!giftsQuery.isLoading && !giftsQuery.isError && gifts.length === 0 ? (
                        <Text style={[styles.stateText, styles.fullState, { color: theme.textMuted }]}>No gifts available.</Text>
                      ) : null}
                    </ScrollView>

                    <View style={[styles.giftFooter, { borderTopColor: theme.border }]}>
                      <Text style={[styles.selectedGiftText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {selectedGift ? `${selectedGift.name} - ${selectedGift.price} KC` : 'Select a gift'}
                      </Text>
                      <Pressable
                        onPress={() => void handleGiftSend()}
                        disabled={!selectedGift || isSendingGift || isBalanceLoading}
                        style={[
                          styles.sendGiftButton,
                          (!selectedGift || isSendingGift || isBalanceLoading) && styles.disabledButton,
                        ]}
                      >
                        {isSendingGift ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.sendGiftText}>{hasInsufficientBalance ? 'Recharge' : 'Send'}</Text>
                        )}
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <View style={styles.fullState}>
                    <MaterialIcons name="redeem" size={34} color={theme.textMuted} />
                    <Text style={[styles.stateText, { color: theme.textMuted }]}>
                      Gifts are unavailable for this conversation.
                    </Text>
                  </View>
                )}
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      <KulcoinTopUpDrawer
        currentBalance={resolvedBalance}
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSuccess={(amount) => {
          giftOptions?.onTopUpSuccess?.(amount);
          void walletQuery.refetch();
          setTopUpOpen(false);
        }}
        warningText="Insufficient Balance to Send Gift"
      />
    </>
  );
});

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: {
    height: '40%',
    minHeight: 240,
    maxHeight: '40%',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  tabs: { height: 45, flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 8 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative' },
  tabText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  tabIndicator: { position: 'absolute', left: 14, right: 14, bottom: 0, height: 3, borderRadius: 2 },
  closeButton: { width: 42, alignItems: 'center', justifyContent: 'center' },
  emojiPanel: { flex: 1, minHeight: 0 },
  panel: { flex: 1, minHeight: 0, paddingTop: 12 },
  searchField: {
    height: 44,
    marginHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, height: 42, paddingVertical: 0, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  collectionTabs: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  collectionChip: { minHeight: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  collectionChipText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textTransform: 'capitalize' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 20, gap: 10 },
  stickerCard: { width: '31%', aspectRatio: 1, borderRadius: 16, padding: 7 },
  stickerImage: { width: '100%', height: '100%' },
  fullState: { width: '100%', minHeight: 160, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },
  stateText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight, textAlign: 'center' },
  giftHeader: { paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  giftHeading: { flex: 1, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  balancePill: { height: 36, minWidth: 72, paddingHorizontal: 10, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  coinIcon: { width: 22, height: 22, resizeMode: 'contain' },
  balanceValue: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  giftCategory: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, justifyContent: 'center' },
  giftGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, paddingBottom: 16, gap: 9 },
  giftCard: { width: '31%', borderRadius: 18, borderWidth: 2, padding: 8, alignItems: 'center', gap: 4 },
  giftMedia: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  giftImage: { width: '100%', height: '100%' },
  giftEmoji: { fontSize: 29 },
  giftName: { width: '100%', textAlign: 'center', ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  giftPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  giftCoinIcon: { width: 14, height: 14 },
  giftPrice: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  giftFooter: { minHeight: 62, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectedGiftText: { flex: 1, ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  sendGiftButton: { minWidth: 96, height: 42, borderRadius: 21, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  disabledButton: { opacity: 0.42 },
  sendGiftText: { color: '#ffffff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
});

export default ExpressionPicker;
