import React from 'react';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useEvent, useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Circle } from 'react-native-svg';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { VoteSheetContent } from './SoundSelect';
import { mediumScreen } from '../types';
import { fontSize } from './typography';
import { useAuthStore } from '../src';
import type { DuetLayout, MusicTrack, VideoDisplayOrientation } from '../src';

type PreviewSound = Awaited<ReturnType<typeof Audio.Sound.createAsync>>['sound'];

type FilterItem = {
  id: string;
  name: string;
  image: string;
  active?: boolean;
};

type SideControl = {
  id: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  active?: boolean;
};

const filters: FilterItem[] = [
  {
    id: 'retro',
    name: 'Retro',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAz2lGR7OStkHE4hbI_FsxMhrSTY_RAyxJKWRU--GlFpa5FvBsSlrt1kaUV7g-Qnt3kvUwuNsSKLXOMv1V--Eqt0ixcYxZ9Nt3scKF89IBggoxBj6SUIwXxzhqbBR6yMguilYzWzFPJnG_HoItPT8_FO4-zUX2Mszn-EANldzQ2KIepRPwGpUqE0k5VVtP6ejwScnX1iUwJfMYp3jEEqAxOjScyDupyg-9qLEw6ByT0vdRNZy-avWvzHrjsBIhF_kWKrp331m5PpAmO',
    active: true,
  },
  {
    id: 'bw',
    name: 'B&W',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB23ShVE6h1bO3oCkRz8WuVDrHyZT5jEVvBfyLBob5W9UsvQhc5bb4-yVooZ1LRoBaNnB7cVzUfqN2fueFR6Clc9x44XcKbTUhEO-MZZP6i08Y5woNUbgB6EkBz5UhafSY1rMa5uJT90WwyDimY_qpcB-oVq0PF9Me9hfbSc4cG4wg2l8ZyxH9jA39euYeKSCzgpDW4qwmDx7d8WE-TyLLkCuzpwEnVpcioKnau9OOVWwykqwG-uT_zPWxIFjssvWG34UJ3uemx3aaa',
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUh6iK4lNUTCw4US-RpyaaqzHswtQtX8SjaWqJpjAy2AcIYG8XOmrFpvbbSV3TOxvxAZm-ItYCYxEXyY6vOohIlVQdwGeYBsGth5Twm5uByWCmE2w4oMZPtbsa-A07Jttz-yRoLO_1BbO426FEOQ1Ratwy3pyOJHu1e6KR6b2bHl94NoZ_n0t47SMlsTo7OFItjVOvZ07Q1jnkg3yhdIxQ8KNeuvs8HQyCMUfrhwcm-6LpiA998Z62vYcz-BKtq6ZydaZvl1MYhSsB',
  },
  {
    id: 'warm',
    name: 'Warm',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCVgmlRySckbwvWsf9k9JWlXpZ4itF8-OhsCJViTUhB8rMic007i0A_a_L_-sd1cRikFmvZEqH0WBgLY68txRipZ7Om5elo91P15THlExS5nAM-9x2o216vLJ2cXLKwTzekYUVUiI68qd0kl9v-wEggQLctrNvefBW_e6MqjxJL6mXbiRGQixYoPtJJ5o_GxPp1qcUypc77F2cP8Y1h-7239B4UmpEiX0FOFGsfQ5O5LWes5b09urQ3AYtfg089wHImGKs4OaXwgy28',
  },
  {
    id: 'glow',
    name: 'Glow',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuATPhjTCYjlVILbuF9DvDlS3SRAuk0NmOOPpMZ_0Aj0SVarvhQTc8iVBhlmYZrBQBsqthGi83szsE-r8N8qJGZi36Z6fmR-sQJDpaQjrKoOZcDXSiUYTCY--UWJ991_zd3BsSCdasuNotoOUx4kTjZGD5KCGwHAvkDYyeO_K09NM2mwLgfcHaSdcszEdpoRsUkg42rLefIwcFFp-i6S-HFxl36Xnr-y-JAzNXO34yypDEIvZZIZz6Stj21AkZLC-ZIZRsrcEDO6Efrp',
  },
  {
    id: 'flashy',
    name: 'Flashy',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAsiqRNO8gQnrI6I-DlVoZ8Xprc8EIYj917CSdWhriVEXNEd33AWOWUfDZLYsmD_xzQQWMU2i-eal9zLi4EQb9O34D1vL2Wz2ckeeQSMzQrgY6rVZOx8JoyMiHdChK1ajhX9iucYLmwZOEuTyXilEK89ZyGlnHLxnFUmQGjY6nRrf7rcaJea-MhZ-5ngVlOMz4h66IFRDkLlpLtBkKaeTlG1OibVi7lLHeBdALvAg1ZWvImoLPTdfhNnKEj-PFO_H00K8z1emCZSPhW',
  },
];

