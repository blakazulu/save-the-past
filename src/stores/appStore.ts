import { create } from 'zustand';
import type { ProcessingStatus } from '@/types';

interface AppState {
  currentArtifactId: string | null;
  processingStatus: ProcessingStatus | null;
  isOnline: boolean;

  // Actions
  setCurrentArtifact: (id: string | null) => void;
  setProcessingStatus: (status: ProcessingStatus | null) => void;
  updateProcessingProgress: (progress: number, message?: string) => void;
  setProcessingError: (error: string) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentArtifactId: null,
  processingStatus: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setCurrentArtifact: (id) => set({ currentArtifactId: id }),

  setProcessingStatus: (status) => set({ processingStatus: status }),

  updateProcessingProgress: (progress, message) =>
    set((state) => ({
      processingStatus: state.processingStatus
        ? { ...state.processingStatus, progress, message }
        : null,
    })),

  setProcessingError: (error) =>
    set((state) => ({
      processingStatus: state.processingStatus
        ? { ...state.processingStatus, error }
        : null,
    })),

  setOnlineStatus: (isOnline) => set({ isOnline }),
}));

// Initialize online status listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useAppStore.getState().setOnlineStatus(true));
  window.addEventListener('offline', () => useAppStore.getState().setOnlineStatus(false));
}
