export type VideoPlaybackFields = {
  streaming_url?: string | null;
  stream_url?: string | null;
  video?: string | null;
  cdn_url?: string | null;
  rendered_url?: string | null;
};

export type VideoPosterFields = {
  poster_url?: string | null;
  thumbnail?: string | null;
  background?: string | null;
  img?: string | null;
  thumbnail_url?: string | null;
};

export type VideoProcessingFields = {
  status?: string | null;
  render_status?: string | null;
  processing_status?: string | null;
  processing_state?: string | null;
  render_completed_at?: string | null;
  metadata?: { edit_status?: string | null } | null;
};

export const getVideoPlaybackUrl = (video: VideoPlaybackFields): string | null =>
  video.streaming_url ??
  video.stream_url ??
  video.video ??
  video.cdn_url ??
  video.rendered_url ??
  null;

export const getVideoPoster = (video: VideoPosterFields): string | null =>
  video.poster_url ??
  video.thumbnail ??
  video.background ??
  video.img ??
  video.thumbnail_url ??
  null;

export const getVideoProcessingState = ({
  status,
  render_status: renderStatus,
  processing_status: processingStatus,
  processing_state: processingState,
  render_completed_at: renderCompletedAt,
  metadata,
}: VideoProcessingFields) => {
  const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? '';
  const statusState = normalize(status);
  const pipelineStates = [renderStatus, processingStatus, processingState, metadata?.edit_status]
    .map(normalize)
    .filter(Boolean);
  const states = [statusState, ...pipelineStates];
  const activeStates = new Set(['queued', 'pending', 'processing', 'rendering', 'rendering_edit', 'awaiting_edit']);
  const readyStates = new Set(['ready', 'completed', 'complete', 'processed', 'succeeded', 'success']);
  const failedStates = new Set(['failed', 'error', 'cancelled', 'canceled']);
  const hasFailed = states.some((state) => failedStates.has(state));
  const hasPipelineState = pipelineStates.length > 0;
  const hasActivePipelineState = pipelineStates.some((state) => activeStates.has(state));
  const isRendering = !hasFailed && (
    hasActivePipelineState
    || (!hasPipelineState && !renderCompletedAt && activeStates.has(statusState))
  );
  const hasReadyState = pipelineStates.some((state) => readyStates.has(state))
    || (!hasActivePipelineState && readyStates.has(statusState));

  return {
    isRendering,
    hasFailed,
    isReady: !hasFailed && !isRendering && (hasReadyState || Boolean(renderCompletedAt)),
  };
};

/** Explicitly marks HLS manifests so Expo Video does not depend on URL inference. */
export const getVideoSource = (url: string | null | undefined) =>
  url
    ? {
        uri: url,
        contentType: /\.m3u8(?:$|[?#])/i.test(url) ? ('hls' as const) : ('auto' as const),
      }
    : null;