const sideControls: SideControl[] = [
  { id: 'flip', label: 'Flip', icon: 'flip-camera-ios' },
  { id: 'speed', label: 'Speed', icon: 'speed' },
  { id: 'beauty', label: 'Beauty', icon: 'face', active: true },
  { id: 'timer', label: 'Timer', icon: 'timer' },
  { id: 'flash', label: 'Flash', icon: 'flash-on' },
];

const modes = ['Live', 'Post', 'Create'] as const;
const RECORDING_PROGRESS_CYCLE_SECONDS = 60;
const DUET_COUNTDOWN_SECONDS = 3;
const RECORD_PROGRESS_SIZE = 88;
const RECORD_PROGRESS_STROKE = 4;
const RECORD_PROGRESS_RADIUS = (RECORD_PROGRESS_SIZE - RECORD_PROGRESS_STROKE) / 2;
const RECORD_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * RECORD_PROGRESS_RADIUS;
const RECORD_BUTTON_SIZE = 76;
const RECORD_RING_OVERHANG = (RECORD_PROGRESS_SIZE - RECORD_BUTTON_SIZE) / 2;
const RECORD_CONTROLS_BOTTOM_PADDING = 24;

const duetLayouts: Array<{
  id: DuetLayout;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { id: 'side_by_side', label: 'Side by side', icon: 'view-column' },
  { id: 'stacked', label: 'Stacked', icon: 'view-stream' },
  { id: 'picture_in_picture', label: 'Picture in picture', icon: 'picture-in-picture-alt' },
];

const getOrientationFromCamera = (orientation?: string): VideoDisplayOrientation =>
  orientation?.startsWith('landscape') ? 'landscape' : 'portrait';

const getOrientationFromSize = (width?: number | null, height?: number | null): VideoDisplayOrientation =>
  width != null && height != null && width > height ? 'landscape' : 'portrait';

