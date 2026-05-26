import React, { useEffect, useMemo, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, FontSize } from '../fonts';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import EmojiStickerPicker from '../components/EmojiStickerPicker';
import GiftDialog, { GiftSelection } from '../components/GiftDialog';
import KulsahInputBar from '../components/KulsahInputBar';


// type ReactionTab =  'Gifts'| null;
type PickerTab = 'emoji' | 'sticker';

type ReactionComment = {
  id: string;
  handle: string;
  avatar: string;
  text: string;
  stickerUrl?: string;
  gift?: GiftSelection;
  time: string;
  likes: number;
  verified?: boolean;
  reply?: {
    handle: string;
    avatar: string;
    text: string;
    time: string;
  };
};

const commentsSeed: ReactionComment[] = [
  {
    id: '1',
    handle: '@pixel_warrior',
    avatar: 'https://picsum.photos/seed/pixel-warrior/120',
    text: 'That drop was absolutely legendary! The lighting sync is next level tonight. Fire.',
    time: '2m',
    likes: 12,
    reply: {
      handle: '@luna_codes',
      avatar: 'https://picsum.photos/seed/luna-codes/120',
      text: "Totally agree! Who's the VJ?",
      time: '1m',
    },
  },
  {
    id: '2',
    handle: '@serena_vibe',
    avatar: 'https://picsum.photos/seed/serena-vibe/120',
    text: 'Can we talk about the visuals? Neon Pulse never misses. Best stream of the month!',
    time: '5m',
    likes: 42,
    verified: true,
  },
];

const CURRENT_USER = {
  handle: '@you',
  avatar: 'https://picsum.photos/seed/current-user/120',
};

type ReactionsProps = {
  onClose: () => void;
  title?: string;
  currentBalance?: number;
  onBalanceChange?: (nextBalance: number) => void;
};

