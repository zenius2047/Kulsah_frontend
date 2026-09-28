import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-file-system/legacy', () => ({}));
vi.mock('react-native', () => ({ NativeModules: {} }));

import { createCreatorVideoEditsPayload } from '../src/services/videoOverlayBurnIn.service';

describe('video overlay project coordinates', () => {
  it('keeps editor positions as top-left coordinates in the render project', () => {
    const payload = createCreatorVideoEditsPayload({
      orientation: 'portrait',
      canvasSize: { width: 360, height: 640 },
      strokes: [],
      textStickers: [{
        id: 'caption-1',
        text: 'Same position',
        color: '#FFFFFF',
        backgroundColor: 'transparent',
        x: 100,
        y: 120,
        start: 0,
        end: 5,
        fontSize: 48,
      }],
      generatedAssets: [{
        id: 'caption-asset-1',
        sourceId: 'caption-1',
        kind: 'text',
        file: { uri: 'file:///caption.png', name: 'caption.png', type: 'image/png' },
        width: 80,
        height: 32,
      }],
    });

    const track = payload?.project.scenes[0]?.tracks[0];
    expect(track?.transform.position).toEqual({ x: 200, y: 240 });
    expect(track?.transform.anchor).toEqual({ preset: 'top_left', x: 0, y: 0 });
  });

  it('creates managed picture and music tracks for permanent rendering', () => {
    const payload = createCreatorVideoEditsPayload({
      orientation: 'portrait',
      canvasSize: { width: 360, height: 640 },
      strokes: [],
      textStickers: [],
      imageOverlays: [{ id: 'photo-1', x: 36, y: 64, width: 100, height: 80, start: 0, end: 5 }],
      audioTrack: { id: 'music-1', duration: 5, volume: 1 },
      generatedAssets: [
        {
          id: 'photo-asset-1', sourceId: 'photo-1', kind: 'image',
          file: { uri: 'file:///photo.jpg', name: 'photo.jpg', type: 'image/jpeg' },
          width: 1000, height: 800,
        },
        {
          id: 'music-asset-1', sourceId: 'music-1', kind: 'audio',
          file: { uri: 'file:///music.mp3', name: 'music.mp3', type: 'audio/mpeg' },
          width: 0, height: 0,
        },
      ],
    });

    const tracks = payload?.project.scenes[0]?.tracks ?? [];
    const imageTrack = tracks.find((track) => track.type === 'image');
    const audioTrack = tracks.find((track) => track.type === 'audio');
    expect(imageTrack?.transform.position).toEqual({ x: 72, y: 128 });
    expect(imageTrack?.transform.size).toEqual({ width: 200, height: 160 });
    expect(imageTrack?.transform.anchor).toEqual({ preset: 'top_left', x: 0, y: 0 });
    expect(audioTrack).toMatchObject({
      type: 'audio',
      source: { assetId: 'music-asset-1' },
      audio: { volume: 1 },
    });
    expect(payload?.assetFiles).toHaveLength(2);
  });
});
