import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useThemeMode, primaryColorAlpha, PRIMARY_COLOR } from "../theme";
import { fontSize } from '../typography';
import { isCommunityVideo, parseApiError, useCreateCommunityPost, validateCommunityPost, type CommunityMediaSource, type CreateCommunityPostPayload } from '../src';

type Audience = 'all' | 'subs';

interface StoredUser {
  name?: string;
  handle?: string;
  avatar?: string;
  role?: 'creator' | 'fan';
}

type ComposerMediaSource = CommunityMediaSource & {
  durationMs?: number | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
};

const DRAFT_STORAGE_KEY = 'pulsar_community_post_draft';
const USER_KEY = 'pulsar_user';
const DEFAULT_AVATAR = 'https://picsum.photos/seed/alex/150/150';
const MAX_POST_LENGTH = 2000;
const MAX_POLL_CAPTION_LENGTH = 280;
const MAX_POLL_QUESTION_LENGTH = 140;
const MAX_MEDIA_POST_ITEMS = 10;
const MAX_VIDEO_POST_LENGTH = 2200;
const DEFAULT_STICKERS = [
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80',
];
const QUICK_EMOJIS = ['🔥', '✨', '🌌', '💫', '🎶', '🚀', '💜', '🙌'];
const formatVideoDuration = (durationMs?: number | null) => {
  if (!durationMs || durationMs <= 0) return '--:--';
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}:${String(totalSeconds % 60).padStart(2, '0')}`;
};

const formatFileSize = (fileSize?: number | null) => {
  if (!fileSize || fileSize <= 0) return '—';
  return `${(fileSize / (1024 * 1024)).toFixed(1)} MB`;
};

const formatAspectRatio = (width?: number, height?: number) => {
  if (!width || !height) return '—';
  const divisor = (left: number, right: number): number => right === 0 ? left : divisor(right, left % right);
  const commonDivisor = divisor(width, height);
  return `${width / commonDivisor}:${height / commonDivisor}`;
};

const ComposerVideoPreview: React.FC<{ uri: string }> = ({ uri }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    setIsPlaying(false);
  }, [uri]);

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying((current) => !current);
  };

  return (
    <View style={styles.videoPreviewViewport}>
      <VideoView player={player} nativeControls={false} contentFit="cover" style={StyleSheet.absoluteFill} />
      <Pressable accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'} onPress={togglePlayback} style={styles.videoPlayButton}>
        <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={39} color="#ffffff" />
      </Pressable>
    </View>
  );
};

const CreateCommunityPost: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useThemeMode();
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<Audience>('all');
  const [isPosting, setIsPosting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDurationDays, setPollDurationDays] = useState<1 | 3 | 7>(7);
  const [allowMultipleChoices, setAllowMultipleChoices] = useState(true);
  const [showResultsAfterVoting, setShowResultsAfterVoting] = useState(true);
  const [attachedImages, setAttachedImages] = useState<ComposerMediaSource[]>([]);
  const [videoThumbnailUri, setVideoThumbnailUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [user, setUser] = useState<StoredUser>({});
  const [userLoaded, setUserLoaded] = useState(false);
  const createPost = useCreateCommunityPost(setUploadProgress);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        if (raw) {
          setUser(JSON.parse(raw) as StoredUser);
        }
      } catch (error) {
        console.error('Failed to load current user for community post', error);
      } finally {
        setUserLoaded(true);
      }
    };

    void loadUser();
  }, []);

  useEffect(() => {
    if (!showMediaEditor) return undefined;

    return navigation.addListener('beforeRemove', (event: { preventDefault: () => void }) => {
      event.preventDefault();
      setShowMediaEditor(false);
    });
  }, [navigation, showMediaEditor]);

  useEffect(() => {
    const video = attachedImages.find(isCommunityVideo);
    if (!video) {
      setVideoThumbnailUri(null);
      return undefined;
    }

    let isActive = true;
    void VideoThumbnails.getThumbnailAsync(video.uri, { time: 1000 })
      .then(({ uri }: { uri: string }) => {
        if (isActive) setVideoThumbnailUri(uri);
      })
      .catch(() => {
        if (isActive) setVideoThumbnailUri(null);
      });

    return () => {
      isActive = false;
    };
  }, [attachedImages]);

  const canPublish = useMemo(() => {
    const hasValidPoll = pollQuestion.trim().length > 0
      && pollOptions.filter((option) => option.trim().length > 0).length >= 2;
    if (showPollEditor) return hasValidPoll;
    if (showMediaEditor) return attachedImages.length > 0;
    return Boolean(content.trim() || attachedImages.length > 0);
  }, [attachedImages, content, pollOptions, pollQuestion, showMediaEditor, showPollEditor]);

  const promptImageUpload = async (
    mediaKind: 'images' | 'videos' | 'all' = 'all',
    maxItems = 4,
    baseMedia: ComposerMediaSource[] = attachedImages,
  ) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Media access required', 'Allow access to your library to attach images or videos.');
      return;
    }
    if (baseMedia.length >= maxItems) {
      Alert.alert('Media limit reached', `You can attach no more than ${maxItems} media items to this post.`);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaKind === 'all' ? ['images', 'videos'] : [mediaKind],
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, maxItems - baseMedia.length),
      quality: 0.9,
    });
    if (result.canceled || !Array.isArray(result.assets)) return;
    const selectedMedia: ComposerMediaSource[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.fileName,
      type: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
      durationMs: asset.duration,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
    }));
    const combinedMedia = [...baseMedia, ...selectedMedia];
    const videoCount = combinedMedia.filter(isCommunityVideo).length;

    if (videoCount > 4) {
      Alert.alert('Video limit reached', 'You can attach no more than four videos to a post.');
      return;
    }
    if (videoCount > 0 && combinedMedia.length > 4) {
      Alert.alert('Media limit reached', 'A post containing pictures and videos can have no more than four media items.');
      return;
    }
    if (maxItems === MAX_MEDIA_POST_ITEMS && videoCount > 0 && combinedMedia.length > 1) {
      Alert.alert('Choose one media type', 'A video post supports one video. Remove the photos or select a single video.');
      return;
    }
    if (videoCount === 0 && combinedMedia.length > maxItems) {
      Alert.alert('Image limit reached', `You can attach no more than ${maxItems} images to this post.`);
      return;
    }

    setAttachedImages(combinedMedia);
  };

  const openMediaEditor = (preferredMedia: 'all' | 'videos' = 'all') => {
    const activateMediaEditor = (media: ComposerMediaSource[]) => {
      setAttachedImages(media);
      setShowPollEditor(false);
      setShowMediaEditor(true);
      if (media.length === 0) {
        void promptImageUpload(preferredMedia, preferredMedia === 'videos' ? 1 : MAX_MEDIA_POST_ITEMS, []);
      }
    };

    if (preferredMedia === 'videos' && attachedImages.length > 0 && !attachedImages.some(isCommunityVideo)) {
      Alert.alert(
        'Start a video post?',
        'Attached photos will be removed when you switch to the video editor.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => activateMediaEditor([]) },
        ],
      );
      return;
    }

    activateMediaEditor(attachedImages.slice(0, MAX_MEDIA_POST_ITEMS));
  };

  const resetComposer = () => {
    setContent('');
    setTargetAudience('all');
    setShowPollEditor(false);
    setShowMediaEditor(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDurationDays(7);
    setAllowMultipleChoices(true);
    setShowResultsAfterVoting(true);
    setAttachedImages([]);
    setUploadProgress(0);
  };

  const handlePublish = async () => {
    if (!canPublish || isPosting) return;

    if (user.role && user.role !== 'creator') {
      Alert.alert('Creator account required', 'Only creators can publish community posts.');
      return;
    }

    const cleanedPollOptions = pollOptions.map((option) => option.trim()).filter(Boolean);
    if (showPollEditor && cleanedPollOptions.length < 2) {
      Alert.alert('Add poll options', 'A poll requires at least two options.');
      return;
    }
    if (showPollEditor && !pollQuestion.trim()) {
      Alert.alert('Add a poll question', 'Ask your community a question before posting the poll.');
      return;
    }

    setIsPosting(true);

    try {
      const hasVideo = attachedImages.some(isCommunityVideo);
      const payload: CreateCommunityPostPayload = {
        type: showPollEditor ? 'poll' : hasVideo ? 'video' : attachedImages.length ? 'image' : 'text',
        content: content.trim() || undefined,
        audience: targetAudience === 'subs' ? 'subscribers' : 'public',
        media: attachedImages.length ? attachedImages : undefined,
        poll: showPollEditor ? {
          question: pollQuestion.trim(),
          options: cleanedPollOptions,
          closes_at: new Date(Date.now() + pollDurationDays * 24 * 60 * 60 * 1000).toISOString(),
          allow_multiple: allowMultipleChoices,
          show_results_after_voting: showResultsAfterVoting,
        } : undefined,
      };
      const validationErrors = validateCommunityPost(payload);
      if (validationErrors.length) {
        Alert.alert('Check your post', validationErrors[0]);
        return;
      }
      await createPost.mutateAsync(payload);
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setToastMessage('Post published');
      resetComposer();
      setTimeout(() => {
        setToastMessage(null);
        navigation.navigate('MainTabs', {
          screen: 'Arena'
        });
      }, 1400);
    } catch (error) {
      const parsed = parseApiError(error);
      Alert.alert(parsed.title, parsed.message);
    } finally {
      setIsPosting(false);
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => `${prev}${emoji}`);
  };

  const sendSticker = (stickerUrl: string) => {
    setContent((current) => `${current}${current ? ' ' : ''}${stickerUrl}`);
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

  const appendHashtag = () => {
    setContent((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}#`);
  };

  const chooseAudience = () => {
    Alert.alert('Audience', 'Choose who can see this post.', [
      { text: 'Everyone in the community', onPress: () => setTargetAudience('all') },
      { text: 'Subscribers only', onPress: () => setTargetAudience('subs') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSaveDraft = async () => {
    if (!content.trim() && attachedImages.length === 0 && !showPollEditor && !showMediaEditor) {
      Alert.alert('Nothing to save', 'Start writing or add something to your post first.');
      return;
    }

    try {
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
        content,
        targetAudience,
        showPollEditor,
        showMediaEditor,
        pollQuestion,
        pollOptions,
        pollDurationDays,
        allowMultipleChoices,
        showResultsAfterVoting,
        attachedImages,
        savedAt: new Date().toISOString(),
      }));
      setToastMessage('Draft saved');
      setTimeout(() => setToastMessage(null), 1800);
    } catch {
      Alert.alert('Draft not saved', 'Please try again.');
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
          <View key={`${img.uri}-${index}`} style={[styles.imageCard, { borderColor: attachmentCardBorder }]}>
            {img.type?.startsWith('video/') ? (
              <View style={[styles.attachmentImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: addCardBackground }]}>
                <MaterialIcons name="play-circle-filled" size={42} color={theme.accent} />
              </View>
            ) : <Image source={{ uri: img.uri }} style={styles.attachmentImage} />}
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
            onPress={() => void promptImageUpload('images')}
          >
            <MaterialIcons name="add" size={28} color={addIconColor} />
          </Pressable>
        )}
      </View>
    );
  };

  const screenGradient = isDark
    ? (['#0c0b12', '#09080f', '#09080f'] as const)
    : (['#ffffff', '#f8f8fc', '#f8f8fc'] as const);
  const headerBackground = isDark ? '#0c0b12' : '#ffffff';
  const headerBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const modalCardBackground = isDark ? '#111018' : theme.card;
  const modalBackdrop = isDark ? 'rgba(0,0,0,0.68)' : 'rgba(15,23,42,0.26)';
  const titleColor = theme.text;
  const mutedText = isDark ? '#94A3B8' : theme.textSecondary;
  const placeholderColor = isDark ? '#64748B' : theme.textMuted;
  const editorBorder = isDark ? 'rgba(255,255,255,0.08)' : theme.border;
  const chipBackground = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const handleColor = isDark ? '#475569' : '#cbd5e1';
  const composerBackground = isDark ? '#15141d' : '#ffffff';
  const inputSurface = isDark ? '#101018' : '#ffffff';
  const primarySurface = isDark ? primaryColorAlpha(0.13) : primaryColorAlpha(0.07);
  const selectedVideo = attachedImages.find(isCommunityVideo);
  const mediaAttachments = selectedVideo ? [selectedVideo] : attachedImages;

  const moveImageEarlier = (index: number) => {
    if (index <= 0) return;

    setAttachedImages((current) => {
      const reordered = [...current];
      [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
      return reordered;
    });
  };

  const renderMediaPostEditor = () => (
    <View style={[styles.imagePostCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
      <View style={styles.imagePostHeading}>
        <View style={styles.imagePostHeadingLabel}>
          <MaterialIcons name="perm-media" size={26} color={PRIMARY_COLOR} />
          <Text style={[styles.imagePostHeadingText, { color: titleColor }]}>Media Post</Text>
        </View>
        <Text style={[styles.imagePostCount, { color: mutedText }]}>
          <Text style={{ color: PRIMARY_COLOR }}>{mediaAttachments.length}</Text> / {MAX_MEDIA_POST_ITEMS} media
        </Text>
      </View>

      <View style={[styles.imagePostDivider, { backgroundColor: editorBorder }]} />

      <TextInput
        includeFontPadding={false}
        value={content}
        onChangeText={setContent}
        maxLength={MAX_POST_LENGTH}
        multiline
        placeholder="Write a caption..."
        placeholderTextColor={placeholderColor}
        textAlignVertical="top"
        style={[styles.imagePostCaption, { color: titleColor }]}
      />

      {mediaAttachments.length > 0 ? (
        <View style={styles.imagePostGrid}>
          {mediaAttachments.slice(0, 4).map((media, index) => (
            <View key={`${media.uri}-${index}`} style={styles.imagePostTile}>
              <Image source={{ uri: media.uri }} resizeMode="cover" style={styles.imagePostTileImage} />
              {index === 3 && mediaAttachments.length > 4 ? (
                <View style={styles.imagePostOverflowOverlay}>
                  <Text style={styles.imagePostOverflowText}>+{mediaAttachments.length - 4}</Text>
                </View>
              ) : null}
              <Pressable
                accessibilityLabel={`Remove image ${index + 1}`}
                onPress={() => setAttachedImages((current) => current.filter((item) => item !== media))}
                style={styles.imagePostRemoveButton}
              >
                <MaterialIcons name="close" size={24} color="#ffffff" />
              </Pressable>
              <Pressable
                accessibilityLabel={`Move image ${index + 1} earlier`}
                delayLongPress={250}
                onLongPress={() => moveImageEarlier(index)}
                style={styles.imagePostReorderButton}
              >
                <MaterialIcons name="drag-indicator" size={26} color="#ffffff" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add more media"
        disabled={mediaAttachments.length >= MAX_MEDIA_POST_ITEMS}
        onPress={() => void promptImageUpload('all', MAX_MEDIA_POST_ITEMS, mediaAttachments)}
        style={[
          styles.imagePostAddButton,
          { borderColor: primaryColorAlpha(0.58), backgroundColor: primarySurface },
          mediaAttachments.length >= MAX_MEDIA_POST_ITEMS && styles.pollControlDisabled,
        ]}
      >
        <View style={styles.imagePostAddIcon}>
          <MaterialIcons name="add" size={20} color="#ffffff" />
        </View>
        <Text style={styles.imagePostAddText}>Add More Media</Text>
      </Pressable>

      <View style={styles.imagePostHint}>
        <MaterialIcons name="info-outline" size={19} color={mutedText} />
        <Text style={[styles.imagePostHintText, { color: mutedText }]}>Tap and hold to reorder. Add up to 10 photos or one video.</Text>
      </View>

      <View style={[styles.imagePostTools, { borderTopColor: editorBorder }]}>
        <Pressable onPress={() => Alert.alert('Filters', 'Photo filters are coming soon.')} style={styles.imagePostTool}>
          <MaterialIcons name="auto-fix-high" size={25} color={titleColor} />
          <Text style={[styles.imagePostToolText, { color: titleColor }]}>Filters</Text>
        </Pressable>
        <View style={[styles.imagePostToolDivider, { backgroundColor: editorBorder }]} />
        <Pressable onPress={() => Alert.alert('Tag people', 'People tagging is coming soon.')} style={styles.imagePostTool}>
          <MaterialIcons name="person-outline" size={27} color={titleColor} />
          <Text style={[styles.imagePostToolText, { color: titleColor }]}>Tag People</Text>
        </Pressable>
        <View style={[styles.imagePostToolDivider, { backgroundColor: editorBorder }]} />
        <Pressable onPress={() => Alert.alert('Add location', 'Location tagging is coming soon.')} style={styles.imagePostTool}>
          <MaterialIcons name="location-on" size={27} color={titleColor} />
          <Text style={[styles.imagePostToolText, { color: titleColor }]}>Add Location</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderVideoPostEditor = () => {
    if (!selectedVideo) return renderMediaPostEditor();

    const duration = formatVideoDuration(selectedVideo.durationMs);
    const videoTools = [
      { icon: 'content-cut' as const, label: 'Trim' },
      { icon: 'image' as const, label: 'Cover' },
      { icon: 'closed-caption' as const, label: 'Captions' },
      { icon: 'music-note' as const, label: 'Sound' },
    ];

    return (
      <>
        <View style={[styles.videoCaptionCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          <TextInput
            includeFontPadding={false}
            value={content}
            onChangeText={setContent}
            maxLength={MAX_VIDEO_POST_LENGTH}
            multiline
            placeholder="Write a caption..."
            placeholderTextColor={placeholderColor}
            textAlignVertical="top"
            style={[styles.videoCaptionInput, { color: titleColor }]}
          />
          <Text style={[styles.videoCaptionCount, { color: mutedText }]}>{content.length}/{MAX_VIDEO_POST_LENGTH}</Text>
        </View>

        <View style={[styles.videoEditorCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          <View style={styles.videoPreviewShell}>
            <ComposerVideoPreview uri={selectedVideo.uri} />
            <View style={styles.videoDurationBadge}>
              <Text style={styles.videoDurationBadgeText}>{duration}</Text>
            </View>
            <Pressable
              onPress={() => void promptImageUpload('videos', 1, [])}
              style={styles.changeVideoButton}
            >
              <Text style={styles.changeVideoText}>Change Video</Text>
              <MaterialIcons name="edit" size={18} color="#ffffff" />
            </Pressable>
          </View>

          <View style={[styles.videoTimeline, { borderColor: PRIMARY_COLOR }]}>
            <View style={styles.videoTimelineHandle} />
            {Array.from({ length: 6 }).map((_, index) => (
              videoThumbnailUri ? (
                <Image key={`frame-${index}`} source={{ uri: videoThumbnailUri }} style={styles.videoTimelineFrame} />
              ) : (
                <View key={`frame-${index}`} style={[styles.videoTimelineFrame, { backgroundColor: primarySurface }]}>
                  <MaterialIcons name="videocam" size={20} color={PRIMARY_COLOR} />
                </View>
              )
            ))}
            <View style={[styles.videoTimelineHandle, styles.videoTimelineHandleRight]} />
          </View>
          <View style={styles.videoTimelineLabels}>
            <Text style={[styles.videoTimelineText, { color: titleColor }]}>0:00</Text>
            <Text style={[styles.videoTimelineText, { color: titleColor }]}>{duration}</Text>
          </View>
        </View>

        <View style={[styles.videoToolCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          {videoTools.map((tool, index) => (
            <React.Fragment key={tool.label}>
              <Pressable onPress={() => Alert.alert(tool.label, `${tool.label} tools are coming soon.`)} style={styles.videoToolButton}>
                <MaterialIcons name={tool.icon} size={25} color={PRIMARY_COLOR} />
                <Text style={[styles.videoToolText, { color: titleColor }]}>{tool.label}</Text>
              </Pressable>
              {index < videoTools.length - 1 ? <View style={[styles.videoToolDivider, { backgroundColor: editorBorder }]} /> : null}
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.videoMetadataCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          <View style={styles.videoMetadataItem}>
            <MaterialIcons name="schedule" size={28} color={titleColor} />
            <View>
              <Text style={[styles.videoMetadataValue, { color: titleColor }]}>{duration}</Text>
              <Text style={[styles.videoMetadataLabel, { color: mutedText }]}>Duration</Text>
            </View>
          </View>
          <View style={[styles.videoMetadataDivider, { backgroundColor: editorBorder }]} />
          <View style={styles.videoMetadataItem}>
            <MaterialIcons name="aspect-ratio" size={28} color={titleColor} />
            <View>
              <Text style={[styles.videoMetadataValue, { color: titleColor }]}>{formatAspectRatio(selectedVideo.width, selectedVideo.height)}</Text>
              <Text style={[styles.videoMetadataLabel, { color: mutedText }]}>Aspect Ratio</Text>
            </View>
          </View>
          <View style={[styles.videoMetadataDivider, { backgroundColor: editorBorder }]} />
          <View style={styles.videoMetadataItem}>
            <MaterialIcons name="insert-drive-file" size={28} color={titleColor} />
            <View>
              <Text style={[styles.videoMetadataValue, { color: titleColor }]}>{formatFileSize(selectedVideo.fileSize)}</Text>
              <Text style={[styles.videoMetadataLabel, { color: mutedText }]}>File Size</Text>
            </View>
          </View>
        </View>

        <View style={[styles.videoSettingsCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          <Pressable onPress={appendHashtag} style={[styles.videoSettingRow, { borderBottomColor: editorBorder }]}>
            <MaterialIcons name="tag" size={27} color={PRIMARY_COLOR} />
            <Text style={[styles.videoSettingTitle, { color: titleColor }]}>Add Hashtags</Text>
            <MaterialIcons name="chevron-right" size={27} color={mutedText} />
          </Pressable>
          <Pressable onPress={() => Alert.alert('Tag people', 'People tagging is coming soon.')} style={[styles.videoSettingRow, { borderBottomColor: editorBorder }]}>
            <MaterialIcons name="alternate-email" size={27} color={PRIMARY_COLOR} />
            <Text style={[styles.videoSettingTitle, { color: titleColor }]}>Tag People</Text>
            <MaterialIcons name="chevron-right" size={27} color={mutedText} />
          </Pressable>
          <Pressable onPress={() => Alert.alert('Cover frame', 'Cover frame selection is coming soon.')} style={styles.videoSettingRowLast}>
            <MaterialIcons name="image" size={27} color={PRIMARY_COLOR} />
            <Text style={[styles.videoSettingTitle, { color: titleColor }]}>Choose Cover Frame</Text>
            {videoThumbnailUri ? <Image source={{ uri: videoThumbnailUri }} style={styles.videoCoverThumbnail} /> : null}
            <MaterialIcons name="chevron-right" size={27} color={mutedText} />
          </Pressable>
        </View>

        <View style={[styles.videoSettingsCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
          <Pressable onPress={chooseAudience} style={[styles.videoSettingRow, { borderBottomColor: editorBorder }]}>
            <MaterialIcons name="public" size={27} color={PRIMARY_COLOR} />
            <Text style={[styles.videoSettingTitle, { color: titleColor }]}>Who can see this post?</Text>
            <Text style={[styles.videoSettingValue, { color: mutedText }]}>{targetAudience === 'all' ? 'Everyone' : 'Subscribers'}</Text>
            <MaterialIcons name="chevron-right" size={27} color={mutedText} />
          </Pressable>
          <Pressable onPress={() => Alert.alert('Upload quality', 'Videos are uploaded at the best available quality.')} style={styles.videoSettingRowLast}>
            <MaterialIcons name="high-quality" size={27} color={PRIMARY_COLOR} />
            <Text style={[styles.videoSettingTitle, { color: titleColor }]}>Upload Quality</Text>
            <Text style={[styles.videoSettingValue, { color: mutedText }]}>High (1080p)</Text>
            <MaterialIcons name="chevron-right" size={27} color={mutedText} />
          </Pressable>
        </View>
      </>
    );
  };

  if (!userLoaded) {
    return <View style={[styles.safeArea, { backgroundColor: theme.screen, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={PRIMARY_COLOR} /></View>;
  }

  if (user.role !== 'creator') {
    return (
      <View style={[styles.safeArea, { backgroundColor: theme.screen, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }]}>
        <MaterialIcons name="lock" size={40} color={PRIMARY_COLOR} />
        <Text style={[styles.headerTitle, { color: theme.text, textAlign: 'center' }]}>CREATOR ACCOUNT REQUIRED</Text>
        <Pressable onPress={() => navigation.goBack()}><Text style={{ color: PRIMARY_COLOR }}>Go back</Text></Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[styles.screen, { backgroundColor: theme.screen }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <LinearGradient colors={screenGradient} style={StyleSheet.absoluteFill} />

        {toastMessage && (
          <View style={styles.toast}>
            <MaterialIcons name="check-circle" size={18} color="#ffffff" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        <View style={[styles.header, { backgroundColor: headerBackground, borderBottomColor: headerBorder }]}>
            {/* {showPollEditor || showMediaEditor ? (
              <Pressable
                accessibilityLabel="Back to post composer"
                onPress={() => {
                  if (showMediaEditor) {
                    setShowMediaEditor(false);
                    return;
                  }
                  setShowPollEditor(false);
                }}
                style={[styles.pollBackButton, { borderColor: editorBorder }]}
              >
                <MaterialIcons name="arrow-back" size={27} color={titleColor} />
              </Pressable>
            ) : null} */}
          <Text pointerEvents="none" style={[styles.referenceHeaderTitle, { color: titleColor }]}>
            {showMediaEditor ? selectedVideo ? 'Add Video' : 'Add Image' : showPollEditor ? 'Create Poll' : 'Write Post'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Publish post"
            onPress={() => void handlePublish()}
            disabled={!canPublish || isPosting}
            style={[styles.headerPostButton, (!canPublish || isPosting) && styles.headerPostButtonDisabled]}
          >
            <LinearGradient
              colors={[PRIMARY_COLOR, PRIMARY_COLOR]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.headerPostGradient}
            >
              {isPosting ? <ActivityIndicator size="small" color="#ffffff" /> : showPollEditor || showMediaEditor ? null : <MaterialIcons name="send" size={19} color="#ffffff" />}
              <Text style={styles.headerPostText}>{isPosting ? 'Posting' : showPollEditor ? 'Post Poll' : 'Post'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showMediaEditor ? selectedVideo ? renderVideoPostEditor() : renderMediaPostEditor() : (
            <>
              <View style={[styles.composerCard, { backgroundColor: composerBackground }]}>
            <View style={styles.profileRow}>
              <LinearGradient colors={[PRIMARY_COLOR, PRIMARY_COLOR]} style={styles.referenceAvatarRing}>
                <View style={[styles.referenceAvatarInner, { backgroundColor: composerBackground }]}>
                  <Image source={{ uri: user.avatar || DEFAULT_AVATAR }} style={styles.referenceAvatar} />
                </View>
              </LinearGradient>
              <View style={styles.profileMeta}>
                <View style={styles.profileNameRow}>
                  <Text numberOfLines={1} style={[styles.profileName, { color: titleColor }]}>{user.name || 'Kulsah Creator'}</Text>
                  <MaterialIcons name="verified" size={20} color={PRIMARY_COLOR} />
                </View>
              </View>
              {/* <Pressable
                onPress={() => Alert.alert('Post destination', 'This post will be shared with your Kulsah community.')}
                style={[styles.destinationPill, { backgroundColor: inputSurface, borderColor: editorBorder }]}
              >
                <MaterialIcons name="public" size={21} color={titleColor} />
                <Text style={[styles.destinationText, { color: titleColor }]}>Community</Text>
                <MaterialIcons name="keyboard-arrow-down" size={23} color={mutedText} />
              </Pressable> */}
            </View>

            <View style={[styles.referenceEditor, showPollEditor && styles.pollCaptionEditor, { backgroundColor: inputSurface, borderColor: editorBorder }]}>
              <TextInput includeFontPadding={false}
                value={content}
                onChangeText={setContent}
                maxLength={showPollEditor ? MAX_POLL_CAPTION_LENGTH : MAX_POST_LENGTH}
                multiline
                placeholder={showPollEditor ? 'Add a caption to your poll (optional)...' : 'Share something with your community...'}
                placeholderTextColor={placeholderColor}
                textAlignVertical="top"
                style={[styles.referenceTextArea, showPollEditor && styles.pollCaptionTextArea, { color: titleColor }]}
              />
              <View style={styles.referenceEditorFooter}>
                {showPollEditor ? <View /> : (
                  <View style={styles.referenceEditorTools}>
                    <Pressable onPress={() => setShowEmojiPicker(true)} style={[styles.referenceToolButton, { borderColor: editorBorder }]}>
                      <MaterialIcons name="mood" size={23} color={mutedText} />
                    </Pressable>
                    <Pressable onPress={appendHashtag} style={[styles.referenceToolButton, { borderColor: editorBorder }]}>
                      <Text style={[styles.referenceHashtag, { color: mutedText }]}>#</Text>
                    </Pressable>
                  </View>
                )}
                <Text style={[styles.referenceCount, { color: mutedText }]}>
                  {content.length}/{showPollEditor ? MAX_POLL_CAPTION_LENGTH : MAX_POST_LENGTH}
                </Text>
              </View>
            </View>

            {!showPollEditor ? renderAttachmentGrid() : null}

            {!showPollEditor ? (
              <>
                <Text style={[styles.addToPostTitle, { color: titleColor }]}>Add to your post</Text>
                <View style={styles.addToPostRow}>
                  <Pressable
                    onPress={() => {
                      setContent((current) => current.slice(0, MAX_POLL_CAPTION_LENGTH));
                      setShowPollEditor(true);
                    }}
                    style={[styles.addToPostButton, { backgroundColor: inputSurface, borderColor: editorBorder }]}
                  >
                    <MaterialIcons name="poll" size={25} color="#17b26a" />
                    <Text style={[styles.addToPostText, { color: titleColor }]}>Poll</Text>
                  </Pressable>
                  <Pressable onPress={() => openMediaEditor('all')} style={[styles.addToPostButton, { backgroundColor: inputSurface, borderColor: editorBorder }]}>
                    <MaterialIcons name="perm-media" size={25} color="#1689e8" />
                    <Text style={[styles.addToPostText, { color: titleColor }]}>Media</Text>
                  </Pressable>
                  <Pressable onPress={() => openMediaEditor('videos')} style={[styles.addToPostButton, { backgroundColor: inputSurface, borderColor: editorBorder }]}>
                    <MaterialIcons name="videocam" size={26} color="#ec168c" />
                    <Text style={[styles.addToPostText, { color: titleColor }]}>Video</Text>
                  </Pressable>
                </View>
              </>
            ) : null}

            {showPollEditor ? (
              <>
                <View style={[styles.pollBuilderCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
                  <View style={styles.pollBuilderHeader}>
                    <View style={[styles.pollBuilderIcon, { backgroundColor: primarySurface }]}>
                      <MaterialIcons name="poll" size={27} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.pollBuilderHeaderCopy}>
                      <Text style={[styles.pollBuilderTitle, { color: titleColor }]}>Poll Question</Text>
                      <Text style={[styles.pollBuilderSubtitle, { color: mutedText }]}>Ask your community anything</Text>
                    </View>
                  </View>

                  <View style={[styles.pollQuestionBox, { backgroundColor: inputSurface, borderColor: editorBorder }]}>
                    <TextInput
                      includeFontPadding={false}
                      value={pollQuestion}
                      onChangeText={setPollQuestion}
                      maxLength={MAX_POLL_QUESTION_LENGTH}
                      multiline
                      placeholder="Type your poll question..."
                      placeholderTextColor={placeholderColor}
                      textAlignVertical="top"
                      style={[styles.pollQuestionInput, { color: titleColor }]}
                    />
                    <Text style={[styles.pollQuestionCount, { color: mutedText }]}>{pollQuestion.length}/{MAX_POLL_QUESTION_LENGTH}</Text>
                  </View>

                  <View style={styles.pollBuilderOptions}>
                    {pollOptions.map((option, index) => (
                      <View key={`poll-${index}`} style={styles.pollBuilderOptionRow}>
                        <MaterialIcons name="drag-indicator" size={25} color={mutedText} />
                        <View style={[styles.pollBuilderOptionField, { backgroundColor: inputSurface, borderColor: editorBorder }]}>
                          <View style={[styles.pollOptionNumber, { backgroundColor: primarySurface }]}>
                            <Text style={[styles.pollOptionNumberText, { color: titleColor }]}>{index + 1}</Text>
                          </View>
                          <TextInput
                            includeFontPadding={false}
                            value={option}
                            onChangeText={(value) => updatePollOption(index, value)}
                            maxLength={80}
                            placeholder={`Option ${index + 1}`}
                            placeholderTextColor={placeholderColor}
                            style={[styles.pollBuilderOptionInput, { color: titleColor }]}
                          />
                        </View>
                        <Pressable
                          accessibilityLabel={`Remove option ${index + 1}`}
                          onPress={() => removePollOption(index)}
                          disabled={pollOptions.length <= 2}
                          style={[styles.pollBuilderRemove, pollOptions.length <= 2 && styles.pollControlDisabled]}
                        >
                          <MaterialIcons name="close" size={27} color={mutedText} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={addPollOption}
                    disabled={pollOptions.length >= 4}
                    style={[styles.pollBuilderAddButton, { borderColor: primaryColorAlpha(0.5) }, pollOptions.length >= 4 && styles.pollControlDisabled]}
                  >
                    <MaterialIcons name="add" size={22} color={PRIMARY_COLOR} />
                    <Text style={styles.pollBuilderAddText}>Add option</Text>
                  </Pressable>

                  <View style={styles.pollDurationRow}>
                    <View style={[styles.pollBuilderIcon, { backgroundColor: primarySurface }]}>
                      <MaterialIcons name="schedule" size={27} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.pollDurationCopy}>
                      <Text style={[styles.pollBuilderTitle, { color: titleColor }]}>Poll duration</Text>
                      <Text style={[styles.pollBuilderSubtitle, { color: mutedText }]}>Choose how long your poll is active</Text>
                    </View>
                    <View style={[styles.pollDurationSegments, { borderColor: editorBorder, backgroundColor: inputSurface }]}>
                      {([1, 3, 7] as const).map((duration) => {
                        const selected = pollDurationDays === duration;
                        return (
                          <Pressable
                            key={duration}
                            onPress={() => setPollDurationDays(duration)}
                            style={[styles.pollDurationButton, selected && { backgroundColor: PRIMARY_COLOR }]}
                          >
                            <Text style={[styles.pollDurationText, { color: selected ? '#ffffff' : titleColor }]}>{duration} day{duration === 1 ? '' : 's'}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={[styles.pollPreferenceCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
                  <View style={[styles.pollPreferenceRow, { borderBottomColor: editorBorder }]}>
                    <View style={[styles.pollPreferenceIcon, { backgroundColor: primarySurface }]}>
                      <MaterialIcons name="checklist" size={26} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.pollPreferenceCopy}>
                      <Text style={[styles.pollPreferenceTitle, { color: titleColor }]}>Allow multiple choices</Text>
                      <Text style={[styles.pollPreferenceSubtitle, { color: mutedText }]}>Voters can select more than one option</Text>
                    </View>
                    <Switch
                      value={allowMultipleChoices}
                      onValueChange={setAllowMultipleChoices}
                      trackColor={{ false: editorBorder, true: PRIMARY_COLOR }}
                      thumbColor="#ffffff"
                      ios_backgroundColor={editorBorder}
                    />
                  </View>
                  <View style={styles.pollPreferenceRowLast}>
                    <View style={[styles.pollPreferenceIcon, { backgroundColor: primarySurface }]}>
                      <MaterialIcons name="bar-chart" size={27} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.pollPreferenceCopy}>
                      <Text style={[styles.pollPreferenceTitle, { color: titleColor }]}>Show results after voting</Text>
                      <Text style={[styles.pollPreferenceSubtitle, { color: mutedText }]}>Voters will see results after they vote</Text>
                    </View>
                    <Switch
                      value={showResultsAfterVoting}
                      onValueChange={setShowResultsAfterVoting}
                      trackColor={{ false: editorBorder, true: PRIMARY_COLOR }}
                      thumbColor="#ffffff"
                      ios_backgroundColor={editorBorder}
                    />
                  </View>
                </View>

                <View style={[styles.pollMediaCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
                  <View style={styles.pollMediaHeading}>
                    <View style={[styles.pollPreferenceIcon, { backgroundColor: primarySurface }]}>
                      <MaterialIcons name="perm-media" size={26} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.pollPreferenceCopy}>
                      <Text style={[styles.pollPreferenceTitle, { color: titleColor }]}>Add media (optional)</Text>
                      <Text style={[styles.pollPreferenceSubtitle, { color: mutedText }]}>Add an image or short video to your poll</Text>
                    </View>
                  </View>
                  <View style={styles.pollMediaActions}>
                    <Pressable onPress={() => void promptImageUpload('images')} style={[styles.pollMediaButton, { borderColor: editorBorder, backgroundColor: inputSurface }]}>
                      <MaterialIcons name="image" size={25} color={PRIMARY_COLOR} />
                      <Text style={[styles.pollMediaButtonText, { color: titleColor }]}>Photo</Text>
                    </Pressable>
                    <Pressable onPress={() => void promptImageUpload('videos')} style={[styles.pollMediaButton, { borderColor: editorBorder, backgroundColor: inputSurface }]}>
                      <MaterialIcons name="videocam" size={26} color={PRIMARY_COLOR} />
                      <Text style={[styles.pollMediaButtonText, { color: titleColor }]}>Video</Text>
                    </Pressable>
                  </View>
                </View>

                {renderAttachmentGrid()}
              </>
            ) : null}
              </View>

              <View style={[styles.referenceSettingsCard, { backgroundColor: composerBackground, borderColor: editorBorder }]}>
            <Pressable
              onPress={() => Alert.alert('Schedule post', 'Scheduled community publishing is not available yet.')}
              style={[styles.referenceSettingRow, { borderBottomColor: editorBorder }]}
            >
              <View style={[styles.referenceSettingIcon, { backgroundColor: primarySurface }]}>
                <MaterialIcons name="schedule" size={27} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.referenceSettingCopy}>
                <Text style={[styles.referenceSettingTitle, { color: titleColor }]}>Schedule post</Text>
                <Text style={[styles.referenceSettingSubtitle, { color: mutedText }]}>Choose date and time</Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color={mutedText} />
            </Pressable>
            <Pressable onPress={chooseAudience} style={[styles.referenceSettingRow, { borderBottomColor: editorBorder }]}>
              <View style={[styles.referenceSettingIcon, { backgroundColor: primarySurface }]}>
                <MaterialIcons name="group" size={27} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.referenceSettingCopy}>
                <Text style={[styles.referenceSettingTitle, { color: titleColor }]}>Audience</Text>
                <Text style={[styles.referenceSettingSubtitle, { color: mutedText }]}>
                  {targetAudience === 'all' ? 'Everyone in the community' : 'Subscribers only'}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color={mutedText} />
            </Pressable>
            <Pressable onPress={() => void handleSaveDraft()} style={styles.referenceSettingRowLast}>
              <View style={[styles.referenceSettingIcon, { backgroundColor: primarySurface }]}>
                <MaterialIcons name="folder-open" size={27} color={PRIMARY_COLOR} />
              </View>
              <View style={styles.referenceSettingCopy}>
                <Text style={[styles.referenceSettingTitle, { color: titleColor }]}>Save draft</Text>
                <Text style={[styles.referenceSettingSubtitle, { color: mutedText }]}>Save and finish later</Text>
              </View>
              <MaterialIcons name="chevron-right" size={28} color={mutedText} />
            </Pressable>
              </View>
            </>
          )}

        </ScrollView>

        {isPosting && uploadProgress > 0 ? (
          <Text style={[styles.referenceUploadText, { color: mutedText }]}>Uploading {uploadProgress}%</Text>
        ) : null}

        <Modal visible={showEmojiPicker} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowEmojiPicker(false)}>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 0,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(5,5,7,0.82)',
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    lineHeight: 30,
  },
  headerPostButton: {
    minWidth: 104,
    height: 38,
    borderRadius: 999,
    overflow: 'hidden',
  },
  headerPostButtonDisabled: {
    opacity: 0.35,
  },
  headerPostText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
  },
  headerPostGradient: {
    flex: 1,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    // paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    minWidth: 0,
    marginLeft: 12,
    marginTop: 10,
  },
  profileName: {
    color: '#F8FAFC',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
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
    backgroundColor: PRIMARY_COLOR,
    marginRight: 8,
  },
  profileSubText: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    ...fontSize.b1,
    lineHeight: fontSize.b1.lineHeight,
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
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    backgroundColor: PRIMARY_COLOR,
  },
  audienceText: {
    color: '#94A3B8',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
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
    backgroundColor: PRIMARY_COLOR,
    shadowColor: PRIMARY_COLOR,
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
    ...fontSize.b3, lineHeight: fontSize.b3.lineHeight,
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
  },
  modalSectionTitle: {
    color: '#94A3B8',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
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
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
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
  composerCard: {
    // borderRadius: 18,
    // borderWidth: 1,
    padding: 18,
    gap: 17,
    // shadowColor: '#111827',
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.08,
    // shadowRadius: 14,
    // elevation: 3,
  },
  referenceHeaderTitle: {
    ...fontSize.b0Variant,
    lineHeight: fontSize.b0Variant.lineHeight + 2,
    // position: 'absolute',
    // left: 0,
    // right: 0,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },
  headerLeading: {
    width: 104,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  pollBackButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceAvatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2,
  },
  referenceAvatarInner: {
    flex: 1,
    borderRadius: 27,
    padding: 2,
  },
  referenceAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destinationPill: {
    minHeight: 46,
    maxWidth: 158,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  destinationText: {
    flexShrink: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  referenceEditor: {
    minHeight: 290,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  pollCaptionEditor: {
    minHeight: 112,
  },
  referenceTextArea: {
    minHeight: 222,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 25,
    textAlignVertical: 'top',
    padding: 0,
  },
  pollCaptionTextArea: {
    minHeight: 56,
  },
  referenceEditorFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  referenceEditorTools: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referenceToolButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceHashtag: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 28,
    lineHeight: 32,
  },
  referenceCount: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  addToPostTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
    marginTop: -2,
  },
  addToPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  addToPostButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToPostText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  pollBuilderCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 17,
    gap: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 13,
    elevation: 2,
  },
  pollBuilderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollBuilderIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollBuilderHeaderCopy: {
    flex: 1,
    marginLeft: 13,
  },
  pollBuilderTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
  },
  pollBuilderSubtitle: {
    marginTop: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  pollQuestionBox: {
    minHeight: 94,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 9,
  },
  pollQuestionInput: {
    minHeight: 47,
    padding: 0,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  pollQuestionCount: {
    alignSelf: 'flex-end',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  pollBuilderOptions: {
    gap: 10,
  },
  pollBuilderOptionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pollBuilderOptionField: {
    flex: 1,
    height: 56,
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollOptionNumber: {
    width: 39,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollOptionNumberText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 21,
  },
  pollBuilderOptionInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 10,
    paddingVertical: 0,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
  },
  pollBuilderRemove: {
    width: 31,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollControlDisabled: {
    opacity: 0.35,
  },
  pollBuilderAddButton: {
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pollBuilderAddText: {
    color: PRIMARY_COLOR,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  pollDurationRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pollDurationCopy: {
    flex: 1,
    minWidth: 88,
  },
  pollDurationSegments: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollDurationButton: {
    minWidth: 48,
    height: 38,
    borderRadius: 9,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollDurationText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    lineHeight: 15,
  },
  pollPreferenceCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  pollPreferenceRow: {
    minHeight: 86,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollPreferenceRowLast: {
    minHeight: 86,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollPreferenceIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pollPreferenceCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },
  pollPreferenceTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  pollPreferenceSubtitle: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    lineHeight: 17,
  },
  pollMediaCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 13,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  pollMediaHeading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollMediaActions: {
    flexDirection: 'row',
    gap: 10,
  },
  pollMediaButton: {
    flex: 1,
    minHeight: 58,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pollMediaButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 19,
  },
  imagePostCard: {
    // marginHorizontal: 18,
    borderRadius: 18,
    borderWidth: 0,
    overflow: 'hidden',
    // shadowColor: '#111827',
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.07,
    // shadowRadius: 14,
    // elevation: 3,
  },
  imagePostHeading: {
    minHeight: 76,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  imagePostHeadingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagePostHeadingText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 23,
  },
  imagePostCount: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 20,
  },
  imagePostDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
  },
  imagePostCaption: {
    minHeight: 126,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    fontFamily: 'Poppins_400Regular',
    fontSize: 17,
    lineHeight: 27,
  },
  imagePostGrid: {
    marginHorizontal: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imagePostTile: {
    position: 'relative',
    width: '48.7%',
    aspectRatio: 0.98,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#dbe4ee',
  },
  imagePostTileImage: {
    width: '100%',
    height: '100%',
  },
  imagePostOverflowOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22, 11, 50, 0.67)',
  },
  imagePostOverflowText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 42,
    lineHeight: 52,
  },
  imagePostRemoveButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 37,
    height: 37,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
  },
  imagePostReorderButton: {
    position: 'absolute',
    left: 9,
    bottom: 9,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.58)',
    transform: [{ rotate: '90deg' }],
  },
  imagePostAddButton: {
    minHeight: 62,
    marginHorizontal: 18,
    marginTop: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  imagePostAddIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  imagePostAddText: {
    color: PRIMARY_COLOR,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  imagePostHint: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePostHintText: {
    flexShrink: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  imagePostTools: {
    minHeight: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePostTool: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  imagePostToolText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  imagePostToolDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
  },
  videoCaptionCard: {
    minHeight: 166,
    // marginHorizontal: 18,
    borderRadius: 17,
    // borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 12,
    // shadowColor: '#111827',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.06,
    // shadowRadius: 12,
    // elevation: 2,
  },
  videoCaptionInput: {
    minHeight: 103,
    padding: 0,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    lineHeight: 26,
  },
  videoCaptionCount: {
    alignSelf: 'flex-end',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  videoEditorCard: {
    marginHorizontal: 18,
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
  },
  videoPreviewShell: {
    position: 'relative',
    aspectRatio: 1.72,
    backgroundColor: '#0f172a',
  },
  videoPreviewViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayButton: {
    position: 'absolute',
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'rgba(17,24,39,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDurationBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    minWidth: 62,
    height: 38,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(17,24,39,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDurationBadgeText: {
    color: '#ffffff',
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  changeVideoButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    minHeight: 42,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(17,24,39,0.68)',
  },
  changeVideoText: {
    color: '#ffffff',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  videoTimeline: {
    position: 'relative',
    height: 68,
    marginHorizontal: 24,
    marginTop: 18,
    borderWidth: 2,
    borderRadius: 13,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  videoTimelineFrame: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTimelineHandle: {
    position: 'absolute',
    zIndex: 3,
    left: 4,
    top: 14,
    bottom: 14,
    width: 4,
    borderRadius: 3,
    backgroundColor: PRIMARY_COLOR,
  },
  videoTimelineHandleRight: {
    left: undefined,
    right: 4,
  },
  videoTimelineLabels: {
    paddingHorizontal: 25,
    paddingTop: 8,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoTimelineText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 18,
  },
  videoToolCard: {
    minHeight: 76,
    marginHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoToolButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  videoToolText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 16,
  },
  videoToolDivider: {
    width: StyleSheet.hairlineWidth,
    height: 38,
  },
  videoMetadataCard: {
    minHeight: 86,
    marginHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoMetadataItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  videoMetadataDivider: {
    width: StyleSheet.hairlineWidth,
    height: 44,
  },
  videoMetadataValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    lineHeight: 18,
  },
  videoMetadataLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 15,
  },
  videoSettingsCard: {
    marginHorizontal: 18,
    borderRadius: 17,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  videoSettingRow: {
    minHeight: 66,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoSettingRowLast: {
    minHeight: 66,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoSettingTitle: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    lineHeight: 19,
  },
  videoSettingValue: {
    maxWidth: 120,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  videoCoverThumbnail: {
    width: 66,
    height: 40,
    borderRadius: 8,
  },
  referenceSettingsCard: {
    // borderRadius: 18,
    // borderWidth: 1,
    overflow: 'hidden',
    // shadowColor: '#111827',
    // shadowOffset: { width: 0, height: 5 },
    // shadowOpacity: 0.07,
    // shadowRadius: 13,
    // elevation: 2,
  },
  referenceSettingRow: {
    minHeight: 88,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceSettingRowLast: {
    minHeight: 88,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceSettingIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referenceSettingCopy: {
    flex: 1,
    marginLeft: 14,
  },
  referenceSettingTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
  },
  referenceSettingSubtitle: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  referenceTipCard: {
    minHeight: 92,
    // borderRadius: 16,
    // borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  referenceTipIcon: {
    width: 45,
    alignItems: 'center',
  },
  referenceTipCopy: {
    flex: 1,
    marginHorizontal: 8,
  },
  referenceTipTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  referenceTipText: {
    marginTop: 2,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 18,
  },
  referenceTipClose: {
    alignSelf: 'flex-start',
    padding: 2,
  },
  referenceUploadText: {
    paddingVertical: 5,
    textAlign: 'center',
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
});

export default CreateCommunityPost;
