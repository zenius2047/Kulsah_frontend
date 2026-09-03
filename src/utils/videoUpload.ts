import type { CreatorVideo, CreatorVideoUploadSession } from '../types/video.types';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as UnknownRecord
    : null;

const firstString = (...values: unknown[]) =>
  values.find((value): value is string => typeof value === 'string' && value.trim() !== '');

const uploadSessionData = (responseBody: unknown) => {
  const root = asRecord(responseBody);
  if (!root) return { root: null, data: null };

  let data: UnknownRecord = root;
  for (let depth = 0; depth < 3 && !asRecord(data.upload); depth += 1) {
    const nested = asRecord(data.data) ?? asRecord(data.item);
    if (!nested || nested === data) break;
    data = nested;
  }

  return { root, data };
};

export const normalizeCreatorVideoUploadSession = (responseBody: unknown): CreatorVideoUploadSession => {
  const { root, data } = uploadSessionData(responseBody);
  const upload = asRecord(data?.upload);
  const videoRecord = asRecord(data?.video);
  const videoId = videoRecord?.id ?? data?.videoId ?? data?.video_id;
  const uploadUrl = firstString(upload?.upload_url, upload?.url);
  const uploadHeaders = asRecord(upload?.upload_headers) ?? asRecord(upload?.headers) ?? undefined;
  const expiresIn = Number(upload?.expiresIn ?? upload?.expires_in);
  const expiresAt = firstString(upload?.expires_at, upload?.expiresAt)
    ?? (Number.isFinite(expiresIn) && expiresIn > 0
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : '');

  if (!upload || !uploadUrl || videoId == null || videoId === '') {
    const backendMessage = firstString(data?.error, root?.error, data?.message, root?.message);
    throw new Error(
      backendMessage
        ? `The backend did not return a valid direct-upload session. ${backendMessage}`
        : 'The backend did not return a valid direct-upload session.',
    );
  }

  const video = videoRecord
    ? { ...videoRecord, id: videoId } as CreatorVideo
    : { id: videoId } as CreatorVideo;

  return {
    video,
    upload: {
      upload_url: uploadUrl,
      upload_headers: uploadHeaders,
      expires_at: expiresAt,
    },
  };
};

export const normalizeCreatorVideoResponse = (responseBody: unknown): CreatorVideo => {
  const root = asRecord(responseBody);
  const data = asRecord(root?.data) ?? asRecord(root?.item) ?? root;
  const nestedData = asRecord(data?.data) ?? data;

  if (!nestedData || nestedData.id == null || nestedData.id === '') {
    const backendMessage = firstString(nestedData?.error, root?.error, nestedData?.message, root?.message);
    throw new Error(
      backendMessage
        ? `The backend did not return the uploaded video. ${backendMessage}`
        : 'The backend did not return the uploaded video.',
    );
  }

  return nestedData as CreatorVideo;
};
