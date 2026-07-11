import { create } from 'zustand';

export type CreatorVideoUploadTask = {
  id: string;
  status: 'uploading' | 'uploaded' | 'failed';
  videoId?: string | number;
  progressPercentage: number;
  processingStatus?: string;
  error?: string;
};

type CreatorVideoUploadState = {
  tasks: Record<string, CreatorVideoUploadTask>;
  startTask: (id: string) => void;
  attachVideoId: (id: string, payload: { videoId: string | number; progressPercentage?: number; processingStatus?: string }) => void;
  completeTask: (id: string, payload: { videoId: string | number; progressPercentage?: number; processingStatus?: string }) => void;
  failTask: (id: string, error: string) => void;
  updateTaskProgress: (id: string, payload: { progressPercentage?: number; processingStatus?: string }) => void;
  clearTask: (id: string) => void;
};

export const useCreatorVideoUploadStore = create<CreatorVideoUploadState>((set) => ({
  tasks: {},
  startTask: (id) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          id,
          status: 'uploading',
          progressPercentage: 0,
          processingStatus: 'uploading',
        },
      },
    })),
  attachVideoId: (id, payload) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          id,
          status: 'uploading',
          videoId: payload.videoId,
          progressPercentage: payload.progressPercentage ?? state.tasks[id]?.progressPercentage ?? 0,
          processingStatus: payload.processingStatus ?? state.tasks[id]?.processingStatus ?? 'uploading',
        },
      },
    })),
  completeTask: (id, payload) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          id,
          status: 'uploaded',
          videoId: payload.videoId,
          progressPercentage: payload.progressPercentage ?? state.tasks[id]?.progressPercentage ?? 0,
          processingStatus: payload.processingStatus ?? state.tasks[id]?.processingStatus ?? 'processing',
        },
      },
    })),
  failTask: (id, error) =>
    set((state) => ({
      tasks: {
        ...state.tasks,
        [id]: {
          id,
          status: 'failed',
          progressPercentage: state.tasks[id]?.progressPercentage ?? 0,
          processingStatus: 'failed',
          error,
        },
      },
    })),
  updateTaskProgress: (id, payload) =>
    set((state) => {
      const task = state.tasks[id];
      if (!task) return state;

      return {
        tasks: {
          ...state.tasks,
          [id]: {
            ...task,
            progressPercentage: payload.progressPercentage ?? task.progressPercentage,
            processingStatus: payload.processingStatus ?? task.processingStatus,
          },
        },
      };
    }),
  clearTask: (id) =>
    set((state) => {
      const { [id]: _removed, ...tasks } = state.tasks;
      return { tasks };
    }),
}));
