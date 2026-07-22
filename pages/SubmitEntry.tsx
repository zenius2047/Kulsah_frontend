import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { fontSize } from './typography';
import {
  parseApiError,
  useCreatorVideoDirectUpload,
  useUpdateCreatorVideo,
  videoApi,
} from '../src';
import type {
  SubmitCreatorVideoEditsPayload,
  VideoContentType,
  VideoDisplayOrientation,
  VideoUploadSource,
  VideoVisibility,
} from '../src';

type SubmitEntryRouteParams = {
  video?: VideoUploadSource;
  sound?: {
    title?: string;
    id?: string;
    meta?: string;
    usage?: string;
  } | null;
  uploadedVideoId?: string | number;
  autoStartUpload?: boolean;
  uploadStatus?: string;
  uploadProgressPercentage?: number;
  visibility?: VideoVisibility;
  orientation?: VideoDisplayOrientation;
  editPayload?: SubmitCreatorVideoEditsPayload | null;
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
  if (status === 'initializing') return 'Initializing upload...';
  if (status === 'uploading') return `Uploading ${progress}%`;
  if (status === 'finalizing') return 'Completing upload...';
  if (status === 'submitting_edits') return 'Submitting edits...';
  if (status === 'processing') return 'Upload complete';
  if (status === 'ready') return 'Ready';
  if (status === 'failed') return 'Upload failed';
  return 'Starting...';
};

type ThumbnailSource = {
  uri: string;
  origin: 'frame' | 'upload';
  time?: number;
  name?: string;
  type?: string;
};

const thumbnailFrameTimes = [0, 1000, 2000, 3500, 5000, 8000];

const formatFrameTime = (time: number) => {
  const seconds = Math.round(time / 1000);
  return `0:${seconds.toString().padStart(2, '0')}`;
};

