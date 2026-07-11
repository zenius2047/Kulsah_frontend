import React, { useMemo, useState } from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { fontSize } from './typography';
import {
  parseApiError,
  useCreateCreatorVideoDraft,
  useCreatorVideoUploadStore,
  useUpdateCreatorVideoProgress,
  useUploadCreatorVideoToDraft,
} from '../src';
import type { VideoDisplayOrientation, VideoUploadSource, VideoVisibility } from '../src';

type EditSubmissionRouteParams = {
  video?: VideoUploadSource;
  sound?: {
    title?: string;
    id?: string;
    meta?: string;
    usage?: string;
  } | null;
};

const getOrientationFromTrackSize = (width?: number, height?: number): VideoDisplayOrientation | null => {
  if (!width || !height) return null;
  return width > height ? 'landscape' : 'portrait';
};

const getRotationDegrees = (track?: Record<string, any> | null): number => {
  const rawRotation = track?.rotation ?? track?.rotate ?? track?.transform?.rotation;
  const rotation = typeof rawRotation === 'string' ? Number(rawRotation) : rawRotation;

  return typeof rotation === 'number' && Number.isFinite(rotation) ? Math.abs(rotation) % 180 : 0;
};

const getOrientationFromTrack = (track?: Record<string, any> | null): VideoDisplayOrientation | null => {
  const explicitOrientation = track?.orientation;
  if (explicitOrientation === 'landscape' || explicitOrientation === 'landscape-left' || explicitOrientation === 'landscape-right') {
    return 'landscape';
  }

  if (explicitOrientation === 'portrait' || explicitOrientation === 'portrait-up' || explicitOrientation === 'portrait-down') {
    return 'portrait';
  }

  const width = track?.size?.width ?? track?.width ?? track?.naturalSize?.width;
  const height = track?.size?.height ?? track?.height ?? track?.naturalSize?.height;
  if (!width || !height) return null;

  const rotatedSideways = getRotationDegrees(track) === 90;
  return getOrientationFromTrackSize(rotatedSideways ? height : width, rotatedSideways ? width : height);
};

const quickActions = [
  { id: 'draw', label: 'Draw', icon: 'brush' as const },
  { id: 'text', label: 'Text', icon: 'text-fields' as const },
  { id: 'music', label: 'Sound', icon: 'music-note' as const },
];

