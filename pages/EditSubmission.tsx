import React, { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useThemeMode, PRIMARY_COLOR, primaryColorAlpha } from "../theme";
import {
  Alert,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import Svg, { Path } from 'react-native-svg';
import { fontSize } from './typography';
import {
  createCreatorVideoEditsPayload,
  hasVideoOverlays,
  parseApiError,
} from '../src';
import type { SubmitCreatorVideoEditsPayload, VideoDisplayOrientation, VideoUploadSource } from '../src';

type EditSubmissionRouteParams = {
  video?: VideoUploadSource;
  uploadedVideoId?: string | number;
  sound?: {
    title?: string;
    id?: string;
    meta?: string;
    usage?: string;
  } | null;
};

type EditorTool = 'none' | 'draw' | 'text';

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

type DraggableTextStickerProps = {
  sticker: TextSticker;
  editable: boolean;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onPress: (id: string) => void;
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

const DRAW_COLORS = ['#fff', PRIMARY_COLOR, '#f97316', '#22c55e', '#38bdf8', '#f43f5e'];
const TEXT_COLORS = ['#fff', '#111827', PRIMARY_COLOR, '#f97316', '#38bdf8'];
const TEXT_BACKGROUNDS = ['transparent', 'rgba(0,0,0,0.62)', 'rgba(255,255,255,0.9)', PRIMARY_COLOR];
const RENDER_TARGET_SIZES: Record<VideoDisplayOrientation, { width: number; height: number }> = {
  portrait: { width: 720, height: 1280 },
  landscape: { width: 1280, height: 720 },
};

const createPath = (points: DrawingPoint[]) => {
  if (!points.length) return '';

  return points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path}${command}${point.x.toFixed(1)},${point.y.toFixed(1)} `;
  }, '');
};

const createScaledPath = (
  points: DrawingPoint[],
  canvasSize: { width: number; height: number },
  targetSize: { width: number; height: number },
) => {
  const scaleX = targetSize.width / Math.max(1, canvasSize.width);
  const scaleY = targetSize.height / Math.max(1, canvasSize.height);

  return createPath(points.map((point) => ({ x: point.x * scaleX, y: point.y * scaleY })));
};

const DraggableTextSticker: React.FC<DraggableTextStickerProps> = ({ sticker, editable, onMove, onPress }) => {
  const lastDeltaRef = React.useRef({ x: 0, y: 0 });
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
          onMove(sticker.id, deltaX, deltaY);
        },
        onPanResponderRelease: () => {
          lastDeltaRef.current = { x: 0, y: 0 };
        },
      }),
    [editable, onMove, sticker.id],
  );

  return (
    <Pressable
      {...panResponder.panHandlers}
      onPress={() => onPress(sticker.id)}
      style={[
        styles.textSticker,
        {
          left: sticker.x,
          top: sticker.y,
          backgroundColor: sticker.backgroundColor,
          borderColor: editable ? 'rgba(255,255,255,0.34)' : 'transparent',
        },
      ]}
    >
      <Text style={[styles.textStickerLabel, { color: sticker.color, fontSize: Math.max(16, sticker.fontSize * 0.42) }]}>
        {sticker.text}
      </Text>
    </Pressable>
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
  const [drawingColor, setDrawingColor] = useState(PRIMARY_COLOR);
  const [drawingWidth, setDrawingWidth] = useState(5);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [textStickers, setTextStickers] = useState<TextSticker[]>([]);
  const [textComposerVisible, setTextComposerVisible] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [composerColor, setComposerColor] = useState('#fff');
  const [composerBackground, setComposerBackground] = useState('rgba(0,0,0,0.62)');
  const [composerFontSize, setComposerFontSize] = useState(48);
  const [composerStart, setComposerStart] = useState('0');
  const [composerEnd, setComposerEnd] = useState('5');
  const [drawingStart, setDrawingStart] = useState('0');
  const [drawingEnd, setDrawingEnd] = useState('5');
  const [editorCanvasSize, setEditorCanvasSize] = useState({ width: 0, height: 0 });
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const loadedPreviewUriRef = React.useRef<string | null>(null);
  const playbackStateRef = React.useRef<boolean | null>(null);
  const drawingExportRef = React.useRef<any>(null);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.keepScreenOnWhilePlaying = false;
    instance.timeUpdateEventInterval = 0.5;
  });

  const routeOrientation = video?.orientation ?? null;
  const previewOrientation = routeOrientation ?? 'portrait';
  const isLandscapePreview = previewOrientation === 'landscape';
  const renderTargetSize = RENDER_TARGET_SIZES[previewOrientation];
  const shouldRenderVideo = Boolean(videoUri && isFocused);
  const nextButtonLabel = isRenderingVideo ? 'Preparing edits' : 'Next';

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
        onStartShouldSetPanResponder: () => activeTool === 'draw',
        onMoveShouldSetPanResponder: () => activeTool === 'draw',
        onPanResponderGrant: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          const stroke: DrawingStroke = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            color: drawingColor,
            width: drawingWidth,
            start: Math.max(0, Number(drawingStart) || 0),
            end: Math.max(Math.max(0, Number(drawingStart) || 0) + 0.1, Number(drawingEnd) || 5),
            points: [{ x: locationX, y: locationY }],
          };
          setStrokes((current) => [...current, stroke]);
        },
        onPanResponderMove: (event) => {
          const { locationX, locationY } = event.nativeEvent;
          setStrokes((current) => {
            const lastStroke = current[current.length - 1];
            if (!lastStroke) return current;

            return [
              ...current.slice(0, -1),
              {
                ...lastStroke,
                points: [...lastStroke.points, { x: locationX, y: locationY }],
              },
            ];
          });
        },
      }),
    [activeTool, drawingColor, drawingEnd, drawingStart, drawingWidth],
  );

  const moveTextSticker = React.useCallback((id: string, deltaX: number, deltaY: number) => {
    setTextStickers((current) =>
      current.map((sticker) =>
        sticker.id === id
          ? {
              ...sticker,
              x: Math.max(12, Math.min(Math.max(12, editorCanvasSize.width - 96), sticker.x + deltaX)),
              y: Math.max(84, Math.min(Math.max(84, editorCanvasSize.height - 120), sticker.y + deltaY)),
            }
          : sticker,
      ),
    );
  }, [editorCanvasSize.height, editorCanvasSize.width]);

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

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'text') {
      setActiveTool('text');
      setComposerText('');
      setComposerColor('#fff');
      setComposerBackground('rgba(0,0,0,0.62)');
      setComposerFontSize(48);
      setComposerStart('0');
      setComposerEnd('5');
      setTextComposerVisible(true);
      return;
    }

    if (actionId === 'music') {
      navigation.navigate('Vote');
      return;
    }

    setActiveTool((current) => (current === 'draw' ? 'none' : 'draw'));
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
        start: Math.max(0, Number(composerStart) || 0),
        end: Math.max(Math.max(0, Number(composerStart) || 0) + 0.1, Number(composerEnd) || 5),
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
    }
  };

  const exportDrawingFiles = async (): Promise<VideoUploadSource[]> => {
    if (!strokes.some((stroke) => stroke.points.length > 0)) return [];
    if (!FileSystem.cacheDirectory) {
      throw new Error('Drawing export cache is not available on this device.');
    }

    const exporter = drawingExportRef.current;
    if (!exporter?.toDataURL) {
      throw new Error('Drawing export is not available on this device.');
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      try {
        exporter.toDataURL((value: string) => resolve(value), renderTargetSize);
      } catch (error) {
        reject(error);
      }
    });

    const uri = `${FileSystem.cacheDirectory}kulsah-drawing-${Date.now()}.png`;
    await FileSystem.writeAsStringAsync(uri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return [
      {
        uri,
        name: 'drawing-0.png',
        type: 'image/png',
      },
    ];
  };

  const handleNext = async () => {
    if (!video) {
      Alert.alert('No video selected', 'Record or choose a video before continuing.');
      return;
    }

    let editPayload: SubmitCreatorVideoEditsPayload | null = null;

    try {
      setIsRenderingVideo(true);
      const drawingFiles = await exportDrawingFiles();

      if (hasVideoOverlays(strokes, textStickers)) {
        editPayload = createCreatorVideoEditsPayload({
          orientation: previewOrientation,
          canvasSize: editorCanvasSize,
          strokes,
          textStickers,
          drawingFiles,
        });
      }

      navigation.replace('SubmitEntry', {
        video: {
          ...video,
          orientation: previewOrientation,
        },
        uploadedVideoId,
        autoStartUpload: uploadedVideoId == null,
        editPayload,
        sound: params.sound ?? null,
        orientation: previewOrientation,
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
          {...drawingResponder.panHandlers}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setEditorCanvasSize((current) =>
              current.width === width && current.height === height ? current : { width, height },
            );
          }}
          pointerEvents={activeTool === 'draw' ? 'auto' : 'none'}
          style={styles.drawingLayer}
        >
          <Svg width="100%" height="100%">
            {strokes.map((stroke) => (
              <Path
                key={stroke.id}
                d={createPath(stroke.points)}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>

        <View pointerEvents={activeTool === 'draw' ? 'none' : 'box-none'} style={styles.stickerLayer}>
          {textStickers.map((sticker) => (
            <DraggableTextSticker
              key={sticker.id}
              sticker={sticker}
              editable={activeTool === 'text'}
              onMove={moveTextSticker}
              onPress={editTextSticker}
            />
          ))}
        </View>

        <View pointerEvents="none" style={[styles.drawingExportSurface, renderTargetSize]}>
          <Svg ref={drawingExportRef} width={renderTargetSize.width} height={renderTargetSize.height}>
            {strokes.map((stroke) => (
              <Path
                key={`export-${stroke.id}`}
                d={createScaledPath(stroke.points, editorCanvasSize, renderTargetSize)}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width * (renderTargetSize.width / Math.max(1, editorCanvasSize.width))}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </Svg>
        </View>

        <View style={styles.rightRail}>
          {quickActions.map((action) => (
            <View key={action.id} style={styles.quickActionItem}>
              <Pressable
                style={[
                  styles.quickActionButton,
                  activeTool === action.id && styles.quickActionButtonActive,
                ]}
                onPress={() => handleQuickAction(action.id)}
              >
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

            <TextInput
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
                <TextInput
                  value={composerStart}
                  onChangeText={setComposerStart}
                  keyboardType="decimal-pad"
                  placeholder="Start"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
                <TextInput
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
                <TextInput
                  value={drawingStart}
                  onChangeText={setDrawingStart}
                  keyboardType="decimal-pad"
                  placeholder="Start"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
                <TextInput
                  value={drawingEnd}
                  onChangeText={setDrawingEnd}
                  keyboardType="decimal-pad"
                  placeholder="End"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={styles.timeInput}
                />
              </View>

              <View style={styles.toolActions}>
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
          ) : params.sound?.title ? (
            <View style={styles.soundPill}>
              <MaterialIcons name="music-note" size={16} color={PRIMARY_COLOR} />
              <Text style={styles.soundPillText} numberOfLines={1}>{params.sound.title}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={() => void handleNext()}
            style={[styles.bottomNextButton, (!videoUri || isRenderingVideo) && styles.postButtonDisabled]}
            disabled={!videoUri || isRenderingVideo}
          >
            <Text style={styles.postButtonText}>{nextButtonLabel}</Text>
            <MaterialIcons name={isRenderingVideo ? 'hourglass-empty' : 'chevron-right'} size={18} color="#fff" />
          </Pressable>
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
    ...fontSize.b3,
    lineHeight: fontSize.b3.fontSize + 1,
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
  quickActionButtonActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
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
    zIndex: 40,
    left: 0,
    right: 0,
    bottom: 24,
    paddingHorizontal: 18,
    gap: 12,
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
  bottomNextButton: {
    // alignSelf: 'flex-end',
    minWidth: '90%',
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: '10%',
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
  stickerLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 14,
  },
  drawingExportSurface: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    backgroundColor: 'transparent',
  },
  textSticker: {
    position: 'absolute',
    maxWidth: 260,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textStickerLabel: {
    ...fontSize.b2,
    lineHeight: fontSize.b2.fontSize + 4,
    fontWeight: '900',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.44)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    lineHeight: fontSize.h2.fontSize + 6,
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
    lineHeight: fontSize.b5.fontSize + 1,
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
    lineHeight: fontSize.b5.fontSize + 1,
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
  secondaryToolText: {
    color: '#fff',
    ...fontSize.b5,
    lineHeight: fontSize.b5.fontSize + 1,
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
    lineHeight: fontSize.b5.fontSize + 1,
    fontWeight: '900',
  },
});

export default EditSubmission;
