import { describe, expect, it } from 'vitest';
import { getVideoProcessingState } from '../src/utils/video';

describe('video processing state', () => {
  it('recognizes backend terminal status aliases', () => {
    expect(getVideoProcessingState({ status: 'completed' }).isReady).toBe(true);
    expect(getVideoProcessingState({ status: 'processing', render_completed_at: '2026-09-28T00:00:00Z' }).isReady).toBe(true);
  });

  it('does not let a source-ready status override an active edit render', () => {
    expect(getVideoProcessingState({ status: 'ready', render_status: 'processing' })).toMatchObject({
      isRendering: true,
      isReady: false,
      hasFailed: false,
    });
  });

  it('uses the render completion timestamp when no active state remains', () => {
    expect(getVideoProcessingState({ render_completed_at: '2026-09-28T00:00:00Z' }).isReady).toBe(true);
  });
});