const visibilityOptions: Array<{ value: VideoVisibility; label: string; icon: keyof typeof MaterialIcons.glyphMap }> = [
  { value: 'public', label: 'Public', icon: 'public' },
  { value: 'premium', label: 'Premium', icon: 'workspace-premium' },
];

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const EditSubmission: React.FC = () => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const params = (route.params ?? {}) as EditSubmissionRouteParams;
  const video = params.video;
  const videoUri = video?.uri ?? null;
  const [visibility, setVisibility] = useState<VideoVisibility>('public');
  const [hasStartedPreview, setHasStartedPreview] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { mutateAsync: createCreatorVideoDraft } = useCreateCreatorVideoDraft();
  const { mutateAsync: uploadCreatorVideoToDraft } = useUploadCreatorVideoToDraft();
  const { mutateAsync: updateCreatorVideoProgress } = useUpdateCreatorVideoProgress();
  const startUploadTask = useCreatorVideoUploadStore((state) => state.startTask);
  const attachVideoIdToUploadTask = useCreatorVideoUploadStore((state) => state.attachVideoId);
  const completeUploadTask = useCreatorVideoUploadStore((state) => state.completeTask);
  const failUploadTask = useCreatorVideoUploadStore((state) => state.failTask);
  const updateUploadTaskProgress = useCreatorVideoUploadStore((state) => state.updateTaskProgress);
  const loadedPreviewUriRef = React.useRef<string | null>(null);
  const lastProgressPatchRef = React.useRef({ percent: 0, timestamp: 0 });

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = false;
  });

  const routeOrientation = video?.orientation ?? null;
  const previewOrientation = routeOrientation ?? 'portrait';
  const isLandscapePreview = previewOrientation === 'landscape';
  const shouldRenderVideo = Boolean(videoUri && isFocused && hasStartedPreview);

  const pausePreview = React.useCallback(() => {
    try {
      player.pause();
    } catch {}
    setIsPlaying(false);
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
      setIsPlaying(true);
    } catch (error: any) {
      Alert.alert('Preview unavailable', error?.message || 'We could not play this video preview.');
    }
  }, [isMuted, player, videoUri]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        pausePreview();
        setHasStartedPreview(false);
      };
    }, [pausePreview]),
  );

  const progress = useMemo(() => {
    if (!duration) return 0;
    return Math.min(1, Math.max(0, currentTime / duration));
  }, [currentTime, duration]);

  const handleTogglePlayback = () => {
    if (!videoUri) return;

    if (isPlaying) {
      pausePreview();
      return;
    }

    setHasStartedPreview(true);
    playPreview();
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'text') {
      Alert.alert('Text tools', 'Text tools are ready for the next editor pass.');
      return;
    }

    if (actionId === 'music') {
      navigation.navigate('Vote');
      return;
    }

    Alert.alert('Draw tools', 'Drawing tools are ready for the next editor pass.');
  };

  const handleNext = () => {
    if (!video) {
      Alert.alert('No video selected', 'Record or choose a video before continuing.');
      return;
    }

    const uploadTaskId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    startUploadTask(uploadTaskId);

    void createCreatorVideoDraft({
      content_type: ['music'],
      visibility,
    })
      .then(async (draftResponse) => {
        const draftVideoId = draftResponse.data.id;
        lastProgressPatchRef.current = { percent: 0, timestamp: 0 };

        attachVideoIdToUploadTask(uploadTaskId, {
          videoId: draftVideoId,
          progressPercentage: draftResponse.data.progress_percentage ?? 0,
          processingStatus: draftResponse.data.status ?? 'uploading',
        });

        const uploadResponse = await uploadCreatorVideoToDraft({
          video: draftVideoId,
          payload: {
            video: {
              ...video,
              orientation: previewOrientation,
            },
          },
          onUploadProgress: (percent) => {
            updateUploadTaskProgress(uploadTaskId, {
              progressPercentage: percent,
              processingStatus: 'draft',
            });

            const now = Date.now();
            const shouldPatch =
              percent === 100 ||
              percent - lastProgressPatchRef.current.percent >= 5 ||
              now - lastProgressPatchRef.current.timestamp >= 1000;

            if (!shouldPatch) return;

            lastProgressPatchRef.current = { percent, timestamp: now };
            void updateCreatorVideoProgress({
              video: draftVideoId,
              payload: { progress_percentage: percent },
            }).catch(() => undefined);
          },
        });

        completeUploadTask(uploadTaskId, {
          videoId: draftVideoId,
          progressPercentage: uploadResponse.data.progress_percentage ?? 100,
          processingStatus: uploadResponse.data.status ?? 'processing',
        });
      })
      .catch((caughtError) => {
        const parsed = parseApiError(caughtError);
        failUploadTask(uploadTaskId, parsed.message);
      });

    navigation.replace('SubmitEntry', {
      video: {
        ...video,
        orientation: previewOrientation,
      },
      creatorUploadTaskId: uploadTaskId,
      uploadStatus: 'uploading',
      uploadProgressPercentage: 0,
      sound: params.sound ?? null,
      visibility,
      orientation: previewOrientation,
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={styles.screen}
      >
        {videoUri ? (
          shouldRenderVideo ? (
            <VideoView
              player={player}
              nativeControls={false}
              contentFit={isLandscapePreview ? 'contain' : 'cover'}
              style={[styles.videoBackground, isLandscapePreview && styles.landscapeVideoBackground]}
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <MaterialIcons name="play-circle-outline" size={64} color="rgba(255,255,255,0.72)" />
            </View>
          )
        ) : (
          <View style={styles.missingVideo}>
            <MaterialIcons name="videocam-off" size={46} color="rgba(255,255,255,0.62)" />
            <Text style={styles.missingVideoText}>No video selected</Text>
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.52)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.88)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={styles.headerBack}>
              <MaterialIcons name="chevron-left" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Submission</Text>
          </View>

          <Pressable
            onPress={() => void handleNext()}
            style={[styles.postButton, !videoUri && styles.postButtonDisabled]}
            disabled={!videoUri}
          >
            <Text style={styles.postButtonText}>NEXT</Text>
          </Pressable>
        </View>

        <Pressable style={styles.videoTapLayer} onPress={handleTogglePlayback}>
          {!isPlaying ? (
            <View style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={54} color="#fff" />
            </View>
          ) : null}
        </Pressable>

        <View style={styles.challengeBadgeWrap}>
          <View style={styles.challengeBadge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeMeta}>Ready to publish</Text>
            <Text style={styles.badgeTitle}>{`${visibility.toUpperCase()} / ${previewOrientation.toUpperCase()}`}</Text>
          </View>
        </View>

        <View style={styles.rightRail}>
          {quickActions.map((action) => (
            <View key={action.id} style={styles.quickActionItem}>
              <Pressable style={styles.quickActionButton} onPress={() => handleQuickAction(action.id)}>
                <MaterialIcons name={action.icon} size={22} color="#fff" />
              </Pressable>
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </View>
          ))}

          <View style={styles.quickActionItem}>
            <Pressable style={styles.quickActionButton} onPress={() => setIsMuted((value) => !value)}>
              <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={22} color="#fff" />
            </Pressable>
            <Text style={styles.quickActionLabel}>{isMuted ? 'Muted' : 'Sound'}</Text>
          </View>
        </View>

        <View style={styles.bottomPanelWrap}>
          <View style={styles.formPanel}>
            {params.sound?.title ? (
              <View style={styles.soundPill}>
                <MaterialIcons name="music-note" size={16} color={PRIMARY_COLOR} />
                <Text style={styles.soundPillText} numberOfLines={1}>{params.sound.title}</Text>
              </View>
            ) : null}

            <View style={styles.visibilityRow}>
              {visibilityOptions.map((option) => {
                const selected = visibility === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setVisibility(option.value)}
                    style={[styles.visibilityButton, selected && styles.visibilityButtonActive]}
                  >
                    <MaterialIcons name={option.icon} size={16} color={selected ? '#fff' : 'rgba(255,255,255,0.72)'} />
                    <Text style={[styles.visibilityText, selected && styles.visibilityTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.timelineHeader}>
              <Text style={styles.timelineMeta}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <Text style={styles.timelineMeta}>1.0x</Text>
            </View>

            <View style={styles.timelineTrack}>
              <View style={[styles.timelineFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.playhead, { left: `${progress * 100}%` }]} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  landscapeVideoBackground: {
    backgroundColor: '#000',
  },
  previewPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
  },
  missingVideo: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a050d',
    gap: 10,
  },
  missingVideoText: {
    color: 'rgba(255,255,255,0.74)',
    ...fontSize.b3,
    lineHeight: fontSize.b3.fontSize + 2,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    height: 94,
    paddingHorizontal: 20,
    paddingTop: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    color: '#fff',
    ...fontSize.b4,
    lineHeight: fontSize.b4.fontSize + 1,
    fontWeight: '800',
  },
  postButton: {
    minWidth: 82,
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.55,
  },
  postButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    letterSpacing: 0.8,
    fontWeight: '900',
  },
  videoTapLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  playButton: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  challengeBadgeWrap: {
    position: 'absolute',
    zIndex: 10,
    top: 104,
    left: 20,
  },
  challengeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
  },
  badgeMeta: {
    color: PRIMARY_COLOR,
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  badgeTitle: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    fontWeight: '900',
  },
  rightRail: {
    position: 'absolute',
    zIndex: 20,
    right: 18,
    bottom: 286,
    gap: 18,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 5,
  },
  quickActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  quickActionLabel: {
    color: 'rgba(255,255,255,0.78)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomPanelWrap: {
    position: 'absolute',
    zIndex: 30,
    left: 0,
    right: 0,
    bottom: 26,
    paddingHorizontal: 18,
  },
  formPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(0,0,0,0.52)',
    padding: 14,
    gap: 10,
  },
  soundPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '82%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: primaryColorAlpha(0.16),
  },
  soundPillText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  visibilityButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  visibilityText: {
    color: 'rgba(255,255,255,0.72)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    fontWeight: '800',
  },
  visibilityTextActive: {
    color: '#fff',
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineMeta: {
    color: 'rgba(255,255,255,0.68)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timelineTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  timelineFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
  },
  playhead: {
    position: 'absolute',
    top: -3,
    width: 2,
    height: 12,
    backgroundColor: '#fff',
  },
});

export default EditSubmission;
