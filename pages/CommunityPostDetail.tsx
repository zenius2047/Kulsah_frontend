import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import { user } from '../types';
import KulsahInputBar from '../components/KulsahInputBar';
import DotTrioLoader from '../components/DotTrioLoader';
import { PageSkeleton } from '../components/PageSkeleton';
import { fontSize } from '../typography';
import {
  communityApi,
  parseApiError,
  formatCommunityRelativeTime,
  useAddCommunityComment,
  useCommunityComments,
  useCommunityLike,
  useCommunityPost,
  useShareCommunityPost,
  type CommunityComment as ApiCommunityComment,
  type CommunityPage,
  type CommunityPost as ApiCommunityPost,
} from '../src';
import type { Sticker } from '../src/types/sticker.types';

interface Comment {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  stickerUrl?: string;
  time: string;
  replys?: Reply[];
}

interface PollOption {
  id: string | number;
  text: string;
  votes: number;
  isSelected?: boolean;
}

interface Reply {
  text: string;
  username: string;
  replyhandle: string;
  time: string;
  avatar: string;
  stickerUrl?: string;
}

interface CommunityPost {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  isLive?: boolean;
  viewerCount?: number;
  likes: number;
  comments: number;
  shares?: number;
  gifts?: number;
  views?: number;
  audience?: 'public' | 'subscribers';
  status?: string;
  commentList?: Comment[];
  time: string;
  isLiked: boolean;
  type: 'text' | 'image' | 'poll' | 'challenge' | 'live';
  pollOptions?: PollOption[];
  isFollowing: boolean;
  isVerified: boolean;
}

interface CurrentUser {
  name?: string;
  handle?: string;
  avatar?: string;
}

const STORAGE_KEY = 'pulsar_community_posts';
const USER_KEY = 'pulsar_user';

const toDetailComment = (comment: ApiCommunityComment): Comment => ({
  id: String(comment.id),
  user: comment.author.name,
  handle: comment.author.handle.replace(/^@/, ''),
  avatar: comment.author.avatar_url || 'https://picsum.photos/seed/user/100/100',
  text: comment.content ?? comment.body ?? '',
  stickerUrl: comment.sticker?.media_url ?? comment.sticker_url ?? undefined,
  time: comment.created_at,
  replys: comment.replies?.map((reply) => ({
    text: reply.content ?? reply.body ?? '',
    username: reply.author.name,
    replyhandle: reply.author.handle.replace(/^@/, ''),
    time: reply.created_at,
    avatar: reply.author.avatar_url || 'https://picsum.photos/seed/user/100/100',
    stickerUrl: reply.sticker?.media_url ?? reply.sticker_url ?? undefined,
  })),
});

const toDetailPost = (post: ApiCommunityPost, comments: Comment[] = []): CommunityPost => ({
  id: String(post.id),
  artist: post.author.name,
  handle: post.author.handle.replace(/^@/, ''),
  avatar: post.author.avatar_url || 'https://picsum.photos/seed/creator/100/100',
  content: post.content || '',
  images: (post.media || []).filter((item) => String(item.type).toLowerCase().startsWith('image')).map((item) => item.url),
  videoUrl: ((post.media || []).find((item) => String(item.type).toLowerCase().startsWith('video'))?.streaming_url
    || (post.media || []).find((item) => String(item.type).toLowerCase().startsWith('video'))?.url
    || post.live?.playback_url) ?? undefined,
  isLive: post.type === 'live' || post.live?.status === 'live',
  viewerCount: post.live?.viewer_count,
  likes: post.stats.likes_count,
  comments: post.stats.comments_count,
  shares: post.stats.shares_count,
  gifts: post.stats.gifts_count,
  views: post.stats.views_count,
  audience: post.audience,
  status: post.status,
  commentList: comments,
  time: post.created_at,
  isLiked: post.viewer.is_liked,
  type: post.type === 'video' ? 'image' : post.type,
  pollOptions: post.poll?.options.map((option) => ({ id: option.id, text: option.text, votes: option.votes_count, isSelected: option.is_selected })),
  isFollowing: post.viewer.is_following ?? post.author.is_following,
  isVerified: post.author.is_verified,
});

