import * as FileSystem from 'expo-file-system/legacy';
import api from '../api/client';
import { endpoints } from '../api/endpoints';
import { hasCreatorVideoEdits } from '../types/video.types';
import type {
  CompleteCreatorVideoUploadResponse,
  CreatorVideo,
  CreatorVideoProgress,
  CreatorVideoUploadSession,
  CreatorVideoUploadStatus,
  InitCreatorVideoUploadPayload,
  InitCreatorVideoUploadResponse,
  SubmitCreatorVideoEditsPayload,
  UploadCreatorVideoPayload,
  VideoUploadSource,
} from '../types/video.types';
import { getVideoProcessingState } from '../utils/video';

export type CreatorVideoDirectUploadStage =
  | Exclude<CreatorVideoUploadStatus, 'idle'>
  | 'retrying';

export type CreatorVideoDirectUploadProgress = {
  stage: CreatorVideoDirectUploadStage;
  progress: number;
  uploadProgress?: number;
  backendProgress?: number;
  videoId?: string | number;
  processing?: CreatorVideoProgress;
  message?: string;
};

export type CreatorVideoDirectUploadOptions = {
  pollIntervalMs?: number;
  maxUploadAttempts?: number;
  waitForProcessing?: boolean;
  edits?: SubmitCreatorVideoEditsPayload | null;
  onProgress?: (progress: CreatorVideoDirectUploadProgress) => void;
  shouldCancel?: () => boolean;
};

const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_MAX_UPLOAD_ATTEMPTS = 2;

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isExpired = (expiresAt?: string) => {
  if (!expiresAt) return false;

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) return false;

  return Date.now() >= expiresAtMs - 15_000;
};

const isLikelyExpiredSignedUrlError = (status: number, responseText: string) => {
  if (status === 403 || status === 400) return true;

  return /expired|signature|request has expired/i.test(responseText);
};

const toInitPayload = (payload: UploadCreatorVideoPayload): InitCreatorVideoUploadPayload => {
  if (payload.video instanceof FormData) {
    throw new Error('Direct video uploads require a file source with uri, name, and type. FormData is only for multipart uploads.');
  }

  const source = payload.video as VideoUploadSource;

  return {
    original_name: source.name ?? source.uri.split('/').pop() ?? 'creator-video.mp4',
    file_name: source.name ?? source.uri.split('/').pop() ?? 'creator-video.mp4',
    filename: source.name ?? source.uri.split('/').pop() ?? 'creator-video.mp4',
    mime_type: source.type ?? 'video/mp4',
    size: source.size,
    title: payload.title ?? null,
    caption: payload.caption ?? null,
    content_type: payload.contentType,
    visibility: payload.visibility,
  };
};

const getSource = (payload: UploadCreatorVideoPayload): VideoUploadSource => {
  if (payload.video instanceof FormData) {
    throw new Error('Direct S3 upload cannot send FormData. Pick a local video file first.');
  }

  return payload.video as VideoUploadSource;
};

const normalizeHeaderValue = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const normalizeUploadHeaders = (headers: Record<string, unknown> | undefined, mimeType: string) => {
  const normalized: Record<string, string> = {};

  Object.entries(headers ?? {}).forEach(([key, value]) => {
    const headerValue = normalizeHeaderValue(value);
    if (!headerValue) return;
    if (/^(authorization|cookie|x-xsrf-token)$/i.test(key)) return;
    normalized[key] = headerValue;
  });

  const hasContentType = Object.keys(normalized).some((key) => key.toLowerCase() === 'content-type');

  return {
    ...normalized,
    ...(hasContentType ? {} : { 'Content-Type': mimeType }),
  };
};

const initUploadSession = async (payload: UploadCreatorVideoPayload) => {
  const response = await api.post<InitCreatorVideoUploadResponse>(
    endpoints.creator.videoUploadInit,
    toInitPayload(payload),
  );

  return response.data.data;
};