const Reactions: React.FC<ReactionsProps> = ({
  onClose,
  title = 'Reactions',
  currentBalance,
  onBalanceChange,
}) => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  // const [activeTab, setActiveTab] = useState<ReactionTab>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>('@pixel_warrior');
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<ReactionComment[]>(commentsSeed);
  const [pickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('emoji');
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [localCoinBalance, setLocalCoinBalance] = useState(1250);

  const shellBackground = isDark ? 'rgba(10,5,13,0.92)' : 'rgba(255,255,255,0.96)';
  const cardBackground = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
  const softBorder = theme.border;
  const muted = theme.textMuted;
  const secondary = theme.textSecondary;
  const commentText = isDark ? '#d0c1d8' : theme.textSecondary;
  const sheetHeight = useMemo(() => 0.85, []);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const coinBalance = currentBalance ?? localCoinBalance;

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const createComment = (overrides: Partial<ReactionComment>): ReactionComment => ({
    id: `comment-${Date.now()}`,
    handle: CURRENT_USER.handle,
    avatar: CURRENT_USER.avatar,
    text: '',
    time: 'now',
    likes: 0,
    ...overrides,
  });

  const handleSendMessage = () => {
    const nextMessage = message.trim();
    if (!nextMessage) {
      return;
    }

    setComments((prev) => [
      ...prev,
      createComment({ text: nextMessage }),
    ]);
    setMessage('');
    setReplyingTo(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => `${prev}${emoji}`);
  };

  const handleStickerSelect = (stickerUrl: string) => {
    setComments((prev) => [
      ...prev,
      createComment({ stickerUrl }),
    ]);
    setIsPickerOpen(false);
    setReplyingTo(null);
  };

  const handleSendGift = (gift: GiftSelection) => {
    setComments((prev) => [
      ...prev,
      createComment({ gift }),
    ]);
    const nextBalance = coinBalance - gift.price;
    if (typeof currentBalance === 'number' && onBalanceChange) {
      onBalanceChange(nextBalance);
    } else {
      setLocalCoinBalance(nextBalance);
    }
    setReplyingTo(null);
  };

  const handleTopUpSuccess = (amount: number) => {
    const nextBalance = coinBalance + amount;
    if (typeof currentBalance === 'number' && onBalanceChange) {
      onBalanceChange(nextBalance);
    } else {
      setLocalCoinBalance(nextBalance);
    }
  };

  return (
    <View style={styles.modalFrame}>
      <Pressable
      onPress={onClose}
      style={styles.backdrop}>
        {/* <Image source={{ uri: 'https://picsum.photos/seed/neon-pulse-bg/1200/1800' }} style={styles.bgImage} /> */}
        <LinearGradient colors={['rgba(10,5,13,0.82)', 'rgba(10,5,13,0.28)', 'rgba(10,5,13,0.95)']} style={StyleSheet.absoluteFillObject} />
      </Pressable>

      <KeyboardAvoidingView
        style={styles.keyboardShell}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <View style={[styles.sheet, { height: `${sheetHeight * 100}%`, backgroundColor: shellBackground, borderTopColor: softBorder, maxHeight: keyboardHeight > 0 ? Platform.OS === 'ios' ?'90%': '70%': '60%' }]}>
        {pickerOpen &&
            <View style={{
              position: 'absolute',
              top: Platform.OS === 'ios' && keyboardHeight > 0 ? 120 : Platform.OS === 'ios' ? 180: keyboardHeight > 0 ? 40:160,
              left: 10,
              right: 10,
              zIndex: 3,
              height: mediumScreen ? 150: 50,
            }}>
              <EmojiStickerPicker
              isOpen={pickerOpen}
              initialTab={pickerTab}
              onClose={() => setIsPickerOpen(false)}
              onEmojiSelect={handleEmojiSelect}
              onStickerSelect={handleStickerSelect}
              />
              </View>}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.iconButton}>
            {/* <MaterialIcons name="close" size={22} color={secondary} /> */}
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
          <Pressable style={styles.iconButton}>
            {/* <MaterialIcons name="settings" size={22} color={secondary} /> */}
          </Pressable>
        </View>

        {/* <View style={styles.tabsRow}>
          {([
            // { label: 'Emoji', icon: 'mood' },
            // { label: 'Stickers', icon: 'sticky-note-2' },
            { label: 'Gifts', icon: 'redeem' },
          ] as const).map((tab) => {
            const active = activeTab === tab.label;
            return (
              <Pressable key={tab.label} onPress={() => setActiveTab(tab.label)} style={[styles.tabButton, active && { backgroundColor: cardBackground }]}>
                <MaterialIcons name={tab.icon} size={18} color={active ? PRIMARY_COLOR : secondary} />
                <Text style={[styles.tabText, { color: active ? PRIMARY_COLOR : secondary }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View> */}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentBlock}>
              <View style={styles.commentRow}>
                <Image source={{ uri: comment.avatar }} style={styles.avatar} />
                <View style={styles.commentMain}>
                  <View style={styles.commentMetaRow}>
                    <View style={styles.commentNameRow}>
                      <Text style={[styles.commentHandle, { color: theme.text }]}>{comment.handle}</Text>
                      {comment.verified ? <MaterialIcons name="verified" size={14} color={PRIMARY_COLOR} /> : null}
                    </View>
                    <Text style={[styles.commentTime, { color: muted }]}>{comment.time}</Text>
                  </View>
                  {comment.stickerUrl ? (
                    <Image source={{ uri: comment.stickerUrl }} style={styles.commentSticker} />
                  ) : comment.gift ? (
                    <View style={[styles.giftMessageCard, { backgroundColor: cardBackground, borderColor: softBorder }]}>
                      <View style={styles.giftMessageMedia}>
                        {comment.gift.isImage ? (
                          <Image source={{ uri: comment.gift.icon }} style={styles.giftMessageImage} />
                        ) : (
                          <Text style={styles.giftMessageEmoji}>{comment.gift.icon}</Text>
                        )}
                      </View>
                      <View style={styles.giftMessageCopy}>
                        <Text style={[styles.giftMessageTitle, { color: theme.text }]}>{comment.gift.name}</Text>
                        <Text style={[styles.giftMessagePrice, { color: muted }]}>
                          Sent a gift worth {comment.gift.price} KC
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.commentBody, { color: commentText }]}>{comment.text}</Text>
                  )}
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => setReplyingTo(comment.handle)} style={styles.metaAction}>
                      <MaterialIcons name="reply" size={14} color={muted} />
                      <Text style={[styles.metaActionText, { color: muted }]}>Reply</Text>
                    </Pressable>
                    <Pressable style={styles.metaAction}>
                      <MaterialIcons name="favorite" size={14} color={muted} />
                      <Text style={[styles.metaActionText, { color: muted }]}>{comment.likes}</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {comment.reply ? (
                <View style={styles.replyWrap}>
                  <View style={[styles.replyLine, { backgroundColor: primaryColorAlpha(0.28) }]} />
                  <View style={styles.replyRow}>
                    <Image source={{ uri: comment.reply.avatar }} style={styles.replyAvatar} />
                    <View style={styles.replyMain}>
                      <View style={styles.commentMetaRow}>
                        <Text style={[styles.replyHandle, { color: theme.text }]}>{comment.reply.handle}</Text>
                        <Text style={[styles.replyTime, { color: muted }]}>{comment.reply.time}</Text>
                      </View>
                      <Text style={[styles.replyBody, { color: commentText }]}>
                        <Text style={{ color: PRIMARY_COLOR, fontFamily: FontFamily.bold }}>{comment.handle} </Text>
                        {comment.reply.text}
                      </Text>
                      <View style={styles.replyActions}>
                        <Text style={[styles.replyActionText, { color: muted }]}>Reply</Text>
                        <Text style={[styles.replyActionText, { color: muted }]}>Like</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>
          ))}

          <BlurView intensity={32} tint={isDark ? 'dark' : 'light'} style={[styles.giftCard, { borderColor: primaryColorAlpha(0.18) }]}>
            <Image source={{ uri: 'https://picsum.photos/seed/marcus-digital/120' }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <View style={styles.giftHeaderRow}>
                <Text style={[styles.commentHandle, { color: theme.text }]}>@marcus_digital</Text>
                <Text style={styles.giftLabel}>GIFTER</Text>
              </View>
              <View style={styles.giftMetaRow}>
                <MaterialIcons name="redeem" size={18} color={PRIMARY_COLOR} />
                <Text style={[styles.giftText, { color: theme.text }]}>Sent a Hyper-Glow Gift</Text>
              </View>
            </View>
          </BlurView>
        </ScrollView>

        <View
          style={[
            styles.inputShell,
            {
              borderTopColor: softBorder,
              paddingBottom: 20
            },
          ]}
        >
          {replyingTo ? (
            <View style={[styles.replyingBanner, { backgroundColor: cardBackground, borderColor: softBorder }]}>
              <View style={styles.replyingInfo}>
                <MaterialIcons name="reply" size={16} color={PRIMARY_COLOR} />
                <Text style={[styles.replyingText, { color: secondary }]}>
                  Replying to <Text style={{ color: theme.text, fontFamily: FontFamily.bold }}>{replyingTo}</Text>
                </Text>
              </View>
              <Pressable onPress={() => setReplyingTo(null)}>
                <MaterialIcons name="close" size={18} color={muted} />
              </Pressable>
            </View>
          ) : null}

          <KulsahInputBar
              value={message}
              onChangeText={setMessage}
              placeholder="Join the discussion..."
              placeholderTextColor={muted}
              containerStyle={{ backgroundColor: cardBackground, borderColor: softBorder }}
              rightAccessory={(
                <>
                  <View style={styles.inputActions}>
                    <Pressable
                      onPress={() => {
                        setGiftDialogOpen(true);
                      }}
                      style={styles.inputIcon}
                    >
                      <MaterialIcons name="redeem" size={26} color={secondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setPickerTab('emoji');
                        setIsPickerOpen(true);
                      }}
                      style={styles.inputIcon}
                    >
                      <MaterialIcons name="mood" size={26} color={pickerOpen ? PRIMARY_COLOR : secondary} />
                    </Pressable>
                  </View>
                  {message ? (
                    <Pressable onPress={handleSendMessage} style={styles.sendButton}>
                      <MaterialIcons name="send" size={18} color="#fff" />
                    </Pressable>
                  ) : null}
                </>
              )}
            />

          {/* <View style={styles.homeIndicatorWrap}>
            <View style={[styles.homeIndicator, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)' }]} />
          </View> */}
        </View>
      </View>
      </KeyboardAvoidingView>
      <GiftDialog
        isOpen={giftDialogOpen}
        onClose={() => setGiftDialogOpen(false)}
        creatorName={replyingTo ?? ""}
        currentBalance={coinBalance}
        onSendGift={(gift) => {
          handleSendGift(gift);
          setGiftDialogOpen(false);
        }}
        onTopUpSuccess={handleTopUpSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalFrame: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  keyboardShell: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000033',
  },
  bgImage: { width: '100%', height: '100%', opacity: 0.4 },
  sheet: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'center',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderTopWidth: 1,
    // overflow: 'hidden',
    // maxHeight: '70%',
    // height: '60%'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.fourteen:FontSize.ten, textTransform: 'uppercase', letterSpacing: 0.8 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tabButton: { flex: 1, minHeight: 46, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabText: { fontFamily: FontFamily.extraBold, fontSize: FontSize.eight, textTransform: 'uppercase', letterSpacing: 0.2 },
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, gap: 22 },
  commentBlock: { gap: 12 },
  commentRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  commentMain: { flex: 1 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentHandle: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.fifteen : FontSize.eleven, marginBottom: 5 },
  commentTime: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.ten:FontSize.seven },
  commentBody: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.thirteen: FontSize.ten, lineHeight: 16 },
  commentSticker: { width: 120, height: 120, borderRadius: 22, marginTop: 4 },
  giftMessageCard: {
    marginTop: 4,
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giftMessageMedia: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColorAlpha(0.12),
  },
  giftMessageImage: {
    width: '100%',
    height: '100%',
  },
  giftMessageEmoji: {
    fontSize: FontSize.twentySix,
  },
  giftMessageCopy: {
    flex: 1,
    gap: 3,
  },
  giftMessageTitle: {
    fontFamily: FontFamily.bold,
    fontSize: mediumScreen ? FontSize.twelve : FontSize.nine,
  },
  giftMessagePrice: {
    fontFamily: FontFamily.medium,
    fontSize: mediumScreen ? FontSize.ten : FontSize.seven,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 },
  metaAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaActionText: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.twelve:FontSize.eight },
  replyWrap: { marginLeft: 34, paddingLeft: 18, position: 'relative', gap: 10 },
  replyLine: { position: 'absolute', left: 0, top: -6, bottom: 6, width: 2, borderRadius: 999 },
  replyRow: { flexDirection: 'row', gap: 10 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  replyMain: { flex: 1 },
  replyHandle: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.eleven:FontSize.eight },
  replyTime: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.nine: FontSize.six },
  replyBody: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.eleven: FontSize.eight, lineHeight: 15 },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  replyActionText: { fontFamily: FontFamily.bold, fontSize: mediumScreen ? FontSize.ten: FontSize.eight },
  giftCard: { flexDirection: 'row', gap: 12, borderRadius: 20, padding: 14, overflow: 'hidden', borderWidth: 1 },
  giftHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  giftLabel: { color: PRIMARY_COLOR, fontFamily: FontFamily.extraBold, fontSize: mediumScreen ? FontSize.nine: FontSize.six, letterSpacing: 0.6, textTransform: 'uppercase' },
  giftMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  giftText: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.eleven:FontSize.eight },
  inputShell: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  replyingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  replyingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyingText: { fontFamily: FontFamily.medium, fontSize: mediumScreen ? FontSize.ten: FontSize.seven },
  inputActions: { flexDirection: 'row' },
  inputIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR },
  homeIndicatorWrap: { alignItems: 'center', paddingTop: 10 },
  homeIndicator: { width: 128, height: 4, borderRadius: 999 },
});

export default Reactions;