const SubmitEntry: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params ?? {}) as SubmitEntryRouteParams;
  const video = params.video;
  const videoUri = video?.uri ?? null;
  const initialVisibility = params.visibility ?? 'public';
  const previewOrientation = params.orientation ?? video?.orientation ?? 'portrait';
  const editPayload = params.editPayload ?? null;
  const directUpload = useCreatorVideoDirectUpload();
  const { mutateAsync: updateCreatorVideo, isPending: isUpdating } = useUpdateCreatorVideo();
  const [uploadedVideoId, setUploadedVideoId] = useState<string | number | undefined>(params.uploadedVideoId);
  const [editSubmitStatus, setEditSubmitStatus] = useState<'idle' | 'submitting_edits' | 'ready' | 'failed'>('idle');
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentTypes, setContentTypes] = useState<VideoContentType[]>(['music']);
  const [subscribersOnly, setSubscribersOnly] = useState(initialVisibility === 'premium');
  const [allowDuets, setAllowDuets] = useState(true);
  const [allowComments, setAllowComments] = useState(false);
  const [thumbnailPickerVisible, setThumbnailPickerVisible] = useState(false);
  const [frameThumbnails, setFrameThumbnails] = useState<ThumbnailSource[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailSource | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(false);

  const cardBackground = isDark ? 'rgba(255,255,255,0.03)' : theme.card;
  const subtleSurface = isDark ? 'rgba(255,255,255,0.05)' : theme.surface;
  const mutedText = isDark ? '#94a3b8' : theme.textSecondary;
  const softText = isDark ? '#64748b' : theme.textMuted;
  const autoUploadPending = Boolean(params.autoStartUpload && uploadedVideoId == null && directUpload.status !== 'failed');
  const progressStatus =
    directUpload.status !== 'idle'
      ? directUpload.status
      : editSubmitStatus !== 'idle'
        ? editSubmitStatus
        : params.uploadStatus ?? (uploadedVideoId != null ? 'ready' : 'idle');
  const progressPercentage =
    directUpload.status !== 'idle'
      ? directUpload.progress
      : editSubmitStatus === 'failed'
        ? 0
        : editSubmitStatus !== 'idle' || uploadedVideoId != null
          ? 100
          : params.uploadProgressPercentage ?? 0;
  const uploadLabel = getUploadLabel(progressStatus, progressPercentage);
  const uploadIsTerminal = progressStatus === 'ready' || progressStatus === 'processing' || progressStatus === 'failed';
  const postIsBusy = directUpload.isActive || isUpdating || editSubmitStatus === 'submitting_edits' || autoUploadPending;
  const selectedVisibility: VideoVisibility = subscribersOnly ? 'premium' : 'public';
  const autoUploadStartedRef = React.useRef(false);
  const editSubmitStartedRef = React.useRef(false);

  useEffect(() => {
    if (!params.autoStartUpload || autoUploadStartedRef.current || !video || uploadedVideoId != null) return;

    autoUploadStartedRef.current = true;

    const startUpload = async () => {
      try {
        const result = await directUpload.upload({
          video: {
            ...video,
            orientation: previewOrientation,
          },
          title: null,
          caption: null,
          contentType: contentTypes,
          visibility: selectedVisibility,
          orientation: previewOrientation,
        }, editPayload ? { edits: editPayload } : undefined);

        setUploadedVideoId(result.video.id);
        navigation.setParams?.({
          uploadedVideoId: result.video.id,
          uploadStatus: result.progress.status,
          uploadProgressPercentage: 100,
          autoStartUpload: false,
          editPayload: null,
        });
      } catch {
        // The upload hook owns failed status and error text for the progress card.
      }
    };

    void startUpload();
  }, [
    contentTypes,
    directUpload,
    editPayload,
    navigation,
    params.autoStartUpload,
    previewOrientation,
    selectedVisibility,
    uploadedVideoId,
    video,
  ]);

  useEffect(() => {
    if (params.autoStartUpload || !uploadedVideoId || !editPayload?.overlays.length || editSubmitStartedRef.current) return;

    editSubmitStartedRef.current = true;

    const submitEdits = async () => {
      try {
        setEditSubmitStatus('submitting_edits');
        setEditSubmitError(null);
        await videoApi.submitCreatorVideoEdits(uploadedVideoId, editPayload);
        setEditSubmitStatus('ready');
        navigation.setParams?.({ editPayload: null });
      } catch (caughtError) {
        const parsed = parseApiError(caughtError);
        setEditSubmitError(parsed.message);
        setEditSubmitStatus('failed');
      }
    };

    void submitEdits();
  }, [editPayload, navigation, params.autoStartUpload, uploadedVideoId]);

  useEffect(() => {
    let cancelled = false;

    const generateFrames = async () => {
      if (!videoUri) {
        setFrameThumbnails([]);
        setSelectedThumbnail(null);
        setThumbnailLoading(false);
        return;
      }

      setSelectedThumbnail(null);
      setThumbnailLoading(true);

      const results = await Promise.allSettled(
        thumbnailFrameTimes.map(async (time) => {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time });
          return { uri, time, origin: 'frame' as const };
        }),
      );

      if (cancelled) return;

      const nextFrames: ThumbnailSource[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          nextFrames.push(result.value);
        }
      });

      setFrameThumbnails(nextFrames);
      setSelectedThumbnail((current) => current ?? nextFrames[0] ?? null);
      setThumbnailLoading(false);
    };

    void generateFrames();

    return () => {
      cancelled = true;
    };
  }, [videoUri]);

  const openThumbnailPicker = () => {
    if (!videoUri) return;
    setThumbnailPickerVisible(true);
  };

  const returnToVideoPreview = (event?: any) => {
    event?.stopPropagation?.();
    if (!video) return;

    navigation.replace('EditSubmission', {
      video: {
        ...video,
        orientation: previewOrientation,
      },
      uploadedVideoId,
      sound: params.sound ?? null,
    });
  };

  const handlePickThumbnailImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Allow photo library access to upload a thumbnail image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const asset = result.assets[0];
      const nextThumbnail: ThumbnailSource = {
        uri: asset.uri,
        origin: 'upload',
        name: asset.fileName ?? `thumbnail-${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      };

      setSelectedThumbnail(nextThumbnail);
      setThumbnailPickerVisible(false);
    } catch (error: any) {
      Alert.alert('Thumbnail unavailable', error?.message || 'We could not load that image.');
    }
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

    try {
      if (uploadedVideoId != null) {
        await updateCreatorVideo({
          video: uploadedVideoId,
          payload: {
            title: title.trim() || null,
            caption: description.trim() || null,
            content_type: contentTypes,
            visibility: selectedVisibility,
          },
        });
      } else {
        await directUpload.upload({
          video: {
            ...video,
            orientation: previewOrientation,
          },
          title: title.trim() || null,
          caption: description.trim() || null,
          contentType: contentTypes,
          visibility: selectedVisibility,
          orientation: previewOrientation,
        }, editPayload ? { edits: editPayload } : undefined);
      }

      Alert.alert('Posted', uploadedVideoId != null ? 'Your video details were saved.' : 'Your video uploaded. Processing will continue in the background.', [
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
          <Pressable style={styles.previewCard} onPress={openThumbnailPicker} disabled={!videoUri}>
            {videoUri ? (
              selectedThumbnail ? (
                <Image source={{ uri: selectedThumbnail.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <ActivityIndicator size="small" color="#fff" />
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
                {/* <View style={styles.thumbnailEditButton}>
                  <MaterialIcons name="image-search" size={22} color="#fff" />
                </View> */}
                <View style={styles.thumbnailHintPill}>
                  <MaterialIcons name="photo-library" size={13} color="#fff" />
                  <Text style={styles.thumbnailHintText}>Thumbnail</Text>
                </View>
                <Pressable style={styles.videoPreviewButton} onPress={returnToVideoPreview}>
                  <MaterialIcons name="play-circle-outline" size={15} color="#fff" />
                  <Text style={styles.videoPreviewButtonText}>Preview</Text>
                </Pressable>
              </>
            ) : null}
            {/* <View style={styles.previewDuration}>
              <Text style={styles.previewDurationText}>{previewOrientation.toUpperCase()}</Text>
            </View> */}
          </Pressable>

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
          {directUpload.status !== 'idle' || uploadedVideoId != null || params.autoStartUpload || editSubmitStatus !== 'idle' ? (
            <View style={[styles.progressCard, { backgroundColor: cardBackground, borderColor: theme.border }]}>
              <View style={styles.progressTop}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Upload Progress</Text>
                <Text style={[styles.progressStatus, { color: progressStatus === 'failed' ? '#ef4444' : PRIMARY_COLOR }]}>
                  {uploadLabel}
                </Text>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: subtleSurface }]}>
                <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, progressPercentage))}%` }]} />
              </View>
              <Text style={[styles.progressHint, { color: mutedText }]}>
                {progressStatus === 'failed'
                  ? directUpload.error || editSubmitError || 'Upload failed. Please try again.'
                  : uploadIsTerminal
                    ? progressStatus === 'processing'
                      ? 'Rendering will continue in the background.'
                      : 'Processing finished.'
                    : editPayload
                      ? 'Your video and edits are being prepared.'
                      : 'Your video is being uploaded and processed.'}
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
              subtitle={subscribersOnly ? 'Visibility will be saved as Premium' : 'Visibility will be saved as Public'}
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
          disabled={!videoUri || postIsBusy}
          style={[styles.postVideoButton, (!videoUri || postIsBusy) && styles.postVideoButtonDisabled]}>
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
      <Modal
        visible={thumbnailPickerVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setThumbnailPickerVisible(false)}
      >
        <View style={styles.thumbnailModal}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setThumbnailPickerVisible(false)} />
          <View style={[styles.thumbnailSheet, { backgroundColor: isDark ? '#0b1120' : '#fff' }]}>
            <View style={styles.thumbnailSheetHeader}>
              <View>
                <Text style={[styles.thumbnailSheetTitle, { color: theme.text }]}>Select Thumbnail</Text>
                <Text style={[styles.thumbnailSheetSubtitle, { color: mutedText }]}>
                  Pick a video frame or upload an image.
                </Text>
              </View>
              <Pressable style={[styles.sheetCloseButton, { backgroundColor: subtleSurface }]} onPress={() => setThumbnailPickerVisible(false)}>
                <MaterialIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={[styles.thumbnailHero, { backgroundColor: subtleSurface }]}>
              {selectedThumbnail ? (
                <Image source={{ uri: selectedThumbnail.uri }} style={styles.thumbnailHeroImage} />
              ) : (
                <View style={styles.thumbnailHeroEmpty}>
                  {thumbnailLoading ? (
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                  ) : (
                    <MaterialIcons name="image" size={30} color={theme.textSecondary} />
                  )}
                </View>
              )}
              <View style={styles.thumbnailHeroBadge}>
                <Text style={styles.thumbnailHeroBadgeText}>
                  {selectedThumbnail?.origin === 'upload'
                    ? 'Uploaded Image'
                    : selectedThumbnail?.time != null
                      ? `Frame ${formatFrameTime(selectedThumbnail.time)}`
                      : 'Thumbnail'}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.frameStrip}>
              {frameThumbnails.map((frame) => {
                const selected = selectedThumbnail?.uri === frame.uri;

                return (
                  <Pressable
                    key={`${frame.uri}-${frame.time}`}
                    onPress={() => setSelectedThumbnail(frame)}
                    style={[styles.frameOption, selected && styles.frameOptionActive]}
                  >
                    <Image source={{ uri: frame.uri }} style={styles.frameOptionImage} />
                    <Text style={styles.frameOptionText}>{formatFrameTime(frame.time ?? 0)}</Text>
                  </Pressable>
                );
              })}
              {thumbnailLoading ? (
                <View style={[styles.frameOption, styles.frameOptionLoading]}>
                  <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.thumbnailSheetActions}>
              <Pressable style={[styles.uploadThumbnailButton, { backgroundColor: subtleSurface }]} onPress={handlePickThumbnailImage}>
                <MaterialIcons name="file-upload" size={18} color={theme.textSecondary} />
                <Text style={[styles.uploadThumbnailText, { color: theme.text }]}>Upload Image</Text>
              </Pressable>
              <Pressable style={styles.useThumbnailButton} onPress={() => setThumbnailPickerVisible(false)}>
                <Text style={styles.useThumbnailText}>Use Thumbnail</Text>
                <MaterialIcons name="check" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  previewCard: {
    width: 122,
    height: 174,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
  thumbnailEditButton: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  thumbnailHintPill: {
    position: 'absolute',
    left: 7,
    right: 7,
    top: 7,
    minHeight: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    // backgroundColor: 'rgba(0,0,0,0.52)',
    // borderWidth: 1,
    // borderColor: 'rgba(255,255,255,0.14)',
  },
  thumbnailHintText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  videoPreviewButton: {
    position: 'absolute',
    left: 7,
    right: 7,
    bottom: 8,
    minHeight: 20,
    borderRadius: 15,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'transparent',
  },
  videoPreviewButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  previewDuration: {
    position: 'absolute',
    left: 7,
    bottom: 44,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewDurationText: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.fontSize + 1,
    letterSpacing: 0.7,
  },
  formColumn: {
    flex: 1,
    gap: 10,
    minWidth: 0,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...fontSize.b4, lineHeight: fontSize.b4.fontSize + 2,
  },
  textArea: {
    minHeight: 78,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
  thumbnailModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  thumbnailSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 16,
  },
  thumbnailSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  thumbnailSheetTitle: {
    ...fontSize.b3,
    lineHeight: fontSize.b3.fontSize + 2,
  },
  thumbnailSheetSubtitle: {
    marginTop: 3,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 3,
  },
  sheetCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailHero: {
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
  },
  thumbnailHeroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailHeroEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailHeroBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.66)',
  },
  thumbnailHeroBadgeText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  frameStrip: {
    gap: 10,
    paddingRight: 4,
  },
  frameOption: {
    width: 86,
    height: 112,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  frameOptionActive: {
    borderColor: PRIMARY_COLOR,
  },
  frameOptionImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  frameOptionText: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  frameOptionLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailSheetActions: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadThumbnailButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  uploadThumbnailText: {
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  useThumbnailButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  useThumbnailText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
});

export default SubmitEntry;
