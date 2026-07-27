import * as FileSystem from 'expo-file-system/legacy';
import { NativeModules } from 'react-native';
import type {
  CreatorVideoTimelineLayer,
  SubmitCreatorVideoEditsPayload,
  VideoDisplayOrientation,
  VideoUploadSource,
} from '../types/video.types';

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

  const hex = color.match(/^#?([0-9a-fA-F]{6})$/)?.[1];
  if (hex) return `0x${hex}`;

  const rgba = color.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const [r, g, b, alpha = '1'] = rgba[1].split(',').map((part) => part.trim());
    const hexValue = [r, g, b]
      .map((part) => Math.max(0, Math.min(255, Number(part) || 0)).toString(16).padStart(2, '0'))
      .join('');
    return `0x${hexValue}@${Math.max(0, Math.min(1, Number(alpha) || 1))}`;
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

const toRenderPoint = (point: BurnInPoint, canvasSize: BurnInCanvasSize, targetSize: BurnInCanvasSize) => ({
  x: roundNumber(point.x * (targetSize.width / Math.max(1, canvasSize.width))),
  y: roundNumber(point.y * (targetSize.height / Math.max(1, canvasSize.height))),
});

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
      color: stroke.color,
      width: roundNumber(stroke.width),
      points: stroke.points.map((point) => ({
        x: roundNumber(point.x),
        y: roundNumber(point.y),
      })),
    }));

  const normalizedTextStickers = textStickers
    .map((sticker) => ({
      text: sticker.text.trim(),
      color: sticker.color,
      backgroundColor: sticker.backgroundColor,
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
}: Omit<BurnInVideoOverlaysOptions, 'video'> & {
  stickers?: BurnInSticker[];
  trim?: { start: number; end: number } | null;
  drawingFiles?: VideoUploadSource[];
}): SubmitCreatorVideoEditsPayload | null => {
  const targetSize = TARGET_SIZES[orientation];
  const layers: CreatorVideoTimelineLayer[] = [];

  textStickers.forEach((sticker) => {
    const text = sticker.text.trim();
    if (!text) return;

    const point = toRenderPoint({ x: sticker.x, y: sticker.y }, canvasSize, targetSize);
    const start = clampTime(sticker.start, 0);
    const end = Math.max(start + 0.1, clampTime(sticker.end, 5));
    layers.push({
      type: 'text',
      text,
      font: 'Arial',
      x: Math.round(point.x),
      y: Math.round(point.y),
      start,
      end,
      size: Math.max(12, Math.round(sticker.fontSize ?? 48)),
      color: sticker.color,
    });
  });

  if (drawingFiles.length > 0 && strokes.some((stroke) => stroke.points.length > 0)) {
    const drawingStart = Math.min(...strokes.map((stroke) => clampTime(stroke.start, 0)));
    const drawingEnd = Math.max(...strokes.map((stroke) => clampTime(stroke.end, 5)));

    layers.push({
      type: 'drawing',
      file_index: 0,
      x: 0,
      y: 0,
      start: drawingStart,
      end: Math.max(drawingStart + 0.1, drawingEnd),
      width: targetSize.width,
      height: targetSize.height,
    });
  }

  stickers.forEach((sticker) => {
    const point = toRenderPoint({ x: sticker.x, y: sticker.y }, canvasSize, targetSize);
    const start = clampTime(sticker.start, 0);
    const end = Math.max(start + 0.1, clampTime(sticker.end, 5));
    layers.push({
      type: 'sticker',
      public_id: sticker.publicId,
      x: Math.round(point.x),
      y: Math.round(point.y),
      width: sticker.width,
      height: sticker.height,
      start,
      end,
    });
  });

  const normalizedTrim = trim && trim.end > trim.start
    ? { start: clampTime(trim.start, 0), end: clampTime(trim.end, trim.start + 0.1) }
    : undefined;

  if (!layers.length && !normalizedTrim) return null;

  return {
    timeline: {
      layers,
      ...(normalizedTrim ? { trim: normalizedTrim } : {}),
      output: {
        format: 'mp4',
        quality: 'auto',
        width: targetSize.width,
        height: targetSize.height,
      },
    },
    drawingFiles,
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
