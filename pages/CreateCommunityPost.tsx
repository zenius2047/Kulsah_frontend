import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GoogleGenAI } from '@google/genai';
import { fontScale } from '../fonts';
import { mediumScreen } from '../types';
import { useThemeMode } from '../theme';

type Audience = 'all' | 'subs';

interface StoredUser {
  name?: string;
  handle?: string;
  avatar?: string;
}

interface PollOption {
  text: string;
  votes: number;
}

interface CommunityPost {
  id: string;
  artist: string;
  handle: string;
  avatar: string;
  content: string;
  images?: string[];
  likes: number;
  comments: number;
  commentList: Array<unknown>;
  time: string;
  isLiked: boolean;
  type: 'text' | 'image' | 'poll';
  pollOptions?: PollOption[];
  targetAudience: Audience;
}

const STORAGE_KEY = 'pulsar_community_posts';
const USER_KEY = 'pulsar_user';
const DEFAULT_AVATAR = 'https://picsum.photos/seed/alex/150/150';
const DEFAULT_STICKERS = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
];
const QUICK_EMOJIS = ['🔥', '✨', '🌌', '💫', '🎶', '🚀', '💜', '🙌'];
const CreateCommunityPost: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<Audience>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [user, setUser] = useState<StoredUser>({});

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw) as StoredUser);
        }
      } catch (error) {
        console.error('Failed to load current user for community post', error);
      }
    };

    void loadUser();
  }, []);

  const canPublish = useMemo(() => {
    const hasPoll = showPollEditor && pollOptions.some((option) => option.trim().length > 0);
    return Boolean(content.trim() || attachedImages.length > 0 || hasPoll);
  }, [attachedImages.length, content, pollOptions, showPollEditor]);

  const promptImageUpload = () => {
    Alert.alert(
      'Image Upload Placeholder',
      'This screen is ready for native image uploads, but `expo-image-picker` is not installed in this project yet. I can wire that in next if you want.',
    );
  };

  const generateAiSpark = async () => {
    setIsAiDrafting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents:
          "Draft a high-energy community update for a creator to their fans. Focus on 'exclusive BTS content' and 'upcoming tour rumors'. 1 sentence only.",
      });
      setContent(response.text?.trim() || '');
    } catch (error) {
      setContent('Rumor has it something big is dropping. Stay tuned for exclusive BTS content this weekend! 🌌');
    } finally {
      setIsAiDrafting(false);
    }
  };

  const resetComposer = () => {
    setContent('');
    setTargetAudience('all');
    setShowPollEditor(false);
    setPollOptions(['', '']);
    setAttachedImages([]);
  };

  const handlePublish = async () => {
    if (!canPublish || isPosting) return;

    setIsPosting(true);

    const newPost: CommunityPost = {
      id: Date.now().toString(),
      artist: user.name || 'Alex Rivera',
      handle: (user.handle || 'alex_rivera').replace('@', ''),
      avatar: user.avatar || DEFAULT_AVATAR,
      content,
      images: attachedImages.length > 0 ? attachedImages : undefined,
      likes: 0,
      comments: 0,
      commentList: [],
      time: 'Just now',
      isLiked: false,
      type: attachedImages.length > 0 ? 'image' : showPollEditor ? 'poll' : 'text',
      pollOptions: showPollEditor
        ? pollOptions
            .filter((option) => option.trim())
            .map((option) => ({ text: option.trim(), votes: 0 }))
        : undefined,
      targetAudience,
    };

    try {
      const existingRaw = await AsyncStorage.getItem(STORAGE_KEY);
      const existingPosts = existingRaw ? (JSON.parse(existingRaw) as CommunityPost[]) : [];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...existingPosts]));
      setShowToast(true);
      resetComposer();
      setTimeout(() => {
        setShowToast(false);
        navigation.navigate('MainTabs', {
          screen: 'Arena'
        });
      }, 1400);
    } catch (error) {
      Alert.alert('Could not publish', 'Something went wrong while saving your post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => `${prev}${emoji}`);
  };

  const sendSticker = (stickerUrl: string) => {
    setAttachedImages((prev) => [...prev, stickerUrl].slice(0, 4));
    setShowEmojiPicker(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((option, idx) => (idx === index ? value : option)));
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions((prev) => prev.filter((_, idx) => idx !== index));
    }
  };

  const renderAttachmentGrid = () => {
    if (attachedImages.length === 0) return null;

    const attachmentCardBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
    const addCardBackground = isDark ? 'rgba(255,255,255,0.02)' : theme.surface;
    const addCardBorder = isDark ? 'rgba(255,255,255,0.12)' : theme.border;
    const addIconColor = isDark ? '#94A3B8' : theme.textSecondary;

    return (
      <View style={styles.imageGrid}>
        {attachedImages.map((img, index) => (
          <View key={`${img}-${index}`} style={[styles.imageCard, { borderColor: attachmentCardBorder }]}>
            <Image source={{ uri: img }} style={styles.attachmentImage} />
            <Pressable
              onPress={() => setAttachedImages((prev) => prev.filter((_, idx) => idx !== index))}
              style={styles.removeImageButton}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        ))}
        {attachedImages.length < 4 && (
          <Pressable
            style={[styles.addImageCard, { borderColor: addCardBorder, backgroundColor: addCardBackground }]}
            onPress={promptImageUpload}
          >
            <MaterialIcons name="add" size={28} color={addIconColor} />
          </Pressable>
        )}
      </View>
    );
  };

  const screenGradient = isDark
    ? (['#100313', '#0B0710', '#050507'] as const)
    : (['#fff7fc', '#f8fafc', '#ffffff'] as const);
  const headerBackground = isDark ? 'rgba(5,5,7,0.82)' : 'rgba(255,255,255,0.94)';
  const headerBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const headerButtonBackground = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const editorSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.card;
  const footerBackground = isDark ? '#0a0508' : 'rgba(255,255,255,0.96)';
  const modalCardBackground = isDark ? '#111018' : theme.card;
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.68)' : 'rgba(15,23,42,0.26)';
  const titleColor = theme.text;
  const mutedText = isDark ? '#94A3B8' : theme.textSecondary;
  const placeholderColor = isDark ? '#64748B' : theme.textMuted;
  const editorBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const pollCardBackground = isDark ? 'rgba(31,8,31,0.9)' : '#fff4fc';
  const pollCardBorder = isDark ? 'rgba(217,0,199,0.22)' : 'rgba(205,43,238,0.18)';
  const audienceBackground = isDark ? 'rgba(255,255,255,0.06)' : theme.surface;
  const inputBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const chipBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const handleColor = isDark ? '#475569' : '#cbd5e1';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LinearGradient colors={screenGradient} style={StyleSheet.absoluteFill} />

        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>POST PUBLISHED!</Text>
          </View>
        )}

        <View style={[styles.header, { backgroundColor: headerBackground, borderBottomColor: headerBorder }]}>
          <Pressable onPress={() => navigation.goBack()} style={[styles.headerButton, { backgroundColor: headerButtonBackground, borderColor: headerBorder }]}>
            <MaterialIcons name="close" size={24} color={titleColor} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: titleColor }]}>CREATE UPDATE</Text>
          <Pressable
            onPress={() => void handlePublish()}
            disabled={!canPublish || isPosting}
            style={[styles.headerPostButton, (!canPublish || isPosting) && styles.headerPostButtonDisabled]}
          >
            {/* <Text style={styles.headerPostText}>{isPosting ? '...' : 'POST'}</Text> */}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileRow}>
            <View style={styles.avatarShell}>
              <Image source={{ uri: user.avatar || DEFAULT_AVATAR }} style={[styles.avatar, { borderColor: 'rgba(205,43,238,0.28)' }]} />
              <View style={[styles.onlineDot, { borderColor: theme.screen }]} />
            </View>
            <View style={styles.profileMeta}>
              <Text style={[styles.profileName, { color: titleColor }]}>{user.name || 'Alex Rivera'}</Text>
              <View style={styles.profileSubRow}>
                <View style={styles.pulseDot} />
                <Text style={styles.profileSubText}>COMMUNITY PULSE</Text>
              </View>
            </View>
          </View>

          <View style={[styles.editorCard, { backgroundColor: editorSurface, borderColor: editorBorder }]}>
            <TextInput
              value={content}
              onChangeText={setContent}
              multiline
              placeholder="What's happening in your world?"
              placeholderTextColor={placeholderColor}
              textAlignVertical="top"
              style={[styles.textArea, { color: titleColor }]}
            />
          </View>

          {renderAttachmentGrid()}

          <View style={styles.aiRow}>
            <Pressable
              onPress={() => void generateAiSpark()}
              disabled={isAiDrafting}
              style={[styles.aiButton, { backgroundColor: theme.accentSoft, borderColor: 'rgba(205,43,238,0.2)' }]}
            >
              <MaterialIcons
                name={isAiDrafting ? 'autorenew' : 'auto-awesome'}
                size={16}
                color={theme.accent}
                style={isAiDrafting ? styles.spinIcon : undefined}
              />
              <Text style={styles.aiButtonText}>{isAiDrafting ? 'DRAFTING' : 'AI SPARK'}</Text>
            </Pressable>
          </View>

          {showPollEditor && (
            <View style={[styles.pollCard, { backgroundColor: pollCardBackground, borderColor: pollCardBorder }]}>
              <View style={styles.pollHeader}>
                <View style={styles.pollTitleRow}>
                  <MaterialIcons name="poll" size={18} color={theme.accent} />
                  <Text style={styles.pollTitle}>CREATE POLL</Text>
                </View>
                <Pressable onPress={() => setShowPollEditor(false)}>
                  <MaterialIcons name="close" size={22} color={mutedText} />
                </Pressable>
              </View>

              <View style={styles.pollOptionsWrap}>
                {pollOptions.map((option, index) => (
                  <View key={`poll-${index}`} style={styles.pollOptionRow}>
                    <TextInput
                      value={option}
                      onChangeText={(value) => updatePollOption(index, value)}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor={placeholderColor}
                      style={[styles.pollInput, { color: titleColor, backgroundColor: inputBackground, borderColor: editorBorder }]}
                    />
                    {pollOptions.length > 2 && (
                      <Pressable onPress={() => removePollOption(index)} style={styles.removePollButton}>
                        <MaterialIcons name="remove-circle" size={24} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                ))}

                {pollOptions.length < 4 && (
                  <Pressable onPress={addPollOption} style={[styles.addPollButton, { borderColor: pollCardBorder }]}>
                    <Text style={styles.addPollText}>+ ADD OPTION</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: footerBackground, borderTopColor: headerBorder }]}>
          <View style={styles.toolbarRow}>
            <View style={styles.toolCluster}>
              <Pressable onPress={promptImageUpload} style={styles.toolButton}>
                <MaterialIcons name="image" size={28} color={theme.accent} />
              </Pressable>
              <Pressable onPress={() => setShowPollEditor((prev) => !prev)} style={styles.toolButton}>
                <MaterialIcons name="format-list-bulleted" size={28} color={theme.accent} />
              </Pressable>
              <Pressable onPress={() => setShowEmojiPicker(true)} style={styles.toolButton}>
                <MaterialIcons name="mood" size={28} color={theme.accent} />
              </Pressable>
            </View>

            <View style={[styles.audienceToggle, { backgroundColor: audienceBackground, borderColor: headerBorder }]}>
              <Pressable
                onPress={() => setTargetAudience('all')}
                style={[styles.audienceButton, targetAudience === 'all' && styles.audienceButtonActive]}
              >
                <Text style={[styles.audienceText, { color: targetAudience === 'all' ? '#fff' : mutedText }, targetAudience === 'all' && styles.audienceTextActive]}>PUBLIC</Text>
              </Pressable>
              <Pressable
                onPress={() => setTargetAudience('subs')}
                style={[styles.audienceButton, targetAudience === 'subs' && styles.audienceButtonActive]}
              >
                <Text style={[styles.audienceText, { color: targetAudience === 'subs' ? '#fff' : mutedText }, targetAudience === 'subs' && styles.audienceTextActive]}>SUBS</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => void handlePublish()}
            disabled={!canPublish || isPosting}
            style={[styles.publishButton, (!canPublish || isPosting) && styles.publishButtonDisabled]}
          >
            <Text style={styles.publishButtonText}>{isPosting ? 'PUBLISHING...' : 'PUBLISH'}</Text>
          </Pressable>
        </View>

        <Modal visible={showEmojiPicker} transparent animationType="slide" onRequestClose={() => setShowEmojiPicker(false)}>
          <View style={styles.modalRoot}>
            <Pressable style={[styles.modalBackdrop, { backgroundColor: modalBackdrop }]} onPress={() => setShowEmojiPicker(false)} />
            <View style={[styles.modalCard, { backgroundColor: modalCardBackground, borderColor: headerBorder }]}>
              <View style={[styles.modalHandle, { backgroundColor: handleColor }]} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: titleColor }]}>EMOJIS & STICKERS</Text>
                <Pressable onPress={() => setShowEmojiPicker(false)}>
                  <MaterialIcons name="close" size={22} color={titleColor} />
                </Pressable>
              </View>

              <Text style={[styles.modalSectionTitle, { color: mutedText }]}>QUICK EMOJIS</Text>
              <View style={styles.emojiGrid}>
                {QUICK_EMOJIS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    onPress={() => addEmoji(emoji)}
                    style={[styles.emojiChip, { backgroundColor: chipBackground, borderColor: headerBorder }]}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.modalSectionTitle, { color: mutedText }]}>STICKERS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stickerRow}>
                {DEFAULT_STICKERS.map((stickerUrl) => (
                  <Pressable key={stickerUrl} onPress={() => sendSticker(stickerUrl)} style={[styles.stickerCard, { borderColor: headerBorder }]}>
                    <Image source={{ uri: stickerUrl }} style={styles.stickerImage} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050507',
  },
  screen: {
    flex: 1,
    backgroundColor: '#050507',
  },
  toast: {
    position: 'absolute',
    top: 72,
    alignSelf: 'center',
    zIndex: 30,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
  },
  toastText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 2.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(5,5,7,0.82)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen? fontScale(16): fontScale(12),
    letterSpacing: 0.5,
  },
  headerPostButton: {
    minWidth: 56,
    alignItems: 'flex-end',
  },
  headerPostButtonDisabled: {
    opacity: 0.35,
  },
  headerPostText: {
    color: '#d900c7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen? fontScale(16): fontScale(12),
    letterSpacing: 0.3,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 22,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarShell: {
    position: 'relative',
    width: 64,
    height: 64,
    marginRight: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(217,0,199,0.28)',
  },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#050507',
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen? fontScale(18): fontScale(14),
  },
  profileSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d900c7',
    marginRight: 8,
  },
  profileSubText: {
    color: '#d900c7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: mediumScreen? fontScale(12): fontScale(8),
    letterSpacing: 2.5,
  },
  editorCard: {
    minHeight: 250,
    borderRadius: 32,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  textArea: {
    minHeight: 210,
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: mediumScreen? fontScale(18): fontScale(14),
    lineHeight: 28,
    textAlignVertical: 'top',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1.45,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
  },
  addImageCard: {
    width: '48%',
    aspectRatio: 1.45,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  aiRow: {
    alignItems: 'flex-end',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(217,0,199,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217,0,199,0.2)',
  },
  aiButtonText: {
    color: '#d900c7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.8,
  },
  spinIcon: {
    transform: [{ rotate: '35deg' }],
  },
  pollCard: {
    borderRadius: 28,
    backgroundColor: 'rgba(31,8,31,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(217,0,199,0.22)',
    padding: 18,
    gap: 14,
  },
  pollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pollTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pollTitle: {
    color: '#d900c7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 2,
  },
  pollOptionsWrap: {
    gap: 10,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollInput: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansMedium',
    fontSize: fontScale(14),
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  removePollButton: {
    marginLeft: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPollButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(217,0,199,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPollText: {
    color: '#d900c7',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 1.8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: '#0a0508',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    gap: 18,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toolCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  toolButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audienceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  audienceButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  audienceButtonActive: {
    backgroundColor: '#d900c7',
  },
  audienceText: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? fontScale(12): fontScale(8),
    letterSpacing: 1.6,
  },
  audienceTextActive: {
    color: '#fff',
  },
  publishButton: {
    minHeight: 58,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d900c7',
    shadowColor: '#d900c7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  publishButtonDisabled: {
    opacity: 0.35,
  },
  publishButtonText: {
    color: '#fff',
    fontFamily: 'PlusJakartaSansBold',
    fontSize: mediumScreen? fontScale(16): fontScale(12),
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.68)',
  },
  modalCard: {
    backgroundColor: '#111018',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#475569',
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#F8FAFC',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(18),
  },
  modalSectionTitle: {
    color: '#94A3B8',
    fontFamily: 'PlusJakartaSansExtraBold',
    fontSize: fontScale(10),
    letterSpacing: 2,
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  emojiChip: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emojiText: {
    fontSize: mediumScreen ? 24 : 20,
  },
  stickerRow: {
    gap: 12,
  },
  stickerCard: {
    width: 82,
    height: 82,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stickerImage: {
    width: '100%',
    height: '100%',
  },
});

export default CreateCommunityPost;
