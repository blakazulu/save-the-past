import { create } from 'zustand';

export interface UploadProgress {
  artifactId: string;
  artifactName: string;
  status: 'pending' | 'uploading' | 'optimizing' | 'completed' | 'failed';
  error?: string;
}

interface UploadState {
  uploads: UploadProgress[];
  isVisible: boolean;

  // Actions
  addUpload: (artifactId: string, artifactName: string) => void;
  updateUpload: (artifactId: string, status: UploadProgress['status'], error?: string) => void;
  removeUpload: (artifactId: string) => void;
  clearCompleted: () => void;
  setVisible: (visible: boolean) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: [],
  isVisible: false,

  addUpload: (artifactId, artifactName) =>
    set((state) => {
      // Don't add if already exists
      if (state.uploads.some((u) => u.artifactId === artifactId)) {
        return state;
      }
      return {
        uploads: [...state.uploads, { artifactId, artifactName, status: 'pending' }],
        isVisible: true,
      };
    }),

  updateUpload: (artifactId, status, error) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.artifactId === artifactId ? { ...u, status, error } : u
      ),
      isVisible: true,
    })),

  removeUpload: (artifactId) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.artifactId !== artifactId),
    })),

  clearCompleted: () =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.status !== 'completed'),
      isVisible: state.uploads.some((u) => u.status !== 'completed'),
    })),

  setVisible: (visible) => set({ isVisible: visible }),
}));
