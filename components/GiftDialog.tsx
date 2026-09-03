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
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import KulcoinTopUpDrawer from './KulcoinTopUpDrawer';
import KulsahInputBar from './KulsahInputBar';
import { fontSize } from './typography';
import { communityApi } from '../src/api/community.api';
import { kulCoinApi } from '../src/api/kulcoin.api';
import { useKulCoinGifts, useKulCoinWallet } from '../src/hooks/kulcoin/useKulCoin';
import { queryClient } from '../src/lib/queryClient';
import type { KulCoinGift } from '../src/types/kulcoin.types';
import { parseApiError } from '../src/utils/apiError';

const KULCOIN_ICON = require('../assets/coin.png');

type GiftCategory = 'all' | string;

export type GiftSelection = {
  id: string;
  name: string;
  price: number;
  icon: string;
  isImage?: boolean;
};

type GiftItem = {
  id: string;
  code: string;
  name: string;
  price: number;
  category: string;
  emoji?: string;
  image?: string;
};

interface GiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  currentBalance?: number;
  creatorId?: string | number;
  communityPostId?: string | number;
  message?: string;
  onSendGift?: (gift: GiftSelection) => void | Promise<void>;
  onGiftSent?: (gift: GiftSelection) => void;
  onTopUpSuccess?: (amount: number) => void;
  onRecharge?: () => void;
}

