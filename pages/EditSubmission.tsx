import React, { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Poppins_500Medium } from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import { useEvent } from 'expo';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Canvas,
  Path as SkiaPath,
  RoundedRect,
  Skia,
  Text as SkiaText,
  useCanvasRef,
  useFont,
} from '@shopify/react-native-skia';
import { fontSize } from './typography';
import {
  createCreatorVideoEditsPayload,
  hasVideoOverlays,
  normalizeHexColor,
  parseApiError,
  useAuthStore,
} from '../src';
import type { GeneratedEditAsset, MusicTrack, SubmitCreatorVideoEditsPayload, VideoDisplayOrientation, VideoPurpose, VideoUploadSource } from '../src';

type EditSubmissionRouteParams = {
  video?: VideoUploadSource;
  uploadedVideoId?: string | number;
  uploadToExistingDraft?: boolean;
  duetSourceVideoId?: string | number;
  sound?: MusicTrack | null;
  challengeId?: string | number;
  purpose?: VideoPurpose;
  officialSoundId?: string | number | null;
};

type EditorTool = 'none' | 'draw' | 'text' | 'sticker' | 'image' | 'trim';

type DrawingPoint = {
  x: number;
  y: number;
};

type DrawingStroke = {
  id: string;
  color: string;
  width: number;
  start: number;
  end: number;
  points: DrawingPoint[];
};

type TextSticker = {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
  x: number;
  y: number;
  start: number;
  end: number;
  fontSize: number;
};

type TimelineSticker = {
  id: string;
  publicId: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  x: number;
  y: number;
  start: number;
  end: number;
};

type ImageOverlay = {
  id: string;
  uri: string;
  name: string;
  type: string;
  sourceWidth: number;
  sourceHeight: number;
  x: number;
  y: number;
  width: number;
  height: number;
  start: number;
  end: number;
};

type DraggableTextStickerProps = {
  sticker: TextSticker;
  editable: boolean;
  highlighted: boolean;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onPress: (id: string) => void;
};

type DrawingBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type DraggableTimelineStickerProps = {
  sticker: TimelineSticker;
  editable: boolean;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onRemove: (id: string) => void;
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
  { id: 'image', label: 'Image', icon: 'add-photo-alternate' as const },
  { id: 'sticker', label: 'Sticker', icon: 'emoji-emotions' as const },
  { id: 'trim', label: 'Trim', icon: 'content-cut' as const },
];

const STICKER_PRESETS: Array<{
  publicId: string;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}> = [
  { publicId: 'stickers/fire', label: 'Fire', icon: 'local-fire-department' },
  { publicId: 'stickers/favorite', label: 'Love', icon: 'favorite' },
  { publicId: 'stickers/star', label: 'Star', icon: 'star' },
];

const DRAW_COLORS = ['#fff', PRIMARY_COLOR, '#f97316', '#22c55e', '#38bdf8', '#f43f5e'];
const TEXT_COLORS = ['#fff', '#111827', PRIMARY_COLOR, '#f97316', '#38bdf8'];
const TEXT_BACKGROUNDS = ['transparent', 'rgba(0,0,0,0.62)', 'rgba(255,255,255,0.9)', PRIMARY_COLOR];
const RENDER_TARGET_SIZES: Record<VideoDisplayOrientation, { width: number; height: number }> = {
  portrait: { width: 720, height: 1280 },
  landscape: { width: 1280, height: 720 },
};

const getVideoRenderTransform = (
  preview: { width: number; height: number },
  output: { width: number; height: number },
) => {
  const landscape = output.width > output.height;
  const displayScale = landscape
    ? Math.min(preview.width / output.width, preview.height / output.height)
    : Math.max(preview.width / output.width, preview.height / output.height);
  const safeScale = Math.max(displayScale, 0.0001);
  const offsetX = (preview.width - output.width * safeScale) / 2;
  const offsetY = (preview.height - output.height * safeScale) / 2;
  return { scale: 1 / safeScale, translateX: -offsetX / safeScale, translateY: -offsetY / safeScale };
};

const getVideoPreviewBounds = (
  preview: { width: number; height: number },
  output: { width: number; height: number },
): DrawingBounds => {
  if (!preview.width || !preview.height || !output.width || !output.height) {
    return { left: 0, top: 0, right: preview.width, bottom: preview.height };
  }

  const landscape = output.width > output.height;
  const scale = landscape
    ? Math.min(preview.width / output.width, preview.height / output.height)
    : Math.max(preview.width / output.width, preview.height / output.height);
  const renderedWidth = output.width * scale;
  const renderedHeight = output.height * scale;
  const offsetX = (preview.width - renderedWidth) / 2;
  const offsetY = (preview.height - renderedHeight) / 2;

  return {
    left: Math.max(0, offsetX),
    top: Math.max(0, offsetY),
    right: Math.min(preview.width, offsetX + renderedWidth),
    bottom: Math.min(preview.height, offsetY + renderedHeight),
  };
};

const getTextStickerLayout = (sticker: TextSticker) => {
  const previewFontSize = Math.max(16, sticker.fontSize * 0.42);
  return {
    fontSize: previewFontSize,
    width: Math.min(260, Math.max(48, sticker.text.length * previewFontSize * 0.62 + 24)),
    height: previewFontSize * 1.35 + 16,
  };
};

const getDrawingBounds = (strokes: DrawingStroke[]): DrawingBounds | null => {
  const visibleStrokes = strokes.filter((stroke) => stroke.points.length > 0);
  if (!visibleStrokes.length) return null;

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  visibleStrokes.forEach((stroke) => {
    stroke.points.forEach((point) => {
      left = Math.min(left, point.x);
      top = Math.min(top, point.y);
      right = Math.max(right, point.x);
      bottom = Math.max(bottom, point.y);
    });
  });

  return { left, top, right, bottom };
};

const SkiaStroke: React.FC<{
  stroke: DrawingStroke;
  scaleX?: number;
  scaleY?: number;
  translateX?: number;
  translateY?: number;
}> = ({ stroke, scaleX = 1, scaleY = 1, translateX = 0, translateY = 0 }) => {
  const path = React.useMemo(() => {
    const nextPath = Skia.Path.Make();
    stroke.points.forEach((point, index) => {
      const x = point.x * scaleX + translateX;
      const y = point.y * scaleY + translateY;
      if (index === 0) nextPath.moveTo(x, y);
      else nextPath.lineTo(x, y);
    });
    return nextPath;
  }, [scaleX, scaleY, stroke.points, translateX, translateY]);

  if (!stroke.points.length) return null;

  return (
    <SkiaPath
      path={path}
      color={stroke.color}
      style="stroke"
      strokeWidth={stroke.width * Math.min(scaleX, scaleY)}
      strokeCap="round"
      strokeJoin="round"
    />
  );
};

