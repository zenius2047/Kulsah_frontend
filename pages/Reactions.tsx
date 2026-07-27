import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { mediumScreen } from '../types';
import EmojiStickerPicker from '../components/EmojiStickerPicker';
import GiftDialog, { GiftSelection } from '../components/GiftDialog';
import KulsahInputBar from '../components/KulsahInputBar';
import KulcoinTopUpDrawer from '../components/KulcoinTopUpDrawer';
import EmptyStateComment from '../assets/icons/Comment VECTOR.svg';
import { fontSize } from './typography';
import { useAddCommentMutation, useLikeCommentMutation, useReplyToCommentMutation, useVideoComments } from '../src';
import type { GeneralComment } from '../src/types/general.types';
import { parseApiError } from '../src/utils/apiError';


// type ReactionTab =  'Gifts'| null;
type PickerTab = 'emoji' | 'sticker';
type ReplyTarget = {
  id: string;
  handle: string;
};

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
  optimistic?: boolean;
  reply?: {
    handle: string;
    avatar: string;
    text: string;
    time: string;
  } | null;
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
  videoId?: string | number;
  title?: string;
  currentBalance?: number;
  onBalanceChange?: (nextBalance: number) => void;
};

const normalizeHandle = (handle?: string | null) => {
  if (!handle) return '@user';
  return handle.startsWith('@') ? handle : `@${handle}`;
};

const mapApiComment = (comment: GeneralComment): ReactionComment => ({
  id: String(comment.id),
  handle: normalizeHandle(comment.handle),
  avatar: comment.avatar || 'https://picsum.photos/seed/comment-avatar/120',
  text: comment.text ?? comment.body ?? '',
  stickerUrl: comment.stickerUrl ?? undefined,
  gift: comment.gift ? (comment.gift as GiftSelection) : undefined,
  time: comment.time ?? 'now',
  likes: Number(comment.likes ?? 0),
  verified: Boolean(comment.verified),
  reply: comment.reply
    ? {
        handle: normalizeHandle(comment.reply.handle),
        avatar: comment.reply.avatar || 'https://picsum.photos/seed/reply-avatar/120',
        text: comment.reply.text,
        time: comment.reply.time,
      }
    : null,
});

const getCommentErrorMessage = (error: unknown) => {
  const parsed = parseApiError(error);
  return parsed.validationErrors?.body?.[0] || parsed.message;
};

