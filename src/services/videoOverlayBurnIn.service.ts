import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules } from 'react-native';
import type {
  SubmitCreatorVideoEditsPayload,
  VideoDisplayOrientation,
  VideoUploadSource,
} from '../types/video.types';
import { VIDEO_PROJECT_SCHEMA_VERSION } from '../types/videoProject.types';
import type { GeneratedEditAsset, VideoProject, VideoProjectTrack } from '../types/videoProject.types';

export type BurnInPoint = {
  x: number;
  y: number;
};

export type BurnInStroke = {
  color: string;
  width: number;
  points: BurnInPoint[];
  start?: number;
  end?: number;
};

export type BurnInTextSticker = {
  id?: string;
  text: string;
  color: string;
  backgroundColor: string;
  x: number;
  y: number;
  start?: number;
  end?: number;
  fontSize?: number;
};

export type BurnInSticker = {
  id?: string;
  publicId: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  start?: number;
  end?: number;
};

export type BurnInCanvasSize = {
  width: number;
  height: number;
};

export type BurnInVideoOverlaysOptions = {
  video: VideoUploadSource;
  orientation: VideoDisplayOrientation;
  canvasSize: BurnInCanvasSize;
  strokes: BurnInStroke[];
  textStickers: BurnInTextSticker[];
};

export const normalizeHexColor = (color: string, fallback = '#FFFFFF') => {
  const value = color?.trim();
  if (!value) return fallback;

  const shorthand = value.match(/^#([0-9a-f]{3,4})$/i)?.[1];
  if (shorthand) {
    return `#${shorthand.split('').map((character) => character.repeat(2)).join('')}`.toUpperCase();
  }

  if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value)) return value.toUpperCase();
  return value;
};

const createProjectId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createBaseProjectTrack = ({
  id,
  type,
  name,
  layer,
  start,
  end,
  x,
  y,
  width = null,
  height = null,
}: {
  id: string;
  type: VideoProjectTrack['type'];
  name: string;
  layer: number;
  start: number;
  end: number;
  x: number;
  y: number;
  width?: number | null;
  height?: number | null;
}): VideoProjectTrack => ({
  id,
  type,
  name,
  layer,
  timeline: {
    start,
    duration: Math.max(0.1, end - start),
  },
  transform: {
    position: { x, y },
    ...(width !== null || height !== null
      ? { size: { width, height } }
      : {}),
    opacity: 1,
    rotation: 0,
  },
});

