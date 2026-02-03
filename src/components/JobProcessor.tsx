import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useJobsStore, useJobsHydrated, type ProcessingJob } from '@/stores/jobsStore';
import { checkReconstruct3DStatus, generateInfoCard, base64ToBlob } from '@/lib/api/client';
import { db } from '@/lib/db';
import { enqueueMuseumUpload } from '@/lib/firebase/uploadQueue';
import { optimizeModel } from '@/lib/firebase/modelOptimizer';
import { logger } from '@/lib/utils/logger';
import type { Model3D, InfoCard } from '@/types';

// Smart polling intervals
const FAST_POLL_INTERVAL_MS = 10000; // 10 seconds for first minute
const SLOW_POLL_INTERVAL_MS = 30000; // 30 seconds after first minute
const FAST_POLL_DURATION_MS = 60000; // First minute uses fast polling

export function JobProcessor() {
  const navigate = useNavigate();
  const { jobs, updateJob, removeJob, notificationPermission } = useJobsStore();
  const hasHydrated = useJobsHydrated();

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // We'll request permission when user starts a job
    }
  }, []);

  const showNotification = useCallback(
    (title: string, body: string, artifactId: string) => {
      if (notificationPermission !== 'granted') return;

      const notification = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `job-${artifactId}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        navigate(`/artifact/${artifactId}`);
        notification.close();
      };
    },
    [navigate, notificationPermission]
  );

  // Track retry counts for network errors
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const MAX_RETRIES = 3;

  const processReconstructionJob = useCallback(
    async (job: ProcessingJob) => {
      try {
        const statusResult = await checkReconstruct3DStatus(job.taskId);

        if (!statusResult.success || !statusResult.data) {
          // Check if this is a network error (Failed to fetch)
          const isNetworkError = statusResult.error?.includes('fetch') ||
                                  statusResult.error?.includes('network') ||
                                  statusResult.error?.includes('Failed to');

          if (isNetworkError) {
            const retryCount = retryCountRef.current.get(job.id) || 0;
            if (retryCount < MAX_RETRIES) {
              // Increment retry count and try again on next poll
              retryCountRef.current.set(job.id, retryCount + 1);
              logger.log(`Network error for job ${job.id}, retry ${retryCount + 1}/${MAX_RETRIES}`);
              return; // Don't mark as failed yet, will retry on next poll
            }
            // Clear retry count after max retries
            retryCountRef.current.delete(job.id);
          }

          updateJob(job.id, {
            status: 'failed',
            error: statusResult.error || 'Failed to check status',
          });
          // Update artifact status to error
          await db.artifacts.update(job.artifactId, {
            status: 'error',
            updatedAt: new Date(),
          });
          return;
        }

        // Reset retry count on successful response
        retryCountRef.current.delete(job.id);

        const status = statusResult.data;

        // Update progress
        updateJob(job.id, {
          progress: status.progress,
          status: status.status === 'succeeded' ? 'succeeded' :
                  status.status === 'failed' ? 'failed' : 'processing',
        });

        // Handle completion
        if (status.status === 'succeeded' && status.modelBase64) {
          // Clear retry count for this job
          retryCountRef.current.delete(job.id);

          // Check if artifact still exists (user might have deleted it)
          const artifactExists = await db.artifacts.get(job.artifactId);
          if (!artifactExists) {
            removeJob(job.id);
            return;
          }

          // Save model to database
          const rawModelBlob = base64ToBlob(status.modelBase64, 'model/gltf-binary');

          // Optimize model before storing (reduces size by 50-70%)
          const modelBlob = await optimizeModel(rawModelBlob);

          const modelId = uuidv4();
          const now = new Date();

          const newModel: Model3D = {
            id: modelId,
            artifactId: job.artifactId,
            blob: modelBlob,
            format: 'glb',
            createdAt: now,
            source: '3d-single',
            metadata: {
              fileSize: modelBlob.size,
            },
          };

          // Use transaction for atomic operations
          await db.transaction('rw', [db.models, db.artifacts], async () => {
            await db.models.add(newModel);
            await db.artifacts.update(job.artifactId, {
              model3DId: modelId,
              status: 'processing-info',
              updatedAt: now,
            });
          });

          // Start info card generation if we have image data
          if (job.imageBase64) {
            // Check if artifact still exists (user might have deleted it during 3D processing)
            const artifactStillExists = await db.artifacts.get(job.artifactId);
            if (!artifactStillExists) {
              removeJob(job.id);
              return;
            }

            const infoCardJobId = uuidv4();
            useJobsStore.getState().addJob({
              id: infoCardJobId,
              artifactId: job.artifactId,
              taskId: '', // Info card is synchronous for now
              type: 'infoCard',
              status: 'processing',
              progress: 0,
              imageBase64: job.imageBase64,
              metadata: job.metadata,
            });

            // Generate info card
            try {
              const infoResult = await generateInfoCard({
                imageBase64: job.imageBase64,
                metadata: job.metadata as Record<string, string>,
              });

              if (infoResult.success && infoResult.data?.infoCard) {
                const infoCardId = uuidv4();
                const analysis = infoResult.data.infoCard;
                const infoCard: InfoCard = {
                  id: infoCardId,
                  artifactId: job.artifactId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  material: analysis.material,
                  estimatedAge: analysis.estimatedAge,
                  possibleUse: analysis.possibleUse,
                  culturalContext: analysis.culturalContext,
                  similarArtifacts: analysis.similarArtifacts,
                  preservationNotes: analysis.preservationNotes,
                  aiModel: analysis.aiModel,
                  aiConfidence: analysis.aiConfidence,
                  isHumanEdited: analysis.isHumanEdited,
                  disclaimer: analysis.disclaimer,
                };

                await db.infoCards.add(infoCard);
                await db.artifacts.update(job.artifactId, {
                  infoCardId,
                  status: 'complete',
                  updatedAt: new Date(),
                });

                useJobsStore.getState().updateJob(infoCardJobId, {
                  status: 'succeeded',
                  progress: 100,
                });
              } else {
                // Info card failed but 3D model is ready - mark as complete anyway
                useJobsStore.getState().updateJob(infoCardJobId, {
                  status: 'failed',
                  error: infoResult.error || 'Info card generation failed',
                });
                await db.artifacts.update(job.artifactId, {
                  status: 'complete',
                  updatedAt: new Date(),
                });
              }
            } catch (err) {
              // Info card failed but 3D model is ready - mark as complete anyway
              useJobsStore.getState().updateJob(infoCardJobId, {
                status: 'failed',
                error: err instanceof Error ? err.message : 'Unknown error',
              });
              await db.artifacts.update(job.artifactId, {
                status: 'complete',
                updatedAt: new Date(),
              });
            }

            // Remove info card job after processing (success or failure)
            setTimeout(() => {
              useJobsStore.getState().removeJob(infoCardJobId);
            }, 2000);
          } else {
            // No info card to generate, mark as complete
            await db.artifacts.update(job.artifactId, {
              status: 'complete',
              updatedAt: new Date(),
            });
          }

          // Show notification
          showNotification(
            '3D Model Ready!',
            'Your artifact has been reconstructed. Tap to view.',
            job.artifactId
          );

          // Queue for museum upload (fire-and-forget)
          enqueueMuseumUpload(job.artifactId).catch((err) => {
            logger.error('Failed to enqueue museum upload:', err);
          });

          // Remove job after a short delay
          setTimeout(() => removeJob(job.id), 2000);
        }

        // Handle failure
        if (status.status === 'failed') {
          // Clear retry count for this job
          retryCountRef.current.delete(job.id);

          // Check if artifact still exists before updating
          const artifactExists = await db.artifacts.get(job.artifactId);
          if (artifactExists) {
            await db.artifacts.update(job.artifactId, {
              status: 'error',
              updatedAt: new Date(),
            });

            showNotification(
              'Reconstruction Failed',
              status.error || 'Please try again.',
              job.artifactId
            );
          }
        }
      } catch (err) {
        logger.error('Job processing error:', err);
        // Clear retry count for this job
        retryCountRef.current.delete(job.id);

        updateJob(job.id, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        // Update artifact status to error (check existence first)
        const artifactExists = await db.artifacts.get(job.artifactId);
        if (artifactExists) {
          await db.artifacts.update(job.artifactId, {
            status: 'error',
            updatedAt: new Date(),
          });
        }
      }
    },
    [updateJob, removeJob, showNotification]
  );

  // Track polling state
  const pollingStartTimeRef = useRef<number>(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPollingRef = useRef<boolean>(false);

  // Get current polling interval based on how long we've been polling
  const getCurrentPollInterval = useCallback(() => {
    const elapsed = Date.now() - pollingStartTimeRef.current;
    return elapsed < FAST_POLL_DURATION_MS ? FAST_POLL_INTERVAL_MS : SLOW_POLL_INTERVAL_MS;
  }, []);

  // Single poll cycle
  const doPoll = useCallback(async () => {
    // Get fresh jobs from store
    const currentJobs = useJobsStore.getState().jobs;
    const activeJobs = currentJobs.filter(
      (job) =>
        job.type === 'reconstruction' &&
        (job.status === 'pending' || job.status === 'processing')
    );

    for (const job of activeJobs) {
      await processReconstructionJob(job);
    }

    return activeJobs.length > 0;
  }, [processReconstructionJob]);

  // Schedule next poll with adaptive interval
  const scheduleNextPoll = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Check if we still have active jobs
    const currentJobs = useJobsStore.getState().jobs;
    const hasActiveJobs = currentJobs.some((j) => j.status === 'pending' || j.status === 'processing');

    if (!hasActiveJobs) {
      isPollingRef.current = false;
      return;
    }

    const interval = getCurrentPollInterval();
    timeoutRef.current = setTimeout(async () => {
      const stillHasJobs = await doPoll();
      if (stillHasJobs) {
        scheduleNextPoll();
      } else {
        isPollingRef.current = false;
      }
    }, interval);
  }, [getCurrentPollInterval, doPoll]);

  // Start polling if not already polling
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    isPollingRef.current = true;
    pollingStartTimeRef.current = Date.now();

    // Poll immediately, then schedule next
    doPoll().then((hasJobs) => {
      if (hasJobs) {
        scheduleNextPoll();
      } else {
        isPollingRef.current = false;
      }
    });
  }, [doPoll, scheduleNextPoll]);

  // Check if we need to start polling when jobs change or hydration completes
  useEffect(() => {
    if (!hasHydrated) return;

    const hasActiveJobs = jobs.some((j) => j.status === 'pending' || j.status === 'processing');

    if (hasActiveJobs && !isPollingRef.current) {
      startPolling();
    }

    // Note: Don't clear timeout in cleanup here - job updates during polling
    // would trigger cleanup and stop the polling prematurely.
    // Polling stops itself when no more active jobs (in scheduleNextPoll).
  }, [hasHydrated, jobs, startPolling]);

  // Cleanup timeout only on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, []);

  // Handle visibility change - poll immediately when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasHydrated) {
        const currentJobs = useJobsStore.getState().jobs;
        const hasActiveJobs = currentJobs.some((j) => j.status === 'pending' || j.status === 'processing');
        if (hasActiveJobs) {
          // Reset polling timer and poll immediately
          pollingStartTimeRef.current = Date.now();
          doPoll().then((hasJobs) => {
            if (hasJobs && !isPollingRef.current) {
              isPollingRef.current = true;
              scheduleNextPoll();
            }
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasHydrated, doPoll, scheduleNextPoll]);

  // This component doesn't render anything
  return null;
}

// Hook to request notification permission
export function useRequestNotificationPermission() {
  const setNotificationPermission = useJobsStore(
    (state) => state.setNotificationPermission
  );

  return useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied' as NotificationPermission;
    }

    if (Notification.permission === 'granted') {
      setNotificationPermission('granted');
      return 'granted' as NotificationPermission;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, [setNotificationPermission]);
}
