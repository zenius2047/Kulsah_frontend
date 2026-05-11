import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fontScale } from '../fonts';
import { useThemeMode } from '../theme';
import { mediumScreen } from '../types';
import KulcoinTopUpDrawer from './KulcoinTopUpDrawer';

type GiftCategory = 'general' | 'food' | 'fashion';

export type GiftSelection = {
  id: string;
  name: string;
  price: number;
  icon: string;
  isImage?: boolean;
};

type GiftItem = {
  id: string;
  name: string;
  price: number;
  emoji?: string;
  image?: string;
};

interface GiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  currentBalance: number;
  onSendGift: (gift: GiftSelection) => void;
  onTopUpSuccess: (amount: number) => void;
}

const generalGifts: GiftItem[] = [
  { id: 'g1', name: 'Thumbs Up!', price: 5, emoji: '\u{1F44D}' },
  { id: 'g2', name: 'This is Fire', price: 10, emoji: '\u{1F525}' },
  { id: 'g3', name: 'Accept this Rose?', price: 15, emoji: '\u{1F339}' },
  { id: 'g4', name: 'Love', price: 25, emoji: '\u{1F496}' },
  { id: 'g5', name: 'Happy Day', price: 50, emoji: '\u{1F308}' },
  { id: 'g6', name: 'Fancy Pearl', price: 100, emoji: '\u{1F41A}' },
  { id: 'g7', name: '1st Place', price: 250, emoji: '\u{1F947}' },
  { id: 'g8', name: "Let's Ride", price: 500, emoji: '\u{1F3CE}\uFE0F' },
  { id: 'g9', name: 'Gold Gummy', price: 1000, emoji: '\u{1F9F8}' },
  { id: 'g10', name: 'Elite Status', price: 1500, emoji: '\u2708\uFE0F' },
  { id: 'g11', name: 'Ice Diamond', price: 2000, emoji: '\u{1F48E}' },
  { id: 'g12', name: 'Pure Royalty', price: 3000, emoji: '\u{1F451}' },
];

