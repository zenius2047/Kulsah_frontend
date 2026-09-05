import api from './client';
import { endpoints } from './endpoints';
import type { MusicBrowseParams, MusicBrowseResponse, MusicTrackResponse } from '../types/music.types';

export const musicApi = {
  browse: (params?: MusicBrowseParams) =>
    api.get<MusicBrowseResponse>(endpoints.creator.music, { params }),
  getTrack: (track: string) =>
    api.get<MusicTrackResponse>(endpoints.creator.musicTrack(track)),
};
