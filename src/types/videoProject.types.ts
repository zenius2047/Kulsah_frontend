export const VIDEO_PROJECT_SCHEMA_VERSION = '3.0.0' as const;

export type VideoProjectAssetType =
  | 'video'
  | 'image'
  | 'audio'
  | 'font'
  | 'sticker'
  | 'drawing'
  | 'lut'
  | 'mask';

export type VideoProjectTrackType =
  | 'video'
  | 'image'
  | 'text'
  | 'caption'
  | 'sticker'
  | 'drawing'
  | 'shape'
  | 'audio'
  | 'adjustment'
  | 'composition';

export type VideoProjectPoint = { x: number; y: number };

export interface VideoProjectAsset {
  id: string;
  type: VideoProjectAssetType;
  storageProvider: 's3' | 'spaces' | 'local' | 'cloudinary';
  storageKey: string;
  url?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  fps?: number | null;
  hasAudio?: boolean | null;
  checksum?: string | null;
  /** Multipart file index resolved by Laravel before FFmpeg rendering. */
  fileIndex?: number;
  file_index?: number;
}

export type GeneratedEditAsset = {
  id: string;
  sourceId: string;
  kind: 'text' | 'drawing' | 'sticker';
  file: import('./video.types').VideoUploadSource;
  width: number;
  height: number;
};

export type VideoProjectV3 = VideoProject;
export type VideoProjectScene = VideoProject['scenes'][number];
export type VideoProjectTimeline = VideoProjectTrack['timeline'];
export type VideoProjectTransform = VideoProjectTrack['transform'];

export interface VideoProjectTrack {
  id: string;
  type: VideoProjectTrackType;
  name?: string;
  layer: number;
  enabled?: boolean;
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
  selected?: boolean;
  groupId?: string | null;
  parentCompositionId?: string | null;
  timeline: {
    start: number;
    duration: number;
    trimStart?: number;
    trimEnd?: number | null;
    playbackRate?: number;
    reverse?: boolean;
    loop?: boolean;
    freezeAtEnd?: boolean;
  };
  transform: {
    position: VideoProjectPoint;
    size?: {
      width: number | null;
      height: number | null;
      maxWidth?: number | null;
      maxHeight?: number | null;
      maintainAspectRatio?: boolean;
    };
    scale?: { x: number; y: number; uniform: boolean };
    anchor?: { preset: 'top_left' | 'center' | 'custom'; x: number; y: number };
    rotation?: number;
    skew?: VideoProjectPoint;
    opacity?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
  };
  crop?: { enabled: boolean; x: number; y: number; width: number; height: number; unit: 'normalized' };
  opacity?: number;
  blendMode?: 'normal';
  mask?: null;
  border?: {
    enabled: boolean;
    color: string;
    width: number;
    opacity: number;
    style: 'solid';
    radius: { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  };
  shadow?: { enabled: boolean; color: string; opacity: number; blur: number; spread: number; offsetX: number; offsetY: number };
  glow?: { enabled: boolean; color: string; opacity: number; blur: number; spread: number; intensity: number };
  animations?: { in: null; loop: null; out: null };
  keyframes?: unknown[];
  motionPath?: null;
  effects?: unknown[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VideoProject {
  schemaVersion: typeof VIDEO_PROJECT_SCHEMA_VERSION;
  metadata: {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy?: string | null;
    duration: number;
    revision?: number;
    source: 'mobile';
  };
  canvas: {
    width: number;
    height: number;
    aspectRatio: string;
    fps: number;
    duration: number;
    background?: { type: 'transparent'; color: string; opacity: number; assetId: null; blur: number; gradient: null };
    safeArea?: { enabled: boolean; top: number; right: number; bottom: number; left: number };
  };
  output: {
    format: 'mp4';
    videoCodec?: 'h264';
    audioCodec?: 'aac';
    width: number;
    height: number;
    fps?: number;
    quality?: 'auto' | 'high';
    crf?: number;
    videoBitrate?: null;
    audioBitrate?: string;
    audioSampleRate?: number;
    audioChannels?: number;
    pixelFormat?: 'yuv420p';
    encoderPreset?: 'medium';
    fastStart?: boolean;
  };
  assets?: VideoProjectAsset[];
  scenes: Array<{
    id: string;
    name: string;
    order: number;
    timeline: { start: number; duration: number };
    background?: { type: 'transparent'; color: string; opacity: number; assetId: null; blur: number; gradient: null };
    tracks: VideoProjectTrack[];
    transitionIn?: null;
    transitionOut?: null;
    enabled?: boolean;
  }>;
  globalAudioTracks?: [];
  globalEffects?: [];
  trim?: { start: number; end: number };
  /** Editor-only preferences; omitted from render submissions. */
  guides?: {
    showSafeArea: false;
    showCenterGuides: false;
    showRuleOfThirds: false;
    showBoundingBoxes: false;
    snappingEnabled: false;
    snapThreshold: number;
  };
}
