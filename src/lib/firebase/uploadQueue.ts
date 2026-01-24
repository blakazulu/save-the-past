import { v4 as uuidv4 } from 'uuid';
import { db, getArtifactWithRelations } from '@/lib/db';
import { uploadToMuseum } from './museumService';
import { useUploadStore } from '@/stores';
import type { PendingMuseumUpload } from '@/types/museum';

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS = [0, 5000, 15000, 45000, 120000]; // ms

// Guard to prevent multiple initializations
let isInitialized = false;

// Lock to prevent concurrent queue processing
let isProcessing = false;

export async function enqueueMuseumUpload(artifactId: string): Promise<string> {
  const uploadId = uuidv4();
  const now = new Date();

  const upload: PendingMuseumUpload = {
    id: uploadId,
    artifactId,
    status: 'pending',
    attempts: 0,
    createdAt: now,
  };

  await db.pendingUploads.add(upload);
  console.log(`[Museum Upload] Enqueued artifact ${artifactId} for upload (uploadId: ${uploadId})`);

  // Try to process immediately
  processUploadQueue();

  return uploadId;
}

export async function processUploadQueue(): Promise<void> {
  // Prevent concurrent processing
  if (isProcessing) {
    console.log('[Museum Upload] Queue already processing, skipping');
    return;
  }
  isProcessing = true;

  try {
    // Get all pending uploads (not already uploading)
    const pendingUploads = await db.pendingUploads
      .where('status')
      .equals('pending')
      .toArray();

    console.log(`[Museum Upload] Processing queue: ${pendingUploads.length} pending uploads`);

    for (const upload of pendingUploads) {
      // Skip if too many attempts
      if (upload.attempts >= MAX_ATTEMPTS) {
        console.log(`[Museum Upload] Max attempts reached for ${upload.artifactId}, marking as failed`);
        await db.pendingUploads.update(upload.id, { status: 'failed' });
        continue;
      }

      // Check if enough time has passed since last attempt
      if (upload.lastAttempt) {
        const delay = RETRY_DELAYS[Math.min(upload.attempts, RETRY_DELAYS.length - 1)];
        const timeSinceLastAttempt = Date.now() - upload.lastAttempt.getTime();
        if (timeSinceLastAttempt < delay) {
          console.log(`[Museum Upload] Waiting for retry delay for ${upload.artifactId}`);
          continue;
        }
      }

      await processUpload(upload);
    }
  } finally {
    isProcessing = false;
  }
}

async function processUpload(upload: PendingMuseumUpload): Promise<void> {
  const newAttempts = upload.attempts + 1;
  const store = useUploadStore.getState();

  console.log(`[Museum Upload] Starting upload for artifact ${upload.artifactId} (attempt ${newAttempts})`);

  // Update status to uploading and increment attempts
  await db.pendingUploads.update(upload.id, {
    status: 'uploading',
    lastAttempt: new Date(),
    attempts: newAttempts,
  });

  try {
    // Get artifact with relations
    const data = await getArtifactWithRelations(upload.artifactId);

    if (!data || !data.artifact) {
      // Artifact was deleted, remove from queue
      console.log(`[Museum Upload] Artifact ${upload.artifactId} was deleted, removing from queue`);
      await db.pendingUploads.delete(upload.id);
      store.removeUpload(upload.artifactId);
      return;
    }

    const artifactName = data.artifact.metadata.name || 'Unnamed Artifact';
    console.log(`[Museum Upload] Uploading "${artifactName}" - has model: ${!!data.model}, has infoCard: ${!!data.infoCard}`);

    // Add to UI progress (or update if exists)
    store.addUpload(upload.artifactId, artifactName);
    store.updateUpload(upload.artifactId, 'uploading');

    // Get thumbnail source
    const thumbnailSource = data.artifact.thumbnailBlob || data.images[0]?.blob;

    if (!thumbnailSource) {
      // No thumbnail, mark as failed
      console.log(`[Museum Upload] No thumbnail available for ${upload.artifactId}`);
      await db.pendingUploads.update(upload.id, {
        status: 'failed',
        error: 'No thumbnail available',
      });
      store.updateUpload(upload.artifactId, 'failed', 'No thumbnail available');
      return;
    }

    // Update to optimizing if there's a model
    if (data.model?.blob) {
      console.log(`[Museum Upload] Optimizing model for ${upload.artifactId} (${(data.model.blob.size / 1024).toFixed(1)} KB)`);
      store.updateUpload(upload.artifactId, 'optimizing');
    }

    // Upload to museum
    console.log(`[Museum Upload] Uploading to Firebase for ${upload.artifactId}...`);
    await uploadToMuseum({
      artifact: data.artifact,
      model: data.model,
      infoCard: data.infoCard,
      thumbnailSource,
    });

    // Success! Update local artifact and remove from queue
    await db.artifacts.update(upload.artifactId, {
      uploadedToMuseum: true,
      museumUploadedAt: new Date(),
    });

    await db.pendingUploads.delete(upload.id);

    store.updateUpload(upload.artifactId, 'completed');
    console.log(`[Museum Upload] Successfully uploaded artifact ${upload.artifactId} to museum`);
  } catch (error) {
    console.error(`[Museum Upload] Failed to upload artifact ${upload.artifactId}:`, error);

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const finalStatus = newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending';

    // Don't re-increment attempts - already done above
    await db.pendingUploads.update(upload.id, {
      status: finalStatus,
      error: errorMsg,
    });

    store.updateUpload(upload.artifactId, finalStatus === 'failed' ? 'failed' : 'pending', errorMsg);
  }
}