const createVideoProject = ({
  orientation,
  targetSize,
  canvasSize,
  strokes,
  textStickers,
  stickers,
  trim,
  drawingFiles,
  generatedAssets,
}: {
  orientation: VideoDisplayOrientation;
  targetSize: { width: number; height: number };
  canvasSize: BurnInCanvasSize;
  strokes: BurnInStroke[];
  textStickers: BurnInTextSticker[];
  stickers: BurnInSticker[];
  trim?: { start: number; end: number };
  drawingFiles: VideoUploadSource[];
  generatedAssets: GeneratedEditAsset[];
}): VideoProject => {
  const tracks: VideoProjectTrack[] = [];
  const assets: NonNullable<VideoProject['assets']> = [];
  let layer = 1;

  textStickers.forEach((sticker, index) => {
    const text = sticker.text.trim();
    if (!text) return;
    const generated = generatedAssets.find((asset) => asset.kind === 'text' && asset.sourceId === sticker.id)
      ?? generatedAssets.filter((asset) => asset.kind === 'text')[index];
    if (!generated) throw new Error(`Missing generated image for text overlay ${index + 1}.`);
    const fileIndex = generatedAssets.indexOf(generated);
    const renderWidth = Math.max(1, Math.round(toRenderLength(generated.width, canvasSize, targetSize)));
    const renderHeight = Math.max(1, Math.round(toRenderLength(generated.height, canvasSize, targetSize)));
    const position = toRenderPoint(sticker, canvasSize, targetSize);
    const start = clampTime(sticker.start, 0);
    const end = Math.max(start + 0.1, clampTime(sticker.end, 5));
    assets.push({
      id: generated.id,
      type: 'image',
      storageProvider: 'local',
      storageKey: `multipart:asset_files[${fileIndex}]`,
      file_index: fileIndex,
      mimeType: generated.file.type ?? 'image/png',
      fileName: generated.file.name ?? `text-overlay-${index + 1}.png`,
      width: generated.width,
      height: generated.height,
    });
    tracks.push({
      ...createBaseProjectTrack({
        id: createProjectId(`text-track-${index}`),
        type: 'image',
        name: 'Text overlay',
        layer: layer++,
        start,
        end,
        x: Math.round(position.x),
        y: Math.round(position.y),
        width: renderWidth,
        height: renderHeight,
      }),
      enabled: true,
      zIndex: layer - 1,
      source: { assetId: generated.id },
    });
  });

  if (strokes.some((stroke) => stroke.points.length > 0)) {
    const generated = generatedAssets.find((asset) => asset.kind === 'drawing');
    if (!generated || !drawingFiles[0]) throw new Error('Missing generated drawing image.');
    const assetId = generated?.id ?? createProjectId('drawing-asset');
    const start = Math.min(...strokes.map((stroke) => clampTime(stroke.start, 0)));
    const end = Math.max(...strokes.map((stroke) => clampTime(stroke.end, 5)));
    if (drawingFiles[0] && generated) {
      const fileIndex = generatedAssets.indexOf(generated);
      assets.push({
        id: assetId,
        type: 'drawing',
        storageProvider: 'local',
        storageKey: `multipart:asset_files[${fileIndex}]`,
        mimeType: drawingFiles[0].type ?? 'image/png',
        fileName: drawingFiles[0].name ?? 'drawing-0.png',
        width: targetSize.width,
        height: targetSize.height,
        file_index: fileIndex,
      });
    }
    tracks.push({
      ...createBaseProjectTrack({
        id: createProjectId('drawing'),
        type: 'drawing',
        name: 'Drawing',
        layer: layer++,
        start,
        end,
        x: 0,
        y: 0,
        width: targetSize.width,
        height: targetSize.height,
      }),
      ...(drawingFiles[0] ? { flattenedAssetId: assetId } : {}),
      ...(generated ? { source: { assetId } } : {}),
      enabled: true,
      zIndex: layer - 1,
    });
  }

  stickers.forEach((sticker, index) => {
    if (!sticker.publicId?.trim()) return;
    const generated = generatedAssets.find((asset) => asset.kind === 'sticker' && asset.sourceId === sticker.id)
      ?? generatedAssets.filter((asset) => asset.kind === 'sticker')[index];
    if (!generated) throw new Error(`Missing generated image for sticker overlay ${index + 1}.`);
    const fileIndex = generatedAssets.indexOf(generated);
    const assetId = generated.id;
    const position = toRenderPoint(sticker, canvasSize, targetSize);
    const renderWidth = Math.max(1, Math.round(toRenderLength(generated.width, canvasSize, targetSize)));
    const renderHeight = Math.max(1, Math.round(toRenderLength(generated.height, canvasSize, targetSize)));
    const start = clampTime(sticker.start, 0);
    const end = Math.max(start + 0.1, clampTime(sticker.end, 5));
    assets.push({
      id: assetId,
      type: 'image',
      storageProvider: 'local',
      storageKey: `multipart:asset_files[${fileIndex}]`,
      file_index: fileIndex,
      mimeType: 'image/png',
      fileName: generated.file.name,
      width: generated.width,
      height: generated.height,
    });
    tracks.push({
      ...createBaseProjectTrack({
        id: createProjectId(`sticker-${index}`),
        type: 'image',
        name: `Sticker ${index + 1}`,
        layer: layer++,
        start,
        end,
        x: Math.round(position.x),
        y: Math.round(position.y),
        width: renderWidth,
        height: renderHeight,
      }),
      enabled: true,
      zIndex: layer - 1,
      source: { assetId },
    });
  });

  const trackDuration = Math.max(...tracks.map((track) => track.timeline.start + track.timeline.duration), 0.1);
  const duration = trim ? Math.max(0.1, trim.end - trim.start) : trackDuration;
  const now = new Date().toISOString();
  return {
    schemaVersion: VIDEO_PROJECT_SCHEMA_VERSION,
    metadata: {
      id: createProjectId('project'),
      name: 'Kulsah mobile video edit',
      createdAt: now,
      updatedAt: now,
      duration,
      source: 'mobile',
    },
    canvas: {
      width: targetSize.width,
      height: targetSize.height,
      aspectRatio: orientation === 'portrait' ? '9:16' : '16:9',
      fps: 30,
      duration,
    },
    output: {
      format: 'mp4',
      quality: 'auto',
      width: targetSize.width,
      height: targetSize.height,
      fps: 30,
      videoCodec: 'h264',
      audioCodec: 'aac',
      encoderPreset: 'medium',
      pixelFormat: 'yuv420p',
      crf: 20,
      fastStart: true,
    },
    assets,
    scenes: [{
      id: createProjectId('scene'),
      name: 'Main scene',
      order: 0,
      enabled: true,
      timeline: { start: trim?.start ?? 0, duration },
      tracks,
    }],
    globalAudioTracks: [],
    globalEffects: [],
    guides: {
      showSafeArea: false,
      showCenterGuides: false,
      showRuleOfThirds: false,
      showBoundingBoxes: false,
      snappingEnabled: false,
      snapThreshold: 12,
    },
    ...(trim ? { trim } : {}),
  };
};

