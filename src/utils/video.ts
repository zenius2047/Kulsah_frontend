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

export const getVideoProcessingState = ({ status, render_status: renderStatus }: VideoProcessingFields) => ({
  isRendering: status === 'processing' || renderStatus === 'processing',
  hasFailed: status === 'failed' || renderStatus === 'failed',
  isReady: status === 'ready' && (!renderStatus || renderStatus === 'ready'),
});

/** Explicitly marks HLS manifests so Expo Video does not depend on URL inference. */
export const getVideoSource = (url: string | null | undefined) =>
  url
    ? {
        uri: url,
        contentType: /\.m3u8(?:$|[?#])/i.test(url) ? ('hls' as const) : ('auto' as const),
      }
    : null;
