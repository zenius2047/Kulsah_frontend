import React, { useEffect, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fontSize } from './typography';
import {
  parseApiError,
  useCreatorVideoProgress,
  useCreatorVideoUploadStore,
  useUpdateCreatorVideo,
  useUploadCreatorVideo,
} from '../src';
import type { VideoContentType, VideoDisplayOrientation, VideoUploadSource, VideoVisibility } from '../src';

type SubmitEntryRouteParams = {
  video?: VideoUploadSource;
  sound?: {
    title?: string;
    id?: string;
    meta?: string;
    usage?: string;
  } | null;
  creatorUploadTaskId?: string;
  uploadedVideoId?: string | number;
  uploadStatus?: string;
  uploadProgressPercentage?: number;
  visibility?: VideoVisibility;
  orientation?: VideoDisplayOrientation;
};

const contentTypeOptions: Array<{
  value: VideoContentType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { value: 'music', label: 'Music', icon: 'music-note' },
  { value: 'dance', label: 'Dance', icon: 'directions-run' },
  { value: 'comedy', label: 'Comedy', icon: 'sentiment-very-satisfied' },
  { value: 'tutorial', label: 'Tutorial', icon: 'school' },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'auto-awesome' },
  { value: 'behind_the_scenes', label: 'BTS', icon: 'movie-filter' },
];

const getUploadLabel = (status: string, progress: number) => {
  if (status === 'draft' && progress < 100) return `Uploading ${progress}%`;
  if (status === 'draft' && progress >= 100) return 'Upload complete, processing...';
  if (status === 'processing') return 'Processing video...';
  if (status === 'ready') return 'Ready';
  if (status === 'failed') return 'Upload failed';
  if (status === 'uploading') return `Uploading ${progress}%`;
  return 'Starting...';
};

