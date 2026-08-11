import { useMutation, useQueryClient } from '@tanstack/react-query';
import { videoApi } from '../../api/video.api';
import type {
  BulkAddCreatorVideoPlaylistVideosPayload,
  CreateCreatorVideoPlaylistPayload,
  UpdateCreatorVideoPlaylistPayload,
} from '../../types/video.types';
import { CREATOR_VIDEOS_QUERY_KEY } from '../queries/useCreatorVideos';
import {
  CREATOR_VIDEO_PLAYLISTS_QUERY_KEY,
  CREATOR_VIDEO_PLAYLIST_PLAYBACK_QUERY_KEY,
  CREATOR_VIDEO_PLAYLIST_QUERY_KEY,
} from '../queries/useCreatorVideoPlaylists';

const invalidatePlaylistData = (
  queryClient: ReturnType<typeof useQueryClient>,
  playlist?: string | number,
  videoIds: Array<string | number> = [],
) => {
  void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEO_PLAYLISTS_QUERY_KEY });
  void queryClient.invalidateQueries({ queryKey: CREATOR_VIDEOS_QUERY_KEY });

  if (playlist != null) {
    void queryClient.invalidateQueries({ queryKey: [...CREATOR_VIDEO_PLAYLIST_QUERY_KEY, playlist] });
    void queryClient.invalidateQueries({ queryKey: [...CREATOR_VIDEO_PLAYLIST_PLAYBACK_QUERY_KEY, playlist] });
  }

  videoIds.forEach((video) => {
    void queryClient.invalidateQueries({ queryKey: ['creator', 'videos', video] });
  });
};

export const useCreateCreatorVideoPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCreatorVideoPlaylistPayload) => {
      const response = await videoApi.createCreatorVideoPlaylist(payload);
      console.log('[Playlists] Create response:', response.data);
      return response.data;
    },
    onSuccess: () => invalidatePlaylistData(queryClient),
  });
};

export const useUpdateCreatorVideoPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlist,
      payload,
    }: {
      playlist: string | number;
      payload: UpdateCreatorVideoPlaylistPayload;
    }) => {
      const response = await videoApi.updateCreatorVideoPlaylist(playlist, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => invalidatePlaylistData(queryClient, variables.playlist),
  });
};

export const useDeleteCreatorVideoPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlist: string | number) => {
      const response = await videoApi.deleteCreatorVideoPlaylist(playlist);
      return response.data;
    },
    onMutate: async (playlist) => {
      await queryClient.cancelQueries({ queryKey: CREATOR_VIDEO_PLAYLISTS_QUERY_KEY });

      const previousPlaylistLists = queryClient.getQueriesData({ queryKey: CREATOR_VIDEO_PLAYLISTS_QUERY_KEY });
      const playlistId = Number(playlist);

      previousPlaylistLists.forEach(([queryKey, value]) => {
        if (!value || typeof value !== 'object' || !Array.isArray((value as any).data)) return;

        queryClient.setQueryData(queryKey, {
          ...(value as any),
          data: (value as any).data.filter((item: any) => Number(item.id) !== playlistId),
          meta: (value as any).meta
            ? {
                ...(value as any).meta,
                total: Math.max(0, Number((value as any).meta.total ?? 0) - 1),
              }
            : (value as any).meta,
        });
      });

      return { previousPlaylistLists };
    },
    onError: (_error, _playlist, context) => {
      context?.previousPlaylistLists?.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });
    },
    onSuccess: (_data, playlist) => invalidatePlaylistData(queryClient, playlist),
  });
};

export const useAddCreatorVideoToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlist, video }: { playlist: string | number; video: string | number }) => {
      const response = await videoApi.addCreatorVideoToPlaylist(playlist, video);
      return response.data;
    },
    onSuccess: (_data, variables) => invalidatePlaylistData(queryClient, variables.playlist, [variables.video]),
  });
};

export const useBulkAddCreatorVideosToPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlist,
      payload,
    }: {
      playlist: string | number;
      payload: BulkAddCreatorVideoPlaylistVideosPayload;
    }) => {
      const response = await videoApi.bulkAddCreatorVideosToPlaylist(playlist, payload);
      return response.data;
    },
    onSuccess: (_data, variables) => invalidatePlaylistData(queryClient, variables.playlist, variables.payload.video_ids),
  });
};

export const useRemoveCreatorVideoFromPlaylist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlist, video }: { playlist: string | number; video: string | number }) => {
      const response = await videoApi.removeCreatorVideoFromPlaylist(playlist, video);
      return response.data;
    },
    onSuccess: (_data, variables) => invalidatePlaylistData(queryClient, variables.playlist, [variables.video]),
  });
};