const SkiaTextSticker: React.FC<{ sticker: TextSticker }> = ({ sticker }) => {
  const layout = getTextStickerLayout(sticker);
  const font = useFont(Poppins_500Medium, layout.fontSize);

  if (!font) return null;

  return (
    <>
      {sticker.backgroundColor !== 'transparent' ? (
        <RoundedRect
          x={sticker.x}
          y={sticker.y}
          width={layout.width}
          height={layout.height}
          r={12}
          color={sticker.backgroundColor}
        />
      ) : null}
      <SkiaText
        x={sticker.x + 12}
        y={sticker.y + 8 + layout.fontSize}
        text={sticker.text}
        font={font}
        color={sticker.color}
      />
    </>
  );
};

const DraggableTextSticker: React.FC<DraggableTextStickerProps> = ({
  sticker,
  editable,
  highlighted,
  onMove,
  onPress,
}) => {
  const layout = getTextStickerLayout(sticker);
  const lastDeltaRef = React.useRef({ x: 0, y: 0 });
  const onMoveRef = React.useRef(onMove);
  const onPressRef = React.useRef(onPress);
  onMoveRef.current = onMove;
  onPressRef.current = onPress;
  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => editable,
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          editable && (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3),
        onPanResponderGrant: () => {
          lastDeltaRef.current = { x: 0, y: 0 };
        },
        onPanResponderMove: (_event, gestureState) => {
          const deltaX = gestureState.dx - lastDeltaRef.current.x;
          const deltaY = gestureState.dy - lastDeltaRef.current.y;
          lastDeltaRef.current = { x: gestureState.dx, y: gestureState.dy };
          onMoveRef.current(sticker.id, deltaX, deltaY);
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (Math.abs(gestureState.dx) < 3 && Math.abs(gestureState.dy) < 3) {
            onPressRef.current(sticker.id);
          }
          lastDeltaRef.current = { x: 0, y: 0 };
        },
        onPanResponderTerminate: () => {
          lastDeltaRef.current = { x: 0, y: 0 };
        },
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
      }),
    [editable, sticker.id],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.textSticker,
        {
          left: sticker.x,
          top: sticker.y,
          width: layout.width,
          height: layout.height,
          borderColor: highlighted ? 'rgba(255,255,255,0.52)' : 'transparent',
        },
      ]}
    />
  );
};

const DraggableDrawingOverlay: React.FC<{
  bounds: DrawingBounds;
  editable: boolean;
  highlighted: boolean;
  onMove: (deltaX: number, deltaY: number) => void;
}> = ({ bounds, editable, highlighted, onMove }) => {
  const handlePadding = 12;
  const lastDeltaRef = React.useRef({ x: 0, y: 0 });
  const onMoveRef = React.useRef(onMove);
  onMoveRef.current = onMove;
  const panResponder = React.useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => editable,
      onMoveShouldSetPanResponder: (_event, gesture) =>
        editable && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
      onPanResponderGrant: () => {
        lastDeltaRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_event, gesture) => {
        const deltaX = gesture.dx - lastDeltaRef.current.x;
        const deltaY = gesture.dy - lastDeltaRef.current.y;
        lastDeltaRef.current = { x: gesture.dx, y: gesture.dy };
        onMoveRef.current(deltaX, deltaY);
      },
      onPanResponderRelease: () => {
        lastDeltaRef.current = { x: 0, y: 0 };
      },
      onPanResponderTerminate: () => {
        lastDeltaRef.current = { x: 0, y: 0 };
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
    [editable],
  );

  return (
    <View
      {...panResponder.panHandlers}
      pointerEvents={editable ? 'auto' : 'none'}
      style={[
        styles.draggableDrawing,
        {
          left: bounds.left - handlePadding,
          top: bounds.top - handlePadding,
          width: Math.max(handlePadding * 2, bounds.right - bounds.left + handlePadding * 2),
          height: Math.max(handlePadding * 2, bounds.bottom - bounds.top + handlePadding * 2),
          borderColor: highlighted ? 'rgba(255,255,255,0.55)' : 'transparent',
        },
      ]}
    >
      {highlighted ? (
        <View style={styles.drawingMoveBadge}>
          <MaterialIcons name="open-with" size={16} color="#fff" />
        </View>
      ) : null}
    </View>
  );
};

const DraggableTimelineSticker: React.FC<DraggableTimelineStickerProps> = ({ sticker, editable, onMove, onRemove }) => {
  const lastDeltaRef = React.useRef({ x: 0, y: 0 });
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editable,
    onMoveShouldSetPanResponder: (_event, gesture) => editable && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
    onPanResponderGrant: () => { lastDeltaRef.current = { x: 0, y: 0 }; },
    onPanResponderMove: (_event, gesture) => {
      const deltaX = gesture.dx - lastDeltaRef.current.x;
      const deltaY = gesture.dy - lastDeltaRef.current.y;
      lastDeltaRef.current = { x: gesture.dx, y: gesture.dy };
      onMove(sticker.id, deltaX, deltaY);
    },
    onPanResponderRelease: () => { lastDeltaRef.current = { x: 0, y: 0 }; },
  }), [editable, onMove, sticker.id]);

  return (
    <Pressable
      {...panResponder.panHandlers}
      onLongPress={() => editable && onRemove(sticker.id)}
      style={[styles.timelineSticker, { left: sticker.x, top: sticker.y }, editable && styles.timelineStickerEditable]}
    >
      <MaterialIcons name={sticker.icon} size={48} color="#fff" />
    </Pressable>
  );
};