export type VideoOverlayCompositionPayload = {
  version: 1;
  orientation: VideoDisplayOrientation;
  canvasSize: BurnInCanvasSize;
  targetSize: BurnInCanvasSize;
  overlays: {
    strokes: BurnInStroke[];
    textStickers: BurnInTextSticker[];
  };
};

const TARGET_SIZES: Record<VideoDisplayOrientation, BurnInCanvasSize> = {
  portrait: { width: 720, height: 1280 },
  landscape: { width: 1280, height: 720 },
};

const stripFileScheme = (uri: string) => decodeURIComponent(uri.replace(/^file:\/\//, ''));

const quoteFilterText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\n/g, '\\n');

const toFfmpegColor = (color: string, fallback = 'white') => {
  if (color === 'transparent') return 'black@0';

  const normalizedColor = normalizeHexColor(color);
  const hex = normalizedColor.match(/^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/);
  if (hex) {
    const alpha = hex[2] ? parseInt(hex[2], 16) / 255 : null;
    return `0x${hex[1]}${alpha === null ? '' : `@${roundNumber(alpha)}`}`;
  }

  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, alpha = '1'] = rgba[1].split(',').map((part) => part.trim());
    const hexValue = [r, g, b]
      .map((part) => Math.max(0, Math.min(255, Number(part) || 0)).toString(16).padStart(2, '0'))
      .join('');
    const parsedAlpha = Number(alpha);
    const safeAlpha = Number.isFinite(parsedAlpha) ? Math.max(0, Math.min(1, parsedAlpha)) : 1;
    return `0x${hexValue}@${safeAlpha}`;
  }

  return fallback;
};

const distance = (a: BurnInPoint, b: BurnInPoint) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const sampleStrokePoints = (stroke: BurnInStroke) => {
  const minDistance = Math.max(3, stroke.width * 0.65);
  const sampled: BurnInPoint[] = [];

  stroke.points.forEach((point) => {
    const previous = sampled[sampled.length - 1];
    if (!previous || distance(previous, point) >= minDistance) {
      sampled.push(point);
    }
  });

  return sampled;
};