const putFileToSignedUrl = (
  session: CreatorVideoUploadSession,
  source: VideoUploadSource,
  onProgress?: (uploadPercent: number) => void,
  shouldCancel?: () => boolean,
) =>
  new Promise<void>(async (resolve, reject) => {
    const mimeType = source.type ?? 'video/mp4';
    const headers = normalizeUploadHeaders(session.upload.upload_headers, mimeType);
    const uploadOptions = {
      httpMethod: 'PUT' as const,
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      headers,
    };
    const uploadTask = FileSystem.createUploadTask(
      session.upload.upload_url,
      source.uri,
      uploadOptions,
      ({ totalBytesSent, totalBytesExpectedToSend }) => {
        if (totalBytesExpectedToSend <= 0) return;

        onProgress?.(clamp(Math.round((totalBytesSent * 100) / totalBytesExpectedToSend)));
      },
    );

    const cancelTimer = setInterval(() => {
      if (!shouldCancel?.()) return;
      clearInterval(cancelTimer);
      void uploadTask.cancelAsync();
      reject(new Error('Upload cancelled.'));
    }, 250);

    try {
      let result = await uploadTask.uploadAsync();
      clearInterval(cancelTimer);

      if (!result) {
        reject(new Error('Upload was cancelled.'));
        return;
      }

      if (result.status >= 200 && result.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      const error = new Error(`S3 upload failed with status ${result.status}.`);
      (error as Error & { status?: number; responseText?: string }).status = result.status;
      (error as Error & { status?: number; responseText?: string }).responseText = result.body;
      reject(error);
    } catch (error) {
      clearInterval(cancelTimer);

      if (/uploadTaskStartAsync|FileSystemUploadOptions|4th argument/i.test(error instanceof Error ? error.message : String(error))) {
        try {
          const result = await FileSystem.uploadAsync(session.upload.upload_url, source.uri, uploadOptions);

          if (result.status >= 200 && result.status < 300) {
            onProgress?.(100);
            resolve();
            return;
          }

          const fallbackError = new Error(`S3 upload failed with status ${result.status}.`);
          (fallbackError as Error & { status?: number; responseText?: string }).status = result.status;
          (fallbackError as Error & { status?: number; responseText?: string }).responseText = result.body;
          reject(fallbackError);
          return;
        } catch (fallbackError) {
          reject(fallbackError);
          return;
        }
      }

      reject(error);
    }
  });

const completeUpload = async (videoId: string | number) => {
  const response = await api.post<CompleteCreatorVideoUploadResponse>(
    endpoints.creator.videoUploadComplete(videoId),
    {},
  );

  return response.data.data;
};

const getCompletedVideo = async (videoId: string | number, fallback: CreatorVideo) => {
  try {
    const response = await api.get<any>(endpoints.creator.video(videoId));
    return response.data?.data ?? response.data?.item ?? fallback;
  } catch {
    return fallback;
  }
};

const submitEdits = async (videoId: string | number, payload: SubmitCreatorVideoEditsPayload) => {
  const formData = new FormData();

  if (payload.timeline) formData.append('timeline', JSON.stringify(payload.timeline));
  if (payload.overlays?.length) formData.append('overlays', JSON.stringify(payload.overlays));
  payload.drawingFiles?.forEach((file, index) => {
    formData.append('drawing_files[]', {
      uri: file.uri,
      name: file.name ?? `drawing-${index}.png`,
      type: file.type ?? 'image/png',
    } as any);
  });

  await api.post(endpoints.creator.videoEdits(videoId), formData);
};

const pollProcessing = async (
  videoId: string | number,
  options: Pick<CreatorVideoDirectUploadOptions, 'pollIntervalMs' | 'onProgress' | 'shouldCancel'>,
) => {
  const interval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;

  while (true) {
    if (options.shouldCancel?.()) throw new Error('Upload cancelled.');

    const response = await api.get<{ data: CreatorVideoProgress }>(endpoints.creator.videoProgress(videoId));
    const processing = response.data.data;
    const { isReady, hasFailed } = getVideoProcessingState(processing);
    const backendProgress = clamp(processing.progress_percentage ?? 0);
    const mappedProgress = isReady ? 100 : 90 + backendProgress * 0.1;

    options.onProgress?.({
      stage: isReady ? 'ready' : hasFailed ? 'failed' : 'processing',
      progress: clamp(mappedProgress),
      backendProgress,
      videoId,
      processing,
      message: `Processing ${backendProgress}%`,
    });

    if (isReady) return processing;

    if (hasFailed) {
      throw new Error(processing.error || processing.message || 'Video processing failed.');
    }

    await sleep(interval);
  }
};

export const uploadCreatorVideoDirect = async (
  payload: UploadCreatorVideoPayload,
  options: CreatorVideoDirectUploadOptions = {},
): Promise<{ video: CreatorVideo; progress: CreatorVideoProgress }> => {
  const source = getSource(payload);
  let session: CreatorVideoUploadSession | null = null;
  let completedVideo: CreatorVideo | null = null;
  const maxAttempts = Math.max(1, options.maxUploadAttempts ?? DEFAULT_MAX_UPLOAD_ATTEMPTS);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.shouldCancel?.()) throw new Error('Upload cancelled.');

    options.onProgress?.({
      stage: attempt > 1 ? 'retrying' : 'initializing',
      progress: 0,
      message: attempt > 1 ? 'Refreshing upload link' : 'Preparing upload',
    });

    session = await initUploadSession(payload);
    options.onProgress?.({
      stage: 'uploading',
      progress: 0,
      uploadProgress: 0,
      videoId: session.video.id,
      message: 'Uploading video',
    });

    if (isExpired(session.upload.expires_at)) {
      if (attempt >= maxAttempts) throw new Error('Upload link expired before the upload could start.');
      continue;
    }

    try {
      await putFileToSignedUrl(
        session,
        source,
        (uploadPercent) => {
          options.onProgress?.({
            stage: 'uploading',
            progress: uploadPercent,
            uploadProgress: uploadPercent,
            videoId: session?.video.id,
            message: `Uploading ${uploadPercent}%`,
          });
        },
        options.shouldCancel,
      );
      break;
    } catch (error) {
      const status = (error as Error & { status?: number }).status ?? 0;
      const responseText = (error as Error & { responseText?: string }).responseText ?? '';

      if (attempt < maxAttempts && isLikelyExpiredSignedUrlError(status, responseText)) {
        options.onProgress?.({
          stage: 'retrying',
          progress: 0,
          videoId: session.video.id,
          message: 'Upload link expired. Retrying with a fresh link.',
        });
        continue;
      }

      throw error;
    }
  }

  if (!session) throw new Error('Upload could not be initialized.');

  options.onProgress?.({
    stage: 'finalizing',
    progress: 100,
    uploadProgress: 100,
    videoId: session.video.id,
    message: 'Finalizing upload',
  });

  completedVideo = await completeUpload(session.video.id);

  options.onProgress?.({
    stage: 'finalizing',
    progress: 100,
    uploadProgress: 100,
    videoId: completedVideo.id,
    message: 'Upload finalized',
  });

  if (hasCreatorVideoEdits(options.edits)) {
    options.onProgress?.({
      stage: 'submitting_edits',
      progress: 100,
      uploadProgress: 100,
      videoId: completedVideo.id,
      message: 'Submitting edits',
    });

    await submitEdits(completedVideo.id, options.edits!);
  }

  if (!options.waitForProcessing) {
    const progress: CreatorVideoProgress = {
      video_id: completedVideo.id,
      status: completedVideo.status ?? 'processing',
      progress_percentage: completedVideo.progress_percentage ?? 0,
      message: 'Processing in background',
    };

    options.onProgress?.({
      stage: 'processing',
      progress: 100,
      uploadProgress: 100,
      backendProgress: progress.progress_percentage,
      videoId: completedVideo.id,
      processing: progress,
      message: 'Processing in background',
    });

    return { video: completedVideo, progress };
  }

  options.onProgress?.({
    stage: 'processing',
    progress: 100,
    uploadProgress: 100,
    videoId: completedVideo.id,
    message: 'Processing video',
  });

  const progress = await pollProcessing(completedVideo.id, options);
  const readyVideo = await getCompletedVideo(completedVideo.id, completedVideo);

  return { video: readyVideo, progress };
};

export const creatorVideoDirectUploadService = {
  uploadCreatorVideoDirect,
};
