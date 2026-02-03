import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestoreDb, getFirebaseStorage } from './config';
import { toMuseumInfoCard, type MuseumArtifact } from '@/types/museum';
import { optimizeModel } from './modelOptimizer';
import { logger } from '@/lib/utils/logger';
import type { Artifact, Model3D, InfoCard } from '@/types';

const DEVICE_ID_KEY = 'save-the-past-device-id';

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// Generate a smaller thumbnail from a source blob
async function generateThumbnail(sourceBlob: Blob, maxSize = 400): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src);
          blob ? resolve(blob) : reject(new Error('Failed to create thumbnail'));
        },
        'image/jpeg',
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(sourceBlob);
  });
}

export interface UploadToMuseumParams {
  artifact: Artifact;
  model?: Model3D;
  infoCard?: InfoCard;
  thumbnailSource: Blob;
}

export async function uploadToMuseum({
  artifact,
  model,
  infoCard,
  thumbnailSource,
}: UploadToMuseumParams): Promise<string> {
  const storage = getFirebaseStorage();
  const firestore = getFirestoreDb();
  const artifactId = artifact.id;

  // 1. Generate and upload thumbnail
  const thumbnail = await generateThumbnail(thumbnailSource);
  const thumbnailRef = ref(storage, `museum/thumbnails/${artifactId}.jpg`);
  await uploadBytes(thumbnailRef, thumbnail, { contentType: 'image/jpeg' });
  const thumbnailUrl = await getDownloadURL(thumbnailRef);

  // 2. Upload 3D model (if exists)
  let modelUrl = '';
  let modelFormat: 'glb' | 'gltf' | 'obj' = 'glb';
  let modelSize: number | undefined;
  if (model?.blob) {
    // Optimize GLB models before upload (reduces size by 50-70%)
    const modelBlob = model.format === 'glb'
      ? await optimizeModel(model.blob)
      : model.blob;

    modelSize = modelBlob.size;

    const modelRef = ref(storage, `museum/models/${artifactId}.${model.format}`);
    await uploadBytes(modelRef, modelBlob, {
      contentType: model.format === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
    });
    modelUrl = await getDownloadURL(modelRef);
    modelFormat = model.format;
  }

  // 3. Create Firestore document
  const museumDoc = {
    localArtifactId: artifactId,
    name: artifact.metadata.name || 'Unnamed Artifact',
    siteName: artifact.metadata.siteName || null,
    discoveryLocation: artifact.metadata.discoveryLocation || null,

    thumbnailUrl,
    modelUrl,
    modelFormat,
    modelSize: modelSize || null,

    infoCard: infoCard ? toMuseumInfoCard(infoCard) : null,

    createdAt: serverTimestamp(),
    deviceId: getDeviceId(),
    status: 'published',
  };

  await setDoc(doc(firestore, 'museum_artifacts', artifactId), museumDoc);

  return artifactId;
}

/**
 * Update an optimized model for an existing museum artifact
 */
export async function updateMuseumModel(
  artifactId: string,
  optimizedModelBlob: Blob,
  modelFormat: 'glb' | 'gltf' | 'obj' = 'glb'
): Promise<void> {
  const storage = getFirebaseStorage();
  const firestore = getFirestoreDb();

  // Upload optimized model (replaces existing)
  const modelRef = ref(storage, `museum/models/${artifactId}.${modelFormat}`);
  await uploadBytes(modelRef, optimizedModelBlob, {
    contentType: modelFormat === 'glb' ? 'model/gltf-binary' : 'model/gltf+json',
  });

  const modelUrl = await getDownloadURL(modelRef);
  const modelSize = optimizedModelBlob.size;

  // Update Firestore document with new size and URL
  await updateDoc(doc(firestore, 'museum_artifacts', artifactId), {
    modelUrl,
    modelSize,
    modelFormat,
  });

  logger.log(`Updated museum model for ${artifactId}: ${(modelSize / 1024).toFixed(1)} KB`);
}

export async function fetchMuseumArtifacts(maxResults = 50): Promise<MuseumArtifact[]> {
  const firestore = getFirestoreDb();

  const q = query(
    collection(firestore, 'museum_artifacts'),
    where('status', '==', 'published'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      localArtifactId: data.localArtifactId,
      name: data.name,
      siteName: data.siteName,
      discoveryLocation: data.discoveryLocation,
      thumbnailUrl: data.thumbnailUrl,
      modelUrl: data.modelUrl,
      modelFormat: data.modelFormat,
      modelSize: data.modelSize,
      infoCard: data.infoCard,
      createdAt: data.createdAt?.toDate() || new Date(),
      deviceId: data.deviceId,
      status: data.status,
    } as MuseumArtifact;
  });
}

export async function fetchMuseumArtifactById(id: string): Promise<MuseumArtifact | null> {
  const firestore = getFirestoreDb();
  const docRef = doc(firestore, 'museum_artifacts', id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    id: snapshot.id,
    localArtifactId: data.localArtifactId,
    name: data.name,
    siteName: data.siteName,
    discoveryLocation: data.discoveryLocation,
    thumbnailUrl: data.thumbnailUrl,
    modelUrl: data.modelUrl,
    modelFormat: data.modelFormat,
    modelSize: data.modelSize,
    infoCard: data.infoCard,
    createdAt: data.createdAt?.toDate() || new Date(),
    deviceId: data.deviceId,
    status: data.status,
  } as MuseumArtifact;
}