const Reactions: React.FC<ReactionsProps> = ({
  onClose,
  videoId,
  title = 'Reactions',
  currentBalance,
  onBalanceChange,
}) => {
  const { isDark, theme } = useThemeMode();
  const insets = useSafeAreaInsets();
  // const [activeTab, setActiveTab] = useState<ReactionTab>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);
  const [message, setMessage] = useState('');
  const [comments, setComments] = useState<ReactionComment[]>(videoId ? [] : commentsSeed);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(new Set());
  const [pickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('emoji');
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [localCoinBalance, setLocalCoinBalance] = useState(1250);
  const sendingMessageRef = useRef(false);
  const addCommentMutation = useAddCommentMutation();
  const replyToCommentMutation = useReplyToCommentMutation();
  const likeCommentMutation = useLikeCommentMutation();
  const commentsQuery = useVideoComments(videoId, { per_page: 20 }, Boolean(videoId));

  const shellBackground = isDark ? 'rgba(10,5,13,0.92)' : 'rgba(255,255,255,0.96)';
  const cardBackground = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)';
  const softBorder = theme.border;
  const muted = theme.textMuted;
  const secondary = theme.textSecondary;
  const commentText = isDark ? '#d0c1d8' : theme.textSecondary;
  const sheetHeight = useMemo(() => 0.85, []);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const coinBalance = currentBalance ?? localCoinBalance;
  const isSendingMessage = addCommentMutation.isPending || replyToCommentMutation.isPending || sendingMessageRef.current;
  const hasTypedMessage = message.trim().length > 0;

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        console.log("it's showing the keyboard");
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        console.log("Keyboard disappears")
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!videoId || !commentsQuery.data) return;

    const apiComments = commentsQuery.data.pages.flatMap((page) => page.data).map(mapApiComment);
    setComments((current) => {
      const optimisticComments = current.filter((comment) => comment.optimistic);
      return [...optimisticComments, ...apiComments];
    });
  }, [commentsQuery.data, videoId]);

  const createComment = (overrides: Partial<ReactionComment>): ReactionComment => ({
    id: `comment-${Date.now()}`,
    handle: CURRENT_USER.handle,
    avatar: CURRENT_USER.avatar,
    text: '',
    time: 'now',
    likes: 0,
    ...overrides,
  });

  const handleSendMessage = async () => {
    if (isSendingMessage) {
      return;
    }

    const nextMessage = message.trim();
    if (!nextMessage) {
      return;
    }

    sendingMessageRef.current = true;

    const optimisticComment = replyingTo ? null : createComment({ text: nextMessage, optimistic: true });
    if (optimisticComment) {
      setComments((prev) => [optimisticComment, ...prev]);
    }
    setMessage('');

    if (!videoId) {
      if (replyingTo) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyingTo.id
              ? {
                  ...comment,
                  reply: {
                    handle: CURRENT_USER.handle,
                    avatar: CURRENT_USER.avatar,
                    text: nextMessage,
                    time: 'now',
                  },
                }
              : comment
          )
        );
      }
      setReplyingTo(null);
      requestAnimationFrame(() => {
        sendingMessageRef.current = false;
      });
      return;
    }

    try {
      const response = replyingTo
        ? await replyToCommentMutation.mutateAsync({
            video: videoId,
            comment: replyingTo.id,
            payload: { body: nextMessage },
          })
        : await addCommentMutation.mutateAsync({
            video: videoId,
            payload: { body: nextMessage },
          });
      const nextComment = mapApiComment(response.data);
      setComments((prev) => {
        if (replyingTo) {
          return prev.map((comment) =>
            comment.id === replyingTo.id
              ? {
                  ...comment,
                  reply: {
                    handle: nextComment.handle,
                    avatar: nextComment.avatar,
                    text: nextComment.text,
                    time: nextComment.time,
                  },
                }
              : comment
          );
        }

        return prev.map((comment) => (comment.id === optimisticComment?.id ? nextComment : comment));
      });
      setReplyingTo(null);
      void commentsQuery.refetch();
    } catch (error: any) {
      if (optimisticComment) {
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      }
      Alert.alert('Comment failed', getCommentErrorMessage(error));
    } finally {
      sendingMessageRef.current = false;
    }
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

  const patchCommentFromResponse = (nextComment: Partial<ReactionComment> & Pick<ReactionComment, 'id'>) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === nextComment.id
          ? {
              ...comment,
              ...nextComment,
              reply: nextComment.reply === undefined ? comment.reply : nextComment.reply,
            }
          : comment
      )
    );
  };

  const handleToggleCommentLike = async (comment: ReactionComment) => {
    if (!videoId || pendingLikeIds.has(comment.id)) return;

    const shouldLike = !likedCommentIds.has(comment.id);
    setPendingLikeIds((prev) => new Set(prev).add(comment.id));
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      if (shouldLike) {
        next.add(comment.id);
      } else {
        next.delete(comment.id);
      }
      return next;
    });

    try {
      const response = await likeCommentMutation.mutateAsync({
        video: videoId,
        comment: comment.id,
        liked: shouldLike,
      });
      const data = response.data;
      patchCommentFromResponse(
        'handle' in data
          ? mapApiComment(data as GeneralComment)
          : {
              id: String(data.id),
              likes: Number(data.likes ?? comment.likes),
            }
      );
    } catch (error) {
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        if (shouldLike) {
          next.delete(comment.id);
        } else {
          next.add(comment.id);
        }
        return next;
      });
      Alert.alert('Comment like failed', getCommentErrorMessage(error));
    } finally {
      setPendingLikeIds((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
    }
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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            (commentsQuery.isLoading || comments.length === 0 || commentsQuery.isError) && styles.emptyContent,
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
        >
          {commentsQuery.isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={PRIMARY_COLOR} />
              <Text style={[styles.emptyBody, { color: secondary }]}>Loading comments...</Text>
            </View>
          ) : commentsQuery.isError ? (
            <View style={styles.emptyState}>
              <EmptyStateComment width={160} height={160} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Comments Unavailable</Text>
              <Text style={[styles.emptyBody, { color: secondary }]}>
                {getCommentErrorMessage(commentsQuery.error)}
              </Text>
              <Pressable
                onPress={() => void commentsQuery.refetch()}
                style={[styles.loadMoreButton, { borderColor: softBorder }]}
              >
                <Text style={[styles.loadMoreText, { color: PRIMARY_COLOR }]}>Try Again</Text>
              </Pressable>
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyState}>
              <EmptyStateComment width={180} height={180} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Comments Yet</Text>
              <Text style={[styles.emptyBody, { color: secondary }]}>Be the first to start the conversation.</Text>
            </View>
          ) : (
            <>
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
                        <Pressable onPress={() => setReplyingTo({ id: comment.id, handle: comment.handle })} style={styles.metaAction}>
                          <MaterialIcons name="reply" size={14} color={muted} />
                          <Text style={[styles.metaActionText, { color: muted }]}>Reply</Text>
                        </Pressable>
                        <Pressable
                          disabled={!videoId || pendingLikeIds.has(comment.id)}
                          onPress={() => void handleToggleCommentLike(comment)}
                          style={[styles.metaAction, pendingLikeIds.has(comment.id) && styles.disabledAction]}
                        >
                          <MaterialIcons
                            name="favorite"
                            size={14}
                            color={likedCommentIds.has(comment.id) ? PRIMARY_COLOR : muted}
                          />
                          <Text
                            style={[
                              styles.metaActionText,
                              { color: likedCommentIds.has(comment.id) ? PRIMARY_COLOR : muted },
                            ]}
                          >
                            {comment.likes}
                          </Text>
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
                            <Text style={{ color: PRIMARY_COLOR }}>{comment.handle} </Text>
                            {comment.reply.text}
                          </Text>
                          <View style={styles.replyActions}>
                            <Text style={[styles.replyActionText, { color: muted }]}>Reply</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
              {commentsQuery.hasNextPage ? (
                <Pressable
                  disabled={commentsQuery.isFetchingNextPage}
                  onPress={() => void commentsQuery.fetchNextPage()}
                  style={[styles.loadMoreButton, { borderColor: softBorder }]}
                >
                  {commentsQuery.isFetchingNextPage ? (
                    <ActivityIndicator color={PRIMARY_COLOR} />
                  ) : (
                    <Text style={[styles.loadMoreText, { color: PRIMARY_COLOR }]}>Load More</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
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
                  Replying to <Text style={{ color: theme.text }}>{replyingTo.handle}</Text>
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
                  <View>
                    {hasTypedMessage ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send message"
                      disabled={isSendingMessage || !hasTypedMessage}
                      onPress={handleSendMessage}
                      style={[styles.sendButton, isSendingMessage && styles.disabledAction]}
                    >
                      {isSendingMessage ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <MaterialIcons name="send" size={18} color="#fff" />
                      )}
                    </Pressable>
                  ) : null}
                  </View>
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
        creatorName={replyingTo?.handle ?? ""}
        currentBalance={coinBalance}
        onSendGift={(gift) => {
          handleSendGift(gift);
          setGiftDialogOpen(false);
        }}
        onTopUpSuccess={handleTopUpSuccess}
        onRecharge={() => {
          setGiftDialogOpen(false);
          setTopUpOpen(true);
        }}
      />
      <KulcoinTopUpDrawer
        currentBalance={coinBalance}
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        onSuccess={(amount) => {
          handleTopUpSuccess(amount);
          setTopUpOpen(false);
        }}
        warningText="Insufficient Balance to Send Gift"
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
  headerTitle: { ...fontSize.reactionB4, lineHeight: fontSize.reactionB4.lineHeight, textTransform: 'uppercase', letterSpacing: 0.8 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tabButton: { flex: 1, minHeight: 46, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  tabText: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight, textTransform: 'uppercase', letterSpacing: 0.2 },
  content: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, gap: 22 },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  emptyTitle: {
    marginTop: 4,
    ...fontSize.reactionB3, lineHeight: fontSize.reactionB3.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  emptyBody: {
    maxWidth: 260,
    ...fontSize.reactionB4,
    lineHeight: fontSize.reactionB4.lineHeight,
    textAlign: 'center',
  },
  commentBlock: { gap: 12 },
  commentRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  commentMain: { flex: 1 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  commentNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentHandle: { ...fontSize.reactionB4, lineHeight: fontSize.reactionB4.lineHeight, marginBottom: 5 },
  commentTime: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  commentBody: { ...fontSize.reactionB4, lineHeight: fontSize.reactionB4.lineHeight },
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
    ...fontSize.reactionB1, lineHeight: fontSize.reactionB1.lineHeight,
  },
  giftMessageCopy: {
    flex: 1,
    gap: 3,
  },
  giftMessageTitle: {
    ...fontSize.reactionB4, lineHeight: fontSize.reactionB4.lineHeight,
  },
  giftMessagePrice: {
    ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 8 },
  metaAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaActionText: { ...fontSize.reactionB4, lineHeight: fontSize.reactionB4.lineHeight },
  disabledAction: { opacity: 0.55 },
  replyWrap: { marginLeft: 34, paddingLeft: 18, position: 'relative', gap: 10 },
  replyLine: { position: 'absolute', left: 0, top: -6, bottom: 6, width: 2, borderRadius: 999 },
  replyRow: { flexDirection: 'row', gap: 10 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  replyMain: { flex: 1 },
  replyHandle: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  replyTime: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  replyBody: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  replyActionText: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  giftCard: { flexDirection: 'row', gap: 12, borderRadius: 20, padding: 14, overflow: 'hidden', borderWidth: 1 },
  giftHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  giftLabel: { color: PRIMARY_COLOR, ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight, letterSpacing: 0.6, textTransform: 'uppercase' },
  giftMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  giftText: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  inputShell: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12 },
  replyingBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  replyingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyingText: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight },
  inputActions: { flexDirection: 'row' },
  inputIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR },
  loadMoreButton: { alignSelf: 'center', minHeight: 38, minWidth: 118, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  loadMoreText: { ...fontSize.reactionB5, lineHeight: fontSize.reactionB5.lineHeight, textTransform: 'uppercase' },
  homeIndicatorWrap: { alignItems: 'center', paddingTop: 10 },
  homeIndicator: { width: 128, height: 4, borderRadius: 999 },
});

export default Reactions;
