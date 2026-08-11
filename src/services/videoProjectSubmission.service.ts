import type { SubmitCreatorVideoEditsPayload } from '../types/video.types';
import type { VideoProjectV3 } from '../types/videoProject.types';

const assertPositive = (value: number, label: string) => {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be greater than zero.`);
};

export const validateVideoProjectV3 = (project: VideoProjectV3, assetFileCount: number) => {
  if (!project.schemaVersion) throw new Error('Video project schemaVersion is required.');
  assertPositive(project.canvas.width, 'Canvas width');
  assertPositive(project.canvas.height, 'Canvas height');
  if (!project.scenes.length) throw new Error('Video project must contain at least one scene.');

  const assets = project.assets ?? [];
  const assetIds = new Set(assets.map((asset) => asset.id));
  const referencedFileIndexes = new Set<number>();
  assets.forEach((asset) => {
    const fileIndex = asset.file_index ?? asset.fileIndex;
    if ((asset.type === 'image' || asset.type === 'drawing') && fileIndex === undefined) {
      throw new Error(`Generated asset ${asset.id} must reference an asset file.`);
    }
    if (fileIndex !== undefined && (fileIndex < 0 || fileIndex >= assetFileCount)) {
      throw new Error(`Asset ${asset.id} points to missing asset_files[${fileIndex}].`);
    }
    if (fileIndex !== undefined) referencedFileIndexes.add(fileIndex);
    if (asset.url?.startsWith('file:')) throw new Error(`Asset ${asset.id} cannot contain a local file URL.`);
    if ((asset.type === 'image' || asset.type === 'drawing') && fileIndex !== undefined) {
      assertPositive(asset.width ?? 0, `Asset ${asset.id} width`);
      assertPositive(asset.height ?? 0, `Asset ${asset.id} height`);
    }
  });
  for (let index = 0; index < assetFileCount; index += 1) {
    if (!referencedFileIndexes.has(index)) throw new Error(`asset_files[${index}] has no matching project asset.`);
  }

  project.scenes.forEach((scene) => {
    if (!Array.isArray(scene.tracks)) throw new Error(`Scene ${scene.id} must contain a tracks array.`);
    scene.tracks.forEach((track) => {
      assertPositive(track.timeline.duration, `Track ${track.id} duration`);
      const source = track.source as { assetId?: string } | undefined;
      if ((track.type === 'image' || track.type === 'drawing') && !source?.assetId) {
        throw new Error(`Track ${track.id} must reference a generated asset.`);
      }
      if (source?.assetId && !assetIds.has(source.assetId)) {
        throw new Error(`Track ${track.id} references missing asset ${source.assetId}.`);
      }
      const size = track.transform.size;
      if ((track.type === 'image' || track.type === 'drawing') && size) {
        assertPositive(size.width ?? 0, `Track ${track.id} width`);
        assertPositive(size.height ?? 0, `Track ${track.id} height`);
      }
    });
  });
};

export const createVideoProjectV3FormData = ({ project, assetFiles }: SubmitCreatorVideoEditsPayload) => {
  validateVideoProjectV3(project, assetFiles.length);
  const formData = new FormData();
  formData.append('schemaVersion', project.schemaVersion);
  formData.append('metadata', JSON.stringify(project.metadata));
  formData.append('canvas', JSON.stringify(project.canvas));
  formData.append('output', JSON.stringify(project.output));
  formData.append('assets', JSON.stringify(project.assets ?? []));
  formData.append('scenes', JSON.stringify(project.scenes));
  formData.append('globalAudioTracks', JSON.stringify(project.globalAudioTracks ?? []));
  formData.append('globalEffects', JSON.stringify(project.globalEffects ?? []));
  formData.append('guides', JSON.stringify(project.guides ?? {}));
  assetFiles.forEach((file, index) => {
    formData.append(`asset_files[${index}]`, {
      uri: file.uri,
      name: file.name ?? `edit-asset-${index}.png`,
      type: file.type ?? 'image/png',
    } as any);
  });
  return formData;
};
