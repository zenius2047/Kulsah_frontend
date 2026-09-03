import { describe, expect, it } from 'vitest';
import {
  normalizeCreatorVideoResponse,
  normalizeCreatorVideoUploadSession,
} from '../src/utils/videoUpload';
import { endpoints } from '../src/api/endpoints';

describe('creator direct-upload response normalization', () => {
  it('uses the unified retry route and creator duet route', () => {
    expect(endpoints.creator.videoRetryProcessing(42)).toBe('media/videos/42/retry-processing');
    expect(endpoints.creator.videoDuetDraft(42)).toBe('creator/videos/42/duet-draft');
  });
  it('supports the latest media upload response', () => {
    const session = normalizeCreatorVideoUploadSession({
      message: 'Created',
      data: {
        videoId: 42,
        video: { id: 42, title: 'Challenge video' },
        upload: {
          method: 'PUT',
          url: 'https://storage.example/upload',
          headers: { 'Content-Type': 'video/mp4' },
          expiresAt: '2026-08-18T12:00:00.000Z',
        },
      },
    });

    expect(session.video.id).toBe(42);
    expect(session.upload.upload_url).toBe('https://storage.example/upload');
    expect(session.upload.upload_headers).toEqual({ 'Content-Type': 'video/mp4' });
  });

  it('supports legacy and unwrapped upload responses', () => {
    const session = normalizeCreatorVideoUploadSession({
      video: { id: 9 },
      upload: {
        upload_url: 'https://storage.example/legacy-upload',
        upload_headers: {},
        expires_at: '2026-08-18T12:00:00.000Z',
      },
    });

    expect(session.video.id).toBe(9);
    expect(session.upload.upload_url).toBe('https://storage.example/legacy-upload');
  });

  it('reports an invalid response without dereferencing upload', () => {
    expect(() => normalizeCreatorVideoUploadSession({ message: 'Storage is not configured.' }))
      .toThrow(/Storage is not configured/);
  });

  it('unwraps completed video responses', () => {
    expect(normalizeCreatorVideoResponse({ data: { id: 42, status: 'processing' } }))
      .toMatchObject({ id: 42, status: 'processing' });
  });
});