const fashionGifts: GiftItem[] = [
  { id: 'f1', name: 'Kente Cloth', price: 250, image: 'https://images.unsplash.com/photo-1590736934444-23be53860bb4?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f2', name: 'Traditional Fugu', price: 150, image: 'https://images.unsplash.com/photo-1563170351-be32ca882749?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f3', name: 'Ahenema Sandals', price: 80, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f4', name: 'Traditional Beads', price: 25, image: 'https://images.unsplash.com/photo-1627341355087-888e2850937a?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f5', name: 'Ankara Print', price: 60, image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&q=80&w=200&h=200' },
  { id: 'f6', name: 'Batakari Hat', price: 40, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=200&h=200' },
];

const foodGifts: GiftItem[] = [
  { id: 'fd1', name: 'Jollof Rice', price: 50, image: 'https://picsum.photos/seed/jollof/200' },
  { id: 'fd2', name: 'Banku', price: 100, image: 'https://picsum.photos/seed/banku/200' },
  { id: 'fd3', name: 'Kelewele', price: 25, image: 'https://picsum.photos/seed/kelewele/200' },
  { id: 'fd4', name: 'Fufu', price: 150, image: 'https://picsum.photos/seed/fufu/200' },
  { id: 'fd5', name: 'Waakye', price: 75, image: 'https://picsum.photos/seed/waakye/200' },
  { id: 'fd6', name: 'Red Red', price: 60, image: 'https://picsum.photos/seed/redred/200' },
  { id: 'fd7', name: 'Sobolo', price: 10, image: 'https://picsum.photos/seed/sobolo/200' },
  { id: 'fd8', name: 'Full Lunch', price: 500, image: 'https://picsum.photos/seed/fulllunch/200' },
];

const GiftDialog: React.FC<GiftDialogProps> = ({
  isOpen,
  onClose,
  creatorName,
  currentBalance,
  onSendGift,
  onTopUpSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark, theme } = useThemeMode();
  const [activeCategory, setActiveCategory] = useState<GiftCategory>('general');
  const [selectedItem, setSelectedItem] = useState<GiftItem | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTopUpOpen(false);
    }
  }, [isOpen]);

  const items = useMemo(() => {
    if (activeCategory === 'food') return foodGifts;
    if (activeCategory === 'fashion') return fashionGifts;
    return generalGifts;
  }, [activeCategory]);

  const handleCategoryChange = (category: GiftCategory) => {
    setActiveCategory(category);
    setSelectedItem(null);
  };

  const hasInsufficientBalance = !!selectedItem && currentBalance < selectedItem.price;

  const handleSend = () => {
    if (!selectedItem) return;

    if (hasInsufficientBalance) {
      setTopUpOpen(true);
      return;
    }

    onSendGift({
      id: selectedItem.id,
      name: selectedItem.name,
      price: selectedItem.price,
      icon: selectedItem.emoji ?? selectedItem.image ?? 'redeem',
      isImage: !!selectedItem.image,
    });
    setSelectedItem(null);
    onClose();
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
            <View style={[styles.fakeInput, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderColor: theme.border }]}>
              <TextInput
                placeholder={`Send a gift to ${creatorName}...`}
                placeholderTextColor={theme.textMuted}
                style={[styles.fakeInputText, { color: theme.text }]}
                editable={false}
              />
            </View>

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
                <MaterialIcons name="redeem" size={22} color="#cd2bee" />
                <View style={styles.redeemDot} />
              </View>

              <View style={styles.toolbarSpacer} />

              <Pressable style={[styles.upgradeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                <MaterialIcons name="upgrade" size={20} color="#cd2bee" />
              </Pressable>
            </View> */}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {(['general', 'food', 'fashion'] as const).map((category) => {
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
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.grid}
            >
              {items.map((item) => {
                const selected = selectedItem?.id === item.id;
                return (
                  <Pressable
                    key={item.id}
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
                        <MaterialIcons name="bolt" size={12} color="#cd2bee" />
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
                    <View style={styles.balanceCoin}>
                      <Text style={styles.balanceCoinText}>$</Text>
                    </View>
                    <Text style={[styles.balanceValue, { color: theme.text }]}>{currentBalance}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleSend}
                  disabled={!selectedItem}
                  style={[
                    styles.sendButton,
                    selectedItem ? styles.sendButtonActive : styles.sendButtonDisabled,
                  ]}
                >
                  <Text style={[styles.sendButtonText, { color: selectedItem ? '#ffffff' : theme.textMuted }]}>
                    {hasInsufficientBalance ? 'Recharge' : 'Send'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      <KulcoinTopUpDrawer
        currentBalance={currentBalance}
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSuccess={(amount) => {
          onTopUpSuccess(amount);
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
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(10),
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
    backgroundColor: '#cd2bee',
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
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  categoryChipActive: {
    backgroundColor: '#cd2bee',
  },
  categoryChipText: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(7),
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 6,
  },
  giftCard: {
    width: '23%',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 8,
  },
  giftCardSelected: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(205,43,238,0.5)',
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
    fontSize: 30,
  },
  giftCopy: {
    alignItems: 'center',
    gap: 2,
  },
  giftName: {
    fontFamily: 'PlusJakartaSansBold',
    fontSize: fontScale(7),
    textAlign: 'center',
  },
  giftPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  giftPrice: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(6.5),
    textTransform: 'uppercase',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rechargeLabel: {
    color: '#f43f5e',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen ? fontScale(14): fontScale(10),
    textTransform: 'uppercase',
    letterSpacing: 1.3,
    // marginBottom: 8,

  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(7),
  },
  balanceValue: {
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen ? fontScale(14):fontScale(10),
    lineHeight: 14
  },
  sendButton: {
    minHeight: 48,
    minWidth: 110,
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
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(9),
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default GiftDialog;
