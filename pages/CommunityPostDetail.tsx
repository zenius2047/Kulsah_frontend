import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useThemeMode } from '../theme';
import { FontSize } from '../fonts';
import { mediumScreen, user } from '../types';
import KulsahInputBar from '../components/KulsahInputBar';

interface Comment {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
  replys?: Reply[];
}

interface PollOption {
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
  commentList?: Comment[];
  time: string;
  isLiked: boolean;
  type: 'text' | 'image' | 'poll' | 'live';
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

const formatCommentTime = (value: string) => {
  const parsedTime = Number(value);
  const timestamp =
    Number.isFinite(parsedTime) && parsedTime > 0
      ? parsedTime
      : Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return value;
  }

  const diffMs = Date.now() - timestamp;
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `${minutes}m`;
  }

  if (diffMs < dayMs) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return `${hours}h`;
  }

  if (diffMs < weekMs) {
    const days = Math.max(1, Math.floor(diffMs / dayMs));
    return `${days}d`;
  }

  if (diffMs < 8 * dayMs) {
    return '1w';
  }

  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const DetailLivePreview: React.FC<{ videoUrl: string; viewerCount?: number }> = ({ videoUrl, viewerCount }) => {
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <View style={styles.mediaWrap}>
      <VideoView player={player} style={styles.video} nativeControls allowsPictureInPicture />
      <View style={styles.liveBadges}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>LIVE</Text>
        </View>
        <View style={styles.viewerPill}>
          <MaterialIcons name="visibility" size={14} color="#fff" />
          <Text style={styles.viewerText}>{(viewerCount ?? 0).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
};

const CommunityPostDetail: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isDark, theme } = useThemeMode();
  const muted = theme.textMuted;
  const postId = route.params?.postId as string | undefined;
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [commentUsername, setcommentUsername] = useState<string>('');
  const [replyUsername, setReplyUsername] = useState<string>('');
  const [replyAvatar, setReplyAvatar] = useState<string>('');
  const [replyTime, setReplyTime] = useState<string>('');

  const screenBg = isDark ? '#0b0d12' : '#f0f2f5';
  const cardBg = isDark ? '#121219' : '#ffffff';
  const headerBg = isDark ? '#121219' : '#ffffff';
  const composerBg = isDark ? '#1d1d27' : theme.surface;
  const softBorder = isDark ? 'rgba(255,255,255,0.08)' : '#dfe3e8';
  const mutedText = isDark ? '#aeb7c2' : '#65676b';
  const dimIcon = isDark ? '#aeb7c2' : '#65676b';
  const normalizedHandle = (currentUser.handle ?? '').replace('@', '');

  const loadPost = useCallback(async () => {
    try {
      const [savedUser, storedPosts] = await Promise.all([
        AsyncStorage.getItem(USER_KEY),
        AsyncStorage.getItem(STORAGE_KEY),
      ]);

      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser) as CurrentUser);
      }

      if (storedPosts && postId) {
        const parsedPosts = JSON.parse(storedPosts) as CommunityPost[];
        const matchedPost = parsedPosts.find((item) => item.id === postId) ?? null;
        setPost(matchedPost);
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadPost();
  }, [loadPost]);

  const totalVotes = useMemo(
    () => post?.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) ?? 0,
    [post?.pollOptions],
  );

  const persistPostUpdate = async (updater: (target: CommunityPost) => CommunityPost) => {
    if (!post) return;
    const storedPosts = await AsyncStorage.getItem(STORAGE_KEY);
    const parsedPosts = storedPosts ? (JSON.parse(storedPosts) as CommunityPost[]) : [];
    const updatedPosts = parsedPosts.map((item) => (item.id === post.id ? updater(item) : item));
    const updatedPost = updatedPosts.find((item) => item.id === post.id) ?? null;
    setPost(updatedPost);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosts));
  };

  const toggleLike = async () => {
    await persistPostUpdate((target) => ({
      ...target,
      isLiked: !target.isLiked,
      likes: target.isLiked ? target.likes - 1 : target.likes + 1,
    }));
  };

  const toggleFollow = async () => {
    await persistPostUpdate((target) => ({
      ...target,
      isFollowing: !target.isFollowing,
    }));
  };

  const voteOnPoll = async (optionIndex: number) => {
    await persistPostUpdate((target) => {
      if (!target.pollOptions) return target;
      const nextOptions = target.pollOptions.map((option, index) => ({
        ...option,
        isSelected: index === optionIndex,
        votes: index === optionIndex ? option.votes + 1 : option.isSelected ? option.votes - 1 : option.votes,
      }));
      return { ...target, pollOptions: nextOptions };
    });
  };

  const addComment = async (commentId: string | null) => {
    console.log('Comment Id from reply:', commentId);
    setcommentUsername(user?.name ?? '')
    const finalText = commentText.trim();
    if (!finalText || !post) return;
    console.log(Date.now().toString());
    const newComment: Comment = {
      id: Math.random().toString(36).slice(2,8),
      user: currentUser.name || 'Anonymous',
      handle: normalizedHandle || 'user',
      avatar: currentUser.avatar || 'https://picsum.photos/seed/user/100/100',
      text: finalText,
      time: Date.now().toString(),
    };

    await persistPostUpdate((target) => {
        let updatedComment: Comment | null = null;
        let listOfComment = target.commentList;
      if(target.commentList && commentId){
        updatedComment = target.commentList.find((item)=>item.id === commentId) ?? null;
        console.log('comment to update',updatedComment);
        if(updatedComment){
          let replys: Reply[] = [];
          if(updatedComment.replys){
            console.log('this is reply that exists already:', replys);
            replys = updatedComment.replys;
          }
          // listOfComment = [...target.commentList, {...updatedComment, reply: commentText}]
          listOfComment = target.commentList.map((item) =>
                  item.id === updatedComment?.id
                    ? { ...updatedComment, replys: [...replys, {
                      text: commentText,
                      username: commentUsername,
                      replyhandle: replyUsername,
                      time: replyTime,
                      avatar: replyAvatar
                    }] }
                    : item
                );
        }
      }else{
        console.log("this is the new comment:", newComment)
        listOfComment = [newComment, ...(target.commentList || [])]
      }
      return ({
      ...target,
      comments: replyingTo ? target.comments : target.comments + 1,
      commentList: listOfComment,
    })
    }
  );
    setCommentText('');
    setReplyingTo(null);
  };

  const sharePost = async () => {
    if (!post) return;
    try {
      await Share.share({
        title: `${post.artist} on Kulsah`,
        message: `${post.artist}: ${post.content}`,
      });
    } catch {
      // ignore share failure
    }
  };

  // const startReply = (comment: Comment) => {
  //   setReplyingTo(`@${comment.handle}`);
  // };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: screenBg }]}>
        <ActivityIndicator size="large" color="#1877f2" />
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
      style={[styles.container, { backgroundColor: screenBg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={[styles.header, { borderBottomColor: softBorder, backgroundColor: headerBg }]}>
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

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.feedCard, { backgroundColor: cardBg, borderBottomColor: softBorder }]}>
          <View style={styles.postHeader}>
            <Pressable style={styles.authorRow} onPress={() => navigation.navigate('ArtistProfile', { isOwner: false, id: post.artist })}>
              <Image source={{ uri: post.avatar }} style={styles.avatar} />
              <View style={styles.authorTextWrap}>
                <View style={styles.authorNameRow}>
                  <Text style={[styles.authorName, { color: theme.text }]}>{post.artist}</Text>
                  {post.isVerified ? <MaterialIcons name="verified" size={16} color="#1b74e4" /> : null}
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.handleSubtext, { color: mutedText }]}>@{post.handle}</Text>
                  <Text style={[styles.metaDot, { color: mutedText }]}>.</Text>
                  <Text style={[styles.handleSubtext, { color: mutedText }]}>{post.time}</Text>
                  <Text style={[styles.metaDot, { color: mutedText }]}>.</Text>
                  <MaterialIcons name="public" size={12} color={mutedText} />
                </View>
              </View>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable style={[styles.followBtn, { backgroundColor: screenBg }]} onPress={() => void toggleFollow()}>
                <Text style={[styles.followBtnText, { color: post.isFollowing ? mutedText : '#1877f2' }]}>
                  {post.isFollowing ? 'following' : 'follow'}
                </Text>
              </Pressable>
              <Pressable style={[styles.iconBtn, { backgroundColor: screenBg }]}>
                <MaterialIcons name="more-horiz" size={22} color={dimIcon} />
              </Pressable>
            </View>
          </View>

          <View style={styles.postContentWrap}>
            <Text style={[styles.postContent, { color: theme.text }]}>{post.content}</Text>
          </View>

          {post.isLive && post.videoUrl ? <DetailLivePreview videoUrl={post.videoUrl} viewerCount={post.viewerCount} /> : null}

          {post.images && post.images.length > 0 && (
            <View style={styles.imageStack}>
              <View style={styles.imageGrid}>
                {post.images.map((img, idx) => {
                  const singleImage = post.images!.length === 1;

                  return (
                    <Pressable
                      key={`${post.id}-${idx}`}
                      onPress={() => setSelectedImage(img)}
                      style={[
                        singleImage ? styles.singleImageFrame : styles.gridImageFrame,
                        { borderColor: softBorder },
                      ]}
                    >
                      <Image source={{ uri: img }} style={singleImage ? styles.postImageSingle : styles.postImageGrid} />
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
            <Pressable style={styles.actionItem} onPress={() => void toggleLike()}>
              <MaterialIcons name={post.isLiked ? 'favorite' : 'favorite-border'} size={20} color={post.isLiked ? '#cd2bee' : dimIcon} />
              <Text style={[styles.actionText, { color: post.isLiked ? '#cd2bee' : mutedText }]}>{post.likes.toLocaleString()}</Text>
            </Pressable>
            <Pressable style={styles.actionItem}>
              <MaterialIcons name="chat-bubble-outline" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>{post.comments.toLocaleString()}</Text>
            </Pressable>
            <Pressable style={styles.actionItem} onPress={() => void sharePost()}>
              <MaterialIcons name="share" size={20} color={dimIcon} />
              <Text style={[styles.actionText, { color: mutedText }]}>0</Text>
            </Pressable>
          </View>

          <View style={styles.commentsSection}>
            <View style={[styles.commentsHeader, { borderBottomColor: softBorder }]}>
              <Text style={[styles.commentsTitle, { color: theme.text }]}>Comments</Text>
            </View>

            {post.commentList && post.commentList.length > 0 ? (
              <View style={styles.commentsStack}>
                {post.commentList.map((comment) => (
                  <View key={comment.id} style={styles.commentRow}>
                    <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                    <View style={styles.commentContentWrap}>
                      <View style={[styles.commentBubble, { backgroundColor: composerBg }]}>
                        <Text style={[styles.commentHandle, { color: theme.text }]}>{comment.user || `@${comment.handle}`}</Text>
                        <Text style={[styles.commentTextBody, { color: theme.text }]}>{comment.text}</Text>
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
                        <Text style={[styles.commentMetaText, { color: mutedText }]}>{formatCommentTime(comment.time)}</Text>
                      </View>
                      {comment.replys?.map((item)=>
                            <View style={styles.replyWrap}>
                                        <View style={[styles.replyLine, { backgroundColor: 'rgba(205,43,238,0.28)' }]} />
                                        <View style={styles.replyRow}>
                                          <Image source={{ uri: item.avatar }} style={styles.replyAvatar} />
                                          <View style={styles.replyMain}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                                              <Text style={[styles.replyHandle, { color: theme.text }]}>@{item.replyhandle}</Text>
                                              <Text style={[styles.replyTime, { color: muted }]}>{formatCommentTime(item.time)}</Text>
                                            </View>
                                            <Text style={[styles.replyBody, { color: commentText }]}>
                                              <Text style={{ color: '#cd2bee', fontFamily: 'PlusJakartaSansBold' }}>@{comment.handle} </Text>
                                               {" "}{item.text}
                                            </Text>
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
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!selectedImage} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageModalRoot}>
          <Pressable style={styles.imageModalBackdrop} onPress={() => setSelectedImage(null)} />
          <View style={styles.imageModalHeader}>
            <Pressable onPress={() => setSelectedImage(null)} style={styles.imageModalCloseBtn}>
              <MaterialIcons name="close" size={22} color="#fff" />
            </Pressable>
          </View>
          {selectedImage ? (
            <View style={styles.imageModalContent}>
              <Image source={{ uri: selectedImage }} style={styles.imageModalImage} />
            </View>
          ) : null}
        </View>
      </Modal>

      <View style={[styles.bottomComposer, { borderTopColor: softBorder, backgroundColor: headerBg }]}>
        <Image source={{ uri: currentUser.avatar || 'https://picsum.photos/seed/user/100/100' }} style={styles.composerAvatar} />
        <View style={styles.inputShell}>
          {replyingTo ? (
            <View style={[styles.replyingBanner, { backgroundColor: composerBg, borderColor: softBorder }]}>
              <View style={styles.replyingInfo}>
                <MaterialIcons name="reply" size={16} color="#cd2bee" />
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
            placeholder="Write a comment..."
            placeholderTextColor={theme.textSecondary}
            multiline
            containerStyle={{ backgroundColor: composerBg, borderColor: softBorder }}
            inputStyle={[styles.bottomComposerInput, { color: theme.text }]}
            rightAccessory={(
              <Pressable onPress={() => void addComment(replyingTo ? replyingTo.id : null)} style={styles.sendBtn}>
                <MaterialIcons name="send" size={18} color={commentText.trim() ? '#1877f2' : dimIcon} />
              </Pressable>
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
    borderBottomWidth: 1,
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
  headerTitle: { fontSize: mediumScreen ? FontSize.fifteen : FontSize.twelve, fontFamily: 'PlusJakartaSansExtraBold' },
  headerSubtitle: { fontSize: mediumScreen ? FontSize.ten : FontSize.eight, fontFamily: 'PlusJakartaSansMedium' },
  scrollBody: { paddingBottom: 96 },
  feedCard: { borderBottomWidth: 1, borderRadius: 28, overflow: 'hidden', marginHorizontal: 12, marginTop: 12 },
  postHeader: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  authorTextWrap: { flex: 1, gap: 2 },
  authorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorName: { fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven, fontFamily: 'PlusJakartaSansBold' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  handleSubtext: { fontSize: mediumScreen ? FontSize.ten : FontSize.eight, fontFamily: 'PlusJakartaSansMedium' },
  metaDot: { fontSize: FontSize.twelve, fontFamily: 'PlusJakartaSansBold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  followBtn: { minHeight: 32, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  followBtnText: { fontSize: mediumScreen ? FontSize.eleven : FontSize.nine, fontFamily: 'PlusJakartaSansBold' },
  iconBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  postContentWrap: { paddingHorizontal: 12, paddingBottom: 12 },
  postContent: { fontSize: mediumScreen ? FontSize.sixteen : FontSize.fourteen, lineHeight: 22, fontFamily: 'PlusJakartaSansMedium' },
  mediaWrap: { height: 280, marginBottom: 12, overflow: 'hidden' },
  video: { width: '100%', height: '100%' },
  liveBadges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 8 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontSize: mediumScreen ? FontSize.fourteen : FontSize.ten, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1 },
  viewerPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.42)', paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  viewerText: { color: '#fff', fontSize: mediumScreen ? FontSize.fourteen : FontSize.ten, fontFamily: 'PlusJakartaSansBold' },
  imageStack: { marginBottom: 12 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6, paddingHorizontal: 12 },
  singleImageFrame: { width: '100%', height: 320, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  gridImageFrame: { width: '49%', aspectRatio: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1 },
  postImageSingle: { width: '100%', height: '100%', resizeMode: 'cover' },
  postImageGrid: { width: '100%', height: '100%', resizeMode: 'cover' },
  pollWrap: { paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  pollOption: { height: 52, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  pollOptionSelected: { borderColor: 'rgba(205,43,238,0.35)' },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(205,43,238,0.08)' },
  pollFillSelected: { backgroundColor: 'rgba(205,43,238,0.16)' },
  pollContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  pollText: { fontSize: mediumScreen ? FontSize.sixteen : FontSize.twelve, fontFamily: 'PlusJakartaSansBold' },
  pollPercent: { fontSize: mediumScreen ? FontSize.fifteen : FontSize.eleven, fontFamily: 'PlusJakartaSansExtraBold' },
  pollFoot: { fontSize: mediumScreen ? FontSize.thirteen : FontSize.ten, fontFamily: 'PlusJakartaSansMedium' },
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
  likeBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#cd2bee', alignItems: 'center', justifyContent: 'center' },
  reactionSummaryText: { fontSize: mediumScreen ? FontSize.ten : FontSize.nine, fontFamily: 'PlusJakartaSansMedium' },
  actionBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, gap: 15 },
  actionItem: { minHeight: 42, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionText: { fontSize: mediumScreen ? FontSize.eleven : FontSize.nine, fontFamily: 'PlusJakartaSansBold' },
  commentsSection: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20 },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1 },
  commentsTitle: { fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven, fontFamily: 'PlusJakartaSansExtraBold' },
  commentsStack: { gap: 14, paddingTop: 14 },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginTop: 2 },
  commentContentWrap: { flex: 1 },
  commentBubble: { borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
  commentHandle: { fontSize: mediumScreen ? FontSize.thirteen : FontSize.eleven, fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 3 },
  commentTextBody: { fontSize: mediumScreen ? FontSize.fifteen : FontSize.twelve, lineHeight: 20, fontFamily: 'PlusJakartaSansMedium' },
  commentMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 10, marginTop: 6 },
  commentMetaText: { fontSize: mediumScreen ? FontSize.eleven : FontSize.ten, fontFamily: 'PlusJakartaSansBold' },
  emptyComments: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyCommentsText: { textAlign: 'center', fontSize: mediumScreen ? FontSize.fourteen : FontSize.eleven, fontFamily: 'PlusJakartaSansBold' },
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
  replyingText: { fontSize: mediumScreen ? FontSize.ten : FontSize.eight, fontFamily: 'PlusJakartaSansMedium' },
  replyingTarget: { fontFamily: 'PlusJakartaSansBold' },
  bottomComposerInput: { maxHeight: 90, paddingVertical: 4, fontSize: mediumScreen ? FontSize.fourteen : FontSize.twelve, fontFamily: 'PlusJakartaSansMedium' },
  sendBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: mediumScreen ? FontSize.eighteen : FontSize.fourteen, fontFamily: 'PlusJakartaSansExtraBold', textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', fontSize: mediumScreen ? FontSize.fifteen : FontSize.twelve, fontFamily: 'PlusJakartaSansMedium', lineHeight: 20 },
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
  imageModalContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 64,
  },
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
  replyHandle: { fontFamily: 'PlusJakartaSansBold', fontSize: mediumScreen ? FontSize.eleven:FontSize.eight },
  replyTime: { fontFamily: 'PlusJakartaSansMedium', fontSize: mediumScreen ? FontSize.nine: FontSize.six },
  replyBody: { fontFamily: 'PlusJakartaSansMedium', fontSize: mediumScreen ? FontSize.eleven: FontSize.eight, lineHeight: 15 },
  replyActions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  replyActionText: { fontFamily: 'PlusJakartaSansBold', fontSize: mediumScreen ? FontSize.ten: FontSize.eight },
});

export default CommunityPostDetail;
