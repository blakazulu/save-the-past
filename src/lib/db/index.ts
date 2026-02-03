import Dexie, { type Table } from 'dexie';
import type { Artifact, ArtifactImage, Model3D, InfoCard } from '@/types';
import type { PendingMuseumUpload } from '@/types/museum';
import { optimizeModel, ModelOptimizationError } from '@/lib/firebase/modelOptimizer';
import { logger } from '@/lib/utils/logger';

export interface ModelOptimizationFailure {
  modelId: string;
  error: string;
  phase?: string;
}

export class SaveThePastDB extends Dexie {
  artifacts!: Table<Artifact>;
  images!: Table<ArtifactImage>;
  models!: Table<Model3D>;
  infoCards!: Table<InfoCard>;
  pendingUploads!: Table<PendingMuseumUpload>;

  constructor() {
    super('SaveThePastDB');
    this.version(1).stores({
      artifacts: 'id, createdAt, updatedAt, status, [metadata.siteName]',
      images: 'id, artifactId, angle, createdAt',
      models: 'id, artifactId, createdAt',
      infoCards: 'id, artifactId, createdAt',
    });

    // Version 2: Add museum upload queue and tracking
    this.version(2).stores({
      artifacts: 'id, createdAt, updatedAt, status, uploadedToMuseum, [metadata.siteName]',
      images: 'id, artifactId, angle, createdAt',
      models: 'id, artifactId, createdAt',
      infoCards: 'id, artifactId, createdAt',
      pendingUploads: 'id, artifactId, status, createdAt',
    });
  }
}

export const db = new SaveThePastDB();

// Helper functions for common database operations
export async function getArtifactWithRelations(artifactId: string) {
  const artifact = await db.artifacts.get(artifactId);
  if (!artifact) return null;

  const images = await db.images.where('artifactId').equals(artifactId).toArray();
  const model = artifact.model3DId
    ? await db.models.get(artifact.model3DId)
    : undefined;
  const infoCard = artifact.infoCardId
    ? await db.infoCards.get(artifact.infoCardId)
    : undefined;

  return {
    artifact,
    images,
    model,
    infoCard,
  };
}

export async function deleteArtifactWithRelations(artifactId: string) {
  await db.transaction('rw', [db.artifacts, db.images, db.models, db.infoCards, db.pendingUploads], async () => {
    const artifact = await db.artifacts.get(artifactId);
    if (!artifact) return;

    // Delete related images
    await db.images.where('artifactId').equals(artifactId).delete();

    // Delete related model
    if (artifact.model3DId) {
      await db.models.delete(artifact.model3DId);
    }

    // Delete related info card
    if (artifact.infoCardId) {
      await db.infoCards.delete(artifact.infoCardId);
    }

    // Delete any pending museum uploads for this artifact
    await db.pendingUploads.where('artifactId').equals(artifactId).delete();

    // Delete the artifact
    await db.artifacts.delete(artifactId);
  });
}

export async function getAllArtifactsSorted(
  sortBy: 'createdAt' | 'updatedAt' = 'updatedAt',
  order: 'asc' | 'desc' = 'desc'
) {
  const artifacts = await db.artifacts.orderBy(sortBy).toArray();
  return order === 'desc' ? artifacts.reverse() : artifacts;
}

/**
 * Optimize all existing GLB models in the database.
 * This is a one-time migration function that:
 * - Reads all models from the database
 * - Optimizes GLB models (dedup, quantize, prune)
 * - Updates them in place (same ID, so no re-upload triggered)
 * - Reports progress via callback
 * - Falls back to original model if optimization fails
 */
export async function optimizeAllExistingModels(
  onProgress?: (current: number, total: number, modelId: string, saved: number, originalSize: number, newSize: number) => void
): Promise<{
  optimized: number;
  skipped: number;
  failed: number;
  totalSaved: number;
  failures: ModelOptimizationFailure[];
}> {
  const allModels = await db.models.toArray();
  const stats = {
    optimized: 0,
    skipped: 0,
    failed: 0,
    totalSaved: 0,
    failures: [] as ModelOptimizationFailure[],
  };

  for (let i = 0; i < allModels.length; i++) {
    const model = allModels[i];

    try {
      // Only optimize GLB models
      if (model.format !== 'glb') {
        stats.skipped++;
        continue;
      }

      // Skip if already optimized recently (within last 7 days)
      if (model.metadata?.optimizedAt) {
        const daysSinceOptimization = (Date.now() - new Date(model.metadata.optimizedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceOptimization < 7) {
          stats.skipped++;
          continue;
        }
      }

      const originalSize = model.blob.size;

      // Optimize the model
      let optimizedBlob: Blob;
      try {
        optimizedBlob = await optimizeModel(model.blob);
      } catch (error) {
        // Track detailed failure information
        if (error instanceof ModelOptimizationError) {
          stats.failures.push({
            modelId: model.id,
            error: error.message,
            phase: error.phase,
          });
          logger.error(`Failed to optimize model ${model.id} at ${error.phase}:`, error.message);
        } else {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          stats.failures.push({
            modelId: model.id,
            error: errorMessage,
          });
          logger.error(`Failed to optimize model ${model.id}:`, errorMessage);
        }
        stats.failed++;
        continue;
      }

      const newSize = optimizedBlob.size;

      // Only update if optimization actually reduced size
      if (newSize < originalSize) {
        const saved = originalSize - newSize;
        stats.totalSaved += saved;

        // Update the model in place (same ID)
        await db.models.update(model.id, {
          blob: optimizedBlob,
          metadata: {
            ...model.metadata,
            fileSize: newSize,
            optimizedAt: new Date(),
            originalSize,
          },
        });

        stats.optimized++;
        onProgress?.(i + 1, allModels.length, model.id, saved, originalSize, newSize);
      } else {
        // Optimization didn't help or made it bigger - skip but mark as optimized
        await db.models.update(model.id, {
          metadata: {
            ...model.metadata,
            optimizedAt: new Date(),
            originalSize,
          },
        });
        stats.skipped++;
      }
    } catch (error) {
      // Catch any unexpected errors (DB errors, etc.)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      stats.failures.push({
        modelId: model.id,
        error: `Unexpected error: ${errorMessage}`,
      });
      logger.error(`Unexpected error while processing model ${model.id}:`, error);
      stats.failed++;
    }
  }

  return stats;
}