/**
 * Delete an artifact from the museum (Firestore + Storage)
 * This removes the document and all associated files (thumbnail, model)
 */
export async function deleteMuseumArtifact(artifactId: string): Promise<void> {
  const firestore = getFirestoreDb();
  const storage = getFirebaseStorage();

  // Get artifact data first to know which files to delete
  const artifact = await fetchMuseumArtifactById(artifactId);

  // Delete storage files
  const deletePromises: Promise<void>[] = [];

  // Delete thumbnail
  try {
    const thumbnailRef = ref(storage, `museum/thumbnails/${artifactId}.jpg`);
    deletePromises.push(deleteObject(thumbnailRef));
  } catch (error) {
    logger.warn(`Failed to delete thumbnail for ${artifactId}:`, error);
  }

  // Delete model (if exists)
  if (artifact?.modelFormat) {
    try {
      const modelRef = ref(storage, `museum/models/${artifactId}.${artifact.modelFormat}`);
      deletePromises.push(deleteObject(modelRef));
    } catch (error) {
      logger.warn(`Failed to delete model for ${artifactId}:`, error);
    }
  }

  // Delete all storage files (ignore errors for missing files)
  await Promise.allSettled(deletePromises);

  // Delete Firestore document
  await deleteDoc(doc(firestore, 'museum_artifacts', artifactId));
}

/**
 * Delete all artifacts uploaded from this device
 */
export async function deleteAllMyMuseumArtifacts(): Promise<number> {
  const firestore = getFirestoreDb();
  const deviceId = getDeviceId();

  const q = query(
    collection(firestore, 'museum_artifacts'),
    where('deviceId', '==', deviceId)
  );

  const snapshot = await getDocs(q);
  let deletedCount = 0;

  for (const docSnapshot of snapshot.docs) {
    try {
      await deleteMuseumArtifact(docSnapshot.id);
      deletedCount++;
    } catch (error) {
      logger.error(`Failed to delete artifact ${docSnapshot.id}:`, error);
    }
  }

  return deletedCount;
}

/**
 * Delete multiple artifacts from the museum using batch operations
 * More efficient than individual deletes for bulk operations
 *
 * @param artifactIds Array of artifact IDs to delete
 * @param onProgress Optional callback for progress tracking
 * @returns Number of successfully deleted artifacts
 *
 * Note: Firebase batch writes are limited to 500 operations per batch
 */
export async function batchDeleteMuseumArtifacts(
  artifactIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<{ deleted: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  const firestore = getFirestoreDb();
  const storage = getFirebaseStorage();
  const results = {
    deleted: 0,
    failed: 0,
    errors: [] as Array<{ id: string; error: string }>,
  };

  // Firebase batch limit is 500 operations
  const BATCH_SIZE = 500;
  const batches: string[][] = [];

  // Split artifactIds into chunks of BATCH_SIZE
  for (let i = 0; i < artifactIds.length; i += BATCH_SIZE) {
    batches.push(artifactIds.slice(i, i + BATCH_SIZE));
  }

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batchIds = batches[batchIndex];
    const batch = writeBatch(firestore);

    // First, try to delete Storage assets (thumbnails and models)
    // Storage deletions are done separately as they can't be batched
    for (const artifactId of batchIds) {
      try {
        // Delete thumbnail
        const thumbnailRef = ref(storage, `museum/${artifactId}/thumbnail.jpg`);
        try {
          await deleteObject(thumbnailRef);
        } catch (error) {
          // Thumbnail might not exist, that's ok
          logger.warn(`Failed to delete thumbnail for ${artifactId}:`, error);
        }

        // Delete 3D model
        const modelRef = ref(storage, `museum/${artifactId}/model.glb`);
        try {
          await deleteObject(modelRef);
        } catch (error) {
          // Model might not exist, that's ok
          logger.warn(`Failed to delete model for ${artifactId}:`, error);
        }
      } catch (error) {
        logger.error(`Failed to delete storage assets for ${artifactId}:`, error);
      }
    }

    // Now batch delete Firestore documents
    for (const artifactId of batchIds) {
      const docRef = doc(firestore, 'museum_artifacts', artifactId);
      batch.delete(docRef);
    }

    // Commit the batch
    try {
      await batch.commit();
      results.deleted += batchIds.length;

      // Report progress
      const processedSoFar = (batchIndex + 1) * BATCH_SIZE;
      onProgress?.(Math.min(processedSoFar, artifactIds.length), artifactIds.length);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Batch ${batchIndex + 1} failed:`, error);

      // If batch fails, mark all in this batch as failed
      results.failed += batchIds.length;
      for (const id of batchIds) {
        results.errors.push({ id, error: errorMessage });
      }
    }
  }

  return results;
}
