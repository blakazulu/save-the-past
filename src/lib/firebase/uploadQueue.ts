import { v4 as uuidv4 } from 'uuid';
import { db, getArtifactWithRelations } from '@/lib/db';
import { uploadToMuseum } from './museumService';
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

  // Try to process immediately
  processUploadQueue();

  return uploadId;
}

export async function processUploadQueue(): Promise<void> {
  // Prevent concurrent processing
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Get all pending uploads (not already uploading)
    const pendingUploads = await db.pendingUploads
      .where('status')
      .equals('pending')
      .toArray();

    for (const upload of pendingUploads) {
      // Skip if too many attempts
      if (upload.attempts >= MAX_ATTEMPTS) {
        await db.pendingUploads.update(upload.id, { status: 'failed' });
        continue;
      }

      // Check if enough time has passed since last attempt
      if (upload.lastAttempt) {
        const delay = RETRY_DELAYS[Math.min(upload.attempts, RETRY_DELAYS.length - 1)];
        const timeSinceLastAttempt = Date.now() - upload.lastAttempt.getTime();
        if (timeSinceLastAttempt < delay) {
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
      await db.pendingUploads.delete(upload.id);
      return;
    }

    // Get thumbnail source
    const thumbnailSource = data.artifact.thumbnailBlob || data.images[0]?.blob;

    if (!thumbnailSource) {
      // No thumbnail, mark as failed
      await db.pendingUploads.update(upload.id, {
        status: 'failed',
        error: 'No thumbnail available',
      });
      return;
    }

    // Upload to museum
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

    console.log(`Successfully uploaded artifact ${upload.artifactId} to museum`);
  } catch (error) {
    console.error(`Failed to upload artifact ${upload.artifactId}:`, error);

    // Don't re-increment attempts - already done above
    await db.pendingUploads.update(upload.id, {
      status: newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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

  console.log(`Reset ${count} artifacts for re-upload`);

  // Clear any failed uploads from queue
  await db.pendingUploads.clear();

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

// Initialize queue processor - call this ONCE on app startup
export function initUploadQueueProcessor(): void {
  if (isInitialized) return;
  isInitialized = true;

  // Expose resync function to browser console for debugging
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).forceResyncAllArtifacts = forceResyncAllArtifacts;
  }

  // Migrate existing artifacts, then process queue
  migrateExistingArtifacts().then(() => {
    processUploadQueue();
  });

  // Process queue when coming back online
  window.addEventListener('online', () => {
    console.log('Back online, processing museum upload queue...');
    processUploadQueue();
  });

  // Process queue periodically (every 2 minutes)
  setInterval(() => {
    if (navigator.onLine) {
      processUploadQueue();
    }
  }, 2 * 60 * 1000);
}
