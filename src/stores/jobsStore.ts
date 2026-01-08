import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProcessingJob {
  id: string;
  artifactId: string;
  taskId: string;
  type: 'reconstruction' | 'infoCard';
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  progress: number;
  startedAt: number;
  error?: string;
  // For info card generation after 3D
  imageBase64?: string;
  metadata?: Record<string, unknown>;
}

interface JobsState {
  jobs: ProcessingJob[];
  notificationPermission: NotificationPermission | 'default';
  _hasHydrated: boolean;

  // Actions
  addJob: (job: Omit<ProcessingJob, 'startedAt'>) => void;
  updateJob: (id: string, updates: Partial<ProcessingJob>) => void;
  removeJob: (id: string) => void;
  getJobByArtifactId: (artifactId: string) => ProcessingJob | undefined;
  getActiveJobs: () => ProcessingJob[];
  setNotificationPermission: (permission: NotificationPermission) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: [],
      notificationPermission: 'default',
      _hasHydrated: false,

      addJob: (job) =>
        set((state) => ({
          jobs: [...state.jobs, { ...job, startedAt: Date.now() }],
        })),

      updateJob: (id, updates) =>
        set((state) => ({
          jobs: state.jobs.map((job) =>
            job.id === id ? { ...job, ...updates } : job
          ),
        })),

      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((job) => job.id !== id),
        })),

      getJobByArtifactId: (artifactId) => {
        return get().jobs.find((job) => job.artifactId === artifactId);
      },

      getActiveJobs: () => {
        return get().jobs.filter(
          (job) => job.status === 'pending' || job.status === 'processing'
        );
      },

      setNotificationPermission: (permission) =>
        set({ notificationPermission: permission }),

      setHasHydrated: (hasHydrated) =>
        set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'save-the-past-jobs',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook to wait for hydration
export function useJobsHydrated() {
  return useJobsStore((state) => state._hasHydrated);
}
