import React, { useEffect, useState } from 'react';
import { useThemeMode } from '../theme';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { mediumScreen, user } from '../types';

interface Comment {
  id: string;
  user: string;
  handle: string;
  avatar: string;
  text: string;
  time: string;
}

interface PollOption {
  text: string;
  votes: number;
  isSelected?: boolean;
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
}

interface CurrentUser {
  name?: string;
  handle?: string;
  avatar?: string;
  role?: 'creator' | 'fan';
}

const STORAGE_KEY = 'pulsar_community_posts';
const USER_KEY = 'pulsar_user';

const seedPosts: CommunityPost[] = [
  {
    id: 'live-1',
    artist: 'Mila Ray',
    handle: 'milaray',
    avatar: 'https://picsum.photos/seed/mila/150/150',
    content: 'Live Studio Session! Come hang out while I work on some new tracks. 🎹✨',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-dancing-40102-large.mp4',
    isLive: true,
    viewerCount: 1240,
    likes: 3200,
    comments: 45,
    time: 'LIVE NOW',
    isLiked: false,
    type: 'live',
  },
  {
    id: '1',
    artist: 'Elena Rose',
    handle: 'elena_rose',
    avatar: 'https://picsum.photos/seed/elena/150/150',
    content: "Just finished the final mix for 'Nebula'. Can't wait for you all to hear it! Which version should I drop first? 🌌✨",
    likes: 1240,
    comments: 2,
    commentList: [
      { id: 'c1', user: 'Alex Rivera', handle: 'alexvibes', avatar: 'https://picsum.photos/seed/fan1/100/100', text: "Can't wait for Nebula! 🔥", time: '1h ago' },
      { id: 'c2', user: 'Sarah J', handle: 'sarah_j', avatar: 'https://picsum.photos/seed/fan2/100/100', text: 'Acoustic version please! ✨', time: '30m ago' },
    ],
    time: '2h ago',
    isLiked: false,
    type: 'poll',
    pollOptions: [
      { text: 'Original Mix', votes: 450, isSelected: true },
      { text: 'Acoustic Version', votes: 320 },
      { text: 'Extended Club Edit', votes: 120 },
    ],
  },
  {
    id: '2',
    artist: 'Zion King',
    handle: 'zionking_afro',
    avatar: 'https://picsum.photos/seed/zion/150/150',
    content: 'Behind the scenes at the O2 Arena. The energy is already building up! See you tonight. 🔥🌍',
    images: ['https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800'],
    likes: 8500,
    comments: 1,
    commentList: [
      { id: 'c3', user: 'Mike D', handle: 'miked_beats', avatar: 'https://picsum.photos/seed/fan3/100/100', text: 'See you there Zion! 🌍🔥', time: '2h ago' },
    ],
    time: '5h ago',
    isLiked: true,
    type: 'image',
  },
  {
    id: '3',
    artist: 'Amara',
    handle: 'amara_official',
    avatar: 'https://picsum.photos/seed/amara/150/150',
    content: 'New merch drop coming this Friday. Galaxy hoodies are back in stock! 💃✨',
    likes: 3200,
    comments: 0,
    commentList: [],
    time: '8h ago',
    isLiked: false,
    type: 'text',
  },
];