const buildVideoBaseFilter = (orientation: VideoDisplayOrientation, target: BurnInCanvasSize) => {
  if (orientation === 'landscape') {
    return `scale=${target.width}:${target.height}:force_original_aspect_ratio=decrease,pad=${target.width}:${target.height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
  }

  return `scale=${target.width}:${target.height}:force_original_aspect_ratio=increase,crop=${target.width}:${target.height},setsar=1`;
};

const buildOverlayFilters = ({
  canvasSize,
  orientation,
  strokes,
  textStickers,
}: Pick<BurnInVideoOverlaysOptions, 'canvasSize' | 'orientation' | 'strokes' | 'textStickers'>) => {
  const target = TARGET_SIZES[orientation];
  const scaleX = target.width / Math.max(1, canvasSize.width);
  const scaleY = target.height / Math.max(1, canvasSize.height);
  const filters: string[] = [buildVideoBaseFilter(orientation, target)];

  strokes.forEach((stroke) => {
    const color = toFfmpegColor(stroke.color);
    const boxSize = Math.max(4, Math.round(stroke.width * ((scaleX + scaleY) / 2)));
    const halfBox = Math.round(boxSize / 2);

    sampleStrokePoints(stroke).forEach((point) => {
      const x = Math.round(point.x * scaleX) - halfBox;
      const y = Math.round(point.y * scaleY) - halfBox;
      filters.push(`drawbox=x=${x}:y=${y}:w=${boxSize}:h=${boxSize}:color=${color}:t=fill`);
    });
  });

  textStickers.forEach((sticker) => {
    const fontColor = toFfmpegColor(sticker.color);
    const boxColor = toFfmpegColor(sticker.backgroundColor, 'black@0');
    const fontSize = Math.max(36, Math.round(38 * ((scaleX + scaleY) / 2)));
    const x = Math.round(sticker.x * scaleX);
    const y = Math.round(sticker.y * scaleY);
    const text = quoteFilterText(sticker.text);
    const box = sticker.backgroundColor === 'transparent' ? '' : `:box=1:boxcolor=${boxColor}:boxborderw=${Math.round(14 * scaleX)}`;

    filters.push(`drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}${box}`);
  });

  filters.push('format=yuv420p');

  return filters.join(',');
};

export const hasVideoOverlays = (strokes: BurnInStroke[], textStickers: BurnInTextSticker[]) =>
  strokes.some((stroke) => stroke.points.length > 0) || textStickers.some((sticker) => sticker.text.trim().length > 0);

export const isVideoOverlayBurnInAvailable = () => Boolean(NativeModules.FFmpegKitReactNativeModule);

const roundNumber = (value: number) => Math.round(value * 100) / 100;

const clampTime = (value: number | undefined, fallback: number) => {
  const time = Number(value);
  return Number.isFinite(time) ? Math.max(0, roundNumber(time)) : fallback;
};

const getPreviewVideoMetrics = (canvasSize: BurnInCanvasSize, targetSize: BurnInCanvasSize) => {
  const isLandscape = targetSize.width > targetSize.height;
  const scale = isLandscape
    ? Math.min(canvasSize.width / targetSize.width, canvasSize.height / targetSize.height)
    : Math.max(canvasSize.width / targetSize.width, canvasSize.height / targetSize.height);
  const renderedWidth = targetSize.width * Math.max(scale, 0.0001);
  const renderedHeight = targetSize.height * Math.max(scale, 0.0001);

  return {
    scale: Math.max(scale, 0.0001),
    offsetX: (canvasSize.width - renderedWidth) / 2,
    offsetY: (canvasSize.height - renderedHeight) / 2,
  };
};

const toRenderPoint = (point: BurnInPoint, canvasSize: BurnInCanvasSize, targetSize: BurnInCanvasSize) => {
  const metrics = getPreviewVideoMetrics(canvasSize, targetSize);
  return {
    x: roundNumber((point.x - metrics.offsetX) / metrics.scale),
    y: roundNumber((point.y - metrics.offsetY) / metrics.scale),
  };
};

const toRenderLength = (length: number, canvasSize: BurnInCanvasSize, targetSize: BurnInCanvasSize) =>
  roundNumber(length / getPreviewVideoMetrics(canvasSize, targetSize).scale);

const toBackendBoxColor = (backgroundColor: string) => {
  if (backgroundColor === 'transparent') return undefined;
  if (/^rgba?\(/.test(backgroundColor)) return toFfmpegColor(backgroundColor, 'black@0.35');
  return toFfmpegColor(backgroundColor, 'black@0.35');
};

export const createVideoOverlayCompositionPayload = ({
  orientation,
  canvasSize,
  strokes,
  textStickers,
}: Omit<BurnInVideoOverlaysOptions, 'video'>): VideoOverlayCompositionPayload | null => {
  const normalizedStrokes = strokes
    .filter((stroke) => stroke.points.length > 0)
    .map((stroke) => ({
      color: normalizeHexColor(stroke.color, '#FFFFFF'),
      width: roundNumber(stroke.width),
      points: stroke.points.map((point) => ({
        x: roundNumber(point.x),
        y: roundNumber(point.y),
      })),
    }));

  const normalizedTextStickers = textStickers
    .map((sticker) => ({
      text: sticker.text.trim(),
      color: normalizeHexColor(sticker.color, '#FFFFFF'),
      backgroundColor: sticker.backgroundColor === 'transparent'
        ? 'transparent'
        : toBackendBoxColor(sticker.backgroundColor) ?? 'black@0.62',
      x: roundNumber(sticker.x),
      y: roundNumber(sticker.y),
    }))
    .filter((sticker) => sticker.text.length > 0);

  if (!hasVideoOverlays(normalizedStrokes, normalizedTextStickers)) return null;

  return {
    version: 1,
    orientation,
    canvasSize: {
      width: roundNumber(canvasSize.width),
      height: roundNumber(canvasSize.height),
    },
    targetSize: TARGET_SIZES[orientation],
    overlays: {
      strokes: normalizedStrokes,
      textStickers: normalizedTextStickers,
    },
  };
};

export const createCreatorVideoEditsPayload = ({
  orientation,
  canvasSize,
  strokes,
  textStickers,
  stickers = [],
  trim,
  drawingFiles = [],
  generatedAssets = [],
}: Omit<BurnInVideoOverlaysOptions, 'video'> & {
  stickers?: BurnInSticker[];
  trim?: { start: number; end: number } | null;
  drawingFiles?: VideoUploadSource[];
  generatedAssets?: GeneratedEditAsset[];
}): SubmitCreatorVideoEditsPayload | null => {
  const targetSize = TARGET_SIZES[orientation];

  const normalizedTrim = trim && trim.end > trim.start
    ? { start: clampTime(trim.start, 0), end: clampTime(trim.end, trim.start + 0.1) }
    : undefined;

  const hasTracks = textStickers.some((sticker) => sticker.text.trim().length > 0)
    || (drawingFiles.length > 0 && strokes.some((stroke) => stroke.points.length > 0))
    || stickers.some((sticker) => sticker.publicId.trim().length > 0);
  if (!hasTracks && !normalizedTrim) return null;

  const project = createVideoProject({
    orientation,
    targetSize,
    canvasSize,
    strokes,
    textStickers,
    stickers,
    trim: normalizedTrim,
    drawingFiles,
    generatedAssets,
  });

  return {
    project,
    assetFiles: generatedAssets.map((asset) => asset.file),
  };
};

const loadFfmpegKit = () => {
  if (!isVideoOverlayBurnInAvailable()) {
    throw new Error(
      'Permanent draw/text video edits need a native video compositor. The deprecated FFmpegKit package is not available for this Android build, so move compositing to the backend or add a supported native encoder before uploading edited overlays.',
    );
  }

  const optionalRequire = eval('require') as NodeRequire;
  return optionalRequire('ffmpeg-kit-react-native') as any;
};

export const burnInVideoOverlays = async ({
  video,
  orientation,
  canvasSize,
  strokes,
  textStickers,
}: BurnInVideoOverlaysOptions): Promise<VideoUploadSource> => {
  if (!hasVideoOverlays(strokes, textStickers)) return video;

  if (!FileSystem.cacheDirectory) {
    throw new Error('Video editing cache is not available on this device.');
  }

  if (!canvasSize.width || !canvasSize.height) {
    throw new Error('The editor canvas is not ready yet. Please try again.');
  }

  const inputPath = stripFileScheme(video.uri);
  const outputName = `kulsah-edited-${Date.now()}.mp4`;
  const outputUri = `${FileSystem.cacheDirectory}${outputName}`;
  const outputPath = stripFileScheme(outputUri);
  const filter = buildOverlayFilters({ canvasSize, orientation, strokes, textStickers });
  const { FFmpegKit, ReturnCode } = loadFfmpegKit();

  const session = await FFmpegKit.executeWithArguments([
    '-y',
    '-i',
    inputPath,
    '-vf',
    filter,
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-c:v',
    'mpeg4',
    '-q:v',
    '3',
    '-c:a',
    'copy',
    '-movflags',
    '+faststart',
    outputPath,
  ]);

  const returnCode = await session.getReturnCode();
  if (!ReturnCode.isSuccess(returnCode)) {
    const logs = await session.getAllLogsAsString(1000).catch(() => '');
    throw new Error(logs || 'Video editing failed before upload.');
  }

  return {
    ...video,
    uri: outputUri,
    name: outputName,
    type: 'video/mp4',
    orientation,
  };
};