// Retry all failed uploads
export async function retryFailedUploads(): Promise<void> {
  await db.pendingUploads
    .where('status')
    .equals('failed')
    .modify({ status: 'pending', attempts: 0 });

  processUploadQueue();
}

// Force re-upload all completed artifacts (use when Firestore was reset)
export async function forceResyncAllArtifacts(): Promise<number> {
  // Reset uploadedToMuseum flag for all completed artifacts
  const count = await db.artifacts
    .where('status')
    .equals('complete')
    .modify({ uploadedToMuseum: false, museumUploadedAt: undefined });

  console.log(`[Museum Upload] Reset ${count} artifacts for re-upload`);

  // Clear only failed uploads from queue (leave pending/uploading intact)
  await db.pendingUploads.where('status').equals('failed').delete();

  // Now run migration
  return migrateExistingArtifacts();
}

// Migrate existing completed artifacts that haven't been uploaded yet
export async function migrateExistingArtifacts(): Promise<number> {
  // Get all completed artifacts not yet uploaded to museum
  const artifacts = await db.artifacts
    .where('status')
    .equals('complete')
    .filter((artifact) => !artifact.uploadedToMuseum)
    .toArray();

  if (artifacts.length === 0) {
    console.log('No artifacts to migrate to museum');
    return 0;
  }

  console.log(`Migrating ${artifacts.length} existing artifacts to museum...`);

  // Check which are already in the pending queue
  const pendingArtifactIds = new Set(
    (await db.pendingUploads.toArray()).map((u) => u.artifactId)
  );

  let enqueued = 0;
  for (const artifact of artifacts) {
    // Skip if already in queue
    if (pendingArtifactIds.has(artifact.id)) {
      continue;
    }

    await enqueueMuseumUpload(artifact.id);
    enqueued++;
  }

  console.log(`Enqueued ${enqueued} artifacts for museum upload`);
  return enqueued;
}

// Get upload status for an artifact
export async function getUploadStatus(artifactId: string): Promise<PendingMuseumUpload | null> {
  const uploads = await db.pendingUploads.where('artifactId').equals(artifactId).toArray();
  return uploads[0] || null;
}

const STARTUP_RETRY_KEY = 'save-the-past-last-startup-retry';
const STARTUP_RETRY_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Retry failed uploads once on startup (max once per 24 hours)
async function retryFailedUploadsOnce(): Promise<void> {
  // Check if we've already retried recently
  const lastRetry = localStorage.getItem(STARTUP_RETRY_KEY);
  if (lastRetry) {
    const lastRetryTime = parseInt(lastRetry, 10);
    if (Date.now() - lastRetryTime < STARTUP_RETRY_INTERVAL_MS) {
      console.log('[Museum Upload] Skipping startup retry - already retried within 24 hours');
      return;
    }
  }

  const failedUploads = await db.pendingUploads
    .where('status')
    .equals('failed')
    .toArray();

  if (failedUploads.length === 0) {
    console.log('[Museum Upload] No failed uploads to retry on startup');
    return;
  }

  console.log(`[Museum Upload] Retrying ${failedUploads.length} failed upload(s) on startup`);

  // Mark that we're doing a startup retry
  localStorage.setItem(STARTUP_RETRY_KEY, Date.now().toString());

  // Reset failed uploads to pending with attempts decremented to allow one more try
  for (const upload of failedUploads) {
    await db.pendingUploads.update(upload.id, {
      status: 'pending',
      attempts: Math.max(0, upload.attempts - 1), // Give one more attempt
      error: undefined,
    });
  }
}

// Initialize queue processor - call this ONCE on app startup
export function initUploadQueueProcessor(): void {
  if (isInitialized) return;
  isInitialized = true;

  console.log('[Museum Upload] Initializing upload queue processor');

  // Expose resync function to browser console for debugging
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).forceResyncAllArtifacts = forceResyncAllArtifacts;
  }

  // On startup: retry failed uploads once, migrate existing artifacts, then process queue
  retryFailedUploadsOnce()
    .then(() => migrateExistingArtifacts())
    .then(() => {
      console.log('[Museum Upload] Startup initialization complete, processing queue');
      processUploadQueue();
    })
    .catch((err) => {
      console.error('[Museum Upload] Error during startup initialization:', err);
    });

  // Process queue when coming back online
  window.addEventListener('online', () => {
    console.log('[Museum Upload] Back online, processing museum upload queue...');
    processUploadQueue();
  });

  // Process queue periodically (every 2 minutes)
  setInterval(() => {
    if (navigator.onLine) {
      processUploadQueue();
    }
  }, 2 * 60 * 1000);
}
