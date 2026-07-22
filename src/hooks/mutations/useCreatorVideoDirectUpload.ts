import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { uploadCreatorVideoDirect } from '../../services/creatorVideoDirectUpload.service';
import type {
  CreatorVideoDirectUploadOptions,
  CreatorVideoDirectUploadProgress,
} from '../../services/creatorVideoDirectUpload.service';
import type {
  CreatorVideo,
  CreatorVideoProgress,
  CreatorVideoUploadStatus,
  UploadCreatorVideoPayload,
} from '../../types/video.types';
import { CREATOR_VIDEO_ANALYTICS_QUERY_KEY } from '../queries/useCreatorVideoAnalytics';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';

export type CreatorVideoDirectUploadState = {
  status: CreatorVideoUploadStatus;
  progress: number;
  uploadProgress: number;
  backendProgress: number;
  videoId?: string | number;
  video?: CreatorVideo;
  processing?: CreatorVideoProgress;
  error?: string;
};

const initialState: CreatorVideoDirectUploadState = {
  status: 'idle',
  progress: 0,
  uploadProgress: 0,
  backendProgress: 0,
};

const toStatus = (stage: CreatorVideoDirectUploadProgress['stage']): CreatorVideoUploadStatus => {
  if (stage === 'retrying') return 'initializing';
  return stage;
};

export const useCreatorVideoDirectUpload = () => {
  const queryClient = useQueryClient();
  const cancelledRef = useRef(false);
  const [state, setState] = useState<CreatorVideoDirectUploadState>(initialState);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setState(initialState);
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const upload = useCallback(
    async (
      payload: UploadCreatorVideoPayload,
      options: Pick<CreatorVideoDirectUploadOptions, 'edits' | 'waitForProcessing'> = {},
    ) => {
      cancelledRef.current = false;
      setState({ ...initialState, status: 'initializing' });

      try {
        const result = await uploadCreatorVideoDirect(payload, {
          ...options,
          shouldCancel: () => cancelledRef.current,
          onProgress: (progress) => {
            setState((current) => ({
              ...current,
              status: toStatus(progress.stage),
              progress: Math.round(progress.progress),
              uploadProgress: progress.uploadProgress ?? current.uploadProgress,
              backendProgress: progress.backendProgress ?? current.backendProgress,
              videoId: progress.videoId ?? current.videoId,
              processing: progress.processing ?? current.processing,
              error: undefined,
            }));
          },
        });

        const finalStatus = result.progress.status === 'ready' ? 'ready' : 'processing';

        setState((current) => ({
          ...current,
          status: finalStatus,
          progress: 100,
          uploadProgress: 100,
          backendProgress: result.progress.progress_percentage ?? current.backendProgress,
          videoId: result.video.id,
          video: result.video,
          processing: result.progress,
        }));

        void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_ANALYTICS_QUERY_KEY });

        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Video upload failed.';
        setState((current) => ({
          ...current,
          status: 'failed',
          error: message,
          processing: current.processing
            ? { ...current.processing, status: 'failed', error: message }
            : current.processing,
        }));
        throw error;
      }
    },
    [queryClient],
  );

  const retry = useCallback(
    (
      payload: UploadCreatorVideoPayload,
      options: Pick<CreatorVideoDirectUploadOptions, 'edits' | 'waitForProcessing'> = {},
    ) => {
      return upload(payload, options);
    },
    [upload],
  );

  return {
    ...state,
    isActive: ['initializing', 'uploading', 'finalizing', 'submitting_edits'].includes(state.status),
    upload,
    retry,
    cancel,
    reset,
  };
};