const DraggableImageOverlay: React.FC<{
  overlay: ImageOverlay;
  editable: boolean;
  highlighted: boolean;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onRemove: (id: string) => void;
}> = ({ overlay, editable, highlighted, onMove, onRemove }) => {
  const lastDeltaRef = React.useRef({ x: 0, y: 0 });
  const onMoveRef = React.useRef(onMove);
  onMoveRef.current = onMove;
  const panResponder = React.useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) =>
      editable && (Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3),
    onPanResponderGrant: () => { lastDeltaRef.current = { x: 0, y: 0 }; },
    onPanResponderMove: (_event, gesture) => {
      const deltaX = gesture.dx - lastDeltaRef.current.x;
      const deltaY = gesture.dy - lastDeltaRef.current.y;
      lastDeltaRef.current = { x: gesture.dx, y: gesture.dy };
      onMoveRef.current(overlay.id, deltaX, deltaY);
    },
    onPanResponderRelease: () => { lastDeltaRef.current = { x: 0, y: 0 }; },
    onPanResponderTerminate: () => { lastDeltaRef.current = { x: 0, y: 0 }; },
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
  }), [editable, overlay.id]);

  return (
    <View
      {...panResponder.panHandlers}
      pointerEvents={editable ? 'auto' : 'none'}
      style={[
        styles.imageOverlay,
        {
          left: overlay.x,
          top: overlay.y,
          width: overlay.width,
          height: overlay.height,
          borderColor: highlighted ? '#fff' : 'transparent',
        },
      ]}
    >
      <Image source={{ uri: overlay.uri }} resizeMode="contain" style={styles.imageOverlayMedia} />
      {highlighted ? (
        <Pressable style={styles.imageRemoveButton} onPress={() => onRemove(overlay.id)}>
          <MaterialIcons name="close" size={16} color="#fff" />
        </Pressable>
      ) : null}
    </View>
  );
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
  const uploadedVideoId = params.uploadedVideoId;
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTool, setActiveTool] = useState<EditorTool>('none');
  const [drawingMode, setDrawingMode] = useState<'draw' | 'move'>('draw');
  const [drawingColor, setDrawingColor] = useState(PRIMARY_COLOR);
  const [drawingWidth, setDrawingWidth] = useState(5);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [textStickers, setTextStickers] = useState<TextSticker[]>([]);
  const [timelineStickers, setTimelineStickers] = useState<TimelineSticker[]>([]);
  const [imageOverlays, setImageOverlays] = useState<ImageOverlay[]>([]);
  const [textComposerVisible, setTextComposerVisible] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState('#fff');
  const [composerBackground, setComposerBackground] = useState('rgba(0,0,0,0.62)');
  const [composerFontSize, setComposerFontSize] = useState(48);
  const [composerStart, setComposerStart] = useState('0');
  const [composerEnd, setComposerEnd] = useState('5');
  const [drawingStart, setDrawingStart] = useState('0');
  const [drawingEnd, setDrawingEnd] = useState('5');
  const [stickerStart, setStickerStart] = useState('0');
  const [stickerEnd, setStickerEnd] = useState('5');
  const [trimEnabled, setTrimEnabled] = useState(false);
  const [trimStart, setTrimStart] = useState('0');
  const [trimEnd, setTrimEnd] = useState('15');
  const [videoDuration, setVideoDuration] = useState(0);
  const [editorCanvasSize, setEditorCanvasSize] = useState({ width: 0, height: 0 });
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const loadedPreviewUriRef = React.useRef<string | null>(null);
  const playbackStateRef = React.useRef<boolean | null>(null);
  const drawingExportRef = useCanvasRef();
  const textExportFont = useFont(Poppins_500Medium, 48);
  const stickerExportFont = useFont(MaterialIcons.font.material, 48);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.keepScreenOnWhilePlaying = false;
    instance.timeUpdateEventInterval = 0.5;
  });
  const loadedMetadata = useEvent(player, 'sourceLoad');

  const routeOrientation = video?.orientation ?? null;
  const previewOrientation = routeOrientation ?? 'portrait';
  const isLandscapePreview = previewOrientation === 'landscape';
  const renderTargetSize = RENDER_TARGET_SIZES[previewOrientation];
  const drawingRenderTransform = getVideoRenderTransform(editorCanvasSize, renderTargetSize);
  const videoPreviewBounds = getVideoPreviewBounds(editorCanvasSize, renderTargetSize);
  const drawingBounds = React.useMemo(() => getDrawingBounds(strokes), [strokes]);
  const shouldRenderVideo = Boolean(videoUri && isFocused);
  const nextButtonLabel = isRenderingVideo ? 'Preparing edits' : 'Next';

  React.useEffect(() => {
    const nextDuration = Number(loadedMetadata?.duration ?? player.duration ?? 0);
    if (!Number.isFinite(nextDuration) || nextDuration <= 0) return;

    const roundedDuration = Math.round(nextDuration * 100) / 100;
    const durationText = String(roundedDuration);
    setVideoDuration(roundedDuration);
    setComposerStart('0');
    setComposerEnd(durationText);
    setDrawingStart('0');
    setDrawingEnd(durationText);
    setStickerStart('0');
    setStickerEnd(durationText);
    setTrimEnd(durationText);
    setStrokes((current) => current.map((stroke) => ({ ...stroke, start: 0, end: roundedDuration })));
    setTextStickers((current) => current.map((sticker) => ({ ...sticker, start: 0, end: roundedDuration })));
    setTimelineStickers((current) => current.map((sticker) => ({ ...sticker, start: 0, end: roundedDuration })));
  }, [loadedMetadata, player]);

  const pausePreview = React.useCallback(() => {
    try {
      player.pause();
    } catch {}
    setIsPlaying(false);
  }, [player]);

  const playPreview = React.useCallback(() => {
    if (!videoUri) return;
    setIsPlaying(true);
  }, [videoUri]);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {}
        playbackStateRef.current = null;
      };
    }, [player]),
  );

  React.useEffect(() => {
    let cancelled = false;
    const shouldPlay = Boolean(videoUri && isFocused && isPlaying);

    if (playbackStateRef.current === shouldPlay && loadedPreviewUriRef.current === videoUri) return;
    playbackStateRef.current = shouldPlay;

    const syncPlayback = async () => {
      try {
        if (!videoUri || !shouldPlay) {
          player.pause();
          return;
        }

        if (loadedPreviewUriRef.current !== videoUri) {
          await player.replaceAsync(videoUri);
          if (cancelled) return;
          loadedPreviewUriRef.current = videoUri;
        }

        player.muted = isMuted;
        player.play();
      } catch (error: any) {
        if (!cancelled) {
          setIsPlaying(false);
          Alert.alert('Preview unavailable', error?.message || 'We could not play this video preview.');
        }
      }
    };

    void syncPlayback();

    return () => {
      cancelled = true;
    };
  }, [isFocused, isMuted, isPlaying, player, videoUri]);

  React.useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  const drawingResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => activeTool === 'draw' && drawingMode === 'draw',
        onMoveShouldSetPanResponder: () => activeTool === 'draw' && drawingMode === 'draw',
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const x = Math.max(videoPreviewBounds.left, Math.min(videoPreviewBounds.right, locationX));
          const y = Math.max(videoPreviewBounds.top, Math.min(videoPreviewBounds.bottom, locationY));
          const overlayEnd = videoDuration || Math.max(0.1, Number(player.duration) || 5);
          const stroke: DrawingStroke = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            color: drawingColor,
            width: drawingWidth,
            start: 0,
            end: overlayEnd,
            points: [{ x, y }],
          };
          setStrokes((current) => [...current, stroke]);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const x = Math.max(videoPreviewBounds.left, Math.min(videoPreviewBounds.right, locationX));
          const y = Math.max(videoPreviewBounds.top, Math.min(videoPreviewBounds.bottom, locationY));
          setStrokes((current) => {
            const lastStroke = current[current.length - 1];
            if (!lastStroke) return current;

            return [
              ...current.slice(0, -1),
              {
                ...lastStroke,
                points: [...lastStroke.points, { x, y }],
              },
            ];
          });
        },
      }),
    [
      activeTool,
      drawingColor,
      drawingMode,
      drawingWidth,
      player,
      videoDuration,
      videoPreviewBounds.bottom,
      videoPreviewBounds.left,
      videoPreviewBounds.right,
      videoPreviewBounds.top,
    ],
  );

  const moveDrawing = React.useCallback((deltaX: number, deltaY: number) => {
    setStrokes((current) => {
      const bounds = getDrawingBounds(current);
      if (!bounds) return current;

      const appliedDeltaX = Math.max(
        videoPreviewBounds.left - bounds.left,
        Math.min(videoPreviewBounds.right - bounds.right, deltaX),
      );
      const appliedDeltaY = Math.max(
        videoPreviewBounds.top - bounds.top,
        Math.min(videoPreviewBounds.bottom - bounds.bottom, deltaY),
      );

      if (appliedDeltaX === 0 && appliedDeltaY === 0) return current;
      return current.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({
          x: point.x + appliedDeltaX,
          y: point.y + appliedDeltaY,
        })),
      }));
    });
  }, [videoPreviewBounds.bottom, videoPreviewBounds.left, videoPreviewBounds.right, videoPreviewBounds.top]);

  const moveTextSticker = React.useCallback((id: string, deltaX: number, deltaY: number) => {
    setTextStickers((current) =>
      current.map((sticker) => {
        if (sticker.id !== id) return sticker;
        const layout = getTextStickerLayout(sticker);
        return {
          ...sticker,
          x: Math.max(videoPreviewBounds.left, Math.min(videoPreviewBounds.right - layout.width, sticker.x + deltaX)),
          y: Math.max(videoPreviewBounds.top, Math.min(videoPreviewBounds.bottom - layout.height, sticker.y + deltaY)),
        };
      }),
    );
  }, [videoPreviewBounds.bottom, videoPreviewBounds.left, videoPreviewBounds.right, videoPreviewBounds.top]);

  const moveTimelineSticker = React.useCallback((id: string, deltaX: number, deltaY: number) => {
    setTimelineStickers((current) => current.map((sticker) => sticker.id === id
      ? {
          ...sticker,
          x: Math.max(0, Math.min(Math.max(0, editorCanvasSize.width - 58), sticker.x + deltaX)),
          y: Math.max(0, Math.min(Math.max(0, editorCanvasSize.height - 58), sticker.y + deltaY)),
        }
      : sticker));
  }, [editorCanvasSize.height, editorCanvasSize.width]);

  const moveImageOverlay = React.useCallback((id: string, deltaX: number, deltaY: number) => {
    setImageOverlays((current) => current.map((overlay) => overlay.id === id
      ? {
          ...overlay,
          x: Math.max(videoPreviewBounds.left, Math.min(videoPreviewBounds.right - overlay.width, overlay.x + deltaX)),
          y: Math.max(videoPreviewBounds.top, Math.min(videoPreviewBounds.bottom - overlay.height, overlay.y + deltaY)),
        }
      : overlay));
  }, [videoPreviewBounds.bottom, videoPreviewBounds.left, videoPreviewBounds.right, videoPreviewBounds.top]);

  const editTextSticker = React.useCallback(
    (id: string) => {
      if (activeTool !== 'text') return;

      const sticker = textStickers.find((item) => item.id === id);
      if (!sticker) return;

      setComposerText(sticker.text);
      setComposerColor(sticker.color);
      setComposerBackground(sticker.backgroundColor);
      setComposerFontSize(sticker.fontSize);
      setComposerStart(String(sticker.start));
      setComposerEnd(String(sticker.end));
      setTextStickers((current) => current.filter((item) => item.id !== id));
      setTextComposerVisible(true);
    },
    [activeTool, textStickers],
  );

  const handleTogglePlayback = () => {
    if (!videoUri) return;

    if (isPlaying) {
      pausePreview();
      return;
    }

    playPreview();
  };

  const pickImageOverlay = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access required', 'Allow photo access to add a picture over your video.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const sourceWidth = Math.max(1, asset.width || 1);
    const sourceHeight = Math.max(1, asset.height || 1);
    const availableWidth = Math.max(80, videoPreviewBounds.right - videoPreviewBounds.left);
    const availableHeight = Math.max(80, videoPreviewBounds.bottom - videoPreviewBounds.top);
    const scale = Math.min((availableWidth * 0.45) / sourceWidth, (availableHeight * 0.35) / sourceHeight);
    const width = Math.max(1, sourceWidth * scale);
    const height = Math.max(1, sourceHeight * scale);
    const overlayEnd = videoDuration || Math.max(0.1, Number(player.duration) || 5);

    setImageOverlays((current) => [...current, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      uri: asset.uri,
      name: asset.fileName ?? `image-overlay-${current.length + 1}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
      sourceWidth,
      sourceHeight,
      x: videoPreviewBounds.left + Math.max(0, (availableWidth - width) / 2),
      y: videoPreviewBounds.top + Math.max(0, (availableHeight - height) / 2),
      width: Math.min(width, availableWidth),
      height: Math.min(height, availableHeight),
      start: 0,
      end: overlayEnd,
    }]);
    setActiveTool('image');
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'text') {
      setActiveTool('text');
      setComposerText('');
      setComposerColor('#fff');
      setComposerBackground('rgba(0,0,0,0.62)');
      setComposerFontSize(48);
      setComposerStart('0');
      setComposerEnd(String(videoDuration || Math.max(0.1, Number(player.duration) || 5)));
      setTextComposerVisible(true);
      return;
    }

    if (actionId === 'sticker' || actionId === 'trim') {
      setActiveTool((current) => current === actionId ? 'none' : actionId);
      return;
    }

    if (actionId === 'image') {
      void pickImageOverlay();
      return;
    }

    setActiveTool((current) => {
      if (current === 'draw') return 'none';
      setDrawingMode('draw');
      return 'draw';
    });
  };

  const addSticker = (preset: (typeof STICKER_PRESETS)[number]) => {
    const overlayEnd = videoDuration || Math.max(0.1, Number(player.duration) || 5);
    setTimelineStickers((current) => [
      ...current,
      {
        id: `${Date.now()}-${preset.publicId}`,
        publicId: preset.publicId,
        icon: preset.icon,
        x: Math.max(24, editorCanvasSize.width / 2 - 28),
        y: Math.max(100, editorCanvasSize.height / 2 - 28),
        start: 0,
        end: overlayEnd,
      },
    ]);
  };

  const addTextSticker = () => {
    const trimmedText = composerText.trim();
    if (!trimmedText) {
      setTextComposerVisible(false);
      return;
    }

    setTextStickers((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: trimmedText,
        color: composerColor,
        backgroundColor: composerBackground,
        start: 0,
        end: videoDuration || Math.max(0.1, Number(player.duration) || 5),
        fontSize: composerFontSize,
        x: 72,
        y: 260,
      },
    ]);
    setComposerText('');
    setTextComposerVisible(false);
    setActiveTool('text');
  };

  const undoEditorAction = () => {
    if (activeTool === 'draw' && strokes.length > 0) {
      setStrokes((current) => current.slice(0, -1));
      return;
    }

    if (activeTool === 'text' && textStickers.length > 0) {
      setTextStickers((current) => current.slice(0, -1));
      return;
    }

    if (activeTool === 'sticker' && timelineStickers.length > 0) {
      setTimelineStickers((current) => current.slice(0, -1));
      return;
    }

    if (activeTool === 'image' && imageOverlays.length > 0) {
      setImageOverlays((current) => current.slice(0, -1));
    }
  };

  const exportDrawingFiles = async (): Promise<VideoUploadSource[]> => {
    if (!strokes.some((stroke) => stroke.points.length > 0)) return [];
    if (!FileSystem.cacheDirectory) {
      throw new Error('Drawing export cache is not available on this device.');
    }

    const exporter = drawingExportRef.current;
    if (!exporter?.makeImageSnapshotAsync) {
      throw new Error('Drawing export is not available on this device.');
    }

    const snapshot = await exporter.makeImageSnapshotAsync();
    const base64 = snapshot.encodeToBase64();

    const uri = `${FileSystem.cacheDirectory}kulsah-drawing-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return [{
        uri,
        name: 'drawing-0.png',
        type: 'image/png',
      }];
  };

  const exportTextAssets = async (stickers: TextSticker[]): Promise<GeneratedEditAsset[]> => {
    if (!stickers.length) return [];
    if (!FileSystem.cacheDirectory || !textExportFont?.getTypeface()) {
      throw new Error('Text overlay export is not available on this device.');
    }

    const typeface = textExportFont.getTypeface();
    if (!typeface) throw new Error('The Poppins overlay font is not ready.');

    return Promise.all(stickers.map(async (sticker, index) => {
      const fontSize = Math.max(16, sticker.fontSize * 0.42);
      const font = Skia.Font(typeface, fontSize);
      const bounds = font.measureText(sticker.text);
      const metrics = font.getMetrics();
      const paddingX = 12;
      const paddingY = 8;
      const width = Math.max(1, Math.ceil(bounds.width + paddingX * 2));
      const height = Math.max(1, Math.ceil(metrics.descent - metrics.ascent + paddingY * 2));
      const surface = Skia.Surface.MakeOffscreen(width, height);
      if (!surface) throw new Error(`Could not create the Skia surface for text overlay ${index + 1}.`);

      const canvas = surface.getCanvas();
      if (sticker.backgroundColor !== 'transparent') {
        const backgroundPaint = Skia.Paint();
        backgroundPaint.setColor(Skia.Color(sticker.backgroundColor));
        canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, width, height), 12, 12), backgroundPaint);
      }

      const textPaint = Skia.Paint();
      textPaint.setColor(Skia.Color(normalizeHexColor(sticker.color, '#FFFFFF')));
      canvas.drawText(sticker.text, paddingX - bounds.x, paddingY - metrics.ascent, textPaint, font);
      surface.flush();
      const image = surface.makeImageSnapshot();
      const uri = `${FileSystem.cacheDirectory}kulsah-text-${Date.now()}-${index}.png`;
      await FileSystem.writeAsStringAsync(uri, image.encodeToBase64(), {
        encoding: FileSystem.EncodingType.Base64,
      });

      return {
        id: `text-asset-${sticker.id}`,
        sourceId: sticker.id,
        kind: 'text' as const,
        file: { uri, name: `text-overlay-${index + 1}.png`, type: 'image/png' },
        width,
        height,
      };
    }));
  };

  const exportStickerAssets = async (stickers: TimelineSticker[]): Promise<GeneratedEditAsset[]> => {
    if (!stickers.length) return [];
    if (!FileSystem.cacheDirectory || !stickerExportFont?.getTypeface()) {
      throw new Error('Sticker export is not available on this device.');
    }

    const typeface = stickerExportFont.getTypeface();
    if (!typeface) throw new Error('The sticker font is not ready.');

    return Promise.all(stickers.map(async (sticker, index) => {
      const size = 58;
      const font = Skia.Font(typeface, 48);
      const glyph = String.fromCodePoint(Number(MaterialIcons.glyphMap[sticker.icon]));
      const bounds = font.measureText(glyph);
      const metrics = font.getMetrics();
      const surface = Skia.Surface.MakeOffscreen(size, size);
      if (!surface) throw new Error(`Could not create the Skia surface for sticker ${index + 1}.`);

      const canvas = surface.getCanvas();
      const backgroundPaint = Skia.Paint();
      backgroundPaint.setColor(Skia.Color('rgba(0,0,0,0.18)'));
      canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(0, 0, size, size), 16, 16), backgroundPaint);
      const iconPaint = Skia.Paint();
      iconPaint.setColor(Skia.Color('#FFFFFF'));
      canvas.drawText(
        glyph,
        (size - bounds.width) / 2 - bounds.x,
        (size - (metrics.descent - metrics.ascent)) / 2 - metrics.ascent,
        iconPaint,
        font,
      );
      surface.flush();
      const uri = `${FileSystem.cacheDirectory}kulsah-sticker-${Date.now()}-${index}.png`;
      await FileSystem.writeAsStringAsync(uri, surface.makeImageSnapshot().encodeToBase64(), {
        encoding: FileSystem.EncodingType.Base64,
      });
      return {
        id: `sticker-asset-${sticker.id}`,
        sourceId: sticker.id,
        kind: 'sticker' as const,
        file: { uri, name: `sticker-overlay-${index + 1}.png`, type: 'image/png' },
        width: size,
        height: size,
      };
    }));
  };

  const exportMusicAsset = async (track: MusicTrack | null | undefined): Promise<GeneratedEditAsset[]> => {
    if (!track) return [];
    if (!track.stream_url) throw new Error('The selected sound does not have an available audio stream.');
    if (!FileSystem.cacheDirectory) throw new Error('Music export cache is not available on this device.');

    const uri = `${FileSystem.cacheDirectory}kulsah-music-${Date.now()}.mp3`;
    const token = useAuthStore.getState().token;
    const result = await FileSystem.downloadAsync(track.stream_url, uri, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error(`The selected sound could not be downloaded (${result.status}).`);
    }

    return [{
      id: `audio-asset-${track.id}`,
      sourceId: `music-${track.id}`,
      kind: 'audio',
      file: { uri: result.uri, name: 'selected-music.mp3', type: 'audio/mpeg' },
      width: 0,
      height: 0,
    }];
  };

  const handleNext = async () => {
    if (!video) {
      Alert.alert('No video selected', 'Record or choose a video before continuing.');
      return;
    }

    let editPayload: SubmitCreatorVideoEditsPayload | null = null;

    try {
      if (trimEnabled && (Number(trimEnd) || 0) <= (Number(trimStart) || 0)) {
        Alert.alert('Invalid trim', 'Trim end must be after trim start.');
        return;
      }

      setIsRenderingVideo(true);
      const fullVideoDuration = videoDuration || Number(player.duration) || 0;
      const textAssets = await exportTextAssets(textStickers);
      const stickerAssets = await exportStickerAssets(timelineStickers);
      const drawingFiles = await exportDrawingFiles();
      const drawingAssets: GeneratedEditAsset[] = drawingFiles.map((file, index) => ({
        id: `drawing-asset-${Date.now()}-${index}`,
        sourceId: 'drawing',
        kind: 'drawing',
        file,
        width: renderTargetSize.width,
        height: renderTargetSize.height,
      }));
      const imageAssets: GeneratedEditAsset[] = imageOverlays.map((overlay) => ({
        id: `image-asset-${overlay.id}`,
        sourceId: overlay.id,
        kind: 'image',
        file: { uri: overlay.uri, name: overlay.name, type: overlay.type },
        width: overlay.sourceWidth,
        height: overlay.sourceHeight,
      }));
      const musicAssets = await exportMusicAsset(params.sound);
      const generatedAssets = [...textAssets, ...stickerAssets, ...drawingAssets, ...imageAssets, ...musicAssets];
      const assetFiles = generatedAssets.map((asset) => asset.file);
      const durationBoundStrokes = fullVideoDuration > 0
        ? strokes.map((stroke) => ({ ...stroke, start: 0, end: fullVideoDuration }))
        : strokes;
      const durationBoundText = fullVideoDuration > 0
        ? textStickers.map((sticker) => ({ ...sticker, start: 0, end: fullVideoDuration }))
        : textStickers;
      const durationBoundStickers = fullVideoDuration > 0
        ? timelineStickers.map((sticker) => ({ ...sticker, start: 0, end: fullVideoDuration }))
        : timelineStickers;
      const durationBoundImages = fullVideoDuration > 0
        ? imageOverlays.map((overlay) => ({ ...overlay, start: 0, end: fullVideoDuration }))
        : imageOverlays;

      if (hasVideoOverlays(strokes, textStickers) || timelineStickers.length > 0 || imageOverlays.length > 0 || params.sound || trimEnabled) {
        editPayload = createCreatorVideoEditsPayload({
          orientation: previewOrientation,
          canvasSize: editorCanvasSize,
          strokes: durationBoundStrokes,
          textStickers: durationBoundText,
          stickers: durationBoundStickers,
          imageOverlays: durationBoundImages,
          audioTrack: params.sound && musicAssets[0]
            ? {
                id: `music-${params.sound.id}`,
                duration: Math.max(0.1, fullVideoDuration || params.sound.duration || 5),
                volume: 1,
              }
            : null,
          trim: trimEnabled
            ? {
                start: Math.max(0, Number(trimStart) || 0),
                end: Math.max(0.1, Number(trimEnd) || 0),
              }
            : null,
          drawingFiles,
          generatedAssets,
        });
      }

      if (editPayload) editPayload = { ...editPayload, assetFiles };

      navigation.replace('SubmitEntry', {
        video: {
          ...video,
          orientation: previewOrientation,
        },
        uploadedVideoId,
        autoStartUpload: uploadedVideoId == null,
        uploadToExistingDraft: params.uploadToExistingDraft,
        duetSourceVideoId: params.duetSourceVideoId,
        editPayload,
        sound: params.sound ?? null,
        orientation: previewOrientation,
        challengeId: params.challengeId,
        purpose: params.purpose,
        officialSoundId: params.officialSoundId,
      });
    } catch (caughtError) {
      const parsed = parseApiError(caughtError);
      Alert.alert(parsed.title || 'Edit export failed', parsed.message || 'We could not prepare your video edits.');
      return;
    } finally {
      setIsRenderingVideo(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#000' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

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
            {/* <Text style={styles.headerTitle}>Edit Submission</Text> */}
          </View>
        </View>

        <Pressable style={styles.videoTapLayer} onPress={handleTogglePlayback}>
          {!isPlaying ? (
            <View style={styles.playButton}>
              <MaterialIcons name="play-arrow" size={54} color="#fff" />
            </View>
          ) : null}
        </Pressable>

        <View
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setEditorCanvasSize((current) =>
              current.width === width && current.height === height ? current : { width, height },
            );
          }}
          pointerEvents="none"
          style={styles.drawingLayer}
        >
          <Canvas style={StyleSheet.absoluteFill}>
            {strokes.map((stroke) => (
              <SkiaStroke
                key={stroke.id}
                stroke={stroke}
              />
            ))}
            {textStickers.map((sticker) => (
              <SkiaTextSticker key={`skia-text-${sticker.id}`} sticker={sticker} />
            ))}
          </Canvas>
        </View>

        <View
          {...drawingResponder.panHandlers}
          pointerEvents={activeTool === 'draw' && drawingMode === 'draw' ? 'auto' : 'none'}
          style={styles.drawingGestureLayer}
        />

        <View
          pointerEvents={activeTool === 'draw' && drawingMode === 'draw' ? 'none' : 'box-none'}
          style={styles.stickerLayer}
        >
          {drawingBounds ? (
            <DraggableDrawingOverlay
              bounds={drawingBounds}
              editable={activeTool === 'none' || (activeTool === 'draw' && drawingMode === 'move')}
              highlighted={activeTool === 'draw' && drawingMode === 'move'}
              onMove={moveDrawing}
            />
          ) : null}
          {textStickers.map((sticker) => (
            <DraggableTextSticker
              key={sticker.id}
              sticker={sticker}
              editable={activeTool === 'text' || activeTool === 'none'}
              highlighted={activeTool === 'text'}
              onMove={moveTextSticker}
              onPress={editTextSticker}
            />
          ))}
          {timelineStickers.map((sticker) => (
            <DraggableTimelineSticker
              key={sticker.id}
              sticker={sticker}
              editable={activeTool === 'sticker'}
              onMove={moveTimelineSticker}
              onRemove={(id) => setTimelineStickers((current) => current.filter((item) => item.id !== id))}
            />
          ))}
          {imageOverlays.map((overlay) => (
            <DraggableImageOverlay
              key={overlay.id}
              overlay={overlay}
              editable={activeTool === 'image' || activeTool === 'none'}
              highlighted={activeTool === 'image'}
              onMove={moveImageOverlay}
              onRemove={(id) => setImageOverlays((current) => current.filter((item) => item.id !== id))}
            />
          ))}
        </View>

        <View pointerEvents="none" style={[styles.drawingExportSurface, renderTargetSize]}>
          <Canvas ref={drawingExportRef} style={renderTargetSize}>
            {strokes.map((stroke) => (
              <SkiaStroke
                key={`export-${stroke.id}`}
                stroke={stroke}
                scaleX={drawingRenderTransform.scale}
                scaleY={drawingRenderTransform.scale}
                translateX={drawingRenderTransform.translateX}
                translateY={drawingRenderTransform.translateY}
              />
            ))}
          </Canvas>
        </View>

        {textComposerVisible ? (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.textComposerOverlay}
          >
            <View style={styles.textComposerTop}>
              <Pressable style={styles.editorIconButton} onPress={() => setTextComposerVisible(false)}>
                <MaterialIcons name="close" size={22} color="#fff" />
              </Pressable>
              <Pressable style={styles.doneButton} onPress={addTextSticker}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>

            <TextInput includeFontPadding={false}
              value={composerText}
              onChangeText={setComposerText}
              autoFocus
              multiline
              maxLength={80}
              placeholder="Add text"
              placeholderTextColor="rgba(255,255,255,0.5)"
              textAlign="center"
              style={[
                styles.composerInput,
                {
                  color: composerColor,
                  backgroundColor: composerBackground,
                },
              ]}
            />

            <View style={styles.composerTray}>
              <View style={styles.swatchRow}>
                {TEXT_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setComposerColor(color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      composerColor === color && styles.colorSwatchActive,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.swatchRow}>
                {TEXT_BACKGROUNDS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setComposerBackground(color)}
                    style={[
                      styles.backgroundSwatch,
                      {
                        backgroundColor: color === 'transparent' ? 'rgba(255,255,255,0.08)' : color,
                      },
                      composerBackground === color && styles.colorSwatchActive,
                    ]}
                  >
                    {color === 'transparent' ? <MaterialIcons name="format-color-reset" size={18} color="#fff" /> : null}
                  </Pressable>
                ))}
              </View>

              <View style={styles.fontSizeRow}>
                {[36, 48, 64].map((size) => (
                  <Pressable
                    key={size}
                    onPress={() => setComposerFontSize(size)}
                    style={[styles.fontSizeButton, composerFontSize === size && styles.fontSizeButtonActive]}
                  >
                    <Text style={styles.fontSizeButtonText}>{size}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.timeInputRow}>
                <TextInput includeFontPadding={false}
                  value={composerStart}
                  onChangeText={setComposerStart}
                  keyboardType="decimal-pad"
                  placeholder="Start"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
                <TextInput includeFontPadding={false}
                  value={composerEnd}
                  onChangeText={setComposerEnd}
                  keyboardType="decimal-pad"
                  placeholder="End"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        ) : null}

        <View style={styles.bottomPanelWrap}>
          {activeTool === 'draw' ? (
            <View style={styles.toolPanel}>
              <View style={styles.swatchRow}>
                {DRAW_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setDrawingColor(color)}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      drawingColor === color && styles.colorSwatchActive,
                    ]}
                  />
                ))}
              </View>

              <View style={styles.brushRow}>
                {[4, 7, 10].map((width) => (
                  <Pressable
                    key={width}
                    onPress={() => setDrawingWidth(width)}
                    style={[styles.brushButton, drawingWidth === width && styles.brushButtonActive]}
                  >
                    <View style={[styles.brushDot, { width, height: width, borderRadius: width / 2 }]} />
                  </Pressable>
                ))}
              </View>

              <View style={styles.timeInputRow}>
                <TextInput includeFontPadding={false}
                  value={drawingStart}
                  onChangeText={setDrawingStart}
                  keyboardType="decimal-pad"
                  placeholder="Start"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
                <TextInput includeFontPadding={false}
                  value={drawingEnd}
                  onChangeText={setDrawingEnd}
                  keyboardType="decimal-pad"
                  placeholder="End"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
              </View>

              <View style={styles.toolActions}>
                {strokes.length > 0 ? (
                  <Pressable
                    style={[styles.secondaryToolButton, drawingMode === 'move' && styles.secondaryToolButtonActive]}
                    onPress={() => setDrawingMode((current) => current === 'draw' ? 'move' : 'draw')}
                  >
                    <MaterialIcons name={drawingMode === 'draw' ? 'open-with' : 'edit'} size={18} color="#fff" />
                    <Text style={styles.secondaryToolText}>{drawingMode === 'draw' ? 'Move' : 'Draw'}</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.secondaryToolButton} onPress={undoEditorAction}>
                  <MaterialIcons name="undo" size={18} color="#fff" />
                  <Text style={styles.secondaryToolText}>Undo</Text>
                </Pressable>
                <Pressable style={styles.doneButton} onPress={() => setActiveTool('none')}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          ) : activeTool === 'text' ? (
            <View style={styles.toolPanel}>
              <View style={styles.toolActions}>
                <Pressable style={styles.secondaryToolButton} onPress={() => setTextComposerVisible(true)}>
                  <MaterialIcons name="add" size={18} color="#fff" />
                  <Text style={styles.secondaryToolText}>Add text</Text>
                </Pressable>
                <Pressable style={styles.secondaryToolButton} onPress={undoEditorAction}>
                  <MaterialIcons name="undo" size={18} color="#fff" />
                  <Text style={styles.secondaryToolText}>Undo</Text>
                </Pressable>
                <Pressable style={styles.doneButton} onPress={() => setActiveTool('none')}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          ) : activeTool === 'sticker' ? (
            <View style={styles.toolPanel}>
              <View style={styles.stickerPresetRow}>
                {STICKER_PRESETS.map((preset) => (
                  <Pressable key={preset.publicId} onPress={() => addSticker(preset)} style={styles.stickerPresetButton}>
                    <MaterialIcons name={preset.icon} size={28} color="#fff" />
                    <Text style={styles.quickActionLabel}>{preset.label}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.timeInputRow}>
                <TextInput includeFontPadding={false} value={stickerStart} onChangeText={setStickerStart} keyboardType="decimal-pad" placeholder="Start" placeholderTextColor="rgba(255,255,255,0.5)" style={styles.timeInput} />
                <TextInput includeFontPadding={false} value={stickerEnd} onChangeText={setStickerEnd} keyboardType="decimal-pad" placeholder="End" placeholderTextColor="rgba(255,255,255,0.5)" style={styles.timeInput} />
              </View>
              <View style={styles.toolActions}>
                <Pressable style={styles.secondaryToolButton} onPress={undoEditorAction}><MaterialIcons name="undo" size={18} color="#fff" /><Text style={styles.secondaryToolText}>Undo</Text></Pressable>
                <Pressable style={styles.doneButton} onPress={() => setActiveTool('none')}><Text style={styles.doneButtonText}>Done</Text></Pressable>
              </View>
            </View>
          ) : activeTool === 'image' ? (
            <View style={styles.toolPanel}>
              <Text style={styles.toolPanelTitle}>Picture overlay</Text>
              <View style={styles.toolActions}>
                <Pressable style={styles.secondaryToolButton} onPress={() => void pickImageOverlay()}>
                  <MaterialIcons name="add-photo-alternate" size={18} color="#fff" />
                  <Text style={styles.secondaryToolText}>Add picture</Text>
                </Pressable>
                <Pressable style={styles.secondaryToolButton} onPress={undoEditorAction}>
                  <MaterialIcons name="undo" size={18} color="#fff" />
                  <Text style={styles.secondaryToolText}>Undo</Text>
                </Pressable>
                <Pressable style={styles.doneButton} onPress={() => setActiveTool('none')}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </Pressable>
              </View>
            </View>
          ) : activeTool === 'trim' ? (
            <View style={styles.toolPanel}>
              <Text style={styles.toolPanelTitle}>Trim video (seconds)</Text>
              <View style={styles.timeInputRow}>
                <TextInput includeFontPadding={false} value={trimStart} onChangeText={setTrimStart} keyboardType="decimal-pad" placeholder="Start" placeholderTextColor="rgba(255,255,255,0.5)" style={styles.timeInput} />
                <TextInput includeFontPadding={false} value={trimEnd} onChangeText={setTrimEnd} keyboardType="decimal-pad" placeholder="End" placeholderTextColor="rgba(255,255,255,0.5)" style={styles.timeInput} />
              </View>
              <View style={styles.toolActions}>
                <Pressable style={styles.secondaryToolButton} onPress={() => setTrimEnabled(false)}><Text style={styles.secondaryToolText}>Clear</Text></Pressable>
                <Pressable style={styles.doneButton} onPress={() => { setTrimEnabled(true); setActiveTool('none'); }}><Text style={styles.doneButtonText}>Apply trim</Text></Pressable>
              </View>
            </View>
          ) : params.sound?.title ? (
            <View style={styles.soundPill}>
              <MaterialIcons name="music-note" size={16} color={PRIMARY_COLOR} />
              <Text style={styles.soundPillText} numberOfLines={1}>{params.sound.title}</Text>
            </View>
          ) : null}

          <View style={styles.bottomActionRow}>
            <View style={styles.floatingNavBar}>
              {quickActions.map((action) => (
                <Pressable
                  key={action.id}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  style={[styles.floatingNavButton, activeTool === action.id && styles.quickActionButtonActive]}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <MaterialIcons name={action.icon} size={21} color="#fff" />
                </Pressable>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isMuted ? 'Unmute sound' : 'Mute sound'}
                style={[styles.floatingNavButton, isMuted && styles.quickActionButtonActive]}
                onPress={() => setIsMuted((value) => !value)}
              >
                <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={21} color="#fff" />
              </Pressable>
            </View>

            <Pressable
              onPress={() => void handleNext()}
              style={[styles.bottomNextButton, (!videoUri || isRenderingVideo) && styles.postButtonDisabled]}
              disabled={!videoUri || isRenderingVideo}
            >
              <Text style={styles.postButtonText}>{nextButtonLabel}</Text>
            </Pressable>
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
    lineHeight: fontSize.b3.lineHeight,
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
    lineHeight: fontSize.b4.lineHeight,
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
    ...fontSize.b3,
    lineHeight: fontSize.b3.lineHeight,
    letterSpacing: 0.8,
    // fontWeight: '900',
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
  quickActionButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  quickActionLabel: {
    color: 'rgba(255,255,255,0.78)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomPanelWrap: {
    position: 'absolute',
    zIndex: 40,
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 18,
    gap: 12,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingNavBar: {
    flex: 1,
    minHeight: 58,
    borderRadius: 29,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(12,12,16,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  floatingNavButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: fontSize.b5.lineHeight,
  },
  bottomNextButton: {
    minWidth: 76,
    minHeight: 40,
    borderRadius: 29,
    paddingHorizontal: 16,
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  drawingLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
  },
  drawingGestureLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 13,
  },
  stickerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 14,
  },
  draggableDrawing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  drawingMoveBadge: {
    position: 'absolute',
    right: -13,
    top: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
    borderWidth: 1,
    borderColor: '#fff',
  },
  drawingExportSurface: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    backgroundColor: 'transparent',
  },
  textSticker: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
  },
  timelineSticker: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  timelineStickerEditable: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  imageOverlay: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 10,
  },
  imageOverlayMedia: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
  },
  imageRemoveButton: {
    position: 'absolute',
    right: -12,
    top: -12,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#fff',
  },
  textComposerOverlay: {
    position: 'absolute',
    zIndex: 80,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  textComposerTop: {
    position: 'absolute',
    top: 48,
    left: 18,
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editorIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  composerInput: {
    alignSelf: 'center',
    minWidth: '72%',
    maxWidth: '94%',
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...fontSize.h2,
    lineHeight: fontSize.h2.lineHeight,
    fontWeight: '900',
  },
  composerTray: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 36,
    gap: 14,
    alignItems: 'center',
  },
  toolPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    backgroundColor: 'rgba(0,0,0,0.62)',
    padding: 14,
    gap: 14,
  },
  toolPanelTitle: {
    color: '#fff',
    textAlign: 'center',
    ...fontSize.b4,
    lineHeight: fontSize.b4.lineHeight,
    fontWeight: '800',
  },
  stickerPresetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  stickerPresetButton: {
    minWidth: 72,
    minHeight: 62,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  backgroundSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchActive: {
    borderColor: '#fff',
    transform: [{ scale: 1.12 }],
  },
  brushRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  fontSizeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  fontSizeButton: {
    minWidth: 48,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  fontSizeButtonActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: primaryColorAlpha(0.2),
  },
  fontSizeButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '900',
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  timeInput: {
    minWidth: 86,
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '800',
  },
  brushButton: {
    width: 42,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  brushButtonActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: primaryColorAlpha(0.2),
  },
  brushDot: {
    backgroundColor: '#fff',
  },
  toolActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryToolButton: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryToolButtonActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  secondaryToolText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '800',
  },
  doneButton: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY_COLOR,
  },
  doneButtonText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.lineHeight,
    fontWeight: '900',
  },
});

export default EditSubmission;