const stickers = [
  { id: 'st1', img: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=100' },
  { id: 'st2', img: 'https://images.unsplash.com/photo-1572375927902-e60e87bb7385?auto=format&fit=crop&q=80&w=100' },
  { id: 'st3', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=100' },
  { id: 'st4', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=100' },
];

const LivePreview: React.FC<{ videoUrl: string; viewerCount?: number; isCreator: boolean }> = ({ videoUrl, viewerCount, isCreator }) => {
  const { isDark, theme } = useThemeMode();
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={[styles.mediaWrap, { borderColor: theme.border }]}>
      <VideoView player={player} style={styles.video} nativeControls={false} allowsPictureInPicture />
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
      {!isCreator && (
        <View style={styles.liveActions}>
          <Pressable style={[styles.iconGlassBtn, { borderColor: isDark ? 'rgba(255,255,255,0.28)' : theme.border, backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.88)' }]}>
            <MaterialIcons name="fullscreen" size={20} color={isDark ? '#fff' : theme.text} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const Community: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({});
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showOptionsPostId, setShowOptionsPostId] = useState<string | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const panelSurface = isDark ? '#121219' : theme.card;
  const panelElevated = isDark ? '#1d1d27' : theme.surface;
  const faintSurface = isDark ? 'rgba(255,255,255,0.04)' : theme.surface;
  const faintSurfaceStrong = isDark ? 'rgba(255,255,255,0.07)' : theme.surface;
  const softBorder = theme.border;
  const mutedText = theme.textSecondary;
  const dimIcon = isDark ? '#9ca3af' : theme.textSecondary;

  const isCreator = currentUser.role === 'creator';
  const normalizedHandle = (currentUser.handle ?? '').replace('@', '');

  useEffect(() => {
    const load = async () => {
      try {
        const [savedUser, storedPosts] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(STORAGE_KEY),
        ]);

        if (savedUser) setCurrentUser(JSON.parse(savedUser) as CurrentUser);

        if (storedPosts) {
          setPosts(JSON.parse(storedPosts) as CommunityPost[]);
        } else {
          setPosts(seedPosts);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedPosts));
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const savePosts = async (nextPosts: CommunityPost[]) => {
    setPosts(nextPosts);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextPosts));
  };

  const toggleLike = async (id: string) => {
    const updated = posts.map((post) =>
      post.id === id
        ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          }
        : post,
    );
    await savePosts(updated);
  };

  const voteOnPoll = async (postId: string, optionIndex: number) => {
    const updated = posts.map((post) => {
      if (post.id === postId && post.pollOptions) {
        const newOptions = post.pollOptions.map((opt, i) => ({
          ...opt,
          isSelected: i === optionIndex,
          votes: i === optionIndex ? opt.votes + 1 : opt.isSelected ? opt.votes - 1 : opt.votes,
        }));
        return { ...post, pollOptions: newOptions };
      }
      return post;
    });
    await savePosts(updated);
  };

  const handleAddComment = async (inputText?: string) => {
    const finalText = (inputText ?? commentText).trim();
    if (!finalText || !activeCommentPost) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      user: currentUser.name || 'Anonymous',
      handle: normalizedHandle || 'user',
      avatar: currentUser.avatar || 'https://picsum.photos/seed/user/100/100',
      text: finalText,
      time: 'Just now',
    };

    const updated = posts.map((post) =>
      post.id === activeCommentPost
        ? {
            ...post,
            comments: post.comments + 1,
            commentList: [newComment, ...(post.commentList || [])],
          }
        : post,
    );

    await savePosts(updated);
    setCommentText('');
    setActiveCommentPost(null);
  };

  const handleDeletePost = async (id: string) => {
    const updated = posts.filter((p) => p.id !== id);
    await savePosts(updated);
    setShowOptionsPostId(null);
  };

  const startEditing = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setShowOptionsPostId(null);
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim() || !editingPostId) return;
    const updated = posts.map((p) => (p.id === editingPostId ? { ...p, content: editContent.trim() } : p));
    await savePosts(updated);
    setEditingPostId(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#cd2bee" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {user!.role === 'fan' && !embedded && <View style={[styles.header, { borderBottomColor: softBorder }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
            <MaterialIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>GALAXY UNIVERSE</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Inbox')} style={[styles.headerRoundBtn, { backgroundColor: faintSurface, borderColor: softBorder }]}>
          <MaterialIcons name="notifications-none" size={22} color={theme.text} />
        </Pressable>
      </View> }

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {posts.map((post) => {
          const ownPost = post.handle === normalizedHandle || post.artist === currentUser.name;
          const totalVotes = post.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) ?? 0;

          return (
            <View key={post.id} style={[styles.postCard, { backgroundColor: panelSurface, borderColor: softBorder }]}>
              <View style={styles.postHeader}>
                <Pressable style={styles.authorRow} onPress={() => navigation.navigate('ArtistProfile')}>
                  <View style={styles.avatarRing}>
                    <Image source={{ uri: post.avatar }} style={styles.avatar} />
                  </View>
                  <View>
                    <Text style={[styles.handleText, { color: theme.text }]}>@{post.handle}</Text>
                    <Text style={[styles.timeText, { color: mutedText }]}>{post.time}</Text>
                  </View>
                </Pressable>

                <View style={styles.optionsWrap}>
                  <Pressable onPress={() => setShowOptionsPostId(showOptionsPostId === post.id ? null : post.id)}>
                    <MaterialIcons name="more-horiz" size={24} color={dimIcon} />
                  </Pressable>
                  {showOptionsPostId === post.id && (
                    <View style={[styles.optionsMenu, { backgroundColor: panelElevated, borderColor: softBorder }]}>
                      {ownPost ? (
                        <>
                          <Pressable style={styles.optionItem} onPress={() => startEditing(post)}>
                            <MaterialIcons name="edit" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Edit Post</Text>
                          </Pressable>
                          <Pressable style={styles.optionItem} onPress={() => handleDeletePost(post.id)}>
                            <MaterialIcons name="delete" size={16} color="#ef4444" />
                            <Text style={styles.deleteText}>Delete Post</Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Pressable style={styles.optionItem}>
                            <MaterialIcons name="report" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Report</Text>
                          </Pressable>
                          <Pressable style={styles.optionItem}>
                            <MaterialIcons name="notifications-off" size={16} color={theme.textSecondary} />
                            <Text style={[styles.optionText, { color: theme.textSecondary }]}>Mute</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.postContentWrap}>
                {editingPostId === post.id ? (
                  <View style={{ gap: 10 }}>
                    <TextInput
                      value={editContent}
                      onChangeText={setEditContent}
                      multiline
                      style={[styles.editInput, { backgroundColor: faintSurface, color: theme.text }]}
                    />
                    <View style={styles.editActions}>
                      <Pressable style={[styles.editCancel, { borderColor: softBorder, backgroundColor: isDark ? 'transparent' : theme.surface }]} onPress={() => setEditingPostId(null)}>
                        <Text style={[styles.editCancelText, { color: theme.text }]}>CANCEL</Text>
                      </Pressable>
                      <Pressable style={styles.editSave} onPress={handleUpdatePost}>
                        <Text style={styles.editSaveText}>SAVE CHANGES</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.postContent, { color: theme.text }]}>{post.content}</Text>
                )}
              </View>

              {post.isLive && post.videoUrl ? <LivePreview videoUrl={post.videoUrl} viewerCount={post.viewerCount} isCreator={isCreator} /> : null}

              {post.images && post.images.length > 0 && (
                <View style={styles.mediaOuter}>
                  {post.images.map((img, idx) => (
                    <View key={`${post.id}-${idx}`} style={[styles.imageFrame, { borderColor: softBorder }]}>
                      <Image source={{ uri: img }} style={styles.postImage} />
                    </View>
                  ))}
                </View>
              )}

              {post.pollOptions && post.pollOptions.length > 0 && (
                <View style={styles.pollWrap}>
                  {post.pollOptions.map((option, idx) => {
                    const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                    return (
                      <Pressable
                        key={`${post.id}-poll-${idx}`}
                        style={[styles.pollOption, { borderColor: softBorder, backgroundColor: faintSurface }, option.isSelected && styles.pollOptionSelected]}
                        onPress={() => voteOnPoll(post.id, idx)}
                      >
                        <View style={[styles.pollFill, { width: `${percentage}%`, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' }, option.isSelected && styles.pollFillSelected]} />
                        <View style={styles.pollContent}>
                          <Text style={[styles.pollText, { color: option.isSelected ? '#cd2bee' : theme.textSecondary }]}>{option.text}</Text>
                          <Text style={[styles.pollPercent, { color: option.isSelected ? '#cd2bee' : mutedText }]}>{percentage}%</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                  <Text style={[styles.pollFoot, { color: mutedText }]}>
                    {totalVotes.toLocaleString()} votes • {post.pollOptions.some((o) => o.isSelected) ? 'Voted' : 'Final results'}
                  </Text>
                </View>
              )}

              <View style={[styles.actionBar, { borderTopColor: softBorder }]}>
                <Pressable style={styles.actionItem} onPress={() => toggleLike(post.id)}>
                  <MaterialIcons name={post.isLiked ? 'favorite' : 'favorite-border'} size={23} color={post.isLiked ? '#cd2bee' : dimIcon} />
                  <Text style={[styles.actionText, { color: post.isLiked ? '#cd2bee' : mutedText }]}>{post.likes.toLocaleString()}</Text>
                </Pressable>
                <Pressable style={styles.actionItem} onPress={() => setActiveCommentPost(post.id)}>
                  <MaterialIcons name="chat-bubble-outline" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>{post.comments.toLocaleString()}</Text>
                </Pressable>
                <Pressable style={styles.actionItem}>
                  <MaterialIcons name="share" size={22} color={dimIcon} />
                  <Text style={[styles.actionText, { color: mutedText }]}>Share</Text>
                </Pressable>
              </View>

              {post.commentList && post.commentList.length > 0 && (
                <View style={[styles.commentsSection, { borderTopColor: softBorder }]}>
                  {post.commentList.slice(0, 3).map((comment) => (
                    <View key={comment.id} style={styles.commentRow}>
                      <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
                      <View style={{ flex: 1 }}>
                        <View style={[styles.commentBubble, { backgroundColor: faintSurfaceStrong }]}>
                          <Text style={[styles.commentHandle, { color: theme.text }]}>@{comment.handle}</Text>
                          <Text style={[styles.commentText, { color: theme.text }]}>{comment.text}</Text>
                        </View>
                        <View style={styles.commentMeta}>
                          <Text style={[styles.commentMetaBtn, { color: mutedText }]}>Like</Text>
                          <Text style={[styles.commentMetaBtn, { color: mutedText }]}>Reply</Text>
                          <Text style={[styles.commentTime, { color: theme.textMuted }]}>{comment.time}</Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {post.comments > 3 && (
                    <Pressable onPress={() => setActiveCommentPost(post.id)} style={styles.moreComments}>
                      <Text style={[styles.moreCommentsText, { color: mutedText }]}>View {post.comments - 3} more comments</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.footerLoader}>
          <ActivityIndicator color="#cd2bee" />
          <Text style={[styles.footerText, { color: mutedText }]}>SYNCING MORE GALAXY UPDATES...</Text>
        </View>
      </ScrollView>

      <Modal visible={!!activeCommentPost} transparent animationType="fade" onRequestClose={() => setActiveCommentPost(null)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalBackdrop} onPress={() => setActiveCommentPost(null)} />
          <View style={[styles.modalCard, { backgroundColor: panelSurface, borderColor: softBorder }]}>
            <View style={[styles.modalGrabber, { backgroundColor: isDark ? '#374151' : '#cbd5e1' }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>ADD COMMENT</Text>

            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.modalInput, { borderColor: softBorder, backgroundColor: faintSurface, color: theme.text }]}
            />

            <View style={styles.emojiRow}>
              {['🔥', '🙌', '❤️', '✨', '🌌', '🌍', '🚀', '💯'].map((emoji) => (
                <Pressable key={emoji} onPress={() => setCommentText((prev) => `${prev}${emoji}`)} style={[styles.emojiBtn, { borderColor: softBorder, backgroundColor: faintSurface }]}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.stickerTitle, { color: mutedText }]}>KULSAH STICKERS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
              {stickers.map((sticker) => (
                <Pressable
                  key={sticker.id}
                  onPress={async () => {
                    const withSticker = `${commentText} [Sticker:${sticker.id}] `;
                    setCommentText(withSticker);
                    await handleAddComment(withSticker);
                  }}
                  style={[styles.stickerBtn, { borderColor: softBorder }]}
                >
                  <Image source={{ uri: sticker.img }} style={styles.stickerImage} />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalCancel, { borderColor: softBorder, backgroundColor: isDark ? 'transparent' : theme.surface }]} onPress={() => setActiveCommentPost(null)}>
                <Text style={[styles.modalCancelText, { color: theme.text }]}>CANCEL</Text>
              </Pressable>
              <Pressable style={styles.modalPost} onPress={() => void handleAddComment()}>
                <Text style={styles.modalPostText}>POST COMMENT</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {isCreator && (
        <Pressable style={styles.fab} onPress={() => navigation.navigate('UploadContent')}>
          <MaterialIcons name="add" size={32} color="#fff" />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050507' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050507' },
  header: {
    marginTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerRoundBtn: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: mediumScreen?20:16, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 0.4 },
  scrollBody: { padding: 14, paddingBottom: 130, gap: 14 },
  postCard: {
    backgroundColor: '#121219',
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
  postHeader: { paddingHorizontal: 16, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRing: {
    height: 46,
    width: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#cd2bee',
    padding: 2,
  },
  avatar: { height: '100%', width: '100%', borderRadius: 20 },
  handleText: { color: '#fff', fontFamily: 'PlusJakartaSansBold', fontSize:  mediumScreen?17:13 },
  timeText: { color: '#94a3b8', fontSize: mediumScreen ? 14: 10, fontFamily: 'PlusJakartaSansBold', letterSpacing: 1.2 },
  optionsWrap: { position: 'relative' },
  optionsMenu: {
    position: 'absolute',
    top: 26,
    right: 0,
    width: 145,
    borderRadius: 16,
    backgroundColor: '#1d1d27',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 30,
    paddingVertical: 4,
  },
  optionItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 11, paddingHorizontal: 12 },
  optionText: { color: '#cbd5e1', fontSize: mediumScreen?16:12, fontFamily: 'PlusJakartaSansBold' },
  deleteText: { color: '#ef4444', fontSize: mediumScreen?16:12, fontFamily: 'PlusJakartaSansBold' },
  postContentWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  postContent: { color: '#e2e8f0', fontSize: mediumScreen?18:14, lineHeight: 22, fontFamily: 'PlusJakartaSansMedium' },
  editInput: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(205,43,238,0.4)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    textAlignVertical: 'top',
    padding: 12,
    fontSize: mediumScreen?18:14,
  },
  editActions: { flexDirection: 'row', gap: 8 },
  editCancel: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editSave: { flex: 1, height: 42, borderRadius: 12, backgroundColor: '#cd2bee', justifyContent: 'center', alignItems: 'center' },
  editCancelText: { color: '#fff', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1.4 },
  editSaveText: { color: '#fff', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1.4 },
  mediaWrap: {
    marginHorizontal: 12,
    marginBottom: 12,
    height: 210,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  video: { width: '100%', height: '100%' },
  liveBadges: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 8 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { height: 6, width: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansExtraBold', letterSpacing: 1 },
  viewerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.42)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  viewerText: { color: '#fff', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansBold' },
  liveActions: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row' },
  iconGlassBtn: {
    height: 42,
    width: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  mediaOuter: { paddingHorizontal: 12, paddingBottom: 12 },
  imageFrame: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    height: 210,
  },
  postImage: { height: '100%', width: '100%' },
  pollWrap: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  pollOption: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  pollOptionSelected: { borderColor: 'rgba(205,43,238,0.55)' },
  pollFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.08)' },
  pollFillSelected: { backgroundColor: 'rgba(205,43,238,0.3)' },
  pollContent: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  pollText: { color: '#cbd5e1', fontSize: mediumScreen?16:12, fontFamily: 'PlusJakartaSansBold' },
  pollTextSelected: { color: '#cd2bee' },
  pollPercent: { color: '#94a3b8', fontSize: mediumScreen?15:11, fontFamily: 'PlusJakartaSansExtraBold' },
  pollFoot: { color: '#94a3b8', textAlign: 'center', marginTop: 4, fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansBold', letterSpacing: 1 },
  actionBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 18,
  },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { color: '#9ca3af', fontSize: mediumScreen?16:12, fontFamily: 'PlusJakartaSansBold' },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 12,
  },
  commentRow: { flexDirection: 'row', gap: 8 },
  commentAvatar: { height: 30, width: 30, borderRadius: 15, marginTop: 2 },
  commentBubble: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  commentHandle: { color: '#fff', fontSize: mediumScreen?15:11, fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 3 },
  commentText: { color: '#e2e8f0', fontSize: mediumScreen?16:12, fontFamily: 'PlusJakartaSansMedium' },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingLeft: 8, marginTop: 4 },
  commentMetaBtn: { color: '#94a3b8', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansBold' },
  commentTime: { color: '#64748b', fontSize: mediumScreen?14:10, fontFamily: 'PlusJakartaSansMedium' },
  moreComments: { paddingLeft: 38 },
  moreCommentsText: { color: '#94a3b8', fontSize: mediumScreen?15:11, fontFamily: 'PlusJakartaSansBold' },
  footerLoader: { alignItems: 'center', gap: 8, opacity: 0.6, paddingVertical: 18 },
  footerText: { color: '#cbd5e1', fontSize: mediumScreen?13:9, letterSpacing: 1.4, fontFamily: 'PlusJakartaSansExtraBold' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  modalCard: {
    backgroundColor: '#13131a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalGrabber: { alignSelf: 'center', width: 42, height: 5, borderRadius: 4, backgroundColor: '#374151', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: mediumScreen?21:18, fontFamily: 'PlusJakartaSansExtraBold', marginBottom: 12 },
  modalInput: {
    borderRadius: 16,
    minHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#fff',
    padding: 12,
    textAlignVertical: 'top',
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  emojiBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  emojiText: { fontSize: mediumScreen?20:16 },
  stickerTitle: { marginTop: 14, color: '#94a3b8', fontSize: mediumScreen?13:9, letterSpacing: 1.4, fontFamily: 'PlusJakartaSansExtraBold' },
  stickerRow: { gap: 10, paddingVertical: 10 },
  stickerBtn: {
    height: 56,
    width: 56,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  stickerImage: { height: '100%', width: '100%' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  modalCancel: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPost: { flex: 1, height: 50, borderRadius: 14, backgroundColor: '#cd2bee', justifyContent: 'center', alignItems: 'center' },
  modalCancelText: { color: '#fff', fontSize: mediumScreen?14:10, letterSpacing: 1.4, fontFamily: 'PlusJakartaSansExtraBold' },
  modalPostText: { color: '#fff', fontSize: mediumScreen?14:10, letterSpacing: 1.4, fontFamily: 'PlusJakartaSansExtraBold' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 110,
    height: 60,
    width: 60,
    borderRadius: 30,
    backgroundColor: '#cd2bee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#cd2bee',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default Community;