const DetailVideoPreview: React.FC<{ videoUrl: string; viewerCount?: number; isLive?: boolean; onOpen: () => void }> = ({ videoUrl, viewerCount, isLive = false, onOpen }) => {
  const [isMuted, setIsMuted] = useState(true);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const isVideoLoading = status !== 'readyToPlay' && status !== 'error';

  const toggleMute = (event: GestureResponderEvent) => {
    event.stopPropagation();
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={isLive ? 'Watch live video full screen' : 'Watch video full screen'} onPress={onOpen} style={styles.mediaWrap}>
      <VideoView player={player} style={styles.video} nativeControls={false} allowsPictureInPicture contentFit="cover" />
      {isVideoLoading && (
        <View pointerEvents="none" style={styles.videoLoaderOverlay}>
          <DotTrioLoader />
        </View>
      )}
      {isLive ? <View style={styles.liveBadges}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE</Text>
        </View>
        <View style={styles.viewerPill}>
          <MaterialIcons name="visibility" size={14} color="#fff" />
          <Text style={styles.viewerText}>{(viewerCount ?? 0).toLocaleString()}</Text>
        </View>
      </View> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute video' : 'Mute video'}
        hitSlop={8}
        onPress={toggleMute}
        style={styles.videoMuteButton}
      >
        <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={16} color="#fff" />
      </Pressable>
    </Pressable>
  );
};

const DetailFullscreenVideo: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, (instance) => instance.play());
  return <VideoView player={player} style={styles.fullscreenVideo} nativeControls allowsPictureInPicture />;
};

const CommunityPostDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, theme } = useThemeMode();
  const { width: viewportWidth } = useWindowDimensions();
  const muted = theme.textMuted;
  const postId = route.params?.postId as string | undefined;
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [selectedImages, setSelectedImages] = useState<{ images: string[]; index: number } | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [commentUsername, setcommentUsername] = useState<string>('');
  const [replyUsername, setReplyUsername] = useState<string>('');
  const [replyAvatar, setReplyAvatar] = useState<string>('');
  const [replyTime, setReplyTime] = useState<string>('');
  const pendingCommentIds = useRef(new Set<string>());
  const postQuery = useCommunityPost(postId);
  const commentsQuery = useCommunityComments(postId);
  const likeMutation = useCommunityLike();
  const shareMutation = useShareCommunityPost();
  const commentMutation = useAddCommunityComment(postId || '');

  const screenBg = isDark ? '#0b0d12' : '#f0f2f5';
  const cardBg = isDark ? '#121219' : '#ffffff';
  const headerBg = isDark ? '#121219' : '#ffffff';
  const composerBg = isDark ? '#1d1d27' : theme.surface;
  const softBorder = isDark ? 'rgba(255,255,255,0.08)' : '#dfe3e8';
  const mutedText = isDark ? '#aeb7c2' : '#65676b';
  const dimIcon = isDark ? '#aeb7c2' : '#65676b';
  const normalizedHandle = (currentUser.handle ?? '').replace('@', '');

  const loadUser = useCallback(async () => {
    try {
      const savedUser = await AsyncStorage.getItem(USER_KEY);

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser) as CurrentUser);
      }
    } catch {}
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!postQuery.data) return;
    const pages = commentsQuery.data?.pages as CommunityPage<ApiCommunityComment>[] | undefined;
    const comments = pages?.flatMap((page) => page.data).map(toDetailComment) ?? [];
    const fetchedIds = new Set(comments.map((comment) => comment.id));
    fetchedIds.forEach((id) => pendingCommentIds.current.delete(id));
    setPost((current) => {
      const commentsWaitingForRefetch = (current?.commentList ?? []).filter((comment) =>
        pendingCommentIds.current.has(comment.id) && !fetchedIds.has(comment.id));
      return toDetailPost(postQuery.data, [...commentsWaitingForRefetch, ...comments]);
    });
  }, [commentsQuery.data, postQuery.data]);

  const totalVotes = useMemo(
    () => post?.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) ?? 0,
    [post?.pollOptions],
  );

  const toggleLike = async () => {
    if (!post || likeMutation.isPending) return;
    const liked = !post.isLiked;
    setPost({ ...post, isLiked: liked, likes: Math.max(0, post.likes + (liked ? 1 : -1)) });
    try {
      const updated = await likeMutation.mutateAsync({ post: post.id, liked });
      setPost(toDetailPost(updated, post.commentList));
    } catch (error) {
      setPost(post);
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  const toggleFollow = async () => {
    if (post) setPost({ ...post, isFollowing: !post.isFollowing });
  };

  const voteOnPoll = async (optionIndex: number) => {
    const option = post?.pollOptions?.[optionIndex];
    if (!post || !option || isVoting || post.pollOptions?.some((item) => item.isSelected)) return;
    const previous = post;
    setIsVoting(true);
    setPost({ ...post, pollOptions: post.pollOptions?.map((item, index) => ({ ...item, isSelected: index === optionIndex, votes: item.votes + (index === optionIndex ? 1 : 0) })) });
    try {
      const response = await communityApi.voteOnPoll(post.id, option.id);
      setPost(toDetailPost(response.data.data, previous.commentList));
    } catch (error) {
      setPost(previous);
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setIsVoting(false);
    }
  };

  const addComment = async (commentId: string | null) => {
    const finalText = commentText.trim();
    if (!finalText || !post || commentMutation.isPending) return;

    const previousPost = post;
    const previousReplyingTo = replyingTo;
    const optimisticId = `pending-${Date.now()}`;
    const optimisticAvatar = currentUser.avatar || 'https://picsum.photos/seed/user/100/100';
    const optimisticHandle = normalizedHandle || 'you';
    const optimisticName = currentUser.name || `@${optimisticHandle}`;

    const optimisticComments = commentId
      ? (post.commentList ?? []).map((comment) => comment.id === commentId ? {
          ...comment,
          replys: [
            ...(comment.replys ?? []),
            {
              text: finalText,
              username: optimisticName,
              replyhandle: optimisticHandle,
              time: new Date().toISOString(),
              avatar: optimisticAvatar,
            },
          ],
        } : comment)
      : [
          {
            id: optimisticId,
            user: optimisticName,
            handle: optimisticHandle,
            avatar: optimisticAvatar,
            text: finalText,
            time: new Date().toISOString(),
            replys: [],
          },
          ...(post.commentList ?? []),
        ];

    if (!commentId) pendingCommentIds.current.add(optimisticId);
    setPost({ ...post, comments: post.comments + 1, commentList: optimisticComments });
    setCommentText('');
    setReplyingTo(null);

    try {
      const createdComment = await commentMutation.mutateAsync({ body: finalText, ...(commentId ? { parent_id: commentId } : {}) });
      if (!commentId) {
        const createdId = String(createdComment.id);
        pendingCommentIds.current.delete(optimisticId);
        pendingCommentIds.current.add(createdId);
        setPost((current) => current ? {
          ...current,
          commentList: [
            toDetailComment(createdComment),
            ...(current.commentList ?? []).filter((comment) =>
              comment.id !== optimisticId && comment.id !== createdId),
          ],
        } : current);
      }
    } catch (error) {
      pendingCommentIds.current.delete(optimisticId);
      setPost(previousPost);
      setCommentText(finalText);
      setReplyingTo(previousReplyingTo);
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  const addStickerComment = async (stickerUrl: string, sticker?: Sticker) => {
    if (!sticker || !post || commentMutation.isPending) return;

    const parentId = replyingTo?.id ?? null;
    try {
      await commentMutation.mutateAsync({
        body: stickerUrl,
        sticker_id: sticker.id,
        ...(parentId ? { parent_id: parentId } : {}),
      });
      setReplyingTo(null);
      await commentsQuery.refetch();
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  const sharePost = async () => {
    if (!post) return;
    try {
      await shareMutation.mutateAsync(post.id);
      await Share.share({
        title: `${post.artist} on Kulsah`,
        message: `${post.artist}: ${post.content}`,
      });
    } catch (error: any) {
      const message = String(error?.response?.data?.message ?? '').toLowerCase();
      if (!message.includes('already shared')) {
        const parsed = parseApiError(error);
        Alert.alert(parsed.title, parsed.message);
      }
    }
  };

  // const startReply = (comment: Comment) => {
  //   setReplyingTo(`@${comment.handle}`);
  // };

  if (postQuery.isLoading) {
    return <PageSkeleton isDark={isDark} variant="detail" />;
  }

  if ((postQuery.isError && (postQuery.error as any)?.response?.status === 403) || postQuery.data?.viewer.can_view === false) {
    return (
      <View style={[styles.emptyState, { backgroundColor: screenBg }]}>
        <MaterialIcons name="lock" size={42} color={PRIMARY_COLOR} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Subscribers only</Text>
        <Text style={[styles.emptyText, { color: mutedText }]}>Subscribe to this creator to view this community post.</Text>
        <Pressable onPress={() => navigation.navigate('ArtistProfile')} style={styles.sendButton}>
          <Text style={{ color: '#fff' }}>View subscription options</Text>
        </Pressable>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.emptyState, { backgroundColor: screenBg }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: cardBg, borderColor: softBorder }]}>
          <MaterialIcons name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>Post not found</Text>
        <Text style={[styles.emptyText, { color: mutedText }]}>This community post may have been deleted or is no longer available.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={[styles.header, {backgroundColor: 'transparent', marginBottom: 15 }]}>
        <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: screenBg, borderColor: softBorder }]}>
          <MaterialIcons name="chevron-left" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Post</Text>
          <Text style={[styles.headerSubtitle, { color: mutedText }]}>Galaxy Update</Text>
        </View>
        <Pressable style={[styles.headerRoundBtn, { backgroundColor: screenBg, borderColor: softBorder }]}>
          <MaterialIcons name="search" size={20} color={theme.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={({ nativeEvent }) => {
          const distance = nativeEvent.contentSize.height - (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height);
          if (distance < 240 && commentsQuery.hasNextPage && !commentsQuery.isFetchingNextPage) void commentsQuery.fetchNextPage();
        }}
        scrollEventThrottle={200}
      >
        <View style={[styles.feedCard, { backgroundColor: cardBg}]}>
          <View style={styles.postHeader}>
            <Pressable style={styles.authorRow} onPress={() => navigation.navigate('ArtistProfile', { isOwner: false, id: post.artist })}>
              <Image source={{ uri: post.avatar }} style={styles.avatar} />
              <View style={styles.authorTextWrap}>
                {/* <View style={styles.authorNameRow}>
                  <Text style={[styles.authorName, { color: theme.text }]}>{post.artist}</Text>
                  {post.isVerified ? <MaterialIcons name="verified" size={16} color="#1b74e4" /> : null}
                </View> */}
                <View style={styles.metaRow}>
                  <View>
                    <Text style={[styles.handleSubtext, { color: mutedText }]}>@{post.handle}</Text>
                    <Text style={[styles.handleSubtext, { color: mutedText }]}>{formatCommunityRelativeTime(post.time)}</Text>
                  </View>
                  <Text style={[styles.metaDot, { color: mutedText }]}>.</Text>
                  <MaterialIcons name="public" size={14} color={mutedText} style={{
                    marginTop: 1
                  }}/>
                </View>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable style={[styles.followBtn,]} onPress={() => void toggleFollow()}>
                <Text style={[styles.followBtnText, { color: post.isFollowing ? mutedText : '#1877f2' , fontFamily: 'Inter_700Bold'}]}>
                  {post.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </Pressable>
              <Pressable style={[styles.iconBtn,]}>
                <MaterialIcons name="more-horiz" size={22} color={dimIcon} />
              </Pressable>
            </View>
          </View>

          <View style={styles.postContentWrap}>
            <Text style={[styles.postContent, { color: theme.textSecondary }]}>{post.content}</Text>
          </View>

          {post.videoUrl ? (
            <DetailVideoPreview videoUrl={post.videoUrl} viewerCount={post.viewerCount} isLive={post.isLive} onOpen={() => setSelectedVideo(post.videoUrl!)} />
          ) : null}

          {post.images && post.images.length > 0 && (
            <View style={styles.imageStack}>
              <View style={styles.imageGrid}>
                {post.images.slice(0, post.images.length > 4 ? 4 : post.images.length).map((img, idx) => {
                  const singleImage = post.images!.length === 1;

                  return (
                    <Pressable
                      key={`${post.id}-${idx}`}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={`Open image ${idx + 1} of ${post.images!.length}`}
                      onPress={() => setSelectedImages({ images: post.images!, index: idx })}
                      style={[
                        singleImage ? styles.singleImageFrame : styles.gridImageFrame,
                        { borderColor: softBorder },
                      ]}
                    >
                      <Image source={{ uri: img }} style={singleImage ? styles.postImageSingle : styles.postImageGrid} />
                      {post.images!.length > 4 && idx === 3 ? (
                        <View pointerEvents="none" style={styles.remainingImagesOverlay}>
                          <Text style={styles.remainingImagesText}>+{post.images!.length - 4}</Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {post.pollOptions && post.pollOptions.length > 0 && (
            <View style={styles.pollWrap}>
              {post.pollOptions.map((option, idx) => {
                const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                return (
                  <Pressable
                    key={`${post.id}-poll-${idx}`}
                    disabled={isVoting || post.pollOptions!.some((item) => item.isSelected)}
                    style={[styles.pollOption, { borderColor: softBorder, backgroundColor: composerBg }, option.isSelected && styles.pollOptionSelected]}
                    onPress={() => void voteOnPoll(idx)}
                  >
                    <View style={[styles.pollFill, { width: `${percentage}%` }, option.isSelected && styles.pollFillSelected]} />
                    <View style={styles.pollContent}>
                      <Text style={[styles.pollText, { color: theme.text }]}>{option.text}</Text>
                      <Text style={[styles.pollPercent, { color: option.isSelected ? '#1877f2' : mutedText }]}>{percentage}%</Text>
                    </View>
                  </Pressable>
                );
              })}
              <Text style={[styles.pollFoot, { color: mutedText }]}>{totalVotes.toLocaleString()} votes</Text>
            </View>
          )}

          {/* <View style={[styles.reactionSummary, { borderTopColor: softBorder, borderBottomColor: softBorder }]}>
            <View style={styles.reactionLeft}>
              <View style={styles.likeBadge}>
                <MaterialIcons name="favorite" size={11} color="#fff" />
              </View>
              <Text style={[styles.reactionSummaryText, { color: mutedText }]}>{post.likes.toLocaleString()}</Text>
            </View>
            <Text style={[styles.reactionSummaryText, { color: mutedText }]}>{post.comments.toLocaleString()} comments</Text>
          </View> */}

          <View style={styles.actionBar}>
            <Pressable accessibilityRole="button" accessibilityLabel={post.isLiked ? 'Unlike post' : 'Like post'} disabled={likeMutation.isPending} style={styles.actionItem} onPress={() => void toggleLike()}>
              <MaterialIcons name={post.isLiked ? 'favorite' : 'favorite-border'} size={20} color={post.isLiked ? '#f43f5e' : dimIcon} />
              <Text style={[styles.actionText, { color: post.isLiked ? '#f43f5e' : mutedText }]}>{post.likes.toLocaleString()}</Text>
            </Pressable>
            <Pressable style={styles.actionItem}>
              <MaterialIcons name="chat-bubble-outline" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>{post.comments.toLocaleString()}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Share post" disabled={shareMutation.isPending} style={styles.actionItem} onPress={() => void sharePost()}>
              <MaterialIcons name="share" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>{(post.shares ?? 0).toLocaleString()}</Text>
            </Pressable>
            {/* <Pressable accessibilityRole="button" accessibilityLabel="Send a KulCoin gift" disabled={giftMutation.isPending} style={styles.actionItem} onPress={() => setGiftDialogOpen(true)}>
              <MaterialIcons name="redeem" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>{(post.gifts ?? 0).toLocaleString()}</Text>
            </Pressable>
            <View style={styles.actionItem} accessibilityLabel={`${post.views ?? 0} views`}>
              <MaterialIcons name="visibility" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>{(post.views ?? 0).toLocaleString()}</Text>
            </View> */}
          </View>

          <View style={styles.commentsSection}>
            <View style={[styles.commentsHeader, { borderBottomColor: softBorder }]}>
              <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>
            </View>

            {commentsQuery.isLoading ? <ActivityIndicator color={PRIMARY_COLOR} style={{ marginTop: 20 }} /> : null}
            {commentsQuery.isError ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Retry loading comments" onPress={() => void commentsQuery.refetch()} style={styles.emptyComments}>
                <Text style={[styles.emptyCommentsText, { color: mutedText }]}>Comments could not be loaded. Tap to retry.</Text>
              </Pressable>
            ) : null}

            {post.commentList && post.commentList.length > 0 ? (
              <View style={styles.commentsStack}>
                {post.commentList.map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContentWrap}>
                      <View style={[styles.commentBubble, { backgroundColor: composerBg }]}>
                        <Text style={[styles.commentHandle, { color: theme.text }]}>{comment.user || `@${comment.handle}`}</Text>
                        {comment.stickerUrl ? (
                          <Image source={{ uri: comment.stickerUrl }} style={styles.commentSticker} resizeMode="contain" />
                        ) : (
                          <Text style={[styles.commentTextBody, { color: theme.text }]}>{comment.text}</Text>
                        )}
                      </View>
                      <View style={styles.commentMetaRow}>
                        <Text style={[styles.commentMetaText, { color: mutedText }]}>Like</Text>
                        <Pressable onPress={() => {
                          setReplyingTo(comment);
                          setReplyUsername(post.handle);
                          setReplyTime(Date.now().toString());
                          setReplyAvatar('https://picsum.photos/seed/luna-codes/120');
                        }}>
                          <Text style={[styles.commentMetaText, { color: mutedText }]}>Reply</Text>
                        </Pressable>
                        <Text style={[styles.commentMetaText, { color: mutedText }]}>{formatCommunityRelativeTime(comment.time)}</Text>
                      </View>
                      {comment.replys?.map((item)=>
                            <View style={styles.replyWrap}>
                                        <View style={[styles.replyLine, { backgroundColor: primaryColorAlpha(0.28) }]} />
                                        <View style={styles.replyRow}>
                                          <Image source={{ uri: item.avatar }} style={styles.replyAvatar} />
                                          <View style={styles.replyMain}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                                              <Text style={[styles.replyHandle, { color: theme.text }]}>@{item.replyhandle}</Text>
                                              <Text style={[styles.replyTime, { color: muted }]}>{formatCommunityRelativeTime(item.time)}</Text>
                                            </View>
                                            {item.stickerUrl ? (
                                              <Image source={{ uri: item.stickerUrl }} style={styles.replySticker} resizeMode="contain" />
                                            ) : (
                                              <Text style={[styles.replyBody, { color: commentText }]}>
                                                <Text style={{ color: PRIMARY_COLOR }}>@{comment.handle} </Text>
                                                {" "}{item.text}
                                              </Text>
                                            )}
                                            <View style={styles.replyActions}>
                                              <Pressable onPress={() => {
                                                setReplyingTo({
                                                  id: comment.id,
                                                  user: '',
                                                  handle: '',
                                                  avatar: '',
                                                  text: commentText,
                                                  time: '',
                                                  // replys: []
                                                });
                                                setReplyUsername(item.username);
                                                setReplyTime(Date.now().toString());
                                                setReplyAvatar('https://picsum.photos/seed/luna-codes/120');
                                              }}>
                                                <Text style={[styles.replyActionText, { color: muted }]}>Reply</Text>
                                              </Pressable>

                                              <Text style={[styles.replyActionText, { color: muted }]}>Like</Text>
                                            </View>
                                          </View>
                                        </View>
                                      </View>
                      )
                        }
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyComments}>
                <MaterialIcons name="forum" size={24} color={dimIcon} />
                <Text style={[styles.emptyCommentsText, { color: mutedText }]}>Be the first to comment.</Text>
              </View>
            )}
            {commentsQuery.isFetchingNextPage ? <ActivityIndicator color={PRIMARY_COLOR} style={{ marginTop: 14 }} /> : null}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!selectedImages} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedImages(null)}>
        <View style={styles.imageModalRoot}>
          <View style={styles.imageModalHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen images" onPress={() => setSelectedImages(null)} style={styles.imageModalCloseBtn}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </Pressable>
          </View>
          {selectedImages ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentOffset={{ x: selectedImages.index * viewportWidth, y: 0 }}
                onMomentumScrollEnd={({ nativeEvent }) => {
                  const index = Math.round(nativeEvent.contentOffset.x / viewportWidth);
                  setSelectedImages((current) => current ? { ...current, index } : current);
                }}
              >
                {selectedImages.images.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={[styles.fullscreenImagePage, { width: viewportWidth }]}>
                    <Image accessibilityLabel={`Image ${index + 1} of ${selectedImages.images.length}`} source={{ uri }} style={styles.imageModalImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
              {selectedImages.images.length > 1 ? (
                <View style={styles.fullscreenCounter}>
                  <Text style={styles.fullscreenCounterText}>{selectedImages.index + 1} / {selectedImages.images.length}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </Modal>

      <Modal visible={!!selectedVideo} animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedVideo(null)}>
        <View style={styles.fullscreenMediaRoot}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close full-screen video" onPress={() => setSelectedVideo(null)} style={styles.fullscreenClose}>
            <MaterialIcons name="close" size={25} color="#fff" />
          </Pressable>
          {selectedVideo ? <DetailFullscreenVideo uri={selectedVideo} /> : null}
        </View>
      </Modal>

      <View style={[styles.bottomComposer, { borderTopColor: softBorder, backgroundColor: headerBg }]}>
        <Image source={{ uri: currentUser.avatar || 'https://picsum.photos/seed/user/100/100' }} style={styles.composerAvatar} />
        <View style={styles.inputShell}>
          {replyingTo ? (
            <View style={[styles.replyingBanner, { backgroundColor: composerBg, borderColor: softBorder }]}>
              <View style={styles.replyingInfo}>
                <MaterialIcons name="reply" size={16} color={PRIMARY_COLOR} />
                <Text style={[styles.replyingText, { color: mutedText }]}>
                  Replying to <Text style={[styles.replyingTarget, { color: theme.text }]}>@{replyingTo.handle}</Text>
                </Text>
              </View>
              <Pressable onPress={() => setReplyingTo(null)}>
                <MaterialIcons name="close" size={18} color={mutedText} />
              </Pressable>
            </View>
          ) : null}
          <KulsahInputBar
            value={commentText}
            onChangeText={setCommentText}
            expressionPicker={{
              onStickerSelect: addStickerComment,
              giftOptions: {
                creatorName: post.artist,
                communityPostId: post.id,
                message: commentText,
              },
            }}
            placeholder="Join the discussion..."
            placeholderTextColor={mutedText}
            containerStyle={{ backgroundColor: composerBg, borderColor: softBorder }}
            rightAccessory={(
              <>
                {commentText ? (
                  <Pressable onPress={() => void addComment(replyingTo ? replyingTo.id : null)} style={styles.sendButton}>
                    <MaterialIcons name="send" size={18} color="#fff" />
                  </Pressable>
                ) : null}
              </>
            )}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    marginTop: 40,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRoundBtn: {
    height: 38,
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCopy: { flex: 1 },
  headerTitle: { ...fontSize.h1, lineHeight: fontSize.h1.lineHeight },
  headerSubtitle: { ...fontSize.h2, lineHeight: fontSize.h2.lineHeight },
  scrollBody: { paddingBottom: 96 },
  feedCard: {overflow: 'hidden'},
  postHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    // backgroundColor: 'blue'
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  authorTextWrap: { flex: 1, gap: 0},
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { ...fontSize.handleTextMedium, lineHeight: fontSize.handleTextMedium.lineHeight },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 4, flex: 1 },
  handleSubtext: { ...fontSize.b0, lineHeight: fontSize.b0.lineHeight},
  metaDot: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  headerActions: { flexDirection: 'row', justifyContent: 'flex-start', gap: 8, marginTop: -10},
  followBtn: { minHeight: 32, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  iconBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  postContentWrap: { paddingHorizontal: 12, paddingBottom: 12 },
  postContent: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,},
  mediaWrap: { height: 410, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  video: { width: '100%', height: '100%' },
  videoMuteButton: {
    position: 'absolute', right: 6, bottom: 6, width: 25, height: 25,
    borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.58)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center',
  },
  videoLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  liveBadges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 8 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, letterSpacing: 1 },
  viewerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  viewerText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  fullscreenMediaRoot: { flex: 1, backgroundColor: '#000' },
  fullscreenVideo: { flex: 1, width: '100%', backgroundColor: '#000' },
  fullscreenClose: {
    position: 'absolute', right: 16, top: 48, zIndex: 10, width: 44, height: 44,
    borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  imageStack: { marginBottom: 12 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 2, paddingHorizontal: 0 },
  singleImageFrame: { width: '100%', height: 210, borderRadius: 0, overflow: 'hidden', borderWidth: 1 },
  gridImageFrame: { width: '49.8%', height: 150, borderRadius: 0, overflow: 'hidden', borderWidth: 1 },
  postImageSingle: { width: '100%', height: '100%', resizeMode: 'cover' },
  postImageGrid: { width: '100%', height: '100%', resizeMode: 'cover' },
  remainingImagesOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.58)' },
  remainingImagesText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  pollWrap: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  pollOption: { height: 52, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  pollOptionSelected: { borderColor: primaryColorAlpha(0.35) },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: primaryColorAlpha(0.08) },
  pollFillSelected: { backgroundColor: primaryColorAlpha(0.16) },
  pollContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  pollText: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  pollPercent: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  pollFoot: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  reactionSummary: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reactionLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: PRIMARY_COLOR, alignItems: 'center', justifyContent: 'center' },
  reactionSummaryText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  actionBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 15 },
  actionItem: { minHeight: 42, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  commentsSection: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 },
  commentsTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight },
  commentsStack: { gap: 14, paddingTop: 14 },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginTop: 2 },
  commentContentWrap: { flex: 1 },
  commentBubble: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  commentHandle: { ...fontSize.b4, lineHeight: fontSize.b4.lineHeight, marginBottom: 3 },
  commentTextBody: { ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  commentSticker: { width: 112, height: 112, marginTop: 6 },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, marginTop: 6 },
  commentMetaText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  emptyComments: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyCommentsText: { textAlign: 'center', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  bottomComposer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  composerAvatar: { width: 34, height: 34, borderRadius: 17 },
  inputShell: {
    flex: 1,
  },
  replyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  replyingInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  replyingText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight + 2 },
  replyingTarget: {  },
  bottomComposerInput: { maxHeight: 90, paddingVertical: 4, ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  inputActions: { flexDirection: 'row' },
  inputIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sendButton: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: PRIMARY_COLOR },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  emptyTitle: { ...fontSize.b1, lineHeight: fontSize.b1.lineHeight, textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', ...fontSize.b3, lineHeight: fontSize.b3.lineHeight },
  imageModalRoot: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' },
  imageModalBackdrop: { ...StyleSheet.absoluteFillObject },
  imageModalHeader: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 2,
  },
  imageModalCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImagePage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fullscreenCounter: { position: 'absolute', bottom: 38, alignSelf: 'center', borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.62)', paddingHorizontal: 12, paddingVertical: 6 },
  fullscreenCounterText: { color: '#fff', ...fontSize.b4, lineHeight: fontSize.b4.lineHeight },
  imageModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  replyWrap: { marginTop: 15, paddingLeft: 10, position: 'relative', gap: 10 },
  replyLine: { position: 'absolute', left: 0, top: -6, bottom: 6, width: 2, borderRadius: 999 },
  replyRow: { flexDirection: 'row', gap: 10 },
  replyAvatar: { width: 32, height: 32, borderRadius: 16 },
  replyMain: { flex: 1 },
  replyHandle: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  replyTime: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  replyBody: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
  replySticker: { width: 96, height: 96, marginTop: 4 },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  replyActionText: { ...fontSize.b5, lineHeight: fontSize.b5.lineHeight },
});

export default CommunityPostDetail;
