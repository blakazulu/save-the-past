import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useJobsStore, type ProcessingJob } from '@/stores/jobsStore';
import { checkReconstruct3DStatus, generateInfoCard, base64ToBlob } from '@/lib/api/client';
import { db } from '@/lib/db';
import type { Model3D, InfoCard } from '@/types';

const POLL_INTERVAL_MS = 3000;

export function JobProcessor() {
  const navigate = useNavigate();
  const { jobs, updateJob, removeJob, notificationPermission } = useJobsStore();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const processReconstructionJob = useCallback(
    async (job: ProcessingJob) => {
      try {
        const statusResult = await checkReconstruct3DStatus(job.taskId);

        if (!statusResult.success || !statusResult.data) {
          updateJob(job.id, {
            status: 'failed',
            error: statusResult.error || 'Failed to check status',
          });
          return;
        }

        const status = statusResult.data;

        // Update progress
        updateJob(job.id, {
          progress: status.progress,
          status: status.status === 'succeeded' ? 'succeeded' :
                  status.status === 'failed' ? 'failed' : 'processing',
        });

        // Handle completion
        if (status.status === 'succeeded' && status.modelBase64) {
          // Save model to database
          const modelBlob = base64ToBlob(status.modelBase64, 'model/gltf-binary');
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

          await db.models.add(newModel);
          await db.artifacts.update(job.artifactId, {
            model3DId: modelId,
            status: 'processing-info',
            updatedAt: now,
          });

          // Start info card generation if we have image data
          if (job.imageBase64) {
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
                useJobsStore.getState().updateJob(infoCardJobId, {
                  status: 'failed',
                  error: infoResult.error || 'Info card generation failed',
                });
              }
            } catch (err) {
              useJobsStore.getState().updateJob(infoCardJobId, {
                status: 'failed',
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            }

            // Remove info card job after processing
            setTimeout(() => {
              useJobsStore.getState().removeJob(infoCardJobId);
            }, 1000);
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

          // Remove job after a short delay
          setTimeout(() => removeJob(job.id), 2000);
        }

        // Handle failure
        if (status.status === 'failed') {
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
      } catch (err) {
        console.error('Job processing error:', err);
        updateJob(job.id, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    [updateJob, removeJob, showNotification]
  );

  // Poll active jobs
  useEffect(() => {
    const pollJobs = async () => {
      const activeJobs = jobs.filter(
        (job) =>
          job.type === 'reconstruction' &&
          (job.status === 'pending' || job.status === 'processing')
      );

      for (const job of activeJobs) {
        await processReconstructionJob(job);
      }
    };

    // Start polling if we have active jobs
    if (jobs.some((j) => j.status === 'pending' || j.status === 'processing')) {
      pollJobs(); // Poll immediately
      pollingRef.current = setInterval(pollJobs, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [jobs, processReconstructionJob]);

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