const SubmitEntry: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as SubmitEntryRouteParams;
  const video = params.video;
  const videoUri = video?.uri ?? null;
  const initialVisibility = params.visibility ?? 'public';
  const creatorUploadTaskId = params.creatorUploadTaskId;
  const uploadTask = useCreatorVideoUploadStore((state) =>
    creatorUploadTaskId ? state.tasks[creatorUploadTaskId] : undefined,
  );
  const updateUploadTaskProgress = useCreatorVideoUploadStore((state) => state.updateTaskProgress);
  const uploadedVideoId = params.uploadedVideoId ?? uploadTask?.videoId;
  const previewOrientation = params.orientation ?? video?.orientation ?? 'portrait';
  const isLandscapePreview = previewOrientation === 'landscape';
  const { mutateAsync: uploadCreatorVideo, isPending: isPosting } = useUploadCreatorVideo();
  const { mutateAsync: updateCreatorVideo, isPending: isUpdating } = useUpdateCreatorVideo();
  const { data: uploadProgress } = useCreatorVideoProgress(uploadedVideoId, uploadedVideoId != null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentTypes, setContentTypes] = useState<VideoContentType[]>(['music']);
  const [subscribersOnly, setSubscribersOnly] = useState(initialVisibility === 'premium');
  const [allowDuets, setAllowDuets] = useState(true);
  const [allowComments, setAllowComments] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const loadedPreviewUriRef = React.useRef<string | null>(null);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  const cardBackground = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const subtleSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const softText = isDark ? '#64748b' : theme.textMuted;
  const shouldRenderPreviewVideo = Boolean(videoUri && isFocused && isPreviewPlaying);
  const progressStatus = uploadProgress?.status ?? uploadTask?.processingStatus ?? params.uploadStatus ?? 'processing';
  const progressPercentage = uploadProgress?.progress_percentage ?? uploadTask?.progressPercentage ?? params.uploadProgressPercentage ?? 0;
  const uploadLabel = getUploadLabel(progressStatus, progressPercentage);
  const uploadIsTerminal = progressStatus === 'ready' || progressStatus === 'failed';
  const backgroundUploadPending = Boolean(creatorUploadTaskId && !uploadedVideoId && uploadTask?.status !== 'failed');
  const backgroundUploadFailed = uploadTask?.status === 'failed';
  const postIsBusy = isPosting || isUpdating;

  useEffect(() => {
    if (!creatorUploadTaskId || !uploadProgress) return;

    updateUploadTaskProgress(creatorUploadTaskId, {
      progressPercentage: uploadProgress.progress_percentage,
      processingStatus: uploadProgress.status,
    });
  }, [creatorUploadTaskId, updateUploadTaskProgress, uploadProgress]);

  const pausePreview = React.useCallback(() => {
    try {
      player.pause();
    } catch {}
    setIsPreviewPlaying(false);
  }, [player]);

  const playPreview = React.useCallback(() => {
    if (!videoUri) return;

    try {
      if (loadedPreviewUriRef.current !== videoUri) {
        if (typeof player.replace !== 'function') {
          throw new Error('Video preview is not supported on this build.');
        }

        player.replace(videoUri);
        loadedPreviewUriRef.current = videoUri;
      }

      player.muted = isMuted;
      player.play();
      setIsPreviewPlaying(true);
    } catch (error: any) {
      Alert.alert('Preview unavailable', error?.message || 'We could not play this video preview.');
    }
  }, [isMuted, player, videoUri]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        pausePreview();
      };
    }, [pausePreview]),
  );

  const togglePreviewPlayback = () => {
    if (!videoUri) return;

    if (isPreviewPlaying) {
      pausePreview();
      return;
    }

    playPreview();
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const toggleContentType = (nextType: VideoContentType) => {
    setContentTypes((current) => {
      if (current.includes(nextType)) {
        return current.length === 1 ? current : current.filter((type) => type !== nextType);
      }

      return [...current, nextType];
    });
  };

  const handlePostVideo = async () => {
    if (!video) {
      Alert.alert('No video selected', 'Go back and select or record a video before posting.');
      return;
    }

    const visibility: VideoVisibility = subscribersOnly ? 'premium' : 'public';

    if (backgroundUploadPending) {
      Alert.alert('Upload still running', 'Your video is still uploading in the background. Please wait for the upload to finish before posting details.');
      return;
    }

    if (backgroundUploadFailed) {
      Alert.alert('Upload failed', uploadTask?.error || 'The background upload failed. Go back and try again.');
      return;
    }

    try {
      if (uploadedVideoId != null) {
        await updateCreatorVideo({
          video: uploadedVideoId,
          payload: {
            title: title.trim() || null,
            caption: description.trim() || null,
            content_type: contentTypes,
            visibility,
          },
        });
      } else {
        await uploadCreatorVideo({
          video: {
            ...video,
            orientation: previewOrientation,
          },
          title: title.trim() || null,
          caption: description.trim() || null,
          contentType: contentTypes,
          visibility,
          orientation: previewOrientation,
        });
      }

      Alert.alert('Posted', uploadedVideoId != null ? 'Your video details were saved.' : 'Your video upload has started.', [
        {
          text: 'Done',
          onPress: () =>
            navigation.navigate('MainTabs', {
              screen: 'Home',
              params: { tabToRoute: 'challenges' },
            }),
        },
      ]);
    } catch (caughtError) {
      const parsed = parseApiError(caughtError);
      Alert.alert(parsed.title, parsed.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)',
              borderBottomColor: theme.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()}>
              <MaterialIcons name="close" size={22} color={theme.textSecondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Create Pulse</Text>
          </View>

          {/* <Pressable style={styles.headerPostButton}>
            <Text style={styles.headerPostText}>Post</Text>
          </Pressable> */}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          style={{ flex: 1, backgroundColor: theme.background }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.previewSection}>
          <View style={styles.previewCard}>
            {videoUri ? (
              shouldRenderPreviewVideo ? (
                <VideoView
                  player={player}
                  nativeControls={false}
                  contentFit={isLandscapePreview ? 'contain' : 'cover'}
                  style={styles.previewVideo}
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <MaterialIcons name="play-circle-outline" size={46} color="rgba(255,255,255,0.78)" />
                </View>
              )
            ) : (
              <View style={styles.missingPreview}>
                <MaterialIcons name="videocam-off" size={34} color="rgba(255,255,255,0.72)" />
                <Text style={styles.missingPreviewText}>No video selected</Text>
              </View>
            )}
            <View style={styles.previewShade} />
            {videoUri ? (
              <>
                <Pressable style={styles.previewPlayButton} onPress={togglePreviewPlayback}>
                  <MaterialIcons name={isPreviewPlaying ? 'pause' : 'play-arrow'} size={28} color="#fff" />
                </Pressable>
                <Pressable style={styles.previewMuteButton} onPress={toggleMute}>
                  <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={18} color="#fff" />
                </Pressable>
              </>
            ) : null}
            <View style={styles.previewDuration}>
              <Text style={styles.previewDurationText}>{previewOrientation.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.formColumn}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: mutedText }]}>Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Add a catchy title..."
                placeholderTextColor={softText}
                style={[
                  styles.input,
                  { backgroundColor: subtleSurface, color: theme.text },
                ]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: mutedText }]}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                placeholder="Tell your fans more about this Pulse... add #hashtags and @mentions here"
                placeholderTextColor={softText}
                style={[
                  styles.textArea,
                  { backgroundColor: subtleSurface, color: theme.text },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
              {creatorUploadTaskId || uploadedVideoId != null ? (
            <View style={[styles.progressCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
              <View style={styles.progressTop}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Upload Progress</Text>
                <Text style={[styles.progressStatus, { color: backgroundUploadFailed || progressStatus === 'failed' ? '#ef4444' : PRIMARY_COLOR }]}>
                  {uploadLabel}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: subtleSurface }]}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPercentage))}%` }]} />
              </View>
              <Text style={[styles.progressHint, { color: mutedText }]}>
                {backgroundUploadFailed
                  ? uploadTask?.error || 'Upload failed. Please go back and try again.'
                  : backgroundUploadPending
                    ? 'Uploading in the background. You can finish details while it continues.'
                    : uploadIsTerminal
                      ? 'Processing finished.'
                      : 'You can finish details while processing continues.'}
              </Text>
            </View>
          ) : null}

          <View style={styles.sectionTop}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Content Type</Text>
            <Text style={styles.sectionHint}>Choose 1+</Text>
          </View>

          <View style={[styles.glassCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
            <View style={styles.contentTypeGrid}>
              {contentTypeOptions.map((option) => {
                const selected = contentTypes.includes(option.value);

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleContentType(option.value)}
                    style={[
                      styles.contentTypeButton,
                      {
                        backgroundColor: selected ? primaryColorAlpha(0.18) : subtleSurface,
                        borderColor: selected ? PRIMARY_COLOR : theme.border,
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={option.icon}
                      size={18}
                      color={selected ? PRIMARY_COLOR : theme.textSecondary}
                    />
                    <Text style={[styles.contentTypeText, { color: selected ? PRIMARY_COLOR : mutedText }]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Permissions</Text>

          <View style={[styles.permissionsCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
            <PermissionRow
              icon="stars"
              title="Subscribers Only"
              subtitle="Only paid members can view this content"
              accent={PRIMARY_COLOR}
              enabled={subscribersOnly}
              onToggle={setSubscribersOnly}
              isDark={isDark}
              theme={theme}
            />
            <PermissionRow
              icon="layers"
              title="Allow Duets"
              subtitle="Let others collaborate with your video"
              accent={PRIMARY_COLOR}
              enabled={allowDuets}
              onToggle={setAllowDuets}
              isDark={isDark}
              theme={theme}
            />
            <PermissionRow
              icon="forum"
              title="Allow Comments"
              subtitle="Open the floor for discussion"
              accent="#64748b"
              enabled={allowComments}
              onToggle={setAllowComments}
              isDark={isDark}
              theme={theme}
              isLast
            />
          </View>
        </View>

        <Pressable style={styles.advancedButton}>
          <Text style={[styles.advancedText, { color: softText }]}>Advanced Settings</Text>
          <MaterialIcons name="expand-more" size={16} color={softText} />
        </Pressable>

        <View style={styles.bottomCtaWrap}>
          <Pressable
          onPress={() => void handlePostVideo()}
          disabled={!videoUri || postIsBusy || backgroundUploadPending || backgroundUploadFailed}
          style={[styles.postVideoButton, (!videoUri || postIsBusy || backgroundUploadPending || backgroundUploadFailed) && styles.postVideoButtonDisabled]}>
            {postIsBusy ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.postVideoText}>POST VIDEO</Text>
                <MaterialIcons name="send" size={18} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

type PermissionRowProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  accent: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  isDark: boolean;
  theme: ReturnType<typeof useThemeMode>['theme'];
  isLast?: boolean;
};

const PermissionRow: React.FC<PermissionRowProps> = ({
  icon,
  title,
  subtitle,
  accent,
  enabled,
  onToggle,
  isDark,
  theme,
  isLast = false,
}) => (
  <View style={[styles.permissionRow, !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
    <View style={styles.permissionLeft}>
      <View
        style={[
          styles.permissionIcon,
          {
            backgroundColor: enabled ? `${accent}20` : isDark ? '#1f2937' : theme.surface,
            borderColor: enabled ? `${accent}30` : theme.border,
          },
        ]}
      >
        <MaterialIcons name={icon} size={20} color={enabled ? accent : theme.textSecondary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.permissionTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.permissionSubtitle, { color: isDark ? '#6b7280' : theme.textMuted }]}>{subtitle}</Text>
      </View>
    </View>

    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ false: isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1', true: PRIMARY_COLOR }}
      thumbColor="#fff"
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    height: 94,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingTop: 34,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  headerPostButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  headerPostText: {
    color: PRIMARY_COLOR,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  content: {
    paddingTop: 108,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 28,
  },
  previewSection: {
    // flexDirection: 'row',
    gap: 18,
    alignItems: 'flex-start',
  },
  previewCard: {
    width: "100%",
    height: 200,
    // aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  missingPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0a050d',
  },
  missingPreviewText: {
    color: 'rgba(255,255,255,0.76)',
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
  },
  previewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  previewPlayButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 48,
    height: 48,
    marginLeft: -24,
    marginTop: -24,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  previewMuteButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  previewDuration: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewDurationText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    letterSpacing: 0.7,
  },
  formColumn: {
    flex: 1,
    gap: 14,
    width: '100%'
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    marginLeft: 4,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  textArea: {
    minHeight: 92,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  section: {
    gap: 12,
  },
  sectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
  },
  progressCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  progressStatus: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  progressHint: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 3,
  },
  sectionHint: {
    color: PRIMARY_COLOR,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  glassCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  contentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  contentTypeButton: {
    minHeight: 44,
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  contentTypeText: {
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    fontWeight: '800',
  },
  permissionsCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    gap: 14,
  },
  permissionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  permissionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  permissionTitle: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  permissionSubtitle: {
    marginTop: 2,
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  advancedText: {
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomCtaWrap: {
    paddingTop: 8,
  },
  postVideoButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  postVideoButtonDisabled: {
    opacity: 0.55,
  },
  postVideoText: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 1,
    letterSpacing: 1.1,
  },
});

export default SubmitEntry;