const RecordContent: React.FC = ({route}:any) => {
  const { isDark, theme } = useThemeMode();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const cameraRef = React.useRef<any>(null);
  const [facing, setFacing] = React.useState<'front' | 'back'>('front');
  const [activeMode, setMode] = React.useState<'Post'| 'Live' | 'Create'>('Post');
  const [soundSelectOpen, setSoundSelectOpen] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [recordedSeconds, setRecordedSeconds] = React.useState(0);
  const [isPickingVideo, setIsPickingVideo] = React.useState(false);
  const cameraOrientationRef = React.useRef<VideoDisplayOrientation>('portrait');
  const mountedRef = React.useRef(true);
  const recordingRef = React.useRef(false);
  const countdownRunRef = React.useRef(0);
  const [sound, setSound] = React.useState<MusicTrack | null>(null);
  const selectedSoundPlaybackRef = React.useRef<PreviewSound | null>(null);
  const isDuet = route?.params?.duetDraftId != null;
  const duetSourceVideoUrl = typeof route?.params?.duetSourceVideoUrl === 'string'
    ? route.params.duetSourceVideoUrl
    : null;
  const [duetLayout, setDuetLayout] = React.useState<DuetLayout>(route?.params?.duetLayout ?? 'side_by_side');
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const [isStartingRecording, setIsStartingRecording] = React.useState(false);
  const [duetSettingsOpen, setDuetSettingsOpen] = React.useState(false);
  const [recordingToolsOpen, setRecordingToolsOpen] = React.useState(false);
  const [effectsOpen, setEffectsOpen] = React.useState(false);
  const [duetCameraPanelSize, setDuetCameraPanelSize] = React.useState({ width: 0, height: 0 });
  const duetSource = duetSourceVideoUrl
    ? {
        uri: duetSourceVideoUrl,
        useCaching: Platform.OS !== 'ios',
        contentType: /\.m3u8(?:$|[?#])/i.test(duetSourceVideoUrl) ? ('hls' as const) : ('auto' as const),
      }
    : null;
  const duetPlayer = useVideoPlayer(duetSource, (player) => {
    player.loop = false;
    player.muted = false;
    player.volume = 1;
    player.audioMixingMode = 'mixWithOthers';
    player.bufferOptions = {
      preferredForwardBufferDuration: Platform.OS === 'ios' ? 45 : 30,
      minBufferForPlayback: Platform.OS === 'ios' ? 6 : 4,
      maxBufferBytes: (Platform.OS === 'ios' ? 64 : 48) * 1024 * 1024,
      prioritizeTimeOverSizeThreshold: true,
      waitsToMinimizeStalling: true,
    };
  });
  const duetPlayerStatus = useEvent(duetPlayer, 'statusChange', { status: duetPlayer.status });
  const duetSourceMetadata = useEvent(duetPlayer, 'sourceLoad');
  const duetDurationSeconds = isDuet && Number(duetSourceMetadata?.duration) > 0
    ? Math.ceil(Number(duetSourceMetadata?.duration))
    : undefined;
  const secondsIntoProgressCycle = recordedSeconds % RECORDING_PROGRESS_CYCLE_SECONDS;
  const recordingProgress = recordedSeconds > 0 && secondsIntoProgressCycle === 0
    ? 1
    : secondsIntoProgressCycle / RECORDING_PROGRESS_CYCLE_SECONDS;
  const recordProgressOffset = RECORD_PROGRESS_CIRCUMFERENCE * (1 - recordingProgress);
  const duetStageBottom = RECORD_CONTROLS_BOTTOM_PADDING
    + (Platform.OS === 'android' ? insets.bottom : 0)
    + RECORD_BUTTON_SIZE
    + RECORD_RING_OVERHANG;
  const duetCameraPreviewSize = React.useMemo(() => {
    const { width, height } = duetCameraPanelSize;
    if (width <= 0 || height <= 0) return null;

    const portraitCameraAspectRatio = 9 / 16;
    if (width / height > portraitCameraAspectRatio) {
      return { width: height * portraitCameraAspectRatio, height };
    }
    return { width, height: width / portraitCameraAspectRatio };
  }, [duetCameraPanelSize]);
  const formatSeconds = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const updateCameraOrientation = React.useCallback((orientation: VideoDisplayOrientation) => {
    cameraOrientationRef.current = orientation;
  }, []);

  const updateDuetCameraPanelSize = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDuetCameraPanelSize((current) => (
      current.width === width && current.height === height ? current : { width, height }
    ));
  }, []);

  const pauseDuetPlayback = React.useCallback(() => {
    if (!isDuet) return;
    try {
      duetPlayer.pause();
    } catch {
      // useVideoPlayer releases its native shared object automatically. A focus
      // or recording callback can race with that release while navigating away.
    }
  }, [duetPlayer, isDuet]);

  const startDuetPlayback = React.useCallback(() => {
    if (!isDuet) return true;
    try {
      duetPlayer.currentTime = 0;
      duetPlayer.play();
      return true;
    } catch {
      return false;
    }
  }, [duetPlayer, isDuet]);

  React.useEffect(() => {
    recordingRef.current = isRecording;
  }, [isRecording]);

  useEventListener(duetPlayer, 'playToEnd', () => {
    if (!recordingRef.current) return;
    cameraRef.current?.stopRecording?.();
  });


  React.useEffect(() => {
    const routeSound = route?.params?.sound?.sound ?? route?.params?.sound;
    if (!routeSound || typeof routeSound !== 'object' || !routeSound.provider || !routeSound.external_id) return;
    setSound(routeSound as MusicTrack);
  }, [route?.params?.sound]);

  React.useEffect(() => {
    let cancelled = false;
    let loadedSound: PreviewSound | null = null;
    let downloadedSoundUri: string | null = null;

    const startSelectedSound = async () => {
      if (!sound?.stream_url || !FileSystem.cacheDirectory) return;

      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
        const token = useAuthStore.getState().token;
        const safeTrackId = String(sound.id).replace(/[^a-z0-9_-]/gi, '-');
        const previewUri = `${FileSystem.cacheDirectory}kulsah-recording-music-${safeTrackId}-${Date.now()}.mp3`;
        const download = await FileSystem.downloadAsync(sound.stream_url, previewUri, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (download.status < 200 || download.status >= 300) {
          throw new Error(`The selected sound could not be downloaded (${download.status}).`);
        }
        downloadedSoundUri = download.uri;
        const result = await Audio.Sound.createAsync(
          { uri: download.uri },
          { shouldPlay: isFocused, isLooping: true, volume: 1 },
        );
        loadedSound = result.sound;

        if (cancelled) {
          await loadedSound.unloadAsync();
          await FileSystem.deleteAsync(download.uri, { idempotent: true }).catch(() => undefined);
          return;
        }

        selectedSoundPlaybackRef.current = loadedSound;
      } catch (error: any) {
        if (!cancelled) {
          Alert.alert('Sound unavailable', error?.message || 'We could not play the selected music.');
        }
      }
    };

    void startSelectedSound();

    return () => {
      cancelled = true;
      if (selectedSoundPlaybackRef.current === loadedSound) selectedSoundPlaybackRef.current = null;
      if (loadedSound) void loadedSound.unloadAsync().catch(() => undefined);
      if (downloadedSoundUri) {
        void FileSystem.deleteAsync(downloadedSoundUri, { idempotent: true }).catch(() => undefined);
      }
    };
  }, [sound?.id, sound?.stream_url]);

  React.useEffect(() => {
    const selectedSoundPlayback = selectedSoundPlaybackRef.current;
    if (!selectedSoundPlayback) return;
    if (isFocused) {
      void selectedSoundPlayback.playAsync().catch(() => undefined);
    } else {
      void selectedSoundPlayback.pauseAsync().catch(() => undefined);
    }
  }, [isFocused, sound?.id]);

  React.useEffect(() => {
    if (!isRecording) return undefined;

    setRecordedSeconds(0);
    const interval = setInterval(() => {
      setRecordedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      countdownRunRef.current += 1;
      cameraRef.current?.stopRecording?.();
    };
  }, []);

  React.useEffect(() => {
    if (isFocused) return;
    countdownRunRef.current += 1;
    setCountdown(null);
    setIsStartingRecording(false);
    pauseDuetPlayback();
    if (isRecording) cameraRef.current?.stopRecording();
  }, [isFocused, isRecording, pauseDuetPlayback]);

  const handleSideControlPress = async (controlId: string) => {
    if (controlId === 'flip') {
      setFacing((current) => (current === 'front' ? 'back' : 'front'));
    }
  };

  const goToUploadPreview = (asset: {
    uri: string;
    name?: string | null;
    type?: string | null;
    orientation?: VideoDisplayOrientation;
  }) => {
    navigation.navigate('EditSubmission', {
      video: {
        uri: asset.uri,
        name: asset.name || `video-${Date.now()}.mp4`,
        type: asset.type || 'video/mp4',
        orientation: asset.orientation ?? cameraOrientationRef.current,
      },
      sound,
      uploadedVideoId: route?.params?.duetDraftId,
      uploadToExistingDraft: route?.params?.duetDraftId != null,
      duetSourceVideoId: route?.params?.duetSourceVideoId,
      duetSourceVideoUrl,
      duetLayout: isDuet ? duetLayout : undefined,
      challengeId: route?.params?.challengeId,
      purpose: route?.params?.purpose,
      officialSoundId: route?.params?.officialSoundId,
    });
  };

  const ensureMicrophonePermission = async () => {
    if (microphonePermission?.granted) return true;

    const nextPermission = await requestMicrophonePermission();
    if (nextPermission.granted) return true;

    Alert.alert(
      'Microphone access needed',
      'Please allow microphone access so your recording can include sound.',
    );
    return false;
  };

  const handleRecordPress = async () => {
    setDuetSettingsOpen(false);
    setRecordingToolsOpen(false);
    setEffectsOpen(false);
    if (isRecording) {
      pauseDuetPlayback();
      cameraRef.current?.stopRecording();
      return;
    }
    if (isStartingRecording) {
      countdownRunRef.current += 1;
      setCountdown(null);
      setIsStartingRecording(false);
      return;
    }

    if (!permission?.granted) {
      const nextPermission = await requestPermission();
      if (!nextPermission.granted) return;
    }

    const hasMicrophonePermission = await ensureMicrophonePermission();
    if (!hasMicrophonePermission) return;

    try {
      if (!cameraRef.current) {
        Alert.alert('Camera unavailable', 'The camera is still getting ready. Please try again.');
        return;
      }

      if (isDuet && !duetSourceVideoUrl) {
        Alert.alert('Duet unavailable', 'The original video could not be loaded. Please return to the feed and try again.');
        return;
      }
      if (isDuet && duetPlayerStatus.status === 'error') {
        Alert.alert('Duet unavailable', 'The original video failed to load. Please return to the feed and try again.');
        return;
      }
      if (isDuet && duetPlayerStatus.status !== 'readyToPlay') {
        Alert.alert('Original video loading', 'Wait a moment for the original video to finish loading, then try again.');
        return;
      }

      if (isDuet) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        setIsStartingRecording(true);
        const countdownRun = ++countdownRunRef.current;
        for (let remaining = DUET_COUNTDOWN_SECONDS; remaining > 0; remaining -= 1) {
          if (!mountedRef.current || countdownRunRef.current !== countdownRun) return;
          setCountdown(remaining);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        if (!mountedRef.current || countdownRunRef.current !== countdownRun) return;
        setCountdown(null);
        setIsStartingRecording(false);
      }

      setIsRecording(true);
      const recordingPromise = cameraRef.current.recordAsync(
        duetDurationSeconds ? { maxDuration: duetDurationSeconds } : undefined,
      );
      if (isDuet && !startDuetPlayback()) {
        cameraRef.current?.stopRecording?.();
        throw new Error('The original video player is no longer available. Please reopen the duet.');
      }
      const recording = await recordingPromise;
      pauseDuetPlayback();

      if (recording?.uri) {
        goToUploadPreview({
          uri: recording.uri,
          name: `recording-${Date.now()}.mp4`,
          type: 'video/mp4',
          orientation: cameraOrientationRef.current,
        });
      }
    } catch (error: any) {
      pauseDuetPlayback();
      if (mountedRef.current) {
        Alert.alert('Recording failed', error?.message || 'Please try recording again.');
      }
    } finally {
      if (mountedRef.current) {
        setCountdown(null);
        setIsStartingRecording(false);
        setIsRecording(false);
        setRecordedSeconds(0);
      }
    }
  };

  const handleUploadPress = async () => {
    try {
      setIsPickingVideo(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Media access needed',
          'Please allow access to your media library so you can choose a video.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      if (!asset?.uri) {
        Alert.alert('Upload failed', 'We could not read the selected video. Please try again.');
        return;
      }

      goToUploadPreview({
        uri: asset.uri,
        name: asset.fileName,
        type: asset.mimeType,
        orientation: getOrientationFromSize(asset.width, asset.height),
      });
    } catch (error: any) {
      Alert.alert('Video picker failed', error?.message || 'Please try again.');
    } finally {
      setIsPickingVideo(false);
    }
  };

  return (
    <SafeAreaView
      edges={isDuet ? ['top'] : []}
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={isDuet ? '#000' : 'transparent'}
        translucent
      />
      {!permission?.granted ? <View style= {styles.screen}>
        {!permission ? (
              <>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.permissionText}>Loading camera...</Text>
              </>
            ) :
             (
              <>
               <View style={{
                width: '100%',
                alignItems: 'center'
               }}>
                 <MaterialIcons name="photo-camera" size={40} color="#ffffff" style={{
                  marginTop: isDuet ? 8 : Platform.OS === "ios" ? 54 : insets.top,
                }} />
               </View>
                <Text style={styles.permissionTitle}>Camera access needed</Text>
                <Text style={styles.permissionText}>
                  Turn on camera permission to use live recording background.
                </Text>
                <Pressable style={styles.permissionButton} onPress={() => void requestPermission()}>
                  <Text style={styles.permissionButtonText}>Enable Camera</Text>
                </Pressable>
              </>
            )
            }
      </View> :  <View style={[styles.screen, { backgroundColor: isDuet ? '#000' : theme.screen }]}>
        {/* <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        /> */}

        {isDuet ? (
          <View style={[
            styles.duetStage,
            { bottom: duetStageBottom },
            duetLayout === 'side_by_side' && styles.duetStageSideBySide,
            duetLayout === 'stacked' && styles.duetStageStacked,
          ]}>
            <View style={[
              styles.duetSourcePanel,
              duetLayout === 'side_by_side' && styles.duetPanelSideBySide,
              duetLayout === 'stacked' && styles.duetPanelStacked,
              duetLayout === 'picture_in_picture' && styles.duetSourcePanelPip,
            ]}>
              <VideoView
                player={duetPlayer}
                style={StyleSheet.absoluteFill}
                contentFit={duetLayout === 'side_by_side' ? 'contain' : 'cover'}
                nativeControls={false}
                surfaceType="textureView"
              />
            </View>
            <View style={[
              styles.duetCameraPanel,
              duetLayout === 'side_by_side' && styles.duetPanelSideBySide,
              duetLayout === 'stacked' && styles.duetPanelStacked,
              duetLayout === 'picture_in_picture' && styles.duetCameraPanelPip,
            ]} onLayout={updateDuetCameraPanelSize}>
              {isFocused ? (
                <CameraView
                  ref={cameraRef}
                  style={duetLayout === 'side_by_side'
                    ? duetCameraPreviewSize ?? StyleSheet.absoluteFill
                    : StyleSheet.absoluteFill}
                  facing={facing}
                  mode="video"
                  mute={false}
                />
              ) : null}
            </View>
          </View>
        ) : isFocused ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} mode="video" />
        ) : null}

        <View style={[styles.topArea, { paddingTop: isDuet ? 8 : Platform.OS === 'ios' ? 54 : insets.top }]}>
          <LinearGradient
            colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0)']}
            style={styles.topFade}
          />

          <View style={styles.headerRow}>
            {!isDuet ? (
              <BlurView intensity={28} tint="dark" style={styles.iconCircle}>
                <Pressable style={styles.fillButton} onPress={() => navigation.goBack()}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </Pressable>
              </BlurView>
            ) : <View style={styles.headerIconSpacer} />}

            {!isDuet ? (
              <Pressable style={styles.soundButton} onPress={() => setSoundSelectOpen(true)}>
                <MaterialIcons name="music-note" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.soundButtonText} numberOfLines={1}>
                  {sound != null ? sound.title : 'Add Sound'}
                </Text>
              </Pressable>
            ) : <View style={styles.headerSpacer} />}

            <BlurView intensity={28} tint="dark" style={styles.iconCircle}>
              <Pressable
                disabled={isRecording || isStartingRecording}
                style={styles.fillButton}
                onPress={() => {
                  if (isDuet) {
                    setDuetSettingsOpen((open) => !open);
                  } else {
                    setRecordingToolsOpen((open) => !open);
                  }
                }}
              >
                <MaterialIcons name="settings" size={22} color="#fff" />
              </Pressable>
            </BlurView>
          </View>
          {isDuet && duetSettingsOpen ? (
            <View style={styles.duetSettingsMenu}>
              <Text style={styles.duetSettingsTitle}>Layout</Text>
              <View style={styles.layoutSelector}>
              {duetLayouts.map((layout) => {
                const selected = duetLayout === layout.id;
                return (
                  <Pressable
                    key={layout.id}
                    accessibilityRole="button"
                    accessibilityLabel={layout.label}
                    accessibilityState={{ selected, disabled: isRecording || isStartingRecording }}
                    disabled={isRecording || isStartingRecording}
                    onPress={() => {
                      setDuetLayout(layout.id);
                      setDuetSettingsOpen(false);
                    }}
                    style={[styles.layoutOption, selected && styles.layoutOptionSelected]}
                  >
                    <MaterialIcons name={layout.icon} size={20} color="#fff" />
                    <Text style={[styles.layoutOptionText, selected && styles.layoutOptionTextSelected]}>{layout.label}</Text>
                  </Pressable>
                );
              })}
              </View>
            </View>
          ) : null}
        </View>

        {!isDuet && recordingToolsOpen ? <View style={styles.sideRailWrap}>
          <BlurView intensity={24} tint="dark" style={styles.sideRail}>
            {sideControls.map((control) => (
              <Pressable
                key={control.id}
                style={styles.sideControl}
                onPress={() => void handleSideControlPress(control.id)}
              >
                <View style={styles.sideIconWrap}>
                  <MaterialIcons
                    name={control.icon}
                    size={24}
                    color={control.active ? PRIMARY_COLOR : '#fff'}
                  />
                </View>
                <Text style={[styles.sideLabel, control.active ? styles.sideLabelActive : null]}>
                  {control.label}
                </Text>
              </Pressable>
            ))}
          </BlurView>
        </View> : null}

        <View style={[
          styles.bottomArea,
          isDuet && styles.duetBottomArea,
          { paddingBottom: RECORD_CONTROLS_BOTTOM_PADDING + (Platform.OS === 'android' ? insets.bottom : 0) },
        ]}>
          {!isDuet ? <LinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.82)']}
            style={styles.bottomFade}
          /> : null}

          {!isDuet && effectsOpen ? <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {filters.map((filter) => (
              <Pressable key={filter.id} style={styles.filterItem}>
                <View style={[styles.filterThumb, filter.active ? styles.filterThumbActive : null]}>
                  <MaterialIcons
                    name="auto-awesome"
                    size={22}
                    color={filter.active ? PRIMARY_COLOR : 'rgba(255,255,255,0.72)'}
                  />
                </View>
                {filter.active ? <View style={styles.filterRing} /> : null}
                <Text style={[styles.filterText, filter.active ? styles.filterTextActive : null]}>
                  {filter.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView> : null}

          <View style={[styles.primaryActions, isDuet && styles.duetPrimaryActions]}>
            {!isDuet ? <Pressable style={styles.utilityAction} onPress={() => void handleUploadPress()} disabled={isPickingVideo}>
              <View style={styles.galleryThumbWrap}>
                <View style={styles.galleryThumb}>
                  <MaterialIcons name="video-library" size={22} color="#fff" />
                </View>
                {isPickingVideo ? (
                  <View style={styles.galleryLoadingOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.utilityLabel}>Upload</Text>
            </Pressable> : null}

            <Pressable style={styles.recordWrap} onPress={() => void handleRecordPress()}>
              <Svg
                pointerEvents="none"
                width={RECORD_PROGRESS_SIZE}
                height={RECORD_PROGRESS_SIZE}
                style={styles.recordProgressRing}
              >
                <Circle
                  cx={RECORD_PROGRESS_SIZE / 2}
                  cy={RECORD_PROGRESS_SIZE / 2}
                  r={RECORD_PROGRESS_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.42)"
                  strokeWidth={RECORD_PROGRESS_STROKE}
                />
                <Circle
                  cx={RECORD_PROGRESS_SIZE / 2}
                  cy={RECORD_PROGRESS_SIZE / 2}
                  r={RECORD_PROGRESS_RADIUS}
                  fill="none"
                  stroke={PRIMARY_COLOR}
                  strokeWidth={RECORD_PROGRESS_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${RECORD_PROGRESS_CIRCUMFERENCE} ${RECORD_PROGRESS_CIRCUMFERENCE}`}
                  strokeDashoffset={recordProgressOffset}
                  rotation={-90}
                  origin={`${RECORD_PROGRESS_SIZE / 2}, ${RECORD_PROGRESS_SIZE / 2}`}
                />
              </Svg>
              <View style={[
                styles.recordOuterRing,
                (isRecording || isStartingRecording) ? styles.recordOuterRingActive : null,
              ]}>
                <View style={[styles.recordInnerButton, (isRecording || isStartingRecording) ? styles.recordInnerButtonActive : null]} />
              </View>
              {isRecording ? <Text style={styles.recordHint}>{formatSeconds(recordedSeconds)}</Text> : null}
            </Pressable>

            {!isDuet ? <Pressable
              accessibilityRole="button"
              accessibilityLabel={effectsOpen ? 'Hide effects' : 'Show effects'}
              accessibilityState={{ expanded: effectsOpen }}
              style={styles.utilityAction}
              onPress={() => setEffectsOpen((open) => !open)}
            >
              <BlurView intensity={24} tint="dark" style={[styles.effectsCircle, effectsOpen && styles.effectsCircleActive]}>
                <MaterialIcons name="auto-fix-high" size={28} color={effectsOpen ? PRIMARY_COLOR : '#fff'} />
              </BlurView>
              <Text style={[styles.utilityLabel, effectsOpen && styles.utilityLabelActive]}>Effects</Text>
            </Pressable> : null}
          </View>

          {!isDuet ? <View style={styles.modeRow}>
            {modes.map((mode) => (
              <Pressable
              onPress= {
              ()=>{
                if(mode === 'Create'){
                  navigation.navigate('CreateContent');
                }
                else if( mode === 'Live'){
                  navigation.navigate('GoLive')
                }
                else{
                  setMode('Post')
                }
              }
              }
              key={mode} style={styles.modeButton}>
                <Text style={[styles.modeText, mode === 'Post' && activeMode === 'Post' && styles.modeTextActive]}>
                  {mode}
                </Text>
                {mode === 'Post' && activeMode === 'Post' && <View style={styles.modeUnderline} /> }
              </Pressable>
            ))}
          </View> : null}
        </View>
        {countdown != null ? (
          <View pointerEvents="none" style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        ) : null}
        <Modal
          visible={soundSelectOpen}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setSoundSelectOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setSoundSelectOpen(false)} />
          <VoteSheetContent
            sheetMode
            selectedTrackId={sound?.id}
            onSelect={setSound}
            onClose={() => setSoundSelectOpen(false)}
          />
        </Modal>
      </View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0a050c',
  },
  duetStage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  duetStageSideBySide: {
    flexDirection: 'row',
  },
  duetStageStacked: {
    flexDirection: 'column',
  },
  duetSourcePanel: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#050505',
  },
  duetPanelSideBySide: {
    flex: 0,
    width: '50%',
    height: '100%',
  },
  duetPanelStacked: {
    flex: 0,
    width: '100%',
    height: '50%',
  },
  duetSourcePanelPip: {
    ...StyleSheet.absoluteFillObject,
  },
  duetCameraPanel: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  duetCameraPanelPip: {
    position: 'absolute',
    right: 18,
    bottom: 210,
    width: '36%',
    height: '28%',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
    elevation: 8,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,5,13,0.45)',
  },
  cameraFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a050c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    color: '#fff',
    ...fontSize.b1, lineHeight: fontSize.b1.lineHeight,
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
    textAlign: 'center'
  },
  permissionText: {
    color: 'rgba(255,255,255,0.75)',
    ...fontSize.b4,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  permissionButton: {
    marginTop: 18,
    // paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '20%'
  },
  permissionButtonText: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  topArea: {
    paddingHorizontal: 16,
    // paddingTop: 8,
    paddingBottom: 12,
    zIndex: 3,
  },
  topFade: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  headerIconSpacer: {
    width: 40,
    height: 40,
  },
  headerSpacer: {
    flex: 1,
  },
  duetSettingsMenu: {
    alignSelf: 'flex-end',
    width: '100%',
    marginTop: 10,
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  duetSettingsTitle: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  layoutSelector: {
    flexDirection: 'row',
    gap: 7,
    padding: 5,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  layoutOption: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 2,
  },
  layoutOptionSelected: {
    backgroundColor: PRIMARY_COLOR,
  },
  layoutOptionText: {
    color: '#fff',
    fontSize: 9,
    lineHeight: 12,
    textAlign: 'center',
  },
  layoutOptionTextSelected: {
    color: '#fff',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  fillButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '60%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  soundButtonText: {
    color: '#fff',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
    maxWidth: '85%',
  },
  sideRailWrap: {
    position: 'absolute',
    right: 16,
    top: '15%',
    zIndex: 3,
  },
  sideRail: {
    position: 'absolute',
    right: 0,
    top: 5,
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sideControl: {
    alignItems: 'center',
    marginVertical: 6,
    width: 54,
  },
  sideIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  sideLabelActive: {
    color: PRIMARY_COLOR,
  },
  bottomArea: {
    marginTop: 'auto',
    paddingBottom: 24,
    zIndex: 3,
  },
  duetBottomArea: {
    backgroundColor: '#000',
  },
  bottomFade: {
    ...StyleSheet.absoluteFillObject,
  },
  filterScroll: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 22,
    gap: 16,
  },
  filterItem: {
    alignItems: 'center',
    width: 72,
  },
  filterThumb: {
    width: 54,
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.34)',
    opacity: 0.65,
  },
  filterThumbActive: {
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    opacity: 1,
  },
  filterRing: {
    position: 'absolute',
    top: -6,
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: primaryColorAlpha(0.18),
  },
  filterText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    ...fontSize.b4, lineHeight: fontSize.b4.lineHeight,
  },
  filterTextActive: {
    color: PRIMARY_COLOR,
  },
  primaryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 34,
  },
  duetPrimaryActions: {
    justifyContent: 'center',
  },
  utilityAction: {
    alignItems: 'center',
    width: 72,
  },
  galleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  galleryThumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  utilityLabel: {
    color: '#fff',
    ...fontSize.b5, lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  utilityLabelActive: {
    color: PRIMARY_COLOR,
  },
  recordWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  recordProgressRing: {
    position: 'absolute',
    top: -6,
    left: -6,
  },
  recordOuterRing: {
    width: 76,
    height: 76,
    borderRadius: 48,
    borderWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  recordOuterRingActive: {
    shadowColor: '#ef4444',
    shadowOpacity: 0.32,
  },
  recordInnerButton: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  recordInnerButtonActive: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  recordHint: {
    position: 'absolute',
    top: RECORD_BUTTON_SIZE + RECORD_RING_OVERHANG + 2,
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
  },
  effectsCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  effectsCircleActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: primaryColorAlpha(0.16),
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 28,
  },
  modeButton: {
    alignItems: 'center',
  },
  modeText: {
    color: 'rgba(255,255,255,0.4)',
    ...fontSize.b2, lineHeight: fontSize.b2.lineHeight,
  },
  modeTextActive: {
    color: '#fff',
  },
  modeUnderline: {
    width: '100%',
    height: 2,
    borderRadius: 999,
    backgroundColor: PRIMARY_COLOR,
    marginTop: 6,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  countdownText: {
    color: '#fff',
    fontSize: 92,
    lineHeight: 104,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
});

export default RecordContent;