const GIFT_EMOJI_BY_CODE: Record<string, string> = {
  rose: '\u{1F339}', heart: '\u{1F496}', fire: '\u{1F525}', trophy: '\u{1F3C6}',
  crown: '\u{1F451}', diamond: '\u{1F48E}', 'super-star': '\u2B50',
  'ankara-glow': '\u{1F9F5}', 'kente-drip': '\u{1F9E3}', 'dashiki-style': '\u{1F455}',
  'gele-queen': '\u{1F451}', 'african-pride': '\u{1F30D}', 'jollof-love': '\u{1F35B}',
  'suya-spice': '\u{1F356}', 'injera-feast': '\u{1FAD3}', 'fufu-bowl': '\u{1F35A}',
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

const GiftDialog: React.FC<GiftDialogProps> = ({
  isOpen,
  onClose,
  creatorName,
  currentBalance = 0,
  creatorId,
  communityPostId,
  message,
  onSendGift,
  onGiftSent,
  onTopUpSuccess,
  onRecharge,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeCategory, setActiveCategory] = useState<GiftCategory>('all');
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const hasBackendRecipient = (communityPostId != null && communityPostId !== '') || (creatorId != null && creatorId !== '');
  const giftsQuery = useKulCoinGifts(isOpen);
  const walletQuery = useKulCoinWallet(isOpen && hasBackendRecipient);

  useEffect(() => {
    if (!isOpen) {
      setTopUpOpen(false);
      setSelectedItem(null);
      setActiveCategory('all');
    }
  }, [isOpen]);

  const catalog = useMemo(() => (giftsQuery.data ?? [])
    .filter((gift) => gift.is_active)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(toGiftItem), [giftsQuery.data]);
  const categories = useMemo<GiftCategory[]>(
    () => ['all', ...Array.from(new Set(catalog.map((gift) => gift.category)))],
    [catalog],
  );
  const items = useMemo(
    () => activeCategory === 'all' ? catalog : catalog.filter((gift) => gift.category === activeCategory),
    [activeCategory, catalog],
  );
  const resolvedBalance = hasBackendRecipient ? (walletQuery.data?.total_kc ?? currentBalance) : currentBalance;
  const isBalanceLoading = hasBackendRecipient && walletQuery.isLoading;
  const isBalanceKnown = !hasBackendRecipient || walletQuery.isSuccess || currentBalance > 0;

  const handleCategoryChange = (category: GiftCategory) => {
    setActiveCategory(category);
    setSelectedItem(null);
  };

  const hasInsufficientBalance = !!selectedItem && isBalanceKnown && resolvedBalance < selectedItem.price;

  const handleSend = async () => {
    if (!selectedItem || isSending) return;

    if (hasInsufficientBalance) {
      if (onRecharge) {
        onRecharge();
        return;
      }
      setTopUpOpen(true);
      return;
    }

    const selection: GiftSelection = {
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      icon: selectedItem.emoji ?? selectedItem.image ?? 'redeem',
      isImage: !!selectedItem.image,
    };

    setIsSending(true);
    try {
      const payload = {
        gift_id: Number(selectedItem.id),
        quantity: 1,
        message: message?.trim() || undefined,
        idempotency_key: `gift-${communityPostId ?? creatorId ?? 'legacy'}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        device_info: { platform: Platform.OS },
      };

      if (communityPostId != null && communityPostId !== '') {
        await communityApi.giftPost(communityPostId, payload);
        await queryClient.invalidateQueries({ queryKey: ['community'] });
      } else if (creatorId != null && creatorId !== '') {
        await kulCoinApi.sendGift({ ...payload, creator_id: creatorId });
      } else if (onSendGift) {
        await onSendGift(selection);
      } else {
        throw new Error('A gift recipient is required.');
      }

      await queryClient.invalidateQueries({ queryKey: ['kulcoin', 'wallet'] });
      onGiftSent?.(selection);
      if (communityPostId != null || creatorId != null) {
        Alert.alert('Gift sent', `${selection.name} was sent to ${creatorName}.`);
      }
      setSelectedItem(null);
      onClose();
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />

          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? '#0F0F12' : '#ffffff',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 20),
              },
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.content}>
            <KulsahInputBar
                placeholder={`Send a gift to ${creatorName}...`}
                placeholderTextColor={theme.textMuted}
                containerStyle={[styles.fakeInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderColor: theme.border }]}
                inputStyle={[styles.fakeInputText, { color: theme.text }]}
                editable={false}
              />

            {/* <View style={styles.toolbar}>
              <View style={styles.toolbarLeft}>
                <Pressable style={styles.toolbarIcon}>
                  <MaterialIcons name="image" size={22} color={theme.textMuted} />
                </Pressable>
                <Pressable style={styles.toolbarIcon}>
                  <MaterialIcons name="sentiment-satisfied" size={22} color={theme.textMuted} />
                </Pressable>
                <Pressable style={styles.toolbarIcon}>
                  <MaterialIcons name="alternate-email" size={22} color={theme.textMuted} />
                </Pressable>
              </View>

              <View style={[styles.toolbarDivider, { backgroundColor: theme.border }]} />

              <View style={styles.redeemBadge}>
                <MaterialIcons name="redeem" size={22} color={PRIMARY_COLOR} />
                <View style={styles.redeemDot} />
              </View>

              <View style={styles.toolbarSpacer} />

              <Pressable style={[styles.upgradeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                <MaterialIcons name="upgrade" size={20} color={PRIMARY_COLOR} />
              </Pressable>
            </View> */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
              style={{
                marginHorizontal: -16,
              }}
            >
              {categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <Pressable
                    key={category}
                    onPress={() => handleCategoryChange(category)}
                    style={[
                      styles.categoryChip,
                      active
                        ? styles.categoryChipActive
                        : {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: active ? '#ffffff' : theme.textMuted },
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              style={styles.giftScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              contentContainerStyle={styles.grid}
            >
              {giftsQuery.isLoading ? (
                <View style={styles.catalogState}>
                  <ActivityIndicator color={PRIMARY_COLOR} />
                  <Text style={[styles.catalogStateText, { color: theme.textMuted }]}>Loading gifts...</Text>
                </View>
              ) : giftsQuery.isError ? (
                <View style={styles.catalogState}>
                  <MaterialIcons name="card-giftcard" size={32} color={theme.textMuted} />
                  <Text style={[styles.catalogStateText, { color: theme.textMuted }]}>Gifts could not be loaded.</Text>
                  <Pressable onPress={() => void giftsQuery.refetch()} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Try again</Text>
                  </Pressable>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.catalogState}>
                  <Text style={[styles.catalogStateText, { color: theme.textMuted }]}>No gifts are available in this category.</Text>
                </View>
              ) : items.map((item) => {
                const selected = selectedItem?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
                    disabled={isSending}
                    onPress={() => setSelectedItem(item)}
                    style={[
                      styles.giftCard,
                      selected
                        ? styles.giftCardSelected
                        : {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.9)',
                          },
                    ]}
                  >
                    <View style={[styles.giftMediaWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0' }]}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.giftImage} />
                      ) : (
                        <Text style={styles.giftEmoji}>{item.emoji}</Text>
                      )}
                    </View>
                    <View style={styles.giftCopy}>
                      <Text style={[styles.giftName, { color: selected ? theme.text : theme.textSecondary }]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.giftPriceRow}>
                        <MaterialIcons name="bolt" size={12} color={PRIMARY_COLOR} />
                        <Text style={[styles.giftPrice, { color: theme.textMuted }]}>{item.price}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

              <View style={[styles.footer, { borderTopColor: theme.border }]}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 5,
                }}>
                  <View style={[styles.balancePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: theme.border }]}>
                    <Image source={KULCOIN_ICON} style={{ width: 25, height: 25, resizeMode: 'contain' }} />
                    {isBalanceLoading ? (
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    ) : (
                      <Text style={[styles.balanceValue, { color: theme.text }]}>{resolvedBalance}</Text>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={handleSend}
                  disabled={!selectedItem || isSending || isBalanceLoading}
                  style={[
                    styles.sendButton,
                    selectedItem && !isSending && !isBalanceLoading ? styles.sendButtonActive : styles.sendButtonDisabled,
                  ]}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={[styles.sendButtonText, { color: selectedItem ? '#ffffff' : theme.textMuted }]}>
                      {hasInsufficientBalance ? 'Recharge' : 'Send'}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <KulcoinTopUpDrawer
        currentBalance={resolvedBalance}
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSuccess={(amount) => {
          onTopUpSuccess?.(amount);
          void walletQuery.refetch();
          setTopUpOpen(false);
        }}
        warningText="Insufficient Balance to Send Gift"
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    height: '88%',
    maxHeight: '88%',
    overflow: 'hidden',
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.35)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  content: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 18,
  },
  fakeInput: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fakeInputText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 8,
  },
  redeemBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  redeemDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY_COLOR,
  },
  toolbarSpacer: {
    flex: 1,
  },
  upgradeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 2,
    paddingHorizontal: 16
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  categoryChipActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  categoryChipText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 12,
  },
  catalogState: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  catalogStateText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: {
    color: '#ffffff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
  },
  giftScroll: {
    flex: 1,
    minHeight: '70%',
  },
  giftCard: {
    width: '31%',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  giftCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: primaryColorAlpha(0.5),
  },
  giftMediaWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  giftEmoji: {
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  giftCopy: {
    alignItems: 'center',
    gap: 2,
  },
  giftName: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  giftPrice: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  footer: {
    flexShrink: 0,
    borderTopWidth: 1,
    paddingTop: 14,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rechargeLabel: {
    color: '#f43f5e',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    // marginBottom: 8,

  },
  balancePill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 30,
    paddingHorizontal: 12,
    // paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  balanceCoin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCoinText: {
    color: '#78350f',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  balanceValue: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight
  },
  sendButton: {
    flexShrink: 0,
    minHeight: 38,
    minWidth: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sendButtonActive: {
    backgroundColor: '#111827',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(148,163,184,0.18)',
  },
  sendButtonText: {
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default GiftDialog;
